/**
 * Leaderboard Lambda Function
 *
 * Purpose: Retrieve and return sorted leaderboard
 * - Queries DynamoDB GSI by session_date
 * - Sorts by score (descending)
 * - Calculates ranks
 * - Returns aggregate stats
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS clients
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Environment variables
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const GSI_NAME = 'session-date-score-index';
const DEFAULT_LIMIT = 100;

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const sessionDate = queryParams.sessionDate || getTodayDate();
    const limit = parseInt(queryParams.limit || DEFAULT_LIMIT, 10);

    console.log('Fetching leaderboard for:', { sessionDate, limit });

    // Query DynamoDB GSI
    const results = await queryLeaderboard(sessionDate, limit);

    // Filter only completed responses
    const completed = results.filter(r => r.processing_status === 'completed');

    // Sort by score descending (GSI should handle this, but ensuring)
    completed.sort((a, b) => b.score - a.score);

    // Calculate ranks and format results
    const leaderboard = completed.map((item, index) => ({
      rank: index + 1,
      name: item.participant_name,
      score: item.score,
      roast: item.roast || '',
      timestamp: item.created_at,
      prizeEligible: item.prize_eligible || false
    }));

    // Calculate aggregate stats
    const totalParticipants = completed.length;
    const averageScore = totalParticipants > 0
      ? Math.round(completed.reduce((sum, item) => sum + item.score, 0) / totalParticipants)
      : 0;

    // Get top 3
    const top3 = leaderboard.slice(0, 3);

    // Return response
    return createResponse(200, {
      leaderboard: leaderboard.slice(0, limit),
      top3,
      totalParticipants,
      averageScore,
      sessionDate,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in leaderboard handler:', error);
    return createResponse(500, {
      error: 'Failed to retrieve leaderboard',
      message: error.message
    });
  }
};

/**
 * Query leaderboard from DynamoDB GSI
 */
async function queryLeaderboard(sessionDate, limit) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    IndexName: GSI_NAME,
    KeyConditionExpression: 'session_date = :date',
    ExpressionAttributeValues: {
      ':date': sessionDate
    },
    ScanIndexForward: false, // Sort descending (highest scores first)
    Limit: limit * 2 // Fetch more to account for non-completed items
  };

  try {
    const { Items } = await docClient.send(new QueryCommand(params));
    return Items || [];
  } catch (error) {
    console.error('DynamoDB query error:', error);
    throw error;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Create HTTP response with caching headers
 */
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Cache-Control': 'max-age=2' // Cache for 2 seconds for "near real-time" updates
    },
    body: JSON.stringify(body)
  };
}
