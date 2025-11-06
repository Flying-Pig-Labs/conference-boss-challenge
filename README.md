# conference-boss-challenge

# Requirements Document: Conference ROI Challenge - Interactive Booth Application

## 1. Executive Summary

An interactive iPad web application for conference booths where participants record 15-second responses to a boss's question about conference ROI. The system transcribes, grades, and displays results on a leaderboard, with prizes for top performers.

**Core Purpose:** Create an engaging, gamified experience that prompts attendees to reflect on "why am I here?" and articulate the value they're getting from the conference in a fun, low-stakes way.

## 2. Application Overview

**Type:** Single-page web application (SPA) optimized for iPad display  
**Pages:** 2 screens (Challenge Screen + Leaderboard Screen)  
**Target Environment:** iPad browser (Safari)  
**Tone:** Playful, energetic, slightly cheeky - encourages self-reflection through game mechanics

## 3. User Flow

### 3.1 Challenge Screen (Main Interaction)
1. User navigates to URL on iPad
2. User enters their name in text input field
3. User sees prompt: **"Boss: How was the conference? (that I paid for you to go to)"**
4. User clicks "Reply" button
5. Audio recording begins with visible 15-second countdown timer (15, 14, 13... 3, 2, 1, 0)
6. Recording automatically stops at 0 seconds
7. System processes response (transcription → grading → feedback)
8. User receives:
   - Score (0-100)
   - Brief roast/feedback (10 words or less)
   - Prize notification if applicable (score ≥ 80)
9. User can view leaderboard to see how they stack up

### 3.2 Leaderboard Screen
- Displays all participant scores sorted by rank
- Shows: Name, Score, Timestamp
- Updates in real-time as new submissions come in
- Highlights top 3 performers
- Creates friendly competition and engagement

## 4. Design Philosophy & User Experience Goals

### 4.1 Core Experience Principles
- **Self-Reflection Through Play:** The "boss" framing creates a fun tension that makes people actually think about their conference experience
- **Immediate Feedback Loop:** Quick turnaround (< 30 seconds) keeps energy high
- **Social Proof:** Leaderboard creates FOMO and encourages participation
- **Low Stakes, High Engagement:** The roast keeps it lighthearted while the prizes add motivation
- **Conversation Starter:** Results give attendees something to talk about with each other

### 4.2 Engagement Hooks
- **Time Pressure:** 15-second limit forces concise, authentic responses
- **Gamification:** Scoring + leaderboard taps into competitive spirit
- **Humor:** Light roasting makes "failure" entertaining
- **Rewards:** Tiered prizes create multiple win conditions
- **Visibility:** Public leaderboard encourages others to try

## 5. Technical Requirements

### 5.1 Frontend
- **Framework:** Modern JavaScript framework (React recommended for SPA)
- **Responsive Design:** Optimized for iPad screen sizes
- **Visual Design Notes:**
  - Bold, energetic color scheme (consider brand colors)
  - Large, confidence-inspiring typography
  - Smooth animations for countdown and score reveal
  - Celebratory visual feedback for high scores
  - Playful microinteractions throughout

- **UI Components:**
  - Text input for name entry (welcoming, not intimidating)
  - Large, touch-friendly "Reply" button (make it feel like a game show buzzer)
  - Visual countdown timer (large, prominent display - create urgency)
  - Audio recording indicator (pulsing waveform or similar)
  - Score display with visual feedback (confetti for 90+, applause for 80+)
  - Roast/feedback message display (animated text reveal)
  - Prize notification modal/alert (exciting, shareable)
  - Leaderboard table with visual ranking indicators (gold/silver/bronze for top 3)

### 5.2 Backend Services
- **Database:** AWS DynamoDB
  - Store: participant name, timestamp, transcription, score, audio file reference
  - Query capabilities: retrieve all scores sorted by score (descending), retrieve by date/time range
  
- **API Endpoints Required:**
  - POST /submit-response (accepts: name, audio file)
  - GET /leaderboard (returns: all scores sorted)
  - GET /top-scores (returns: top 3 for the day)
  - GET /stats (optional: total participants, average score - for display)

### 5.3 AI/ML Integration

#### Audio Transcription
- **Service:** OpenAI Whisper API
- **Input:** 15-second audio recording
- **Output:** Text transcription of user's response

#### Response Grading
- **Service:** OpenAI GPT-4.5 Turbo or Claude Sonnet 4.5 (both excellent for this task)
- **Input:** Transcribed text
- **Output:** 
  - Numerical score (0-100)
  - Brief roast/feedback (≤10 words)
  
**Note on Model Selection:** Either GPT-4.5 Turbo or Claude Sonnet 4.5 will work well. Claude may produce slightly more nuanced, conversational roasts. Use whichever fits budget and existing infrastructure.

## 6. Grading Rubric

