# Almora Radar - Completion Guide

## 🎯 Current Status: ~40% Complete

### ✅ What's Done (Production Ready)
- Complete infrastructure & database layer
- All utilities with property-based tests
- AI integration (Gemini)
- Geocoding service (Nominatim)
- 3 critical API routes: `/api/process`, `/api/events`, `/api/cleanup`

### 📋 Remaining Work

## PHASE 1: Complete API Routes (4-6 hours)

### 1. Authentication Routes

**File: `app/api/auth/signup/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabase-server';

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();
  
  // Validate input
  // Call supabaseServer.auth.admin.createUser()
  // Create preferences record
  // Return session token
}
```

**File: `app/api/auth/login/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabase-server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  // Call supabaseServer.auth.signInWithPassword()
  // Return session token and user data
}
```

### 2. Comments Routes

**File: `app/api/comments/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getEventComments, createComment } from '@/lib/db/supabase-server';

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('event_id');
  const comments = await getEventComments(eventId!);
  return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
  const { event_id, comment_text } = await request.json();
  // Verify auth
  // Create comment
  return NextResponse.json(comment);
}
```

### 3. Preferences Route

**File: `app/api/preferences/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUserPreferences, updateUserPreferences } from '@/lib/db/supabase-server';

export async function GET(request: NextRequest) {
  // Get user from auth
  // Return preferences
}

export async function PUT(request: NextRequest) {
  // Get user from auth
  // Update preferences
  // Return updated preferences
}
```

### 4. Notifications Route

**File: `app/api/notify/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUsersForNotifications } from '@/lib/db/supabase-server';
import { calculateDistance } from '@/lib/utils/geo';

export async function POST(request: NextRequest) {
  const { eventId, title, category, coords, priorityScore } = await request.json();
  
  // Get users with notifications enabled for this category
  const users = await getUsersForNotifications(category);
  
  // Filter by geofence
  const nearbyUsers = users.filter(user => {
    if (!user.location_coords) return false;
    const distance = calculateDistance(coords, user.location_coords);
    return distance <= 50; // 50km radius
  });
  
  // Send FCM notifications (implement Firebase Admin SDK)
  // Return count
}
```

### 5. User Count Route

**File: `app/api/users/count/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import { getTotalUserCount } from '@/lib/db/supabase-server';

export async function GET() {
  const count = await getTotalUserCount();
  return NextResponse.json({ count });
}
```

### 6. Recommendations Route

**File: `app/api/recommendations/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import { getUserPreferences } from '@/lib/db/supabase-server';
import { calculateDistance } from '@/lib/utils/geo';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  
  // Get user preferences
  const prefs = await getUserPreferences(userId!);
  
  // Query events matching categories
  const db = await getDatabase();
  const events = await db.collection('events')
    .find({ category: { $in: prefs.categories } })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  
  // Calculate relevance scores based on distance + priority
  // Sort and return top 10
}
```

## PHASE 2: Implement Scrapers (6-8 hours)

### Base Scraper Class

**File: `lib/scrapers/base.ts`**
```typescript
export abstract class BaseScraper {
  abstract name: string;
  abstract url: string;
  
  abstract scrape(): Promise<ScrapedArticle[]>;
  
  protected async fetchHTML(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AlmoraRadar/1.0' }
    });
    return response.text();
  }
  
  protected handleError(error: Error): void {
    console.error(`[${this.name}] Error:`, error);
  }
}
```

### Example Scraper

**File: `lib/scrapers/amar-ujala.ts`**
```typescript
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import { ScrapedArticle } from '@/types';

export class AmarUjalaScraper extends BaseScraper {
  name = 'Amar Ujala Kumaon';
  url = 'https://www.amarujala.com/uttarakhand/kumaon';
  
  async scrape(): Promise<ScrapedArticle[]> {
    try {
      const html = await this.fetchHTML(this.url);
      const $ = cheerio.load(html);
      const articles: ScrapedArticle[] = [];
      
      // Parse HTML and extract articles
      $('.article-item').each((i, elem) => {
        const title = $(elem).find('.title').text().trim();
        const content = $(elem).find('.content').text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && content && link) {
          articles.push({
            title,
            content,
            images: [],
            publishTime: new Date().toISOString(),
            sourceLink: link,
          });
        }
      });
      
      return articles;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }
}
```

