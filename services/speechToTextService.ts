import OpenAI from 'openai';
import { Lyric } from '../types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable not set.");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be done server-side
});

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

export const extractLyricsFromAudio = async (audioFile: File): Promise<TranscriptionSegment[]> => {
  try {
    console.log('Starting audio transcription...');
    
    // Convert File to the format expected by OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    });

    console.log('Transcription completed:', transcription);

    // Extract segments with timestamps
    const segments: TranscriptionSegment[] = [];
    
    if (transcription.segments) {
      transcription.segments.forEach((segment: any) => {
        if (segment.text && segment.text.trim()) {
          segments.push({
            text: segment.text.trim(),
            start: segment.start,
            end: segment.end
          });
        }
      });
    }

    return segments;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to extract lyrics from audio. Please check your OpenAI API key and try again.");
  }
};

export const convertSegmentsToLyrics = (segments: TranscriptionSegment[]): Lyric[] => {
  return segments.map(segment => ({
    text: segment.text,
    startTime: segment.start
  }));
};