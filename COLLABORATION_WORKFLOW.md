# Collaboration Workflow: Building Conference Boss Challenge

**Document Version:** 1.0
**Date:** November 6, 2025

---

## Our Collaborative Approach

### Core Principle: Secure Iteration with Clear Handoffs

**What I Do:**
- Write all code (Lambda functions, React components, configs)
- Create infrastructure-as-code templates (AWS SAM/Terraform)
- Provide step-by-step deployment instructions
- Debug issues based on error logs you share
- Review and refine based on your feedback

**What You Do:**
- Execute AWS CLI commands (using your credentials)
- Test the application in your browser/iPad
- Share error logs and feedback
- Make deployment decisions
- Verify functionality

**Security:** Your AWS credentials stay on your machine. I never need access to them.

---

## Iterative Development Phases

### Phase 0: Setup & Environment (1 session)

**Goal:** Get local development environment ready

**My Tasks:**
1. Create project structure for backend and frontend
2. Set up `package.json` with dependencies
3. Create `.env.example` files with required variables
4. Write setup instructions

**Your Tasks:**
1. Install Node.js 20+ and AWS CLI
2. Configure AWS CLI with your credentials: `aws configure`
3. Copy `.env.example` to `.env` and fill in values
4. Run `npm install` in both projects

**Checkpoint:** You can run `npm run dev` locally and see "Hello World"

---

### Phase 1: Backend - Minimal Viable Lambda (2-3 sessions)

#### Session 1.1: DynamoDB + Basic Submit Lambda

**My Tasks:**
1. Write AWS SAM template for DynamoDB table
2. Write `submit-response` Lambda function (Node.js)
3. Write unit tests
4. Create deployment script

**Deliverables:**
- `backend/template.yaml`
- `backend/functions/submit/index.js`
- `backend/functions/submit/package.json`
- `backend/README.md` (deployment instructions)

**Your Tasks:**
1. Review the code
2. Run: `cd backend && sam build && sam deploy --guided`
3. Share the API endpoint URL from outputs
4. Test with: `curl -X POST [endpoint]/submit -d '{"name":"Test","audioFormat":"mp4","audioSize":50000}'`
5. Share any error logs from CloudWatch

**Checkpoint:** Submit endpoint returns `responseId` and `uploadUrl`

**Feedback Loop:**
- If it works: ✅ Move to next session
- If errors occur: Share CloudWatch logs → I debug → You redeploy

---

#### Session 1.2: S3 Upload + Process Lambda (Whisper Integration)

**My Tasks:**
1. Add S3 bucket to SAM template
2. Write `process-response` Lambda with Whisper API integration
3. Add retry logic and error handling
4. Create test script

**Deliverables:**
- Updated `backend/template.yaml` with S3
- `backend/functions/process/index.js`
- `backend/test-upload.js` (upload test audio file)

