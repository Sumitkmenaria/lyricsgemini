import { GoogleGenAI, Type } from "@google/genai";
import { Lyric } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const lyricSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: "A single, meaningful line of the song lyrics, suitable for display.",
      },
      startTime: {
        type: Type.NUMBER,
        description: "The estimated time in seconds when this lyric line should start appearing."
      }
    },
    required: ["text", "startTime"],
  },
};

export const structureLyrics = async (rawLyrics: string): Promise<Lyric[]> => {
  try {
    const prompt = `
      You are an expert in music and video production. Your task is to parse Hindi song lyrics and assign timestamps for a lyric video.
      Analyze the following Hindi song lyrics and convert them into a JSON array of objects.
      Each object must represent a single lyric line and contain two keys:
      1.  "text": A string containing the clean lyric line in its original Hindi script.
      2.  "startTime": A number representing the estimated start time in seconds for the line to appear in a video.

      Guidelines for timing:
      - Assume a standard song pace.
      - Add a 5-second buffer at the beginning for an musical intro before the first lyric appears.
      - Distribute the start times logically throughout the song, considering verses, choruses, and bridges.
      - Do not include any annotations like '[Chorus]', '(Verse 1)', etc. in the final 'text' value.
      - The final output MUST be only the JSON array of objects.

      Lyrics to process:
      ---
      ${rawLyrics}
      ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lyricSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedLyrics = JSON.parse(jsonText);

    if (!Array.isArray(parsedLyrics) || !parsedLyrics.every(item => typeof item === 'object' && 'text' in item && 'startTime' in item)) {
        throw new Error("AI returned data in an unexpected format.");
    }

    // Sort by start time just in case the AI provides them out of order
    return parsedLyrics.sort((a, b) => a.startTime - b.startTime);

  } catch (error) {
    console.error("Error processing lyrics with Gemini API:", error);
    throw new Error("The AI failed to understand the lyrics. Please check the format and try again.");
  }
};
