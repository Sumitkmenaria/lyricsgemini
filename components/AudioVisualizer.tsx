import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  colors?: string[];
  isBackground?: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  audioRef, 
  isPlaying, 
  colors, 
  isBackground = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  const particlesRef = useRef<Array<{
    x: number, 
    y: number, 
    vx: number, 
    vy: number, 
    life: number, 
    maxLife: number,
    size: number,
    color: string
  }>>([]);
  
  const defaultColors = ['#67e8f9', '#a78bfa', '#f472b6'];
  const palette = colors && colors.length > 0 ? colors : defaultColors;

  useEffect(() => {
    const initializeAudioContext = () => {
      if (!audioRef.current) return;
      if (!audioContextRef.current) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        
        if(!sourceRef.current) {
            const source = context.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            source.connect(context.destination);
            sourceRef.current = source;
        } else {
             sourceRef.current.connect(analyser);
             sourceRef.current.connect(context.destination);
        }

        analyserRef.current = analyser;
        audioContextRef.current = context;
      }
    };
    
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
      
      if (isBackground) {
        // Background visualizer - subtle particle effects
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);
        
        const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
        
        // Generate floating particles
        if (avgVolume > 20) {
          for (let i = 0; i < Math.floor(avgVolume / 30); i++) {
            particlesRef.current.push({
              x: Math.random() * width,
              y: Math.random() * height,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 0,
              maxLife: 120 + Math.random() * 80,
              size: Math.random() * 3 + 1,
              color: palette[Math.floor(Math.random() * palette.length)]
            });
          }
        }
        
        // Update and draw particles
        particlesRef.current = particlesRef.current.filter(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life++;
          
          // Wrap around edges
          if (particle.x < 0) particle.x = width;
          if (particle.x > width) particle.x = 0;
          if (particle.y < 0) particle.y = height;
          if (particle.y > height) particle.y = 0;
          
          const alpha = Math.sin((particle.life / particle.maxLife) * Math.PI) * 0.3;
          if (particle.life >= particle.maxLife) return false;
          
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add subtle glow
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = particle.size * 2;
          ctx.fill();
          ctx.restore();
          
          return true;
        });

        // Add frequency-based wave effects
        ctx.save();
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < bufferLength; i += 8) {
          const value = dataArray[i] / 255;
          const x = (i / bufferLength) * width;
          const waveHeight = value * height * 0.3;
          
          const gradient = ctx.createRadialGradient(x, height/2, 0, x, height/2, waveHeight);
          gradient.addColorStop(0, palette[i % palette.length] + '40');
          gradient.addColorStop(1, palette[i % palette.length] + '00');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, height/2, waveHeight, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        
      } else {
        // Foreground visualizer - more prominent effects
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);
        
        const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
        
        // Generate more visible particles
        if (avgVolume > 25) {
          for (let i = 0; i < Math.floor(avgVolume / 15); i++) {
            particlesRef.current.push({
              x: Math.random() * width,
              y: height - 20,
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 10 - 3,
              life: 0,
              maxLife: 80 + Math.random() * 60,
              size: Math.random() * 4 + 2,
              color: palette[Math.floor(Math.random() * palette.length)]
            });
          }
        }
        
        // Update and draw particles
        particlesRef.current = particlesRef.current.filter(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.15; // gravity
          particle.life++;
          
          const alpha = 1 - (particle.life / particle.maxLife);
          if (alpha <= 0) return false;
          
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.color;
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = particle.size * 3;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          
          return true;
        });
        
        // Draw circular frequency visualization
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.15;
        
        for (let i = 0; i < bufferLength; i += 4) {
          const value = dataArray[i] / 255;
          const angle = (i / bufferLength) * Math.PI * 2;
          const radius = baseRadius + value * 40;
          
          const x1 = centerX + Math.cos(angle) * baseRadius;
          const y1 = centerY + Math.sin(angle) * baseRadius;
          const x2 = centerX + Math.cos(angle) * radius;
          const y2 = centerY + Math.sin(angle) * radius;
          
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, palette[i % palette.length] + '80');
          gradient.addColorStop(1, palette[i % palette.length]);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.shadowColor = palette[i % palette.length];
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
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
  }, [isPlaying, audioRef, palette, isBackground]);

  return (
    <canvas 
      ref={canvasRef} 
      width={isBackground ? "1920" : "800"} 
      height={isBackground ? "1080" : "200"} 
      className={`${isBackground ? 'absolute inset-0 w-full h-full object-cover opacity-20' : 'opacity-80 rounded-lg max-w-full h-auto'}`}
      style={isBackground ? {} : { maxWidth: '100%', height: 'auto' }}
    />
  );
};

export default AudioVisualizer;