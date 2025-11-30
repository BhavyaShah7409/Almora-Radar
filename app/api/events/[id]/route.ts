import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/events/[id]
 * Retrieve a single event by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Event not found' },
        { status: 404 }
      );
    }

    // Format response
    const formattedEvent = {
      _id: event._id.toString(),
      title: event.title,
      clean_title: event.clean_title,
      summary_en: event.summary_en,
      summary_hi: event.summary_hi,
      category: event.category,
      coords: event.coords,
      images: event.images,
      videos: event.videos,
      location_text: event.location_text,
      priority_score: event.priority_score,
      keywords: event.keywords,
      incident_date: event.incident_date.toISOString(),
      source_link: event.source_link,
      raw_text: event.raw_text,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
