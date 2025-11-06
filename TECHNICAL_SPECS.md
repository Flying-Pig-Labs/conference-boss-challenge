# Conference Boss Challenge - Technical Specifications & Vetting Report

**Document Version:** 1.0
**Date:** November 6, 2025
**Status:** Technical Review Complete

---

## Executive Summary

This document provides a comprehensive technical vetting of the Conference Boss Challenge project, breaking it down into four implementation phases with detailed specifications. Critical gaps, dependencies, and risks have been identified and addressed.

### Critical Issues Identified

1. **CRITICAL:** Audio capture format and browser compatibility not specified
2. **CRITICAL:** No architecture defined for serverless backend
3. **CRITICAL:** Real-time leaderboard update mechanism undefined
4. **CRITICAL:** Missing S3 upload strategy and file handling
5. **HIGH:** No error handling or retry logic specified
6. **HIGH:** API authentication and security not defined
7. **HIGH:** Cost estimation and rate limiting missing
8. **MEDIUM:** No deployment or CI/CD strategy
9. **MEDIUM:** Monitoring and observability not addressed

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Backend Infrastructure](#phase-1-backend-infrastructure)
3. [Phase 2: API Layer](#phase-2-api-layer)
4. [Phase 3: Frontend Application](#phase-3-frontend-application)
5. [Phase 4: Integration & Testing](#phase-4-integration--testing)
6. [Dependencies & Prerequisites](#dependencies--prerequisites)
7. [Risk Analysis](#risk-analysis)
8. [Cost Estimation](#cost-estimation)
9. [Deployment Strategy](#deployment-strategy)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (iPad)                         │
│  ┌──────────────┐           ┌─────────────────────┐        │
│  │  Challenge   │ ◄────────►│   Leaderboard       │        │
│  │  Screen      │           │   Screen            │        │
│  └──────┬───────┘           └──────▲──────────────┘        │
│         │                           │                        │
└─────────┼───────────────────────────┼────────────────────────┘
          │                           │
          │ HTTPS/REST                │ HTTPS/REST or WebSocket
          ▼                           │
┌─────────────────────────────────────────────────────────────┐
│                    AWS API Gateway                           │
│                    (REST API + CORS)                         │
└─────┬───────────────────────────────┬───────────────────────┘
      │                               │
      ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│ Lambda: Submit      │       │ Lambda: Leaderboard │
│ - Validate input    │       │ - Query DynamoDB    │
│ - Upload to S3      │       │ - Sort & filter     │
│ - Trigger process   │       │ - Return JSON       │
└──────┬──────────────┘       └─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Lambda: Process     │
│ - Download from S3  │
│ - Call Whisper API  │
│ - Call GPT/Claude   │
│ - Save to DynamoDB  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data & Storage Layer                      │
│  ┌──────────────┐    ┌───────────────┐   ┌──────────────┐ │
│  │  DynamoDB    │    │   S3 Bucket   │   │ CloudWatch   │ │
│  │  Responses   │    │   Audio Files │   │   Logs       │ │
│  └──────────────┘    └───────────────┘   └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐              ┌───────────────────────┐   │
│  │ OpenAI       │              │ Anthropic Claude API  │   │
│  │ Whisper API  │              │ (Alternative)         │   │
│  └──────────────┘              └───────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ (with Hooks)
- Vite (build tool, fast dev server)
- TailwindCSS (styling)
- React Router (navigation)
- Axios (HTTP client)
- MediaRecorder API (audio capture)

**Backend:**
- AWS Lambda (Node.js 20.x runtime)
- API Gateway (REST API with CORS)
- DynamoDB (NoSQL database)
- S3 (audio file storage)
- CloudWatch (logging and monitoring)

**External Services:**
- OpenAI Whisper API (transcription)
- OpenAI GPT-4.5 Turbo OR Anthropic Claude Sonnet 4.5 (grading)

**Infrastructure as Code:**
- AWS SAM or Terraform (recommended: AWS SAM for Lambda-focused projects)
- AWS CLI (deployment)

---

## Phase 1: Backend Infrastructure

### 1.1 AWS Resources Setup

#### 1.1.1 DynamoDB Table

**Table Name:** `conference-responses`

**Primary Key:**
- Partition Key: `response_id` (String, UUID)
- Sort Key: `timestamp` (Number, Unix timestamp in milliseconds)

**Attributes:**
```javascript
{
  response_id: String,        // UUID v4
  timestamp: Number,          // Unix timestamp (milliseconds) for efficient sorting
  created_at: String,         // ISO 8601 for human readability
  participant_name: String,
  transcription: String,
  score: Number,              // 0-100
  roast: String,              // Max 100 characters
  audio_file_url: String,     // S3 object key
  session_date: String,       // YYYY-MM-DD for daily filtering
  processing_status: String,  // 'pending', 'processing', 'completed', 'failed'
  error_message: String       // Optional, for failed responses
}
```

**Global Secondary Index (GSI):**
- Index Name: `session-date-score-index`
- Partition Key: `session_date` (String)
- Sort Key: `score` (Number)
- Projection: ALL
- Purpose: Efficient daily leaderboard queries sorted by score

**Capacity Mode:** On-Demand (for unpredictable booth traffic)

**TTL Configuration:** Enable TTL on `ttl` attribute (set to 90 days post-event for automatic cleanup)

**CRITICAL ISSUE IDENTIFIED:**
- Original design used String for timestamp as sort key, but Number is more efficient
- Need GSI for leaderboard queries to avoid table scans
- Processing status needed to handle async workflow

#### 1.1.2 S3 Bucket

**Bucket Name:** `conference-boss-audio-files-[account-id]`

**Configuration:**
- **Region:** Same as Lambda functions (e.g., us-east-1)
- **Versioning:** Disabled (not needed for this use case)
- **Encryption:** AES-256 server-side encryption (S3-managed keys)
- **Lifecycle Policy:** Delete objects after 90 days
- **CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**CRITICAL ISSUE IDENTIFIED:**
- No CORS configuration specified in original plan
- Without CORS, presigned URL uploads from browser will fail

#### 1.1.3 IAM Roles

**Lambda Execution Role: `ConferenceBossLambdaRole`**

Permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/conference-responses",
        "arn:aws:dynamodb:*:*:table/conference-responses/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::conference-boss-audio-files-*/*"
    }
  ]
}
```

### 1.2 Lambda Functions

#### 1.2.1 Submit Lambda (`submit-response`)

**Runtime:** Node.js 20.x
**Memory:** 256 MB
**Timeout:** 15 seconds
**Trigger:** API Gateway

**Purpose:** Handle initial submission, generate presigned S3 URL, create DynamoDB record

**Input:**
```json
{
  "name": "string",
  "audioFormat": "string",  // e.g., "webm", "mp4", "wav"
  "audioSize": number       // bytes
}
```

**Output:**
```json
{
  "responseId": "uuid",
  "uploadUrl": "string",     // Presigned S3 URL
  "expiresIn": 300          // seconds
}
```

**Logic:**
1. Validate input (name: 1-50 chars, audioSize < 5MB)
2. Generate UUID for response_id
3. Create DynamoDB record with status='pending'
4. Generate presigned S3 PUT URL (5-minute expiration)
5. Return response with upload URL

**Environment Variables:**
- `DYNAMODB_TABLE_NAME`
- `S3_BUCKET_NAME`
- `S3_PRESIGNED_URL_EXPIRATION` (300)

**Error Handling:**
- 400: Invalid input (missing name, size too large)
- 500: DynamoDB/S3 errors
- Return structured error JSON

**CRITICAL ISSUE IDENTIFIED:**
- Original plan didn't specify how audio upload works
- Need two-step process: get presigned URL, then upload from frontend
- Audio format validation needed (iPad Safari outputs specific formats)

#### 1.2.2 Process Lambda (`process-response`)

**Runtime:** Node.js 20.x
**Memory:** 512 MB (AI API calls may need more memory for retries)
**Timeout:** 60 seconds
**Trigger:** API Gateway (called after successful S3 upload)

**Purpose:** Transcribe audio, grade response, update DynamoDB

**Input:**
```json
{
  "responseId": "uuid"
}
```

**Output:**
```json
{
  "responseId": "uuid",
  "score": number,
  "roast": "string",
  "transcription": "string",
  "prizeEligible": boolean
}
```

**Logic:**
1. Retrieve DynamoDB record by responseId
2. Update status to 'processing'
3. Download audio file from S3
4. Call OpenAI Whisper API for transcription
   - Retry up to 3 times with exponential backoff
5. Call GPT-4.5/Claude API for grading
   - Pass transcription + grading prompt
   - Parse JSON response (score, roast)
6. Update DynamoDB with results, set status='completed'
7. Return response

**Environment Variables:**
- `DYNAMODB_TABLE_NAME`
- `S3_BUCKET_NAME`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY` (if using Claude)
- `AI_MODEL_CHOICE` ('openai' or 'anthropic')

**Error Handling:**
- Update DynamoDB status='failed' with error_message
- Log to CloudWatch
- Return 500 with structured error
- Implement circuit breaker for AI API failures

**Retry Logic:**
```javascript
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
  }
};
```

**CRITICAL ISSUES IDENTIFIED:**
- No error handling strategy in original plan
- AI APIs can fail or timeout - need retry logic
- Processing status tracking essential for UX
- Need to handle partial failures gracefully

#### 1.2.3 Leaderboard Lambda (`get-leaderboard`)

**Runtime:** Node.js 20.x
**Memory:** 256 MB
**Timeout:** 10 seconds
**Trigger:** API Gateway

**Purpose:** Retrieve and return sorted leaderboard

**Input (Query Parameters):**
```javascript
{
  sessionDate: 'YYYY-MM-DD',  // defaults to today
  limit: number               // defaults to 100
}
```

**Output:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "name": "string",
      "score": number,
      "timestamp": "ISO 8601",
      "roast": "string"
    }
  ],
  "totalParticipants": number,
  "averageScore": number,
  "lastUpdated": "ISO 8601"
}
```

**Logic:**
1. Query DynamoDB GSI `session-date-score-index`
2. Filter by session_date (today by default)
3. Sort by score descending (GSI handles this efficiently)
4. Limit results (default 100)
5. Calculate rank based on position
6. Calculate aggregate stats (total, average)
7. Return JSON response

**Caching Strategy:**
- Add `Cache-Control: max-age=2` header
- Frontend can poll every 3-5 seconds for "real-time" updates
- Consider API Gateway caching for 2 seconds

**Environment Variables:**
- `DYNAMODB_TABLE_NAME`
- `GSI_NAME` ('session-date-score-index')

**CRITICAL ISSUE IDENTIFIED:**
- Original plan mentioned "real-time" but no mechanism defined
- WebSockets are overkill for this use case
- Polling with short cache is simpler and sufficient

### 1.3 CloudWatch Configuration

**Log Groups:**
- `/aws/lambda/conference-boss-submit`
- `/aws/lambda/conference-boss-process`
- `/aws/lambda/conference-boss-leaderboard`

**Retention:** 7 days (cost optimization)

**Alarms:**
- Lambda errors > 5 in 5 minutes
- Lambda duration > 10 seconds (p99)
- DynamoDB throttled requests > 0
- API Gateway 5xx errors > 10 in 5 minutes

**Metrics Dashboard:**
- Total submissions (count)
- Average processing time (duration)
- Success rate (percentage)
- Leaderboard requests (count)

---

## Phase 2: API Layer

### 2.1 API Gateway Configuration

**API Type:** REST API (not HTTP API, for better integration options)
**Name:** `conference-boss-api`
**Stage:** `prod`

#### 2.1.1 API Endpoints

##### POST /submit

**Request:**
```
Headers:
  Content-Type: application/json
Body:
{
  "name": "string",
  "audioFormat": "string",
  "audioSize": number
}
```

**Response (200):**
```json
{
  "responseId": "uuid",
  "uploadUrl": "string",
  "expiresIn": 300
}
```

**Response (400):**
```json
{
  "error": "Invalid input",
  "details": "string"
}
```

**Lambda Integration:** `submit-response`

##### POST /process

**Request:**
```
Headers:
  Content-Type: application/json
Body:
{
  "responseId": "uuid"
}
```

**Response (200):**
```json
{
  "responseId": "uuid",
  "score": number,
  "roast": "string",
  "transcription": "string",
  "prizeEligible": boolean
}
```

**Response (404):**
```json
{
  "error": "Response not found"
}
```

**Lambda Integration:** `process-response`

##### GET /leaderboard

**Request:**
```
Query Parameters:
  sessionDate: YYYY-MM-DD (optional, defaults to today)
  limit: number (optional, defaults to 100)
```

**Response (200):**
```json
{
  "leaderboard": [...],
  "totalParticipants": number,
  "averageScore": number,
  "lastUpdated": "ISO 8601"
}
```

**Lambda Integration:** `get-leaderboard`

#### 2.1.2 CORS Configuration

**CRITICAL:** Must be configured for frontend to work

```javascript
Access-Control-Allow-Origin: * (or specific domain for production)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token
Access-Control-Max-Age: 3600
```

**Enable CORS on all endpoints including OPTIONS preflight**

#### 2.1.3 Rate Limiting & Throttling

**Throttle Settings:**
- Rate: 100 requests/second
- Burst: 200 requests

**Usage Plan (optional for production):**
- API Key required
- Quota: 10,000 requests/day
- Throttle: 50 requests/second per key

**ISSUE IDENTIFIED:**
- No rate limiting discussed in original plan
- Booth environment may not need API keys, but throttling prevents abuse

#### 2.1.4 Request Validation

**API Gateway Request Validators:**
- Enable request validation on all POST endpoints
- Validate request body against JSON schema
- Reject invalid requests before reaching Lambda (cost optimization)

**Example Schema for POST /submit:**
```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "audioFormat": {
      "type": "string",
      "enum": ["webm", "mp4", "wav", "m4a"]
    },
    "audioSize": {
      "type": "number",
      "minimum": 1,
      "maximum": 5242880
    }
  },
  "required": ["name", "audioFormat", "audioSize"]
}
```

### 2.2 API Documentation

**Use OpenAPI 3.0 Specification:**
- Generate Swagger/OpenAPI spec from API Gateway
- Export to `api-spec.yaml`
- Use for frontend integration and testing

**ISSUE IDENTIFIED:**
- No API documentation strategy in original plan
- OpenAPI spec essential for frontend/backend coordination

---

## Phase 3: Frontend Application

### 3.1 Project Setup

**Framework:** React 18 with Vite

**Project Structure:**
```
conference-boss-frontend/
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── assets/
│   │   ├── sounds/
│   │   └── images/
│   ├── components/
│   │   ├── AudioRecorder.jsx
│   │   ├── Countdown.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── NameInput.jsx
│   │   ├── PrizeNotification.jsx
│   │   ├── ScoreDisplay.jsx
│   │   └── RoastDisplay.jsx
│   ├── hooks/
│   │   ├── useAudioRecorder.js
│   │   ├── useLeaderboard.js
│   │   └── useSubmission.js
│   ├── pages/
│   │   ├── ChallengePage.jsx
│   │   └── LeaderboardPage.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── audioProcessor.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── validators.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .env
├── package.json
├── tailwind.config.js
└── vite.config.js
```

### 3.2 Audio Recording Implementation

#### 3.2.1 Browser Compatibility

**CRITICAL ISSUE:** iPad Safari audio capture has specific requirements

**MediaRecorder API Support:**
- Safari 14.5+ supports MediaRecorder
- Default format: `audio/mp4` (AAC codec)
- Alternative: `audio/webm` (may not be supported)

**Required Feature Detection:**
```javascript
const checkAudioSupport = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { supported: false, error: 'MediaDevices not supported' };
  }

  if (!window.MediaRecorder) {
    return { supported: false, error: 'MediaRecorder not supported' };
  }

  // Test supported MIME types
  const mimeTypes = [
    'audio/mp4',
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/wav'
  ];

  const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

  return {
    supported: true,
    mimeType: supportedType || 'audio/mp4'
  };
};
```

#### 3.2.2 Audio Recording Hook

**File:** `src/hooks/useAudioRecorder.js`

```javascript
import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(15);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerInterval = useRef(null);
  const stream = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Detect supported MIME type
      const mimeType = ['audio/mp4', 'audio/webm', 'audio/wav']
        .find(type => MediaRecorder.isTypeSupported(type)) || 'audio/mp4';

      mediaRecorder.current = new MediaRecorder(stream.current, { mimeType });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mimeType });
        setAudioBlob(blob);

        // Stop all tracks to release microphone
        stream.current.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(15);

      // Countdown timer
      timerInterval.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError('Microphone permission denied or not available');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(15);
    setError(null);
  }, []);

  return {
    isRecording,
    recordingTime,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    reset
  };
};
```

**ISSUES IDENTIFIED & ADDRESSED:**
- Microphone permission handling
- Safari-specific MIME type detection
- Proper cleanup of media streams
- Timer synchronization
- Error states

### 3.3 API Integration

#### 3.3.1 API Service

**File:** `src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Network error
      console.error('Network Error:', error.message);
      return Promise.reject({ error: 'Network error. Please check your connection.' });
    } else {
      console.error('Error:', error.message);
      return Promise.reject({ error: error.message });
    }
  }
);

