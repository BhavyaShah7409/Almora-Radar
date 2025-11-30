import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import { processArticleWithGemini } from '@/lib/ai/gemini';
import { geocodeLocation } from '@/lib/geocoding/nominatim';
import { ProcessArticleRequest, ProcessArticleResponse } from '@/types';
import { validateCoordinates } from '@/lib/utils/validators';

/**
 * POST /api/process
 * Process a scraped article with Gemini AI and geocoding
 * 
 * This is the core processing pipeline:
 * 1. Receive scraped article
 * 2. Process with Gemini AI (summaries, classification, extraction)
 * 3. Geocode location to GPS coordinates
 * 4. Check for duplicates by source_link
 * 5. Insert or update in MongoDB
 * 6. Trigger notifications if priority >= 4
 */
export async function POST(request: NextRequest) {
  try {
    const body: ProcessArticleRequest = await request.json();

    // Validate input
    if (!body.title || !body.content || !body.sourceLink) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required fields: title, content, sourceLink' },
        { status: 400 }
      );
    }

    console.log(`Processing article: ${body.title}`);

    // Step 1: Process with Gemini AI
    console.log('Step 1: Processing with Gemini AI...');
    const geminiResponse = await processArticleWithGemini(
      body.title,
      body.content,
      body.sourceLink
    );

    // Step 2: Geocode location
    console.log(`Step 2: Geocoding location: ${geminiResponse.location_text}`);
    const geocodingResult = await geocodeLocation(geminiResponse.location_text);

    // Validate coordinates
    const coords = {
      lat: geocodingResult.lat,
      lng: geocodingResult.lng,
    };

    if (!validateCoordinates(coords)) {
      console.error('Invalid coordinates received, using fallback');
      coords.lat = 29.5971;
      coords.lng = 79.659;
    }

    // Step 3: Prepare event document
    const eventDocument = {
      title: geminiResponse.title,
      clean_title: geminiResponse.clean_title,
      summary_en: geminiResponse.summary_en,
      summary_hi: geminiResponse.summary_hi,
      category: geminiResponse.category,
      coords,
      images: body.images || [],
      videos: [],
      location_text: geminiResponse.location_text,
      priority_score: geminiResponse.priority_score,
      keywords: geminiResponse.keywords,
      incident_date: new Date(geminiResponse.incident_date || body.publishTime),
      source_link: body.sourceLink,
      raw_text: geminiResponse.raw_text,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Step 4: Check for existing event and insert/update
    console.log('Step 3: Saving to MongoDB...');
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const existingEvent = await eventsCollection.findOne({
      source_link: body.sourceLink,
    });

    let result;
    let isNew = false;

    if (existingEvent) {
      // Update existing event
      console.log(`Updating existing event: ${existingEvent._id}`);
      result = await eventsCollection.updateOne(
        { _id: existingEvent._id },
        {
          $set: {
            ...eventDocument,
            createdAt: existingEvent.createdAt, // Preserve original creation date
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Insert new event
      console.log('Inserting new event');
      result = await eventsCollection.insertOne(eventDocument);
      isNew = true;
    }

    // Get the final event
    const finalEvent = await eventsCollection.findOne({
      source_link: body.sourceLink,
    });

    if (!finalEvent) {
      throw new Error('Failed to retrieve saved event');
    }

    // Step 5: Trigger notifications if high priority
    if (geminiResponse.priority_score >= 4 && isNew) {
      console.log('Step 4: Triggering notifications for high-priority event...');
      
      // Call notification API (fire and forget)
      fetch(`${request.nextUrl.origin}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: finalEvent._id.toString(),
          title: finalEvent.title,
          category: finalEvent.category,
          location: finalEvent.location_text,
          coords: finalEvent.coords,
          priorityScore: finalEvent.priority_score,
        }),
      }).catch((error) => {
        console.error('Failed to trigger notifications:', error);
      });
    }

    // Return response
    const response: ProcessArticleResponse = {
      event: {
        _id: finalEvent._id.toString(),
        title: finalEvent.title,
        clean_title: finalEvent.clean_title,
        summary_en: finalEvent.summary_en,
        summary_hi: finalEvent.summary_hi,
        category: finalEvent.category,
        coords: finalEvent.coords,
        images: finalEvent.images,
        videos: finalEvent.videos,
        location_text: finalEvent.location_text,
        priority_score: finalEvent.priority_score,
        keywords: finalEvent.keywords,
        incident_date: finalEvent.incident_date.toISOString(),
        source_link: finalEvent.source_link,
        raw_text: finalEvent.raw_text,
        createdAt: finalEvent.createdAt.toISOString(),
        updatedAt: finalEvent.updatedAt.toISOString(),
      },
      isNew,
    };

    console.log(`✓ Article processed successfully (${isNew ? 'new' : 'updated'})`);

    return NextResponse.json(response, { status: isNew ? 201 : 200 });
  } catch (error) {
    console.error('Error processing article:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