**Your Tasks:**
1. Get OpenAI API key from https://platform.openai.com/api-keys
2. Deploy updated stack: `sam deploy`
3. Add OpenAI key to AWS Systems Manager Parameter Store (I'll provide command)
4. Run test script: `node test-upload.js`
5. Share results and any errors

**Checkpoint:** Test audio file gets transcribed successfully

---

#### Session 1.3: AI Grading + Complete Pipeline

**My Tasks:**
1. Add GPT-4.5 grading logic to process Lambda
2. Implement grading rubric from specs
3. Update DynamoDB schema with all fields
4. Write integration tests

**Your Tasks:**
1. Deploy updated Lambda
2. Run end-to-end test
3. Review sample gradings - are they good? Too harsh? Too lenient?
4. Provide feedback on roast tone

**Checkpoint:** Full pipeline works: upload → transcribe → grade → store

**Feedback Loop:** We iterate on the grading prompt together until the tone is right

---

#### Session 1.4: Leaderboard Lambda

**My Tasks:**
1. Write leaderboard Lambda with GSI queries
2. Add caching logic
3. Create test data seeder script

**Your Tasks:**
1. Deploy updated stack
2. Seed test data: `node seed-test-data.js`
3. Test: `curl [endpoint]/leaderboard`
4. Verify sorting and ranking

**Checkpoint:** Leaderboard returns sorted scores correctly

---

### Phase 2: Frontend - React Application (3-4 sessions)

#### Session 2.1: Project Setup + Audio Recording

**My Tasks:**
1. Initialize Vite React project
2. Set up Tailwind CSS and routing
3. Implement `useAudioRecorder` hook
4. Create basic Challenge page with recording UI
5. Add browser compatibility checks

**Deliverables:**
- Complete `frontend/` directory structure
- Audio recording component with countdown
- Local dev setup

**Your Tasks:**
1. `cd frontend && npm install && npm run dev`
2. Open on your iPad (use local network IP)
3. Test microphone permission and recording
4. Report: Does it work? What format does Safari use?

**Checkpoint:** Can record 15-second audio clip on iPad Safari

**Critical Test:** This is where we discover Safari quirks. Be prepared to iterate.

---

#### Session 2.2: API Integration + Upload Flow

**My Tasks:**
1. Write API service with axios
2. Implement two-step upload (presigned URL + S3)
3. Add loading states and error handling
4. Create `useSubmission` hook

**Your Tasks:**
1. Add `.env` file with your API endpoint
2. Test full submission flow
3. Check Network tab for errors
4. Verify file appears in S3 bucket

**Checkpoint:** Can submit recording and see it in S3

---

#### Session 2.3: Results Display + Prize Logic

**My Tasks:**
1. Build ScoreDisplay component with animation
2. Build RoastDisplay component
3. Add PrizeNotification logic
4. Polish transitions and timing

**Your Tasks:**
1. Test full flow: record → submit → see score
2. Feedback: Is animation timing good? Too slow? Too fast?
3. Try different responses, verify scoring makes sense

**Checkpoint:** Complete Challenge flow works end-to-end

---

#### Session 2.4: Leaderboard Page

**My Tasks:**
1. Create Leaderboard page with polling
2. Add rank indicators (gold/silver/bronze)
3. Implement auto-refresh
4. Add navigation between pages

**Your Tasks:**
1. Submit multiple test responses
2. Verify leaderboard updates
3. Check sorting and rankings
4. Test on iPad portrait and landscape

**Checkpoint:** Leaderboard shows all submissions, sorted correctly

---

### Phase 3: Polish & Production (2-3 sessions)

#### Session 3.1: UI/UX Refinement

**My Tasks:**
1. Add celebratory animations for high scores
2. Implement error messages and retry flows
3. Add loading skeletons
4. Responsive design tweaks

**Your Tasks:**
1. User test with 2-3 friends/colleagues
2. Collect feedback on UX
3. Share observations

**We Iterate Together:** I make changes based on your feedback

---

#### Session 3.2: Error Handling & Edge Cases

**My Tasks:**
1. Add comprehensive error boundaries
2. Handle network failures gracefully
3. Add retry logic to API calls
4. Improve error messages

**Your Tasks:**
1. Test edge cases:
   - Turn off WiFi mid-upload
   - Submit empty name
   - Record in noisy environment
   - Submit very quickly multiple times
2. Report what breaks

**Checkpoint:** App handles failures gracefully, no crashes

---

#### Session 3.3: Performance & Monitoring

**My Tasks:**
1. Add CloudWatch dashboard configuration
2. Optimize Lambda cold starts
3. Add frontend performance monitoring
4. Create deployment checklist

**Your Tasks:**
1. Deploy CloudWatch dashboard
2. Run load test: `npm run load-test`
3. Monitor metrics during test
4. Verify API Gateway throttling works

**Checkpoint:** System handles 10 concurrent users smoothly

---

### Phase 4: Production Deployment (1 session)

**My Tasks:**
1. Create production deployment guide
2. Write environment-specific configs
3. Create rollback procedures
4. Write operational runbook

**Your Tasks:**
1. Deploy frontend to Netlify/Vercel
2. Update CORS to allow production domain
3. Do final end-to-end test on production
4. Set up billing alerts

**Checkpoint:** App live and ready for event!

---

## Communication Protocol

### When Things Work ✅
**You:** "Session 1.1 complete! API endpoint: https://abc123.execute-api.us-east-1.amazonaws.com/prod"
**Me:** "Perfect! Let's move to Session 1.2. I'm writing the S3 upload code now..."

### When Things Break 🔧
**You:** "Getting error: Access Denied from DynamoDB. Here's the CloudWatch log: [paste]"
**Me:** [Analyzes error] "Ah, the IAM role is missing DynamoDB permissions. Update your SAM template with this..." [provides fix]
**You:** [Redeploys with fix]

### When Feedback is Needed 🤔
**You:** "The roasts seem too harsh. Example: [screenshot]"
**Me:** "Got it. Let me adjust the prompt to be more playful..." [updates grading prompt]
**You:** [Tests again, confirms it's better]

---

## Tools & Practices

### What We'll Use

**Version Control:**
- All code in this Git repo
- I commit changes after each session
- You can review commits before deploying

**Testing:**
- I write unit tests for all functions
- You do manual testing in browser/iPad
- We write integration tests together based on what breaks

**Documentation:**
- I document every function and component
- I provide deployment instructions for each step
- You keep notes on what works in your environment

**Async Work:**
- Between sessions, I can write next phase code
- You can test and report results anytime
- We sync up to review and plan next steps

---

## Example Session: How We'll Work Together

### Before Session
**Me:** [Commits code] "Ready for Session 2.1. I've pushed the audio recording component. When you're ready, pull the latest code and test on your iPad."

### During Session
**You:** "Pulled and running. The recording starts but stops after 5 seconds instead of 15."
**Me:** "Interesting. Can you check the browser console for errors?"
**You:** [Shares screenshot of console error]
**Me:** "Ah, Safari is using a different timer API. Let me fix that..." [Updates code in real-time]
**You:** [Pulls update, tests] "Working now! Counts down properly."
**Me:** "Great! While you continue testing, I'll start on the upload flow for Session 2.2."

### After Session
**You:** "Tested on both iPad and desktop Safari. Recording works perfectly now. Ready for Session 2.2 whenever."
**Me:** "Awesome! I've already pushed the upload code. Want to continue now or pick up tomorrow?"

---

## What I Need From You

### For Each Session

1. **Feedback on functionality:** Does it work? What breaks?
2. **Error logs:** CloudWatch logs, browser console errors
3. **Environment info:** When Safari does something weird, what version?
4. **UX feedback:** Does this feel good? Too slow? Confusing?
5. **Decisions:** When there are multiple approaches, you choose

### What I DON'T Need

- ❌ AWS credentials or tokens
- ❌ API keys (you store in AWS Secrets Manager)
- ❌ Access to your AWS console
- ❌ To run AWS CLI commands

---

## Security Best Practices

### How We Keep Things Secure

**API Keys:**
- I write code that reads from environment variables
- You store keys in AWS Systems Manager Parameter Store
- Lambda functions retrieve at runtime

**Example:**
```javascript
// I write this:
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// You store the actual key:
aws ssm put-parameter --name /conference-boss/openai-key --value "sk-..." --type SecureString
```

**AWS Access:**
- You run all `aws` CLI commands
- You run all `sam deploy` commands
- I provide the exact commands to run

**Environment Files:**
- `.env` files are gitignored
- `.env.example` shows what variables are needed
- You fill in real values locally

---

## Estimated Timeline

| Phase | Sessions | Hours | Calendar Time |
|-------|----------|-------|---------------|
| Setup | 1 | 1-2 | 1 day |
| Backend | 4 | 6-8 | 3-5 days |
| Frontend | 4 | 8-10 | 5-7 days |
| Polish | 3 | 6-8 | 3-5 days |
| Deploy | 1 | 2-3 | 1 day |
| **Total** | **13** | **23-31** | **2-3 weeks** |

**Assumptions:**
- Sessions are 1-2 hours each
- Time between sessions for testing and async work
- Some sessions can happen same day if things go smoothly

---

## Success Metrics

### We Know We're On Track When:
- ✅ Each checkpoint passes before moving to next session
- ✅ No major blockers lasting more than 1 session
- ✅ Code quality stays high (tests passing, documented)
- ✅ You understand what each piece does (I explain, not just deliver)

### Red Flags:
- 🚩 Stuck on same issue for 3+ sessions
- 🚩 Having to rewrite large portions of code
- 🚩 You don't understand how to deploy/troubleshoot
- 🚩 Missing checkpoints (moving on before things work)

---

## My Commitment to You

1. **Clear Communication:** I'll explain WHY I make technical decisions
2. **Production Quality:** Not just "works on my machine" - proper error handling, tests, docs
3. **Iterative:** We build, test, refine - no big-bang deployments
4. **Knowledge Transfer:** By the end, you'll understand the architecture and can maintain it
5. **Responsiveness:** When you hit blockers, I prioritize helping you debug

---

## Getting Started

### Next Steps

1. **Review this workflow** - does this approach work for you?
2. **Confirm your environment:**
   - Do you have Node.js 20+ installed?
   - Do you have AWS CLI configured?
   - Do you have an OpenAI account?
3. **Decide on pace:**
   - Fast track: 2-3 sessions per day
   - Steady: 1 session per day
   - Relaxed: 2-3 sessions per week

4. **Let's start Phase 0:** I'll create the project structure and you'll set up your environment

---

## Ready to Begin?

Just say: **"Let's start Phase 0"** and I'll create the initial project structure with setup instructions!

Or if you want to adjust this workflow, let me know what works better for you.