### 6.1 Evaluation Criteria
The AI model should evaluate responses based on:

**ROI & Business Value (30 points)**
- Concrete examples of takeaways, learnings, or skills
- Business applications mentioned
- Value proposition for company
- Quantifiable impacts or metrics

**Professional Development (25 points)**
- Personal growth articulated
- Career advancement relevance
- Skills or knowledge gained
- Credible commitment to implementation

**Networking & Connections (20 points)**
- Specific people, companies, or organizations mentioned
- Potential partnerships or opportunities identified
- Industry connections made
- Follow-up plans mentioned

**Concrete Details & Storytelling (15 points)**
- Specific sessions, speakers, or topics mentioned
- Clear narrative structure (beginning, middle, end)
- Memorable details vs. vague generalities
- Energy and enthusiasm conveyed

**Future Value & Next Steps (10 points)**
- Expressed desire to attend next year with reasoning
- Action items or follow-ups mentioned
- Long-term impact articulated
- Clear connection to ongoing professional goals

### 6.2 Example Responses for Model Training Context

**High Score Example (90-95):**
*"I attended the AI scaling session by Sarah Chen from DataCorp and learned techniques that'll cut our processing time 40%. Met with three potential integration partners, including TechFlow who wants to pilot with us. The serverless architecture workshop gave me ideas for our Q2 migration. I'm already implementing the monitoring framework I learned, and I'd love to go next year to deepen the DataCorp relationship and catch the security track."*

**Solid Score Example (75-85):**
*"Really valuable day. The keynote on edge computing opened my eyes to solutions for our latency issues. Connected with the CTO of MicroScale who's facing similar challenges. Got practical code examples from the API design workshop that I'm taking back to the team. Definitely want to return - the ML track next year is directly relevant to our roadmap."*

**Medium Score Example (60-70):**
*"The conference was great! I went to some really interesting talks about cloud technology and AI. Met some cool people and got lots of ideas. The sessions were informative and I learned a lot about industry trends. I think it would be valuable to go again because there's always more to learn."*

**Needs Improvement Example (40-55):**
*"Pretty good. Some talks were interesting, others not so much. The food was decent. Made a few LinkedIn connections. I'd probably come back if it's convenient."*

**Low Score Example (Below 40):**
*"It was fine. Some good talks. Met a few people. Would be nice to go again I guess."*

## 7. AI Prompt Template for Grading

```
You are evaluating a conference attendee's response to their boss asking "How was the conference? (that I paid for you to go to)". 

Context: This is a fun, interactive booth experience designed to help attendees reflect on their conference value. The boss character is slightly skeptical but fair - they want ROI but appreciate genuine enthusiasm and concrete details.

The boss is evaluating whether to send this person to next year's conference based on:
- ROI & Business Value (30 pts): Concrete takeaways, business applications, quantifiable impact
- Professional Development (25 pts): Growth, career relevance, skills gained, implementation plans  
- Networking & Connections (20 pts): Specific people/companies, opportunities, follow-up plans
- Concrete Details & Storytelling (15 pts): Specific sessions, clear narrative, energy
- Future Value & Next Steps (10 pts): Desire to return with reasoning, action items, long-term impact

Response to evaluate: [TRANSCRIPTION]

Provide:
1. A score from 0-100 (be fair but have standards - most responses should fall in 50-80 range)
2. A light roast in 10 words or less. Be witty and playful, not mean. Reference something specific from their response when possible. Think friendly colleague banter, not harsh criticism.

Roast style examples:
- High scores (85+): "Your boss is already booking next year's ticket."
- Good scores (70-84): "Solid. Next time, bring actual business cards."
- Medium scores (50-69): "Your boss heard 'networking' as 'snack bar.'"
- Low scores (<50): "That's a lot of words for 'free coffee.'"

Format your response as JSON:
{
  "score": [number],
  "roast": "[text]"
}
```

## 8. Prize Structure

| Score Range | Prize | Purpose |
|-------------|-------|---------|
| 80-89 | Prize Tier 1 (TBD by organizer) | Reward good effort, encourage participation |
| 90-100 | Prize Tier 2 (TBD by organizer) | Celebrate excellence |
| Top 3 Daily | Free tickets to next year's Code and Cloud Con | Ultimate goal, creates buzz |

**Prize Suggestions:**
- Tier 1 (80-89): Conference swag bag, book voucher, coffee gift card
- Tier 2 (90-100): Premium swag, tech gadget, larger gift card
- Top 3: Next year's tickets (generates word-of-mouth marketing)

**Display Logic:**
- Show prize notification immediately after score reveal
- Make it celebratory for 80+ scores
- For top 3 contenders, hint at leaderboard position

## 9. Data Schema (DynamoDB)

### Table: conference_responses

**Primary Key:** response_id (UUID)  
**Sort Key:** timestamp (ISO 8601)

