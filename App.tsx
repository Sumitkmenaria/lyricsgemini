import React, { useState, useCallback } from 'react';
import InputForm from './components/InputForm';
import VideoPreview from './components/VideoPreview';
import Header from './components/Header';
import Loader from './components/Loader';
import { structureLyrics } from './services/geminiService';
import { extractColors } from './services/colorExtractor';
import { exportVideo } from './services/videoExporter';
import { AppState, View, AspectRatio, Lyric, HindiFont } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    view: View.INPUT,
    audioUrl: null,
    imageUrl: null,
    rawLyrics: '',
    structuredLyrics: [],
    error: null,
    isLoading: false,
    isExporting: false,
    songName: '',
    creatorName: '',
    aspectRatio: '16:9',
    imageColors: [],
    hindiFont: 'Mukta',
  });

  const handleCreateClick = useCallback(async (data: { audio: File; image: File; lyrics: string; songName: string; creatorName: string; aspectRatio: AspectRatio; hindiFont: HindiFont; }) => {
    setAppState(prev => ({ ...prev, isLoading: true, error: null, isExporting: false }));
    try {
      const imageUrl = URL.createObjectURL(data.image);
      const audioUrl = URL.createObjectURL(data.audio);
      
      const [structuredLyrics, imageColors] = await Promise.all([
        structureLyrics(data.lyrics),
        extractColors(imageUrl)
      ]);

      setAppState(prev => ({
        ...prev,
        view: View.PREVIEW,
        audioUrl,
        imageUrl,
        rawLyrics: data.lyrics,
        structuredLyrics,
        isLoading: false,
        songName: data.songName,
        creatorName: data.creatorName,
        aspectRatio: data.aspectRatio,
        imageColors,
        hindiFont: data.hindiFont,
      }));
    } catch (error) {
      console.error('Failed to generate video preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setAppState(prev => ({ ...prev, isLoading: false, error: `Failed to process your request. ${errorMessage}` }));
    }
  }, []);

  const handleAutoExtractAndCreate = useCallback(async (data: { audio: File; image: File; lyrics: string; songName: string; creatorName: string; aspectRatio: AspectRatio; hindiFont: HindiFont; }) => {
    setAppState(prev => ({ ...prev, isLoading: true, error: null, isExporting: false }));
    try {
      const imageUrl = URL.createObjectURL(data.image);
      const audioUrl = URL.createObjectURL(data.audio);
      
      // Extract lyrics with timestamps from audio
      const segments = await extractLyricsFromAudio(data.audio);
      
      // Use Gemini to enhance synchronization with provided lyrics (if any)
      const structuredLyrics = data.lyrics.trim() 
        ? await enhanceLyricSynchronization(segments, data.lyrics)
        : convertSegmentsToLyrics(segments);
      
      const imageColors = await extractColors(imageUrl);

      setAppState(prev => ({
        ...prev,
        view: View.PREVIEW,
        audioUrl,
        imageUrl,
        rawLyrics: data.lyrics || segments.map(s => s.text).join('\n'),
        structuredLyrics,
        isLoading: false,
        songName: data.songName,
        creatorName: data.creatorName,
        aspectRatio: data.aspectRatio,
        imageColors,
        hindiFont: data.hindiFont,
      }));
    } catch (error) {
      console.error('Failed to auto-extract and create video preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setAppState(prev => ({ ...prev, isLoading: false, error: `Failed to process your request. ${errorMessage}` }));
    }
  }, []);

  const handleBack = () => {
    setAppState(prev => ({
      ...prev,
      view: View.INPUT,
      error: null,
      isExporting: false,
      // Keep all other data including audioUrl, imageUrl, structuredLyrics, etc.
    }));
  };

  const handleExport = async () => {
    if (!appState.audioUrl || !appState.imageUrl) return;
    
    setAppState(prev => ({ ...prev, isExporting: true, error: null }));
    try {
      const {
        view,
        rawLyrics,
        structuredLyrics,
        isLoading,
        error,
        ...restOfState
      } = appState;

      await exportVideo({
        ...restOfState,
        lyrics: structuredLyrics,
      });
    } catch (error) {
       console.error('Failed to export video:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
       setAppState(prev => ({ ...prev, error: `Failed to export video. ${errorMessage}` }));
    } finally {
       setAppState(prev => ({ ...prev, isExporting: false }));
    }
  };


  const getLoaderMessage = () => {
    if (appState.isExporting) return "Exporting video... This may take a moment.";
    if (appState.isLoading) return "AI is synchronizing your lyrics...";
    return "Loading...";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white flex flex-col items-center p-2 sm:p-4 md:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-7xl flex-grow flex flex-col items-center justify-center min-h-0">
        {(appState.isLoading || appState.isExporting) && <Loader message={getLoaderMessage()} />}
        
        {!appState.isLoading && !appState.isExporting && appState.view === View.INPUT && (
          <InputForm
            onSubmit={handleCreateClick}
            onAutoExtractLyrics={handleAutoExtractAndCreate}
            initialData={{
              lyrics: appState.rawLyrics,
              songName: appState.songName,
              creatorName: appState.creatorName,
              aspectRatio: appState.aspectRatio,
              hindiFont: appState.hindiFont,
            }}
            error={appState.error}
            isExtracting={appState.isLoading}
          />
        )}
        
        {!appState.isLoading && !appState.isExporting && appState.view === View.PREVIEW && appState.audioUrl && appState.imageUrl && (
          <VideoPreview
            {...appState}
            lyrics={appState.structuredLyrics}
            onBack={handleBack}
            onExport={handleExport}
          />
        )}
      </main>
    </div>
  );
};

export default App;