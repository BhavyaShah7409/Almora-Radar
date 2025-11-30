import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import { supabaseServer } from '@/lib/db/supabase-server';
import { getDaysAgo } from '@/lib/utils/date';
import { validateCronRequest, createUnauthorizedResponse } from '@/lib/utils/auth';
import { DATA_RETENTION_DAYS } from '@/types';

/**
 * POST /api/cleanup
 * Delete events older than 15 days and associated comments
 * Triggered by Railway Cron daily at midnight UTC
 */
export async function POST(request: NextRequest) {
  // Validate cron authentication
  if (!validateCronRequest(request)) {
    return createUnauthorizedResponse();
  }
  try {
    console.log('Starting cleanup job...');

    // Calculate cutoff date (15 days ago)
    const cutoffDate = getDaysAgo(DATA_RETENTION_DAYS);
    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);

    // Step 1: Find old events
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const oldEvents = await eventsCollection
      .find({ createdAt: { $lt: cutoffDate } })
      .toArray();

    console.log(`Found ${oldEvents.length} events to delete`);

    if (oldEvents.length === 0) {
      return NextResponse.json({
        eventsDeleted: 0,
        commentsDeleted: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Delete events from MongoDB
    const deleteResult = await eventsCollection.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`Deleted ${deleteResult.deletedCount} events from MongoDB`);

    // Step 3: Delete associated comments from Supabase
    const eventIds = oldEvents.map(e => e._id.toString());
    let commentsDeleted = 0;

    for (const eventId of eventIds) {
      const { error } = await supabaseServer
        .from('comments')
        .delete()
        .eq('event_id', eventId);

      if (error) {
        console.error(`Error deleting comments for event ${eventId}:`, error);
      } else {
        commentsDeleted++;
      }
    }

    console.log(`Deleted comments for ${commentsDeleted} events`);

    const result = {
      eventsDeleted: deleteResult.deletedCount,
      commentsDeleted,
      timestamp: new Date().toISOString(),
    };

    console.log('Cleanup job completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cleanup job failed:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
