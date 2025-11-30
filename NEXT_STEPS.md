# Almora Radar - Next Steps Guide

## Current Status

✅ **Foundation Complete** (Tasks 1-6 Partial)
- Project initialized with Next.js 14
- Database connections configured (MongoDB + Supabase)
- TypeScript types defined
- Utility functions implemented with property-based tests
- Gemini AI client ready
- Geocoding service ready

## What's Working Now

You can test the following components:

```typescript
// 1. Test MongoDB Connection
import { checkMongoConnection, getDatabase } from '@/lib/db/mongodb';
const isConnected = await checkMongoConnection();
const db = await getDatabase();

// 2. Test Supabase Connection
import { supabaseClient } from '@/lib/db/supabase-client';
const { data } = await supabaseClient.auth.getSession();

// 3. Test Gemini AI
import { processArticleWithGemini } from '@/lib/ai/gemini';
const result = await processArticleWithGemini(
  'Test Title',
  'Test content about Almora...',
  'https://example.com'
);

// 4. Test Geocoding
import { geocodeLocation } from '@/lib/geocoding/nominatim';
const coords = await geocodeLocation('Mall Road, Almora');

// 5. Test Utilities
import { validateCoordinates } from '@/lib/utils/validators';
import { calculateDistance } from '@/lib/utils/geo';
import { countWords } from '@/lib/utils/text';
```

## Implementation Priority

### Phase 1: Core API Routes (1-2 days)

**Task 8: /api/process Route**
```typescript
// app/api/process/route.ts
// 1. Accept scraped article
// 2. Call Gemini AI
// 3. Geocode location
// 4. Save to MongoDB
// 5. Trigger notifications if priority >= 4
```

**Task 9: /api/events Route**
```typescript
// app/api/events/route.ts
// GET: Fetch events with filtering
// POST: Create event (for testing)
```

**Task 10: /api/cleanup Route**
```typescript
// app/api/cleanup/route.ts
// Delete events older than 15 days
// Delete associated comments
```

### Phase 2: Scrapers (2-3 days)

**Task 7: Implement Scrapers**
```typescript
// lib/scrapers/base.ts - Base scraper class
// lib/scrapers/amar-ujala.ts
// lib/scrapers/dainik-jagran.ts
// lib/scrapers/orchestrator.ts - Run all scrapers
```

**Task 9: /api/scrape Route**
```typescript
// app/api/scrape/route.ts
// Run all scrapers
// Process each article via /api/process
```

### Phase 3: Frontend Components (3-4 days)

**Task 20-21: Map Components**
```typescript
// components/map/MapContainer.tsx
// components/map/EventMarker.tsx
// components/map/HeatmapLayer.tsx
// components/map/CategoryFilter.tsx
```

**Task 22-23: UI Components**
```typescript
// components/ui/SearchBar.tsx
// components/ui/EventPopup.tsx
// components/auth/AuthModal.tsx
```

**Task 27: Main Page**
```typescript
// app/page.tsx - Landing page with map
// app/layout.tsx - Root layout
```

### Phase 4: Authentication & User Features (2-3 days)

**Task 13: Auth API Routes**
```typescript
// app/api/auth/signup/route.ts
// app/api/auth/login/route.ts
// app/api/auth/google/route.ts
```

**Task 14-16: User Features**
```typescript
// app/api/preferences/route.ts
// app/api/comments/route.ts
// app/api/recommendations/route.ts
```

### Phase 5: Notifications & PWA (1-2 days)

**Task 11-12: Firebase Integration**
```typescript
// lib/notifications/firebase.ts
// app/api/notify/route.ts
```

**Task 28: PWA Configuration**
```typescript
// next.config.js - Configure next-pwa
// public/manifest.json
// public/sw.js - Service worker
```

### Phase 6: Testing & Deployment (2-3 days)

**Task 31: Testing**
- Run all property-based tests
- Write integration tests
- E2E testing with Playwright

**Task 30: Deployment**
- Configure Vercel
- Set environment variables
- Deploy and test cron jobs

## Quick Implementation Templates

