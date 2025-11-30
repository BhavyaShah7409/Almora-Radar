// ============================================================================
// CORE TYPES
// ============================================================================

export type Category =
  | 'accident'
  | 'crime'
  | 'wildlife'
  | 'festival'
  | 'celebrity'
  | 'emergency'
  | 'weather'
  | 'public';

export interface Coordinates {
  lat: number;
  lng: number;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface Event {
  _id: string;
  title: string;
  clean_title: string;
  summary_en: string;
  summary_hi: string;
  category: Category;
  coords: Coordinates;
  images: string[];
  videos: string[];
  location_text: string;
  priority_score: number;
  keywords: string[];
  incident_date: string;
  source_link: string;
  raw_text: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  language: 'en' | 'hi';
  categories: Category[];
  location_text: string | null;
  location_coords: Coordinates | null;
  notifications_enabled: boolean;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// COMMENT TYPES
// ============================================================================

export interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  timestamp: string;
}

export interface CommentWithUser extends Comment {
  users: {
    name: string;
  };
}

// ============================================================================
// SCRAPER TYPES
// ============================================================================

export interface ScrapedArticle {
  title: string;
  content: string;
  images: string[];
  publishTime: string;
  sourceLink: string;
}

export interface ScraperResult {
  source: string;
  articlesScraped: number;
  errors: string[];
  timestamp: string;
}

// ============================================================================
// AI PROCESSING TYPES
// ============================================================================

export interface GeminiResponse {
  title: string;
  clean_title: string;
  summary_en: string;
  summary_hi: string;
  category: Category;
  location_text: string;
  priority_score: number;
  keywords: string[];
  incident_date: string;
  raw_text: string;
  source_link: string;
}

export interface ProcessArticleRequest {
  title: string;
  content: string;
  images: string[];
  publishTime: string;
  sourceLink: string;
}

export interface ProcessArticleResponse {
  event: Event;
  isNew: boolean;
}

// ============================================================================
// GEOCODING TYPES
// ============================================================================

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  success: boolean;
}

export interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationPayload {
  eventId: string;
  title: string;
  category: string;
  location: string;
  coords: Coordinates;
  priorityScore: number;
}

export interface NotificationResult {
  sent: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface UpdatePreferencesRequest {
  language?: 'en' | 'hi';
  categories?: Category[];
  location_text?: string;
  location_coords?: Coordinates;
  notifications_enabled?: boolean;
  fcm_token?: string;
}

export interface CreateCommentRequest {
  event_id: string;
  comment_text: string;
}

export interface EventsQueryParams {
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

export interface RecommendationsQueryParams {
  userId: string;
}

// ============================================================================
// CLEANUP TYPES
// ============================================================================

export interface CleanupResult {
  eventsDeleted: number;
  commentsDeleted: number;
  timestamp: string;
}

// ============================================================================
// MAP COMPONENT TYPES
// ============================================================================

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MarkerData {
  event: Event;
  position: Coordinates;
  icon: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchResult {
  event: Event;
  score: number;
  matches: {
    field: string;
    value: string;
  }[];
}

export interface SearchSuggestion {
  text: string;
  type: 'location' | 'title' | 'category' | 'keyword';
  eventId?: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface FilterState {
  category: string | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchQuery: string;
  showHeatmap: boolean;
}

// ============================================================================
// THEME TYPES
// ============================================================================

export type Theme = 'light' | 'dark';

export interface ThemeConfig {
  mode: Theme;
  mapTileUrl: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T | null>;

// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORIES: Category[] = [
  'accident',
  'crime',
  'wildlife',
  'festival',
  'celebrity',
  'emergency',
  'weather',
  'public',
];

export const ALMORA_COORDINATES: Coordinates = {
  lat: 29.5971,
  lng: 79.659,
};

export const DEFAULT_MAP_ZOOM = 12;
export const MAX_EVENTS_PER_PAGE = 50;
export const DATA_RETENTION_DAYS = 15;
export const SCRAPER_INTERVAL_MINUTES = 30;
export const HIGH_PRIORITY_THRESHOLD = 4;
export const GEOFENCE_RADIUS_KM = 50;
