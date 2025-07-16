import React, { useState, useRef, useEffect, useMemo } from 'react';
import AudioVisualizer from './AudioVisualizer';
import LyricDisplayer from './LyricDisplayer';
import { BackIcon, PlayIcon, PauseIcon, ReplayIcon, ExportIcon, NextIcon } from './icons/Icons';
import { Lyric, AspectRatio, HindiFont } from '../types';

interface VideoPreviewProps {
  audioUrl: string;
  imageUrl: string;
  lyrics: Lyric[];
  songName: string;
  creatorName: string;
  aspectRatio: AspectRatio;
  imageColors: string[];
  hindiFont: HindiFont;
  onBack: () => void;
  onExport: () => void;
}

const fontMap: Record<HindiFont, string> = {
  Mukta: 'font-mukta',
  Tiro: 'font-tiro',
  Baloo: 'font-baloo',
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  audioUrl,
  imageUrl,
  lyrics,
  songName,
  creatorName,
  aspectRatio,
  imageColors,
  hindiFont,
  onBack,
  onExport
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlePlay = () => {
        setIsPlaying(true);
        if(!isStarted) setIsStarted(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setIsFinished(true);
      setCurrentLyricIndex(lyrics.length);
    };
    const handleTimeUpdate = () => {
      if (!audio || !lyrics.length) return;
      
      const time = audio.currentTime;
      setCurrentTime(time);
      
      let newLyricIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (time >= lyrics[i].startTime) {
          newLyricIndex = i;
          break;
        }
      }

      if (newLyricIndex !== currentLyricIndex) {
        setCurrentLyricIndex(newLyricIndex);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Auto-play on mount
    audio.play().catch(e => console.error("Autoplay was prevented:", e));

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [lyrics, currentLyricIndex]);
  
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if(isFinished) {
          handleRestart();
        } else {
          audioRef.current.play();
        }
      }
    }
  };

  const handleRestart = () => {
    if(audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsFinished(false);
      setCurrentLyricIndex(-1);
    }
  }

  const handleSeek = (direction: 'forward' | 'backward') => {
    if (audioRef.current) {
      const seekAmount = 10; // seconds
      const newTime = direction === 'forward' 
        ? Math.min(audioRef.current.currentTime + seekAmount, duration)
        : Math.max(audioRef.current.currentTime - seekAmount, 0);
      audioRef.current.currentTime = newTime;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const aspectRatioClass = useMemo(() => aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]', [aspectRatio]);
  const fontClass = useMemo(() => fontMap[hindiFont] || 'font-mukta', [hindiFont]);

  const getCurrentLyrics = () => {
    const current = currentLyricIndex >= 0 ? lyrics[currentLyricIndex] : null;
    const previous = currentLyricIndex > 0 ? lyrics[currentLyricIndex - 1] : null;
    const next = currentLyricIndex < lyrics.length - 1 ? lyrics[currentLyricIndex + 1] : null;
    
    return { current, previous, next };
  };

  const { current, previous, next } = getCurrentLyrics();

  return (
    <div className="w-full h-full flex items-center justify-center px-2 sm:px-4">
        <div className="w-full max-w-6xl flex flex-col items-center space-y-4">
            {/* Video Container */}
            <div className={`w-full ${aspectRatioClass} max-h-[70vh] relative flex flex-col justify-between items-center bg-black rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/20 animate-fade-in`}>
                {/* Background Image with Overlay */}
                <img src={imageUrl} alt="background" className="absolute inset-0 w-full h-full object-cover opacity-40 z-0" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 z-10"></div>
                
                {/* Background Visualizer */}
                <div className="absolute inset-0 z-15">
                    <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} isBackground={true} />
                </div>
                
                {/* Top Controls */}
                <div className="w-full p-3 md:p-4 flex justify-between items-start z-30">
                    <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/20 transition-all duration-300 text-sm">
                        <BackIcon className="w-4 h-4" />
                        <span className="font-semibold hidden sm:inline">Back</span>
                    </button>
                    <button 
                        onClick={onExport} 
                        disabled={!isStarted}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm animate-pulse-glow">
                        <ExportIcon className="w-4 h-4" />
                        <span className="font-semibold hidden sm:inline">Export</span>
                    </button>
                </div>

                {/* Song Info - Prominent Display */}
                <div className="absolute top-16 md:top-20 left-1/2 transform -translate-x-1/2 text-center z-30">
                    <div className="glass rounded-xl p-4 md:p-6 backdrop-blur-md">
                        <h1 className={`text-xl md:text-3xl lg:text-4xl font-bold text-white mb-2 ${fontClass}`}>
                            {songName}
                        </h1>
                        <p className="text-sm md:text-lg text-gray-300 font-medium">
                            by {creatorName}
                        </p>
                    </div>
                </div>

                {/* Lyrics Display - Center */}
                <div className="flex-1 flex items-center justify-center w-full px-4 z-30">
                    <LyricDisplayer 
                        currentLyric={current?.text || ''}
                        previousLyric={previous?.text || ''}
                        nextLyric={next?.text || ''}
                        fontClass={fontClass}
                        key={currentLyricIndex}
                    />
                </div>

                {/* Progress Bar */}
                <div className="w-full px-4 md:px-6 z-30">
                    <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                        <span>{formatTime(currentTime)}</span>
                        <div 
                            className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer"
                            onClick={handleProgressClick}
                        >
                            <div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-300"
                                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="w-full p-3 md:p-4 flex justify-center items-center gap-4 z-30">
                    <button 
                        onClick={() => handleSeek('backward')} 
                        className="p-2 glass rounded-full hover:bg-white/20 transition-all duration-300"
                    >
                        <div className="transform rotate-180">
                            <NextIcon className="w-5 h-5" />
                        </div>
                    </button>
                    
                    <button 
                        onClick={handlePlayPause} 
                        className="p-3 md:p-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 shadow-lg animate-pulse-glow"
                    >
                        {isFinished ? <ReplayIcon className="w-6 h-6 md:w-8 md:h-8"/> : isPlaying ? <PauseIcon className="w-6 h-6 md:w-8 md:h-8" /> : <PlayIcon className="w-6 h-6 md:w-8 md:h-8" />}
                    </button>
                    
                    <button 
                        onClick={() => handleSeek('forward')} 
                        className="p-2 glass rounded-full hover:bg-white/20 transition-all duration-300"
                    >
                        <NextIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Export Button Below Video */}
            <div className="w-full flex justify-center">
                <button 
                    onClick={onExport} 
                    disabled={!isStarted}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full hover:from-green-400 hover:to-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold shadow-lg animate-pulse-glow"
                >
                    <ExportIcon className="w-6 h-6" />
                    Create Video Export
                </button>
            </div>
            
            <audio ref={audioRef} src={audioUrl} className="hidden" crossOrigin="anonymous"/>
        </div>
    </div>
  );
};

export default VideoPreview;