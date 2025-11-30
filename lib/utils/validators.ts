import { Coordinates, Category, CATEGORIES } from '@/types';

/**
 * Validate coordinates are within valid ranges
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export function validateCoordinates(coords: Coordinates): boolean {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return false;
  }

  const { lat, lng } = coords;

  // Validate latitude range
  if (lat < -90 || lat > 90) {
    return false;
  }

  // Validate longitude range
  if (lng < -180 || lng > 180) {
    return false;
  }

  // Check for NaN or Infinity
  if (!isFinite(lat) || !isFinite(lng)) {
    return false;
  }

  return true;
}

/**
 * Validate category is one of the allowed values
 */
export function isCategoryValid(category: string): category is Category {
  return CATEGORIES.includes(category as Category);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasUppercase && hasLowercase && hasNumber;
}

/**
 * Validate priority score is between 1 and 5
 */
export function isValidPriorityScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if comment contains abusive content
 * Basic implementation - can be enhanced with ML models
 */
export function containsAbusiveContent(text: string): boolean {
  const abusiveWords = [
    // Add abusive words here - keeping it minimal for example
    'spam',
    'scam',
  ];

  const lowerText = text.toLowerCase();
  return abusiveWords.some((word) => lowerText.includes(word));
}

/**
 * Validate comment text
 */
export function isValidComment(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const trimmed = text.trim();

  // Check length
  if (trimmed.length === 0 || trimmed.length > 1000) {
    return false;
  }

  // Check for abusive content
  if (containsAbusiveContent(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Validate date string is in ISO format
 */
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate MongoDB ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
