import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  colors?: string[];
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioRef, isPlaying, colors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  
  const defaultColors = ['#67e8f9', '#a78bfa', '#f472b6'];
  const palette = colors && colors.length > 0 ? colors : defaultColors;

  useEffect(() => {
    const initializeAudioContext = () => {
      if (!audioRef.current) return;
      if (!audioContextRef.current) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        
        // This check prevents re-connecting the source node
        if(!sourceRef.current) {
            const source = context.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            source.connect(context.destination); // Connect to speakers
            sourceRef.current = source;
        } else {
             sourceRef.current.connect(analyser);
             sourceRef.current.connect(context.destination);
        }

        analyserRef.current = analyser;
        audioContextRef.current = context;
      }
    };
    
    // An interaction is needed to start AudioContext
    if(isPlaying){
        if (!audioContextRef.current) {
            initializeAudioContext();
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }

    const draw = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        palette.forEach((color, index) => {
            gradient.addColorStop(index / (palette.length -1 || 1), color);
        });
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying && analyserRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isPlaying, audioRef, palette]);

  return <canvas ref={canvasRef} width="600" height="100" className="opacity-80"/>;
};

export default AudioVisualizer;