### API Route Template
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
```

### Component Template
```typescript
// components/example/Example.tsx
'use client';

import { useState, useEffect } from 'react';

interface ExampleProps {
  // props
}

export function Example({ }: ExampleProps) {
  return (
    <div>
      {/* Your component */}
    </div>
  );
}
```

## Testing Commands

```bash
# Run all tests
npm test

# Run property-based tests
npm test tests/property

# Run specific test file
npm test tests/property/utils.test.ts

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Database Setup Commands

```bash
# Setup MongoDB indexes
npm run setup:mongo

# Or manually with Node
node -r tsx/register lib/db/setup-indexes.ts
```

## Development Workflow

1. **Start Development Server**
```bash
npm run dev
```

2. **Create API Route**
```bash
# Create file: app/api/your-route/route.ts
# Implement GET/POST/etc handlers
# Test at http://localhost:3000/api/your-route
```

3. **Create Component**
```bash
# Create file: components/your-component/YourComponent.tsx
# Import and use in pages
```

4. **Write Tests**
```bash
# Create file: tests/unit/your-component.test.tsx
# Or: tests/property/your-feature.test.ts
npm test
```

5. **Format Code**
```bash
npm run format
```

## Common Issues & Solutions

### MongoDB Connection Issues
```typescript
// Check connection
import { checkMongoConnection } from '@/lib/db/mongodb';
const isConnected = await checkMongoConnection();

// If false, check:
// 1. MONGODB_URI in .env.local
// 2. Network access in MongoDB Atlas
// 3. Correct database name
```

### Supabase Auth Issues
```typescript
// Check if tables exist
// Run SQL from lib/db/supabase-schema.sql
// Verify RLS policies are enabled
```

### Gemini API Issues
```typescript
// Test connection
import { testGeminiConnection } from '@/lib/ai/gemini';
const works = await testGeminiConnection();

// If false, check:
// 1. GEMINI_API_KEY in .env.local
// 2. API key is valid
// 3. Free tier limits not exceeded
```

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [React Leaflet](https://react-leaflet.js.org/)

## Project Structure Reference

```
almora-radar/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes (TO IMPLEMENT)
│   │   ├── auth/           # Authentication
│   │   ├── events/         # Events CRUD
│   │   ├── scrape/         # Scraper endpoint
│   │   ├── process/        # AI processing
│   │   ├── cleanup/        # Cleanup cron
│   │   ├── notify/         # Notifications
│   │   ├── comments/       # Comments
│   │   └── preferences/    # User preferences
│   ├── page.tsx            # Landing page (TO IMPLEMENT)
│   └── layout.tsx          # Root layout (TO IMPLEMENT)
├── components/              # React components (TO IMPLEMENT)
│   ├── map/                # Map components
│   ├── auth/               # Auth components
│   ├── ui/                 # UI components
│   └── ...
├── lib/                     # ✅ Core utilities (DONE)
│   ├── db/                 # ✅ Database connections
│   ├── ai/                 # ✅ Gemini integration
│   ├── geocoding/          # ✅ Nominatim client
│   ├── utils/              # ✅ Helper functions
│   ├── scrapers/           # Scrapers (TO IMPLEMENT)
│   └── notifications/      # Firebase (TO IMPLEMENT)
├── types/                   # ✅ TypeScript types (DONE)
├── tests/                   # Tests (PARTIAL)
│   ├── unit/               # Unit tests (TO IMPLEMENT)
│   ├── property/           # ✅ Property tests (DONE)
│   ├── integration/        # Integration tests (TO IMPLEMENT)
│   └── e2e/                # E2E tests (TO IMPLEMENT)
├── public/                  # Static assets (TO IMPLEMENT)
├── .env.example            # ✅ Environment template
├── vercel.json             # ✅ Vercel config
├── README.md               # ✅ Project documentation
└── IMPLEMENTATION_STATUS.md # ✅ Status tracking
```

## Contact & Support

For questions or issues:
1. Check IMPLEMENTATION_STATUS.md
2. Review this NEXT_STEPS.md
3. Check the design document
4. Review test files for examples

## License

MIT License