export const submitResponse = async (name, audioBlob) => {
  // Step 1: Get presigned URL
  const { data } = await apiClient.post('/submit', {
    name,
    audioFormat: audioBlob.type.split('/')[1] || 'mp4',
    audioSize: audioBlob.size
  });

  const { responseId, uploadUrl } = data;

  // Step 2: Upload audio to S3 using presigned URL
  await axios.put(uploadUrl, audioBlob, {
    headers: {
      'Content-Type': audioBlob.type
    }
  });

  // Step 3: Trigger processing
  const processResult = await apiClient.post('/process', { responseId });

  return processResult.data;
};

export const getLeaderboard = async (sessionDate = null, limit = 100) => {
  const params = {};
  if (sessionDate) params.sessionDate = sessionDate;
  if (limit) params.limit = limit;

  const { data } = await apiClient.get('/leaderboard', { params });
  return data;
};

export default apiClient;
```

**CRITICAL ISSUES ADDRESSED:**
- Two-step upload process (presigned URL, then S3)
- Proper Content-Type headers
- Error handling and retries
- Environment variable configuration

#### 3.3.2 Submission Hook

**File:** `src/hooks/useSubmission.js`

```javascript
import { useState } from 'react';
import { submitResponse } from '../services/api';

export const useSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (name, audioBlob) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const data = await submitResponse(name, audioBlob);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.error || 'Submission failed. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    isSubmitting,
    result,
    error,
    submit,
    reset
  };
};
```

### 3.4 UI Components

#### 3.4.1 Countdown Timer

**File:** `src/components/Countdown.jsx`

```javascript
import React from 'react';

