/**
 * Process Lambda Function
 *
 * Purpose: Process audio response after upload
 * - Downloads audio file from S3
 * - Transcribes using OpenAI Whisper API
 * - Grades response using GPT-4.5 Turbo
 * - Updates DynamoDB with results
 * - Returns score and roast
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const OpenAI = require('openai');

// Initialize AWS clients
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Environment variables
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Grading rubric prompt
const GRADING_PROMPT = `You are evaluating a conference attendee's response to their boss asking "How was the conference? (that I paid for you to go to)".

Context: This is a fun, interactive booth experience designed to help attendees reflect on their conference value. The boss character is slightly skeptical but fair - they want ROI but appreciate genuine enthusiasm and concrete details.

The boss is evaluating whether to send this person to next year's conference based on:
- ROI & Business Value (30 pts): Concrete takeaways, business applications, quantifiable impact
- Professional Development (25 pts): Growth, career relevance, skills gained, implementation plans
- Networking & Connections (20 pts): Specific people/companies, opportunities, follow-up plans
- Concrete Details & Storytelling (15 pts): Specific sessions, clear narrative, energy
- Future Value & Next Steps (10 pts): Desire to return with reasoning, action items, long-term impact

Roast style examples:
- High scores (85+): "Your boss is already booking next year's ticket."
- Good scores (70-84): "Solid. Next time, bring actual business cards."
- Medium scores (50-69): "Your boss heard 'networking' as 'snack bar.'"
- Low scores (<50): "That's a lot of words for 'free coffee.'"

Provide:
1. A score from 0-100 (be fair but have standards - most responses should fall in 50-80 range)
2. A light roast in 10 words or less. Be witty and playful, not mean. Reference something specific from their response when possible. Think friendly colleague banter, not harsh criticism.

Format your response as JSON:
{
  "score": [number],
  "roast": "[text]"
}`;

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { responseId } = body;

    if (!responseId) {
      return createResponse(400, {
        error: 'Invalid input',
        details: ['responseId is required']
      });
    }

    // Get record from DynamoDB
    const record = await getRecord(responseId);
    if (!record) {
      return createResponse(404, {
        error: 'Response not found',
        details: ['No record found with the provided responseId']
      });
    }

    // Update status to processing
    await updateStatus(responseId, record.timestamp, 'processing');

    // Build S3 key from record
    const s3Key = `${record.session_date}/${responseId}.${record.audio_format}`;
    console.log('Processing audio file:', s3Key);

    // Download audio from S3
    const audioBuffer = await downloadAudioFromS3(s3Key);

    // Transcribe audio using Whisper
    console.log('Transcribing audio...');
    const transcription = await transcribeAudio(audioBuffer, record.audio_format);
    console.log('Transcription:', transcription);

    // Grade response using GPT
    console.log('Grading response...');
    const grading = await gradeResponse(transcription);
    console.log('Grading result:', grading);

    // Determine prize eligibility
    const prizeEligible = grading.score >= 80;

    // Update DynamoDB with results
    await updateResults(
      responseId,
      record.timestamp,
      transcription,
      grading.score,
      grading.roast,
      s3Key,
      prizeEligible
    );

    // Return response
    return createResponse(200, {
      responseId,
      transcription,
      score: grading.score,
      roast: grading.roast,
      prizeEligible
    });

  } catch (error) {
    console.error('Error in process handler:', error);

    // Try to update status to failed
    try {
      const body = JSON.parse(event.body || '{}');
      if (body.responseId) {
        const record = await getRecord(body.responseId);
        if (record) {
          await updateStatus(
            body.responseId,
            record.timestamp,
            'failed',
            error.message
          );
        }
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return createResponse(500, {
      error: 'Processing failed',
      message: error.message
    });
  }
};

/**
 * Get record from DynamoDB
 */
async function getRecord(responseId) {
  // Query to get the record (we need to scan since we don't have timestamp)
  // In practice, we could optimize this by passing timestamp from client
  const { Item } = await docClient.send(new GetCommand({
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      response_id: responseId,
      timestamp: 0 // We'll need to fix this - for now, using a query
    }
  }));

  return Item;
}

/**
 * Update processing status
 */
async function updateStatus(responseId, timestamp, status, errorMessage = null) {
  const updateParams = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      response_id: responseId,
      timestamp
    },
    UpdateExpression: 'SET processing_status = :status, updated_at = :updated',
    ExpressionAttributeValues: {
      ':status': status,
      ':updated': new Date().toISOString()
    }
  };

  if (errorMessage) {
    updateParams.UpdateExpression += ', error_message = :error';
    updateParams.ExpressionAttributeValues[':error'] = errorMessage;
  }

  await docClient.send(new UpdateCommand(updateParams));
}

/**
 * Download audio file from S3
 */
async function downloadAudioFromS3(s3Key) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key
  });

  const response = await s3Client.send(command);

  // Convert stream to buffer
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Transcribe audio using OpenAI Whisper
 */
async function transcribeAudio(audioBuffer, audioFormat) {
  return await retryWithBackoff(async () => {
    // Create a File-like object from buffer
    const file = new File([audioBuffer], `audio.${audioFormat}`, {
      type: `audio/${audioFormat}`
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en'
    });

    return transcription.text;
  });
}

/**
 * Grade response using GPT-4.5 Turbo
 */
async function gradeResponse(transcription) {
  return await retryWithBackoff(async () => {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: GRADING_PROMPT
        },
        {
          role: 'user',
          content: `Response to evaluate: "${transcription}"`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Validate response
    if (typeof result.score !== 'number' || !result.roast) {
      throw new Error('Invalid grading response format');
    }

    return {
      score: Math.max(0, Math.min(100, result.score)), // Clamp to 0-100
      roast: result.roast
    };
  });
}

/**
 * Update DynamoDB with results
 */
async function updateResults(
  responseId,
  timestamp,
  transcription,
  score,
  roast,
  audioFileUrl,
  prizeEligible
) {
  await docClient.send(new UpdateCommand({
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      response_id: responseId,
      timestamp
    },
    UpdateExpression: `
      SET transcription = :transcription,
          score = :score,
          roast = :roast,
          audio_file_url = :audio_file_url,
          prize_eligible = :prize_eligible,
          processing_status = :status,
          completed_at = :completed
    `,
    ExpressionAttributeValues: {
      ':transcription': transcription,
      ':score': score,
      ':roast': roast,
      ':audio_file_url': audioFileUrl,
      ':prize_eligible': prizeEligible,
      ':status': 'completed',
      ':completed': new Date().toISOString()
    }
  }));
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Create HTTP response
 */
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}
