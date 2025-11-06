/**
 * Submit Lambda Function
 *
 * Purpose: Handle initial submission request
 * - Validates input (name, audio format, size)
 * - Generates response_id (UUID)
 * - Creates DynamoDB record with status='pending'
 * - Generates presigned S3 URL for audio upload
 * - Returns upload URL to client
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');

// Initialize AWS clients
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({});

// Environment variables
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const PRESIGNED_URL_EXPIRATION = 300; // 5 minutes

// Validation constants
const MAX_NAME_LENGTH = 50;
const MIN_NAME_LENGTH = 1;
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_AUDIO_FORMATS = ['mp4', 'webm', 'wav', 'm4a', 'aac'];

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { name, audioFormat, audioSize } = body;

    // Validate input
    const validation = validateInput(name, audioFormat, audioSize);
    if (!validation.valid) {
      return createResponse(400, {
        error: 'Invalid input',
        details: validation.errors
      });
    }

    // Generate response ID
    const responseId = randomUUID();
    const timestamp = Date.now();
    const sessionDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days from now

    // Create DynamoDB record
    const dbRecord = {
      response_id: responseId,
      timestamp,
      created_at: new Date(timestamp).toISOString(),
      participant_name: name.trim(),
      session_date: sessionDate,
      processing_status: 'pending',
      audio_format: audioFormat,
      audio_size: audioSize,
      ttl
    };

    await docClient.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: dbRecord
    }));

    console.log('Created DynamoDB record:', responseId);

    // Generate presigned S3 URL
    const s3Key = `${sessionDate}/${responseId}.${audioFormat}`;
    const uploadUrl = await generatePresignedUrl(s3Key, audioFormat);

    // Return response
    return createResponse(200, {
      responseId,
      uploadUrl,
      expiresIn: PRESIGNED_URL_EXPIRATION,
      s3Key
    });

  } catch (error) {
    console.error('Error in submit handler:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Validate input parameters
 */
function validateInput(name, audioFormat, audioSize) {
  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string') {
    errors.push('Name is required and must be a string');
  } else if (name.trim().length < MIN_NAME_LENGTH) {
    errors.push(`Name must be at least ${MIN_NAME_LENGTH} character`);
  } else if (name.trim().length > MAX_NAME_LENGTH) {
    errors.push(`Name must not exceed ${MAX_NAME_LENGTH} characters`);
  }

  // Validate audio format
  if (!audioFormat || typeof audioFormat !== 'string') {
    errors.push('Audio format is required');
  } else if (!ALLOWED_AUDIO_FORMATS.includes(audioFormat.toLowerCase())) {
    errors.push(`Audio format must be one of: ${ALLOWED_AUDIO_FORMATS.join(', ')}`);
  }

  // Validate audio size
  if (!audioSize || typeof audioSize !== 'number') {
    errors.push('Audio size is required and must be a number');
  } else if (audioSize <= 0) {
    errors.push('Audio size must be greater than 0');
  } else if (audioSize > MAX_AUDIO_SIZE) {
    errors.push(`Audio size must not exceed ${MAX_AUDIO_SIZE / 1024 / 1024}MB`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate presigned S3 URL for upload
 */
async function generatePresignedUrl(s3Key, audioFormat) {
  const contentType = getContentType(audioFormat);

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION
  });

  return url;
}

/**
 * Get content type for audio format
 */
function getContentType(format) {
  const contentTypes = {
    mp4: 'audio/mp4',
    m4a: 'audio/mp4',
    webm: 'audio/webm',
    wav: 'audio/wav',
    aac: 'audio/aac'
  };

  return contentTypes[format.toLowerCase()] || 'application/octet-stream';
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