export const Countdown = ({ seconds, isActive }) => {
  const getColorClass = () => {
    if (seconds > 10) return 'text-green-500';
    if (seconds > 5) return 'text-yellow-500';
    return 'text-red-500 animate-pulse';
  };

  return (
    <div className={`text-9xl font-bold ${getColorClass()} transition-colors duration-300`}>
      {seconds}
    </div>
  );
};
```

#### 3.4.2 Audio Recorder Component

**File:** `src/components/AudioRecorder.jsx`

```javascript
import React from 'react';
import { Countdown } from './Countdown';

export const AudioRecorder = ({
  isRecording,
  recordingTime,
  onStart,
  onStop
}) => {
  return (
    <div className="flex flex-col items-center space-y-8">
      {isRecording && <Countdown seconds={recordingTime} isActive={isRecording} />}

      {isRecording && (
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xl font-medium">Recording...</span>
        </div>
      )}

      {!isRecording && (
        <button
          onClick={onStart}
          className="bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold py-6 px-12 rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
        >
          🎤 Reply to Boss
        </button>
      )}
    </div>
  );
};
```

#### 3.4.3 Score Display

**File:** `src/components/ScoreDisplay.jsx`

```javascript
import React, { useEffect, useState } from 'react';

export const ScoreDisplay = ({ score, onComplete }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animated count-up effect
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = score / steps;
    const stepTime = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
        if (onComplete) onComplete();
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, onComplete]);

  const getScoreColor = () => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="text-center">
      <div className={`text-8xl font-bold ${getScoreColor()}`}>
        {displayScore}
      </div>
      <div className="text-2xl text-gray-600 mt-4">out of 100</div>
    </div>
  );
};
```

### 3.5 Responsive Design (iPad Optimization)

**Target Devices:**
- iPad (9.7" and 10.2"): 768x1024px
- iPad Pro (11"): 834x1194px
- iPad Pro (12.9"): 1024x1366px

**TailwindCSS Configuration:**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        'ipad': '768px',
        'ipad-pro': '1024px',
      },
      fontSize: {
        'countdown': '12rem',
      }
    }
  }
};
```

