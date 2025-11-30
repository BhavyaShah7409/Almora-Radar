/**
 * Firebase Cloud Messaging Integration
 * Handles push notifications for high-priority events
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('Firebase Admin SDK initialized');
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send push notification to a single device
 * @param token - FCM device token
 * @param payload - Notification content
 * @returns Promise<NotificationResult>
 */
export async function sendNotification(
  token: string,
  payload: NotificationPayload
): Promise<NotificationResult> {
  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
      },
    };

    const messageId = await admin.messaging().send(message);
    
    console.log(`Notification sent successfully: ${messageId}`);
    
    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('Failed to send notification:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notifications to multiple devices
 * @param tokens - Array of FCM device tokens
 * @param payload - Notification content
 * @returns Promise<{ successCount: number; failureCount: number; results: NotificationResult[] }>
 */
export async function sendMulticastNotification(
  tokens: string[],
  payload: NotificationPayload
): Promise<{
  successCount: number;
  failureCount: number;
  results: NotificationResult[];
}> {
  if (tokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      results: [],
    };
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Multicast notification sent: ${response.successCount} success, ${response.failureCount} failure`);
    
    const results: NotificationResult[] = response.responses.map((resp, index) => {
      if (resp.success) {
        return {
          success: true,
          messageId: resp.messageId,
        };
      } else {
        return {
          success: false,
          error: resp.error?.message || 'Unknown error',
        };
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      results,
    };
  } catch (error) {
    console.error('Failed to send multicast notification:', error);
    
    return {
      successCount: 0,
      failureCount: tokens.length,
      results: tokens.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })),
    };
  }
}

/**
 * Log notification delivery status
 * @param result - Notification result
 * @param userId - User ID
 * @param eventId - Event ID
 */
export function logNotificationDelivery(
  result: NotificationResult,
  userId: string,
  eventId: string
): void {
  const status = result.success ? 'SUCCESS' : 'FAILURE';
  const details = result.success 
    ? `MessageId: ${result.messageId}` 
    : `Error: ${result.error}`;
  
  console.log(`[NOTIFICATION] ${status} - User: ${userId}, Event: ${eventId}, ${details}`);
}

/**
 * Format notification payload for event
 * @param eventTitle - Event title
 * @param eventCategory - Event category
 * @param eventLocation - Event location
 * @param eventId - Event ID
 * @returns NotificationPayload
 */
export function formatEventNotification(
  eventTitle: string,
  eventCategory: string,
  eventLocation: string,
  eventId: string
): NotificationPayload {
  return {
    title: `${eventCategory.toUpperCase()}: ${eventLocation}`,
    body: eventTitle,
    data: {
      eventId,
      category: eventCategory,
      location: eventLocation,
      type: 'event_notification',
    },
  };
}
