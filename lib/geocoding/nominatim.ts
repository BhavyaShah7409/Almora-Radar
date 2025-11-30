import { Coordinates, GeocodingResult, NominatimResponse, ALMORA_COORDINATES } from '@/types';
import { validateCoordinates } from '@/lib/utils/validators';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_DELAY = 1000; // 1 second between requests (Nominatim policy)

let lastRequestTime = 0;

/**
 * Geocode location text to coordinates using Nominatim API
 * Includes retry logic and rate limiting
 */
export async function geocodeLocation(
  locationText: string,
  maxRetries: number = 3
): Promise<GeocodingResult> {
  if (!locationText || locationText.trim().length === 0) {
    return {
      ...ALMORA_COORDINATES,
      display_name: 'Almora, Uttarakhand, India',
      success: false,
    };
  }

  // Add "Almora" to search if not present
  const searchQuery = locationText.toLowerCase().includes('almora')
    ? locationText
    : `${locationText}, Almora, Uttarakhand, India`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Rate limiting
      await enforceRateLimit();

      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?` +
          new URLSearchParams({
            q: searchQuery,
            format: 'json',
            limit: '1',
            addressdetails: '1',
          }),
        {
          headers: {
            'User-Agent': 'AlmoraRadar/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data: NominatimResponse[] = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const coords: Coordinates = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };

        // Validate coordinates
        if (validateCoordinates(coords)) {
          return {
            ...coords,
            display_name: result.display_name,
            success: true,
          };
        }
      }

      // No results found, use fallback
      console.log(`No geocoding results for: ${locationText}`);
      return {
        ...ALMORA_COORDINATES,
        display_name: 'Almora, Uttarakhand, India',
        success: false,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`Geocoding attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`Retrying geocoding after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed, use fallback
  console.error(`Geocoding failed after ${maxRetries + 1} attempts:`, lastError);
  return {
    ...ALMORA_COORDINATES,
    display_name: 'Almora, Uttarakhand, India (fallback)',
    success: false,
  };
}

/**
 * Enforce rate limiting (1 request per second)
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    const waitTime = REQUEST_DELAY - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Reverse geocode coordinates to location name
 */
export async function reverseGeocode(coords: Coordinates): Promise<string> {
  try {
    await enforceRateLimit();

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?` +
        new URLSearchParams({
          lat: coords.lat.toString(),
          lon: coords.lng.toString(),
          format: 'json',
        }),
      {
        headers: {
          'User-Agent': 'AlmoraRadar/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding error: ${response.status}`);
    }

    const data: NominatimResponse = await response.json();
    return data.display_name || 'Unknown location';
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return 'Unknown location';
  }
}