**Touch Target Sizes:**
- Minimum: 44x44pt (Apple Human Interface Guidelines)
- Recommended: 56x56pt for primary actions
- Spacing: 8pt minimum between targets

---

## Phase 4: Integration & Testing

### 4.1 Integration Workflow

#### 4.1.1 End-to-End Flow

1. **User loads app** → Frontend loads, checks audio support
2. **User enters name** → Validation (1-50 chars, no special chars)
3. **User clicks "Reply"** → Request microphone permission
4. **Recording starts** → MediaRecorder captures audio, countdown begins
5. **Recording ends** → Audio blob created
6. **Upload initiated** → POST /submit → receives presigned URL
7. **S3 upload** → PUT to presigned URL
8. **Processing triggered** → POST /process → Lambda processes async
9. **Results displayed** → Score, roast, prize notification
10. **Leaderboard updated** → GET /leaderboard (polling every 5s)

#### 4.1.2 Error Scenarios & Recovery

| Error Scenario | Recovery Strategy |
|---------------|-------------------|
| Microphone permission denied | Display clear error, instructions to enable |
| Network failure during upload | Retry 3 times with exponential backoff, then fail gracefully |
| S3 upload fails | Return error to user, "Try again" button |
| AI API timeout | Lambda retries, frontend shows "Processing..." for up to 60s |
| Processing fails | Display generic error, log to CloudWatch |
| Leaderboard fetch fails | Show cached data or "Unable to load" message |

