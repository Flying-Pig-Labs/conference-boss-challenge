# Phase 0: Project Setup Guide

**Status:** ✅ Code Complete - Ready for You to Set Up!

This guide will walk you through setting up your local development environment for the Conference Boss Challenge project. By the end of this phase, you'll have both backend and frontend running locally.

---

## Prerequisites Checklist

Before starting, ensure you have these installed:

- [ ] **Node.js 20+** - [Download here](https://nodejs.org/)
  - Check: `node --version` (should show v20.x.x or higher)
  - Check: `npm --version` (should show 10.x.x or higher)

- [ ] **AWS CLI** - [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  - Check: `aws --version`

- [ ] **AWS SAM CLI** - [Installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
  - Check: `sam --version`

- [ ] **Git** - [Download here](https://git-scm.com/)
  - Check: `git --version`

- [ ] **OpenAI API Account** - [Sign up here](https://platform.openai.com/)
  - You'll need an API key

- [ ] **AWS Account** - [Sign up here](https://aws.amazon.com/)
  - With permissions to create Lambda, DynamoDB, S3, API Gateway

---

## Step 1: AWS CLI Configuration

Configure your AWS credentials:

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your IAM user access key
- **AWS Secret Access Key**: Your IAM user secret key
- **Default region**: Recommend `us-east-1`
- **Default output format**: `json`

**Verify it works:**
```bash
aws sts get-caller-identity
```

You should see your AWS account ID and user ARN.

---

## Step 2: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)
4. **Save it somewhere safe** - you'll need it in Step 4

**Important:** Make sure you have credits in your OpenAI account. You can check at https://platform.openai.com/account/billing

---

## Step 3: Install Backend Dependencies

Navigate to the backend directory and install dependencies for each Lambda function:

```bash
cd backend/functions/submit
npm install
cd ../process
npm install
cd ../leaderboard
npm install
cd ../../..
```

This will install the AWS SDK and other dependencies needed by the Lambda functions.

---

## Step 4: Deploy Backend to AWS

Now let's deploy the backend infrastructure to AWS using SAM:

```bash
cd backend
sam build
```

This will build all Lambda functions. You should see:
```
Build Succeeded

Built Artifacts  : .aws-sam/build
```

Now deploy (this will prompt you with questions):

```bash
sam deploy --guided
```

**Answer the prompts:**
1. **Stack Name**: `conference-boss-dev` (or your preferred name)
2. **AWS Region**: `us-east-1` (or your preferred region)
3. **Parameter OpenAIApiKey**: Paste your OpenAI API key from Step 2
4. **Parameter Environment**: `dev`
5. **Confirm changes before deploy**: `Y`
6. **Allow SAM CLI IAM role creation**: `Y`
7. **Disable rollback**: `N`
8. **SubmitFunction has no authentication**: `Y`
9. **ProcessFunction has no authentication**: `Y`
10. **LeaderboardFunction has no authentication**: `Y`
11. **Save arguments to configuration file**: `Y`
12. **SAM configuration file**: Press Enter (default)
13. **SAM configuration environment**: Press Enter (default)

**This will take 3-5 minutes.** SAM is creating:
- DynamoDB table
- S3 bucket
- 3 Lambda functions
- API Gateway
- IAM roles
- CloudWatch log groups

When complete, you'll see:
```
CloudFormation outputs from deployed stack
--------------------------------------------------------------------------------
Outputs
--------------------------------------------------------------------------------
Key                 ApiEndpoint
Description         API Gateway endpoint URL
Value               https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/
--------------------------------------------------------------------------------
```

**🔴 IMPORTANT:** Copy the `ApiEndpoint` URL - you'll need it for the frontend!

---

## Step 5: Test the Backend

Let's verify the backend is working:

### Test 1: Leaderboard Endpoint (should return empty array)

```bash
curl https://YOUR-API-ENDPOINT/leaderboard
```

Replace `YOUR-API-ENDPOINT` with your actual endpoint from Step 4.

**Expected response:**
```json
{
  "leaderboard": [],
  "top3": [],
  "totalParticipants": 0,
  "averageScore": 0,
  "sessionDate": "2025-11-06",
  "lastUpdated": "2025-11-06T..."
}
```

If you see this, your backend is working! 🎉

### Test 2: Submit Endpoint

```bash
curl -X POST https://YOUR-API-ENDPOINT/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "audioFormat": "mp4",
    "audioSize": 50000
  }'
```

**Expected response:**
```json
{
  "responseId": "some-uuid",
  "uploadUrl": "https://...",
  "expiresIn": 300,
  "s3Key": "..."
}
```

If you see a `responseId` and `uploadUrl`, your submit function works! 🎉

---

## Step 6: Install Frontend Dependencies

Navigate to the frontend directory:

```bash
cd ../frontend
npm install
```

This will install React, Vite, TailwindCSS, and other frontend dependencies.

---

## Step 7: Configure Frontend Environment

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API endpoint:

```bash
# Use your actual API endpoint from Step 4
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/

VITE_ENVIRONMENT=dev
```

**Make sure to include the trailing slash!**

---

## Step 8: Run Frontend Locally

Start the development server:

```bash
npm run dev
```

You should see:
```
  VITE v5.1.0  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

**Open your browser to http://localhost:3000/**

You should see:
- 🎤 Conference Boss Challenge header
- Navigation tabs (Challenge, Leaderboard)
- Phase 0 setup complete message
- Mock UI showing what's coming

---

## Step 9: Test on iPad (Optional but Recommended)

To test on your iPad:

1. Make sure your iPad and computer are on the same WiFi network
2. Note the "Network" URL from Step 8 (e.g., `http://192.168.x.x:3000/`)
3. On your iPad, open Safari and navigate to that URL
4. You should see the app!

**Why this matters:** Safari on iPad has specific audio recording requirements, so testing early helps catch issues.

---

## Phase 0 Checkpoint ✅

You've successfully completed Phase 0 if:

- [ ] Backend deployed to AWS without errors
- [ ] Leaderboard endpoint returns valid JSON
- [ ] Submit endpoint returns responseId and uploadUrl
- [ ] Frontend runs locally at http://localhost:3000/
- [ ] You can navigate between Challenge and Leaderboard pages
- [ ] (Optional) App loads on your iPad

---

## Project Structure Overview

Here's what you now have:

```
conference-boss-challenge/
├── backend/
│   ├── template.yaml              ← AWS SAM infrastructure definition
│   ├── functions/
│   │   ├── submit/                ← Lambda: Get presigned URL
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   ├── process/               ← Lambda: Transcribe & grade
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   └── leaderboard/           ← Lambda: Get leaderboard
│   │       ├── index.js
│   │       └── package.json
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── pages/                 ← Challenge & Leaderboard pages
│   │   ├── components/            ← Reusable UI components (empty for now)
│   │   ├── hooks/                 ← Custom React hooks (empty for now)
│   │   ├── services/              ← API integration (empty for now)
│   │   ├── utils/                 ← Constants & validators
│   │   ├── App.jsx                ← Main app component
│   │   ├── main.jsx               ← Entry point
│   │   └── index.css              ← Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── .gitignore
├── TECHNICAL_SPECS.md             ← Complete technical documentation
├── COLLABORATION_WORKFLOW.md      ← How we'll work together
└── README.md                      ← Original requirements
```

---

## What's Next?

You're ready for **Phase 1: Backend Implementation**!

In Phase 1, we'll:
1. **Session 1.1:** Implement full Submit Lambda (currently a stub)
2. **Session 1.2:** Add S3 upload and Whisper transcription
3. **Session 1.3:** Implement AI grading with GPT-4.5
4. **Session 1.4:** Complete leaderboard with real data

---

## Troubleshooting

### Issue: `sam: command not found`
**Solution:** Install AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

### Issue: `Access Denied` when deploying
**Solution:** Check your AWS credentials have sufficient permissions. You need:
- IAM role creation
- Lambda, DynamoDB, S3, API Gateway, CloudWatch access

### Issue: OpenAI API key invalid
**Solution:**
1. Verify key starts with `sk-`
2. Check it hasn't expired
3. Ensure you have credits: https://platform.openai.com/account/billing

### Issue: Frontend can't connect to API
**Solution:**
1. Verify `.env` has correct VITE_API_BASE_URL
2. Make sure URL includes trailing slash
3. Check API Gateway is deployed (test with curl)
4. Check browser console for CORS errors

### Issue: CORS error in browser
**Solution:** This shouldn't happen in Phase 0 since API Gateway CORS is configured, but if it does:
1. Verify the API Gateway CORS settings in template.yaml
2. Redeploy: `sam build && sam deploy`

---

## Getting Help

If you're stuck:

1. **Check CloudWatch Logs:**
   ```bash
   sam logs --stack-name conference-boss-dev --tail
   ```

2. **Check API Gateway:**
   - Go to AWS Console → API Gateway
   - Find `conference-boss-api-dev`
   - Check the stage is deployed

3. **Share error messages with me:**
   - Copy the full error output
   - Include CloudWatch logs if available
   - I'll help debug!

---

## Cost Estimate for Phase 0

**AWS Resources Created:**
- DynamoDB (Pay-per-request): ~$0.00 (no data yet)
- S3 bucket: ~$0.00 (empty)
- Lambda functions: ~$0.00 (free tier covers testing)
- API Gateway: ~$0.00 (first 1M requests free)

**OpenAI API:**
- $0.00 (no API calls yet in Phase 0)

**Total Phase 0 cost: $0.00** ✅

---

## Cleanup (If Needed)

To delete all AWS resources:

```bash
cd backend
sam delete --stack-name conference-boss-dev
```

**Warning:** This will permanently delete:
- All Lambda functions
- DynamoDB table and all data
- S3 bucket and all audio files
- API Gateway

---

## Ready?

Once you've completed all checkpoints, let me know and we'll move to **Phase 1: Backend Implementation**!

**Let me know:**
1. Did all steps work smoothly?
2. Any errors or issues?
3. Can you see the frontend in your browser?
4. (Optional) Does it load on your iPad?

Great work completing Phase 0! 🎉
