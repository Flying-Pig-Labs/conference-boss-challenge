/**
 * Application Constants
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Recording Configuration
export const RECORDING_DURATION = 15; // seconds
export const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_AUDIO_FORMATS = ['mp4', 'm4a', 'webm', 'wav', 'aac'];

// Validation
export const MIN_NAME_LENGTH = 1;
export const MAX_NAME_LENGTH = 50;

// Scoring
export const PRIZE_THRESHOLD_TIER_1 = 80;
export const PRIZE_THRESHOLD_TIER_2 = 90;
export const TOP_PRIZE_COUNT = 3;

// UI Configuration
export const LEADERBOARD_POLL_INTERVAL = 5000; // 5 seconds
export const LEADERBOARD_MAX_ITEMS = 100;

// Prize Messages
export const PRIZE_MESSAGES = {
  tier1: '🎁 Congratulations! You won a prize!',
  tier2: '🏆 Amazing! You won the premium prize!',
  top3: '🎟️ Top 3! You might win next year\'s tickets!'
};

// Error Messages
export const ERROR_MESSAGES = {
  microphonePermission: 'Microphone permission denied. Please enable it in your browser settings.',
  microphoneNotSupported: 'Your browser doesn\'t support audio recording. Please use Safari on iPad.',
  networkError: 'Network error. Please check your connection and try again.',
  uploadFailed: 'Upload failed. Please try again.',
  processingFailed: 'Processing failed. Please try again.',
  invalidName: 'Please enter a valid name (1-50 characters).',
  generic: 'Something went wrong. Please try again.'
};
