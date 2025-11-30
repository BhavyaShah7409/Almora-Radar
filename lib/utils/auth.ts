/**
 * Authentication Utilities
 * 
 * Helper functions for validating API requests
 */

import { NextRequest } from 'next/server';

/**
 * Validate cron job requests using Bearer token
 * 
 * Cron jobs from Railway must include the CRON_SECRET in the Authorization header
 */
export function validateCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set');
    return false;
  }

  if (!authHeader) {
    console.warn('Missing Authorization header in cron request');
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (token !== cronSecret) {
    console.warn('Invalid cron secret provided');
    return false;
  }

  return true;
}

/**
 * Create unauthorized response for invalid cron requests
 */
export function createUnauthorizedResponse() {
  return Response.json(
    {
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    },
    { status: 401 }
  );
}
