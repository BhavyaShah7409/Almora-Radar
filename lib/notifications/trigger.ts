/**
 * Notification Trigger Logic
 * Determines which users should receive notifications for high-priority events
 */

import { supabaseServer } from '@/lib/db/supabase-server';
import { calculateDistance } from '@/lib/utils/geo';
import { sendMulticastNotification, formatEventNotification, logNotificationDelivery } from './firebase';
import type { Coordinates } from '@/types';

export interface EventNotificationData {
  eventId: string;
  title: string;
  category: string;
  location: string;
  coords: Coordinates;
  priorityScore: number;
}

export interface UserPreferences {
  user_id: string;
  categories: string[];
  location_coords: Coordinates | null;
  notifications_enabled: boolean;
  fcm_token: string | null;
}

const GEOFENCE_RADIUS_KM = 50; // 50km radius for notifications

/**
 * Check if event should trigger notifications
 * @param priorityScore - Event priority score (1-5)
 * @returns boolean
 */
export function shouldTriggerNotification(priorityScore: number): boolean {
  return priorityScore >= 4;
}

/**
 * Get users who should receive notification for this event
 * @param event - Event notification data
 * @returns Promise<UserPreferences[]>
 */
export async function getNotificationRecipients(
  event: EventNotificationData
): Promise<UserPreferences[]> {
  try {
    // Query users with notifications enabled
    const { data: preferences, error } = await supabaseServer
      .from('preferences')
      .select('user_id, categories, location_coords, notifications_enabled, fcm_token')
      .eq('notifications_enabled', true)
      .not('fcm_token', 'is', null);

    if (error) {
      console.error('Error fetching user preferences:', error);
      return [];
    }

    if (!preferences || preferences.length === 0) {
      return [];
    }

    // Filter users based on category preferences and geofence
    const recipients = preferences.filter((pref: UserPreferences) => {
      // Check if user has FCM token
      if (!pref.fcm_token) {
        return false;
      }

      // Check if user has enabled this category
      if (pref.categories && pref.categories.length > 0) {
        if (!pref.categories.includes(event.category)) {
          return false;
        }
      }

      // Check geofence if user has location set
      if (pref.location_coords) {
        const distance = calculateDistance(
          pref.location_coords.lat,
          pref.location_coords.lng,
          event.coords.lat,
          event.coords.lng
        );

        if (distance > GEOFENCE_RADIUS_KM) {
          return false;
        }
      }

      return true;
    });

    return recipients;
  } catch (error) {
    console.error('Error getting notification recipients:', error);
    return [];
  }
}

/**
 * Send notifications for high-priority event
 * @param event - Event notification data
 * @returns Promise<{ sent: number; failed: number }>
 */
export async function triggerEventNotifications(
  event: EventNotificationData
): Promise<{ sent: number; failed: number }> {
  try {
    // Check if event should trigger notifications
    if (!shouldTriggerNotification(event.priorityScore)) {
      console.log(`Event ${event.eventId} priority too low (${event.priorityScore}), skipping notifications`);
      return { sent: 0, failed: 0 };
    }

    console.log(`Triggering notifications for event ${event.eventId} (priority: ${event.priorityScore})`);

    // Get users who should receive notification
    const recipients = await getNotificationRecipients(event);

    if (recipients.length === 0) {
      console.log('No recipients found for notification');
      return { sent: 0, failed: 0 };
    }

    console.log(`Found ${recipients.length} recipients for notification`);

    // Extract FCM tokens
    const tokens = recipients
      .map(r => r.fcm_token)
      .filter((token): token is string => token !== null);

    if (tokens.length === 0) {
      console.log('No valid FCM tokens found');
      return { sent: 0, failed: 0 };
    }

    // Format notification payload
    const payload = formatEventNotification(
      event.title,
      event.category,
      event.location,
      event.eventId
    );

    // Send multicast notification
    const result = await sendMulticastNotification(tokens, payload);

    // Log delivery status for each user
    recipients.forEach((recipient, index) => {
      if (result.results[index]) {
        logNotificationDelivery(
          result.results[index],
          recipient.user_id,
          event.eventId
        );
      }
    });

    console.log(`Notifications sent: ${result.successCount} success, ${result.failureCount} failure`);

    return {
      sent: result.successCount,
      failed: result.failureCount,
    };
  } catch (error) {
    console.error('Error triggering event notifications:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Filter users by category preferences
 * @param users - Array of user preferences
 * @param category - Event category
 * @returns UserPreferences[]
 */
export function filterByCategory(
  users: UserPreferences[],
  category: string
): UserPreferences[] {
  return users.filter(user => {
    // If user has no category preferences, include all categories
    if (!user.categories || user.categories.length === 0) {
      return true;
    }

    // Check if user has enabled this category
    return user.categories.includes(category);
  });
}

/**
 * Filter users by geofence
 * @param users - Array of user preferences
 * @param eventCoords - Event coordinates
 * @param radiusKm - Geofence radius in kilometers
 * @returns UserPreferences[]
 */
export function filterByGeofence(
  users: UserPreferences[],
  eventCoords: Coordinates,
  radiusKm: number = GEOFENCE_RADIUS_KM
): UserPreferences[] {
  return users.filter(user => {
    // If user has no location set, include them
    if (!user.location_coords) {
      return true;
    }

    // Calculate distance
    const distance = calculateDistance(
      user.location_coords.lat,
      user.location_coords.lng,
      eventCoords.lat,
      eventCoords.lng
    );

    return distance <= radiusKm;
  });
}
