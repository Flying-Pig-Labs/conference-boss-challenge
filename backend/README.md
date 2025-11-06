# Conference Boss Challenge - Backend

This directory contains the AWS Lambda functions and infrastructure for the Conference Boss Challenge application.

## Architecture

- **AWS SAM** - Infrastructure as Code
- **3 Lambda Functions:**
  - `submit` - Creates response record, returns presigned S3 URL
  - `process` - Transcribes audio (Whisper), grades response (GPT-4.5)
  - `leaderboard` - Returns sorted scores from DynamoDB
- **DynamoDB** - Stores response data
- **S3** - Stores audio files
- **API Gateway** - REST API endpoints

## Quick Start

See [PHASE_0_SETUP.md](../PHASE_0_SETUP.md) in the root directory for complete setup instructions.

### Deploy to AWS

```bash
# Build
sam build

# Deploy (first time - interactive)
sam deploy --guided

# Deploy (subsequent times)
sam deploy
```

### Test Endpoints

```bash
# Test leaderboard
curl https://YOUR-API-ID.execute-api.REGION.amazonaws.com/dev/leaderboard

# Test submit
curl -X POST https://YOUR-API-ID.execute-api.REGION.amazonaws.com/dev/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","audioFormat":"mp4","audioSize":50000}'
```

### View Logs

```bash
# Tail all logs
sam logs --stack-name conference-boss-dev --tail

# Specific function
sam logs --stack-name conference-boss-dev --name SubmitFunction --tail
```

## Development Status

**Phase 0:** ✅ Infrastructure and basic stubs complete
**Phase 1:** 🚧 Full implementation coming in sessions 1.1-1.4

## Environment Variables

Set during deployment via SAM template parameters:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DYNAMODB_TABLE_NAME` - Auto-generated
- `S3_BUCKET_NAME` - Auto-generated
- `ENVIRONMENT` - `dev` or `prod`

## Cleanup

To delete all AWS resources:

```bash
sam delete --stack-name conference-boss-dev
```
