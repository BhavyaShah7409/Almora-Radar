import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import { EventsQueryParams } from '@/types';

/**
 * GET /api/events
 * Retrieve news events with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: EventsQueryParams = {
      category: searchParams.get('category') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      skip: parseInt(searchParams.get('skip') || '0'),
    };

    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    // Build query
    const query: any = {};
    
    if (params.category) {
      query.category = params.category;
    }
    
    if (params.startDate || params.endDate) {
      query.createdAt = {};
      if (params.startDate) {
        query.createdAt.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        query.createdAt.$lte = new Date(params.endDate);
      }
    }

    // Get total count
    const total = await eventsCollection.countDocuments(query);

    // Get events with pagination
    const events = await eventsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(params.skip)
      .limit(params.limit)
      .toArray();

    // Format response
    const formattedEvents = events.map(event => ({
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
    }));

    return NextResponse.json({
      events: formattedEvents,
      total,
      hasMore: params.skip + params.limit < total,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
