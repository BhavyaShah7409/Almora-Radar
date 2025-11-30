import { NextRequest, NextResponse } from 'next/server';
import { triggerEventNotifications, type EventNotificationData } from '@/lib/notifications/trigger';
import { validateCronRequest, createUnauthorizedResponse } from '@/lib/utils/auth';

/**
 * POST /api/notify
 * Send push notifications for high-priority events
 * Can be triggered by /api/process or manually
 */
export async function POST(request: NextRequest) {
  // Validate authentication (cron or internal)
  if (!validateCronRequest(request)) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.eventId || !body.title || !body.category || !body.location || !body.coords || !body.priorityScore) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Missing required fields: eventId, title, category, location, coords, priorityScore',
        },
        { status: 400 }
      );
    }

    const eventData: EventNotificationData = {
      eventId: body.eventId,
      title: body.title,
      category: body.category,
      location: body.location,
      coords: body.coords,
      priorityScore: body.priorityScore,
    };

    console.log(`Processing notification request for event: ${eventData.eventId}`);

    // Trigger notifications
    const result = await triggerEventNotifications(eventData);

    return NextResponse.json({
      success: true,
      notificationsSent: result.sent,
      notificationsFailed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Notification API error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