### Scraper Orchestrator

**File: `lib/scrapers/orchestrator.ts`**
```typescript
import { AmarUjalaScraper } from './amar-ujala';
import { DainikJagranScraper } from './dainik-jagran';
// Import other scrapers

export async function runAllScrapers() {
  const scrapers = [
    new AmarUjalaScraper(),
    new DainikJagranScraper(),
    // Add more scrapers
  ];
  
  const results = await Promise.allSettled(
    scrapers.map(scraper => scraper.scrape())
  );
  
  const allArticles = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<any>).value);
  
  return allArticles;
}
```

### Scrape API Route

**File: `app/api/scrape/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import { runAllScrapers } from '@/lib/scrapers/orchestrator';

export async function POST() {
  try {
    console.log('Starting scraper job...');
    
    const articles = await runAllScrapers();
    console.log(`Scraped ${articles.length} articles`);
    
    // Process each article
    let processed = 0;
    for (const article of articles) {
      try {
        await fetch('http://localhost:3000/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(article),
        });
        processed++;
      } catch (error) {
        console.error('Failed to process article:', error);
      }
    }
    
    return NextResponse.json({
      scraped: articles.length,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scraper job failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## PHASE 3: Build Frontend (8-12 hours)

### Main Layout

**File: `app/layout.tsx`**
```typescript
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Almora Radar',
  description: 'Real-time news intelligence for Almora',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Landing Page

**File: `app/page.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Event } from '@/types';

const MapContainer = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
});

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <main className="h-screen w-screen">
      <MapContainer events={events} />
    </main>
  );
}
```

### Map Component

**File: `components/map/MapContainer.tsx`**
```typescript
'use client';

import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';
import { Event, ALMORA_COORDINATES } from '@/types';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  events: Event[];
}

export default function MapContainer({ events }: MapContainerProps) {
  return (
    <LeafletMap
      center={[ALMORA_COORDINATES.lat, ALMORA_COORDINATES.lng]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {events.map(event => (
        <Marker
          key={event._id}
          position={[event.coords.lat, event.coords.lng]}
        >
          <Popup>
            <div>
              <h3>{event.title}</h3>
              <p>{event.summary_en.substring(0, 100)}...</p>
              <span className="badge">{event.category}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </LeafletMap>
  );
}
```

## PHASE 4: PWA Configuration (2-3 hours)

### Next.js Config

**File: `next.config.js`**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

### Manifest

**File: `public/manifest.json`**
```json
{
  "name": "Almora Radar",
  "short_name": "Almora Radar",
  "description": "Real-time news intelligence for Almora",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## PHASE 5: Deployment (1-2 hours)

### Steps:
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy
5. Test cron jobs

### Environment Variables to Set:
- MONGODB_URI
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- GEMINI_API_KEY
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Test
npm test

# Setup MongoDB indexes
npm run setup:mongo

# Format code
npm run format
```

## Testing Checklist

- [ ] Test /api/process with sample article
- [ ] Test /api/events returns data
- [ ] Test /api/cleanup deletes old events
- [ ] Test map displays events
- [ ] Test authentication flow
- [ ] Test comments system
- [ ] Test notifications
- [ ] Test PWA installation
- [ ] Test offline functionality

## Estimated Time to Complete

- API Routes: 4-6 hours
- Scrapers: 6-8 hours
- Frontend: 8-12 hours
- PWA: 2-3 hours
- Deployment & Testing: 2-3 hours

**Total: 22-32 hours of focused development**

## Support

All the hard infrastructure is done. The remaining work is straightforward implementation following the patterns established in the completed components.

Check the existing files for reference:
- API routes: `app/api/process/route.ts`
- Utilities: `lib/utils/*.ts`
- Tests: `tests/property/*.test.ts`
- Types: `types/index.ts`