### 4.2 Testing Strategy

#### 4.2.1 Backend Testing

**Unit Tests (Jest):**
- Lambda function logic (mocked AWS SDK)
- Input validation
- Error handling
- Retry logic

**Integration Tests:**
- DynamoDB queries (local DynamoDB)
- S3 operations (LocalStack)
- API Gateway endpoints (sam local)

**Load Tests (Artillery):**
- 10 concurrent users submitting
- 50 users viewing leaderboard simultaneously
- Stress test: 100 rapid submissions

#### 4.2.2 Frontend Testing

**Unit Tests (Vitest + React Testing Library):**
- Component rendering
- Hook logic (useAudioRecorder, useSubmission)
- API service functions (mocked axios)

**Integration Tests:**
- Full user flow with mocked API
- Audio recording simulation
- Leaderboard updates

**Manual Testing (iPad):**
- Test on actual iPad devices (Safari)
- Verify audio recording quality
- Test touch interactions
- Check responsive layout
- Verify animations and transitions

#### 4.2.3 E2E Testing

**Playwright Tests:**
```javascript
test('complete challenge flow', async ({ page }) => {
  await page.goto('/');

  // Enter name
  await page.fill('input[name="name"]', 'Test User');
  await page.click('button:has-text("Reply to Boss")');

  // Wait for recording to complete (15s + buffer)
  await page.waitForTimeout(16000);

  // Verify score display
  await expect(page.locator('.score-display')).toBeVisible();
  const score = await page.locator('.score-display').textContent();
  expect(parseInt(score)).toBeGreaterThanOrEqual(0);
  expect(parseInt(score)).toBeLessThanOrEqual(100);

  // Navigate to leaderboard
  await page.click('a:has-text("Leaderboard")');
  await expect(page.locator('.leaderboard-table')).toBeVisible();

  // Verify entry appears
  await expect(page.locator('text=Test User')).toBeVisible();
});
```

### 4.3 Monitoring & Observability

#### 4.3.1 CloudWatch Dashboards

