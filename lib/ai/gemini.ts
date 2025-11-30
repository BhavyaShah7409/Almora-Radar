import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse } from '@/types';
import { countWords } from '@/lib/utils/text';
import { isCategoryValid } from '@/lib/utils/validators';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GEMINI_PROMPT = `You are an AI engine for Almora Radar, a news intelligence system for Almora, Uttarakhand, India.

Analyze the following news article and return JSON ONLY (no markdown, no code blocks, just raw JSON):

{
  "title": "",
  "clean_title": "",
  "summary_en": "100-150 word English summary",
  "summary_hi": "100-150 word Hindi summary",
  "category": "",
  "location_text": "",
  "priority_score": 1-5,
  "keywords": [],
  "incident_date": "",
  "raw_text": "",
  "source_link": ""
}

Rules:
- Stick strictly to the article text (no hallucinations)
- Be factual and neutral
- Extract the most precise location mentioned in Almora region
- Choose category from ONLY these options: "accident", "crime", "wildlife", "festival", "celebrity", "emergency", "weather", "public"
- Priority score: 1=low, 2=moderate, 3=important, 4=urgent, 5=critical
- Prioritize key facts: time/place/impact
- Make summaries smooth and readable
- English summary must be 100-150 words
- Hindi summary must be 100-150 words in Devanagari script
- Extract 3-7 relevant keywords
- Return ONLY valid JSON, no additional text`;

/**
 * Process article with Gemini AI
 * Includes retry logic with exponential backoff
 */
export async function processArticleWithGemini(
  title: string,
  content: string,
  sourceLink: string,
  maxRetries: number = 3
): Promise<GeminiResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const articleText = `
Title: ${title}
Content: ${content}
Source: ${sourceLink}
`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent([GEMINI_PROMPT, articleText]);
      const response = await result.response;
      const text = response.text();

      // Clean the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      // Parse JSON
      const parsed = JSON.parse(cleanedText) as GeminiResponse;

      // Validate the response
      validateGeminiResponse(parsed, sourceLink);

      return parsed;
    } catch (error) {
      lastError = error as Error;
      console.error(`Gemini API attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`Retrying after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Gemini API failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
}

/**
 * Validate Gemini response has all required fields and correct formats
 */
function validateGeminiResponse(response: any, sourceLink: string): asserts response is GeminiResponse {
  const required = [
    'title',
    'clean_title',
    'summary_en',
    'summary_hi',
    'category',
    'location_text',
    'priority_score',
    'keywords',
    'incident_date',
  ];

  for (const field of required) {
    if (!(field in response) || response[field] === null || response[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate category
  if (!isCategoryValid(response.category)) {
    throw new Error(`Invalid category: ${response.category}`);
  }

  // Validate priority score
  if (
    typeof response.priority_score !== 'number' ||
    response.priority_score < 1 ||
    response.priority_score > 5 ||
    !Number.isInteger(response.priority_score)
  ) {
    throw new Error(`Invalid priority_score: ${response.priority_score}`);
  }

  // Validate keywords is array
  if (!Array.isArray(response.keywords)) {
    throw new Error('keywords must be an array');
  }

  // Validate word counts (with some tolerance)
  const enWordCount = countWords(response.summary_en);
  const hiWordCount = countWords(response.summary_hi);

  if (enWordCount < 80 || enWordCount > 180) {
    console.warn(`English summary word count (${enWordCount}) outside ideal range 100-150`);
  }

  if (hiWordCount < 80 || hiWordCount > 180) {
    console.warn(`Hindi summary word count (${hiWordCount}) outside ideal range 100-150`);
  }

  // Add source_link and raw_text
  response.source_link = sourceLink;
  response.raw_text = response.title + ' ' + response.summary_en;
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(['Say "OK" if you can read this.']);
    const response = await result.response;
    const text = response.text();
    return text.toLowerCase().includes('ok');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}