**Attributes:**
- response_id: String (UUID)
- timestamp: String (ISO 8601 datetime)
- participant_name: String
- transcription: String
- score: Number (0-100)
- roast: String
- audio_file_url: String (S3 reference)
- session_date: String (YYYY-MM-DD for daily filtering)

**Indexes:**
- GSI: session_date-score-index (for daily leaderboard queries)

## 10. Non-Functional Requirements

### 10.1 Performance
- Response processing time: < 10 seconds from recording end to score display
- Leaderboard updates: Real-time or < 2 second delay
- Audio recording: Reliable capture across iPad Safari versions
- Page load time: < 2 seconds

### 10.2 Usability
- Large, touch-friendly UI elements (minimum 44x44pt tap targets)
- Clear visual feedback for recording status (pulsing indicator)
- Countdown timer must be highly visible (minimum 72pt font)
- Error handling with user-friendly, encouraging messages
- "Try again" option if recording fails
- Accessibility: High contrast, clear audio cues

### 10.3 Engagement Optimization
- Smooth animations that don't slow down experience
- Score reveal should have satisfying buildup (2-3 second animation)
- Leaderboard should be visible from challenge screen (navigation tab or link)
- Consider adding sound effects (optional, toggle-able)
- Social sharing capability (optional: "Share my score" button)

### 10.4 Security & Privacy
- Audio files stored securely in S3 with appropriate access controls
- No PII beyond name and timestamp
- HTTPS for all communications
- Consider data retention policy for post-event cleanup (suggest 90 days)
- Clear privacy notice: "Audio used only for scoring, not retained long-term"

### 10.5 Scalability
- Support for concurrent users at booth (assume 5-10 simultaneous)
- Daily capacity: 100-500 submissions (adjust based on expected traffic)
- Handle graceful degradation if AI APIs are slow

## 11. Out of Scope (for Initial Version)
- User authentication/login
- Editing or deleting responses
- Multi-language support
- Mobile phone optimization (iPad only)
- Admin panel for moderation (can be added later)
- Video recording (audio only for MVP)
- Multi-day persistent leaderboards (daily reset is fine)

## 12. Success Metrics

### 12.1 Technical Metrics
- 95%+ successful recording → transcription → grading pipeline
- Average time from start to score: < 30 seconds
- System uptime during event hours: 99%+

### 12.2 Engagement Metrics
- **Primary:** Completion rate (users who start complete the challenge): Target 80%+
- Participation rate: Total participants vs. conference attendance
- Repeat attempts (if allowed): Indicates engagement
- Average score distribution (expect bell curve around 60-70)
- Leaderboard views vs. challenge attempts (indicates spectator interest)

### 12.3 Qualitative Goals
- Generates buzz/conversation at booth
- Attendees share experience with colleagues
- Creates social media moments (if sharing enabled)
- Helps attendees genuinely reflect on conference value

## 13. Development Phases (Suggested)

**Phase 1 (MVP - step 1):** 
- Challenge screen with audio recording
- Basic transcription (Whisper API integration)
- Simple UI/UX with countdown

**Phase 2 (Scoring - step 2):** 
- Full AI grading with rubric
- Roast generation
- Score display with basic animations

**Phase 3 (Gamification - step 3):** 
- Leaderboard implementation
- Prize logic and notifications
- DynamoDB integration

**Phase 4 (Polish - step 4):** 
- Visual design refinement
- Error handling and edge cases
- Performance optimization
- User testing and iteration

## 14. Booth Logistics Considerations

### 14.1 Physical Setup
- iPad on stand or mounted
- Quiet-ish area (background noise tolerance needs testing)
- Clear signage explaining the challenge
- Booth staff to encourage participation and explain rules
- Consider privacy screen or angled position for speaker comfort

### 14.2 Operational Notes
- Pre-load app on iPad before event
- Test audio recording quality in booth environment
- Have backup device in case of technical issues
- Monitor leaderboard throughout day
- Plan for announcing winners (end of day or next morning)

### 14.3 Engagement Tactics
- Have booth staff participate first to demonstrate
- Display leaderboard on secondary screen to attract attention
- Offer "practice mode" for nervous participants (optional)
- Create friendly competitive atmosphere

---

**Document Version:** 1.1  
**Last Updated:** November 6, 2025  
**Next Steps:** 
1. Review with development team
2. Finalize prize details and sourcing
3. Set up AWS resources (DynamoDB, S3, API Gateway)
4. Create design mockups
5. Begin Phase 1 development
6. Plan booth logistics and staffing

**Key Insight:** This tool's success hinges on making self-reflection feel like play, not work. The "boss" framing creates just enough pressure to make people think seriously, while the roast and prizes keep it light and fun. The leaderboard transforms a solo reflection into a social experience.