**Metrics to Track:**
- Total submissions (count per minute)
- Processing duration (p50, p95, p99)
- Error rate (percentage)
- Leaderboard requests (count per minute)
- AI API latency (milliseconds)

**Custom Metrics:**
```javascript
// In Lambda functions
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

await cloudwatch.putMetricData({
  Namespace: 'ConferenceBoss',
  MetricData: [{
    MetricName: 'ProcessingDuration',
    Value: duration,
    Unit: 'Milliseconds',
    Timestamp: new Date()
  }]
}).promise();
```

#### 4.3.2 Error Tracking

**Frontend (Sentry or similar):**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**Backend (CloudWatch Logs Insights):**
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

---

## Dependencies & Prerequisites

### Phase 1 Dependencies (Backend)

**AWS Account Setup:**
- [ ] AWS account with appropriate permissions
- [ ] AWS CLI installed and configured
- [ ] IAM user with AdministratorAccess (or specific permissions)

**AWS Resources:**
- [ ] DynamoDB table created
- [ ] S3 bucket created with CORS
- [ ] IAM roles configured
- [ ] CloudWatch log groups

**API Keys:**
- [ ] OpenAI API key (with credits)
- [ ] Anthropic API key (optional, if using Claude)

**Development Tools:**
- [ ] Node.js 20.x installed
- [ ] AWS SAM CLI or Terraform
- [ ] Postman or curl (for API testing)

### Phase 2 Dependencies (API)

**Prerequisites:**
- [ ] Phase 1 complete
- [ ] Lambda functions deployed
- [ ] DynamoDB and S3 accessible

**API Gateway Setup:**
- [ ] API Gateway REST API created
- [ ] CORS configured
- [ ] Lambda integrations connected
- [ ] API deployed to `prod` stage

### Phase 3 Dependencies (Frontend)

**Development Environment:**
- [ ] Node.js 18+ installed
- [ ] npm or yarn
- [ ] iPad (for testing) or Safari browser
- [ ] HTTPS enabled (required for MediaRecorder API)

**Frontend Libraries:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

**Environment Variables:**
```bash
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
VITE_SENTRY_DSN=your-sentry-dsn (optional)
```

### Phase 4 Dependencies (Integration)

**Testing Tools:**
- [ ] Jest (backend unit tests)
- [ ] Vitest (frontend unit tests)
- [ ] Playwright (E2E tests)
- [ ] Artillery (load testing)

**Deployment:**
- [ ] S3 bucket for static hosting (frontend)
- [ ] CloudFront distribution (optional, for CDN)
- [ ] Custom domain and SSL certificate (optional)

---

## Risk Analysis

### High-Priority Risks

#### 1. Audio Recording Browser Compatibility
**Risk:** Safari MediaRecorder API may not work as expected
**Impact:** HIGH - Core functionality broken
**Mitigation:**
- Test early on actual iPad devices
- Implement fallback UI for unsupported browsers
- Consider polyfill or alternative recording libraries
- Budget time for cross-browser debugging

#### 2. AI API Rate Limits & Costs
**Risk:** OpenAI/Anthropic may rate-limit or become expensive
**Impact:** MEDIUM - Service degradation or unexpected costs
**Mitigation:**
- Implement API rate limiting on backend
- Set up billing alerts on OpenAI/Anthropic accounts
- Cache common responses (if appropriate)
- Budget $50-200 for API calls during event

**Cost Estimation:**
- Whisper API: $0.006/minute = $0.0015 per 15-second clip
- GPT-4.5 Turbo: ~$0.01 per grading (assuming 500 tokens)
- Total per submission: ~$0.012
- 500 submissions: ~$6
- Safe budget: $50 (includes retries and overhead)

#### 3. Network Reliability at Conference Venue
**Risk:** Poor WiFi may cause upload failures
**Impact:** HIGH - User frustration, incomplete submissions
**Mitigation:**
- Implement robust retry logic
- Show clear upload progress indicators
- Cache submissions locally and retry in background
- Consider mobile hotspot as backup internet

#### 4. Concurrent Processing Bottleneck
**Risk:** Multiple simultaneous submissions overwhelm processing Lambda
**Impact:** MEDIUM - Slow response times, timeouts
**Mitigation:**
- Increase Lambda concurrency limits
- Implement SQS queue for async processing (Phase 2 enhancement)
- Monitor processing duration closely
- Scale Lambda memory if needed

#### 5. DynamoDB Query Performance
**Risk:** Large dataset slows leaderboard queries
**Impact:** LOW-MEDIUM - Leaderboard loads slowly
**Mitigation:**
- GSI properly configured for efficient queries
- Limit results to top 100
- Implement API Gateway caching
- Consider pagination for very large datasets

### Medium-Priority Risks

#### 6. Audio File Size & Upload Time
**Risk:** Large audio files slow down upload over slow networks
**Impact:** MEDIUM - Poor UX, timeouts
**Mitigation:**
- Limit recording to 15 seconds (enforced)
- Use compressed audio format (MP4/AAC)
- Set reasonable timeout (30s) with progress indicator

