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
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, life: number, maxLife: number}>>([]);
  
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
      
      // Create a trailing effect instead of clearing completely
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      
      // Calculate average volume for particle generation
      const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
      
      // Generate particles based on volume
      if (avgVolume > 30) {
        for (let i = 0; i < Math.floor(avgVolume / 20); i++) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: height,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 8 - 2,
            life: 0,
            maxLife: 60 + Math.random() * 40
          });
        }
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.life++;
        
        const alpha = 1 - (particle.life / particle.maxLife);
        if (alpha <= 0) return false;
        
        const colorIndex = Math.floor((particle.x / width) * palette.length);
        const color = palette[colorIndex] || palette[0];
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        return true;
      });
      
      // Draw frequency bars with improved styling
      const barCount = Math.min(bufferLength, 64); // Limit bars for better performance
      const barWidth = (width * 0.8) / barCount;
      const startX = width * 0.1;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * (height * 0.6);
        const x = startX + i * (barWidth + 2);
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
        gradient.addColorStop(0, palette[i % palette.length] + '80');
        gradient.addColorStop(0.5, palette[i % palette.length]);
        gradient.addColorStop(1, palette[i % palette.length] + '40');
        
        ctx.fillStyle = gradient;
        
        // Draw main bar
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        // Add glow effect
        ctx.shadowColor = palette[i % palette.length];
        ctx.shadowBlur = 10;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;
        
        // Draw reflection
        const reflectionGradient = ctx.createLinearGradient(x, height, x, height + barHeight * 0.3);
        reflectionGradient.addColorStop(0, palette[i % palette.length] + '40');
        reflectionGradient.addColorStop(1, palette[i % palette.length] + '00');
        
        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(x, height, barWidth, barHeight * 0.3);
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

  return (
    <div className="w-full flex justify-center">
      <canvas 
        ref={canvasRef} 
        width="800" 
        height="150" 
        className="opacity-90 rounded-lg max-w-full h-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default AudioVisualizer;
