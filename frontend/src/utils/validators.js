/**
 * Validation Utilities
 */

import { MIN_NAME_LENGTH, MAX_NAME_LENGTH } from './constants';

/**
 * Validate participant name
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < MIN_NAME_LENGTH) {
    return { valid: false, error: `Name must be at least ${MIN_NAME_LENGTH} character` };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name must not exceed ${MAX_NAME_LENGTH} characters` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Check if browser supports audio recording
 */
export function checkAudioSupport() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      error: 'MediaDevices API not supported'
    };
  }

  if (!window.MediaRecorder) {
    return {
      supported: false,
      error: 'MediaRecorder API not supported'
    };
  }

  // Test supported MIME types
  const mimeTypes = [
    'audio/mp4',
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/wav'
  ];

  const supportedType = mimeTypes.find(type =>
    MediaRecorder.isTypeSupported(type)
  );

  return {
    supported: true,
    mimeType: supportedType || 'audio/mp4'
  };
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date for session queries
 */
export function formatSessionDate(date = new Date()) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