#### 7. Prize Logic Accuracy
**Risk:** Incorrect prize notifications or eligibility
**Impact:** LOW-MEDIUM - User confusion, wrong winners
**Mitigation:**
- Thorough testing of prize logic
- Manual verification of top 3 before announcing
- Admin view to review scores

#### 8. Data Privacy & GDPR
**Risk:** Storing audio and names without consent
**Impact:** LOW - Legal/compliance issue
**Mitigation:**
- Display clear privacy notice on start screen
- Implement 90-day TTL on all data
- Don't collect email or other PII
- Consider "I consent" checkbox

### Low-Priority Risks

#### 9. UI/UX Not Engaging Enough
**Risk:** Design doesn't motivate participation
**Impact:** LOW - Lower participation rates
**Mitigation:**
- User testing with sample participants
- Iterate on design based on feedback
- Add celebratory animations and sounds

#### 10. Leaderboard Manipulation
**Risk:** Users spam submissions to dominate leaderboard
**Impact:** LOW - Unfair competition
**Mitigation:**
- Rate limit per name (max 3 attempts per hour)
- Manual review of top 3
- Display "best score" per name, not all attempts

---

## Cost Estimation

### AWS Costs (500 submissions over 1-day event)

| Service | Unit Cost | Usage | Total Cost |
|---------|-----------|-------|------------|
| API Gateway | $3.50/million requests | 1,500 requests | $0.01 |
| Lambda (Invoke) | $0.20/million requests | 1,500 invocations | $0.01 |
| Lambda (Duration) | $0.0000166667/GB-second | 500 submissions × 10s × 0.5GB | $0.04 |
| DynamoDB | On-Demand, $1.25/million writes | 500 writes, 1,500 reads | $0.01 |
| S3 (Storage) | $0.023/GB | 500 files × 200KB = 0.1GB | $0.01 |
| S3 (Requests) | $0.005/1000 PUT | 500 PUTs | $0.01 |
| CloudWatch Logs | $0.50/GB | ~0.5GB | $0.25 |

**AWS Subtotal:** ~$0.34 per event

### External API Costs

| Service | Unit Cost | Usage | Total Cost |
|---------|-----------|-------|------------|
| OpenAI Whisper | $0.006/minute | 500 × 15s = 125 min | $0.75 |
| OpenAI GPT-4.5 Turbo | ~$0.01/grading | 500 gradings | $5.00 |

**API Subtotal:** ~$5.75 per event

### Total Estimated Cost per Event: **$6-10**

**Notes:**
- Costs scale linearly with submissions
- Development/testing may add $10-20 in API costs
- Monthly AWS costs negligible if unused between events
- First event may incur one-time setup costs (domain, SSL, etc.)

---

## Deployment Strategy

### Phase 1: Backend Deployment

**Using AWS SAM:**

1. **Initialize SAM template:**
```bash
sam init --runtime nodejs20.x --name conference-boss-backend
```

2. **Create `template.yaml`:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs20.x
    Environment:
      Variables:
        DYNAMODB_TABLE_NAME: !Ref ResponsesTable
        S3_BUCKET_NAME: !Ref AudioBucket

Resources:
  ResponsesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: conference-responses
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: response_id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
        - AttributeName: session_date
          AttributeType: S
        - AttributeName: score
          AttributeType: N
      KeySchema:
        - AttributeName: response_id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: session-date-score-index
          KeySchema:
            - AttributeName: session_date
              KeyType: HASH
            - AttributeName: score
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

  AudioBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub conference-boss-audio-${AWS::AccountId}
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders: ['*']
            AllowedMethods: [PUT, POST, GET]
            AllowedOrigins: ['*']
            MaxAge: 3600

  SubmitFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/submit/
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ResponsesTable
        - S3CrudPolicy:
            BucketName: !Ref AudioBucket
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /submit
            Method: post

  ProcessFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/process/
      Handler: index.handler
      Timeout: 60
      MemorySize: 512
      Environment:
        Variables:
          OPENAI_API_KEY: !Ref OpenAIApiKey
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ResponsesTable
        - S3CrudPolicy:
            BucketName: !Ref AudioBucket
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /process
            Method: post

  LeaderboardFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/leaderboard/
      Handler: index.handler
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref ResponsesTable
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /leaderboard
            Method: get

Parameters:
  OpenAIApiKey:
    Type: String
    NoEcho: true

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/
```

3. **Deploy:**
```bash
sam build
sam deploy --guided --parameter-overrides OpenAIApiKey=your-api-key
```

### Phase 2: Frontend Deployment

**Option 1: S3 + CloudFront**

```bash
# Build frontend
cd conference-boss-frontend
npm run build

# Create S3 bucket
aws s3 mb s3://conference-boss-frontend

# Enable static website hosting
aws s3 website s3://conference-boss-frontend --index-document index.html

# Upload files
aws s3 sync dist/ s3://conference-boss-frontend --delete

