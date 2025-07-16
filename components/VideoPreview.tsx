
import React, { useState, useRef, useEffect, useMemo } from 'react';
import AudioVisualizer from './AudioVisualizer';
import LyricDisplayer from './LyricDisplayer';
import { BackIcon, PlayIcon, PauseIcon, ReplayIcon, ExportIcon } from './icons/Icons';
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
      setCurrentLyricIndex(lyrics.length); // Hide lyrics when finished
    };
    const handleTimeUpdate = () => {
      if (!audio || !lyrics.length) return;
      
      const currentTime = audio.currentTime;
      
      let newLyricIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].startTime) {
          newLyricIndex = i;
          break;
        }
      }

      if (newLyricIndex !== currentLyricIndex) {
        setCurrentLyricIndex(newLyricIndex);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    // Auto-play on mount
    audio.play().catch(e => console.error("Autoplay was prevented:", e));

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
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

  const aspectRatioClass = useMemo(() => aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]', [aspectRatio]);
  const fontClass = useMemo(() => fontMap[hindiFont] || 'font-mukta', [hindiFont]);

  return (
    <div className="w-full h-full flex items-center justify-center max-h-[90vh] px-4">
        <div className={`w-full max-w-4xl ${aspectRatioClass} relative flex flex-col justify-between items-center bg-black rounded-xl md:rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden animate-fade-in`}>
            <img src={imageUrl} alt="background" className="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-0" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/90 via-black/30 to-black/90 z-10"></div>
            
            <div className="w-full p-3 md:p-4 flex justify-between items-center z-20">
                <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/20 transition-all duration-300 text-sm md:text-base">
                    <BackIcon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold hidden sm:inline">Back to Editor</span>
                    <span className="font-semibold sm:hidden">Back</span>
                </button>
                 <button 
                    onClick={onExport} 
                    disabled={!isStarted}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base animate-pulse-glow">
                    <ExportIcon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold hidden sm:inline">Export Video</span>
                    <span className="font-semibold sm:hidden">Export</span>
                </button>
            </div>

            <div className="absolute bottom-16 md:bottom-20 left-3 md:left-4 text-left z-20">
                <div className="glass rounded-lg p-3 md:p-4">
                    <p className="font-bold text-base md:text-lg text-white">{songName}</p>
                    <p className="text-xs md:text-sm text-gray-300">by {creatorName}</p>
                </div>
            </div>

            <div className="w-full flex-grow flex flex-col justify-center items-center z-20 p-4 md:p-8 space-y-6 md:space-y-8">
                <LyricDisplayer 
                    lyric={currentLyricIndex > -1 ? lyrics[currentLyricIndex]?.text : ''} 
                    fontClass={fontClass}
                    key={currentLyricIndex} // Re-mount component to trigger animation
                />
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} />
            </div>

            <div className="w-full p-3 md:p-4 flex justify-center items-center gap-6 z-20">
                <button onClick={handlePlayPause} className="p-3 md:p-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 shadow-lg animate-pulse-glow">
                {isFinished ? <ReplayIcon className="w-6 h-6 md:w-8 md:h-8"/> : isPlaying ? <PauseIcon className="w-6 h-6 md:w-8 md:h-8" /> : <PlayIcon className="w-6 h-6 md:w-8 md:h-8" />}
                </button>
            </div>
            
            <audio ref={audioRef} src={audioUrl} className="hidden" crossOrigin="anonymous"/>
        </div>
    </div>
  );
};

export default VideoPreview;
