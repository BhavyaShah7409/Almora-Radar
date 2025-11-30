# Almora Radar

Real-time, AI-powered geospatial news intelligence system for Almora, Uttarakhand, India.

## Features

- 🗺️ Interactive map with real-time news events
- 🤖 AI-powered content processing using Google Gemini 1.5 Flash
- 🌐 Bilingual summaries (Hindi & English)
- 📍 Automatic geocoding and location extraction
- 🔔 Push notifications for high-priority events
- 👥 User accounts with personalization
- 🔍 Smart search with autocomplete
- 📱 Progressive Web App (PWA) with offline support
- 🌓 Dark/Light mode
- ♻️ Automatic 15-day data retention

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Leaflet.js + React-Leaflet
- TypeScript

### Backend
- Next.js API Routes
- MongoDB Atlas
- Supabase (Auth & Comments)
- Firebase Cloud Messaging
- Google Gemini 1.5 Flash API
- Nominatim Geocoding API

### Testing
- Jest + React Testing Library
- fast-check (Property-Based Testing)
- Playwright (E2E Testing)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier)
- Supabase account (free tier)
- Firebase account (free tier)
- Google Gemini API key
- Vercel account for deployment (frontend + API)
- Railway account for cron jobs (free tier)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd almora-radar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
   - MongoDB Atlas connection string
   - Supabase URL and keys
   - Gemini API key
   - Firebase credentials

5. Set up databases:

**MongoDB Atlas:**
- Create a free tier cluster (M0)
- Create database: `almora-radar`
- Create collection: `events`
- Create indexes (see Database Setup section)

**Supabase:**
- Create a new project
- Run the SQL migrations in `lib/db/supabase-schema.sql`
- Enable Realtime for comments table
- Set up Row Level Security policies

**Firebase:**
- Create a new project
- Enable Cloud Messaging
- Generate service account key
- Add web app configuration

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### MongoDB Indexes

```javascript
// In MongoDB Atlas or MongoDB Shell
db.events.createIndex({ createdAt: -1 });
db.events.createIndex({ category: 1 });
db.events.createIndex({ coords: "2dsphere" });
db.events.createIndex({ source_link: 1 }, { unique: true });
```

### Supabase Schema

See `lib/db/supabase-schema.sql` for complete schema including:
- users table
- preferences table
- comments table
- Row Level Security policies

## Project Structure

```
almora-radar/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── comments/     # Comments endpoints
│   │   ├── events/       # Events endpoints
│   │   ├── scrape/       # Scraper endpoint
│   │   ├── process/      # AI processing endpoint
│   │   ├── cleanup/      # Cleanup cron endpoint
│   │   └── notify/       # Notifications endpoint
│   ├── page.tsx          # Landing page
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── map/              # Map-related components
│   ├── auth/             # Authentication components
│   ├── ui/               # UI components
│   └── ...
├── lib/                   # Utility functions and services
│   ├── db/               # Database connections
│   ├── ai/               # Gemini AI integration
│   ├── geocoding/        # Nominatim geocoding
│   ├── scrapers/         # News scrapers
│   ├── notifications/    # Firebase FCM
│   └── utils/            # Helper functions
├── hooks/                 # Custom React hooks
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── property/         # Property-based tests
│   └── e2e/              # End-to-end tests
├── public/                # Static assets
└── types/                 # TypeScript type definitions

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI

## Testing

### Unit Tests
```bash
npm test
```

### Property-Based Tests
Property-based tests are located in `tests/property/` and use fast-check library.

### End-to-End Tests
```bash
npm run test:e2e
```

## Deployment

### Vercel Deployment (Frontend + API)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard:
   - All variables from `.env.local`
   - Add `CRON_SECRET` for authenticating cron requests
4. Deploy

### Railway Deployment (Cron Jobs)

Vercel has limitations on cron frequency, so we use Railway for scheduled tasks.

1. Sign up at https://railway.app
2. Create new project from GitHub repository
3. Configure environment variables:
   - `VERCEL_URL`: Your Vercel deployment URL
   - `CRON_SECRET`: Same secret as in Vercel
4. Railway will automatically detect `railway.json` and deploy

**Cron Schedule:**
- Scraper: Every 30 minutes (`*/30 * * * *`)
- Cleanup: Daily at midnight UTC (`0 0 * * *`)

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

## Environment Variables

See `.env.example` for all required environment variables.

### Required Variables:
- `MONGODB_URI` - MongoDB Atlas connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `GEMINI_API_KEY` - Google Gemini API key
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `FIREBASE_CLIENT_EMAIL` - Firebase client email
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase key

## API Routes

### Public Routes
- `GET /api/events` - Get news events with filtering
- `GET /api/events/[id]` - Get single event
- `GET /api/users/count` - Get total user count

### Protected Routes (Require Authentication)
- `POST /api/comments` - Create comment
- `DELETE /api/comments/[id]` - Delete comment
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update user preferences
- `GET /api/recommendations` - Get personalized recommendations

### Cron Routes (Internal)
- `POST /api/scrape` - Run news scrapers
- `POST /api/cleanup` - Clean up old events
- `POST /api/process` - Process article with AI
- `POST /api/notify` - Send push notifications

### Authentication Routes
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Built with Next.js, React, and TailwindCSS
- Maps powered by Leaflet.js and OpenStreetMap
- AI processing by Google Gemini
- Geocoding by Nominatim
- Authentication by Supabase
- Notifications by Firebase