# Make public
aws s3 cp s3://conference-boss-frontend s3://conference-boss-frontend --recursive --acl public-read
```

**Option 2: Netlify/Vercel (Recommended for ease)**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### CI/CD Pipeline (Optional)

**GitHub Actions Example:**

```yaml
name: Deploy Conference Boss

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/setup-sam@v2
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: |
          cd backend
          sam build
          sam deploy --no-confirm-changeset --no-fail-on-empty-changeset

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: |
          cd frontend
          npm ci
          npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=frontend/dist
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

---

## Missing Details from Original Plan

### Critical Gaps Identified

1. **Audio Upload Mechanism**
   - ❌ Original: No mention of how audio gets to S3
   - ✅ Fixed: Two-step presigned URL upload process

2. **Browser Compatibility**
   - ❌ Original: Assumed MediaRecorder "just works"
   - ✅ Fixed: Safari-specific MIME type detection and fallbacks

3. **Real-time Leaderboard**
   - ❌ Original: "Real-time" but no implementation strategy
   - ✅ Fixed: Polling with short cache, not WebSockets (simpler)

4. **Error Handling**
   - ❌ Original: No error scenarios discussed
   - ✅ Fixed: Comprehensive error handling and retry logic

5. **CORS Configuration**
   - ❌ Original: Not mentioned
   - ✅ Fixed: Detailed CORS setup for both API Gateway and S3

6. **Processing Status**
   - ❌ Original: No tracking of async processing state
   - ✅ Fixed: Added `processing_status` field to DynamoDB

7. **Cost & Scaling**
   - ❌ Original: No cost estimation or rate limiting
   - ✅ Fixed: Detailed cost breakdown and throttling strategy

8. **Deployment**
   - ❌ Original: No deployment instructions
   - ✅ Fixed: Complete SAM template and deployment guide

9. **Security**
   - ❌ Original: Minimal security discussion
   - ✅ Fixed: IAM roles, API validation, secure API key storage

10. **Testing Strategy**
    - ❌ Original: Not specified
    - ✅ Fixed: Comprehensive testing plan across all layers

---

## Recommended Implementation Order

### Week 1: Backend Foundation
- Day 1-2: Set up AWS resources (DynamoDB, S3, IAM)
- Day 3-4: Implement and test Lambda functions locally
- Day 5: Deploy to AWS, test API endpoints with Postman

### Week 2: Frontend Core
- Day 1-2: Set up React project, implement audio recording
- Day 3: Build Challenge screen UI
- Day 4: Integrate with backend API
- Day 5: Build Leaderboard screen

### Week 3: Integration & Polish
- Day 1-2: End-to-end testing on iPad
- Day 3: UI/UX refinements, animations
- Day 4: Error handling and edge cases
- Day 5: Load testing and performance optimization

### Week 4: Final Prep
- Day 1-2: User testing with volunteers
- Day 3: Bug fixes and final tweaks
- Day 4: Deploy to production, monitoring setup
- Day 5: Documentation and booth setup planning

**Total Timeline:** 4 weeks (3 weeks minimal if experienced team)

---

## Success Criteria Checklist

### Technical Success
- [ ] 95%+ successful recording → processing → scoring pipeline
- [ ] Average total time (start to score) < 30 seconds
- [ ] Zero downtime during event hours
- [ ] All tests passing (unit, integration, E2E)

### User Experience Success
- [ ] Audio recording works on iPad Safari without issues
- [ ] UI is intuitive, no confusion from test users
- [ ] Countdown timer is clearly visible
- [ ] Score reveal is satisfying and engaging
- [ ] Leaderboard updates within 5 seconds

### Business Success
- [ ] 80%+ completion rate (users who start finish)
- [ ] Positive feedback from participants
- [ ] Generates buzz/conversation at booth
- [ ] Top 3 winners identified accurately

---

## Conclusion

This technical specification addresses all critical gaps in the original plan and provides a clear roadmap for implementation. Key improvements include:

1. **Detailed architecture** with proper separation of concerns
2. **Safari audio recording compatibility** with fallbacks
3. **Robust error handling** across all layers
4. **Clear deployment strategy** using AWS SAM
5. **Comprehensive testing plan** for quality assurance
6. **Cost estimation and monitoring** for operational awareness
7. **Security best practices** throughout the stack

### Recommended Next Steps

1. **Review and approve** this technical specification
2. **Set up AWS account** and create initial resources
3. **Create GitHub repository** and initialize projects
4. **Assign team roles** (backend, frontend, DevOps)
5. **Begin Week 1 implementation** following the timeline above

### Key Risks to Monitor

- 🔴 **HIGH:** Safari audio recording compatibility - test early!
- 🟡 **MEDIUM:** AI API rate limits and costs - monitor closely
- 🟡 **MEDIUM:** Conference venue network reliability - have backup plan
- 🟢 **LOW:** Everything else can be mitigated with proper testing

This project is **feasible within 3-4 weeks** with an experienced developer or small team. The architecture is sound, costs are minimal, and the technical challenges are manageable with the solutions provided.
