
import { AppState } from "../types";

const FONT_MAP: Record<string, string> = {
  'font-mukta': '700 48px Mukta',
  'font-tiro': '400 48px "Tiro Devanagari Hindi"',
  'font-baloo': '700 52px "Baloo 2"',
}

const getFontClass = (font: AppState['hindiFont']) => {
    if (font === 'Tiro') return 'font-tiro';
    if (font === 'Baloo') return 'font-baloo';
    return 'font-mukta';
}


const loadAsset = <T extends HTMLImageElement | HTMLAudioElement>(asset: T): Promise<T> => {
    return new Promise((resolve, reject) => {
        if (asset instanceof HTMLImageElement) {
            asset.onload = () => resolve(asset);
        } else {
            asset.oncanplaythrough = () => resolve(asset);
        }
        asset.onerror = reject;
    });
};

export const exportVideo = async (options: Omit<AppState, 'view' | 'rawLyrics' | 'structuredLyrics' | 'isLoading' | 'error' > & { lyrics: AppState['structuredLyrics'] }): Promise<void> => {
    const { audioUrl, imageUrl, lyrics, songName, creatorName, aspectRatio, imageColors, hindiFont } = options;
    
    const canvas = document.createElement('canvas');
    const FONT_SIZE = aspectRatio === '16:9' ? 56 : 48;
    const VIDEO_WIDTH = aspectRatio === '16:9' ? 1920 : 1080;
    const VIDEO_HEIGHT = aspectRatio === '16:9' ? 1080 : 1920;

    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");

    const audioContext = new AudioContext();
    const [image, audio] = await Promise.all([
        loadAsset(Object.assign(new Image(), { src: imageUrl, crossOrigin: 'anonymous' })),
        loadAsset(Object.assign(new Audio(), { src: audioUrl, crossOrigin: 'anonymous' })),
    ]);
    
    const fontClassName = getFontClass(hindiFont);
    const fontString = FONT_MAP[fontClassName].replace(/\d+px/, `${FONT_SIZE}px`);
    await document.fonts.load(fontString);

    const destination = audioContext.createMediaStreamDestination();
    const source = audioContext.createMediaElementSource(audio);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    
    source.connect(analyser);
    source.connect(destination);

    const videoStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${songName.replace(/ /g, '_')}_lyric_video.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    let animationFrameId: number;
    const particles: Array<{x: number, y: number, vx: number, vy: number, life: number, maxLife: number}> = [];

    const renderFrame = () => {
        // Background with gradient
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.drawImage(image, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        ctx.restore();
        
        // Enhanced gradient overlay
        const gradient = ctx.createLinearGradient(0, 0, 0, VIDEO_HEIGHT);
        gradient.addColorStop(0, 'rgba(0,0,0,0.8)');
        gradient.addColorStop(0.3, 'rgba(0,0,0,0.3)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.3)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

        // Enhanced Visualizer with particles
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume for particle generation
        const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
        
        // Generate particles
        if (avgVolume > 30) {
            for (let i = 0; i < Math.floor(avgVolume / 15); i++) {
                particles.push({
                    x: Math.random() * VIDEO_WIDTH,
                    y: VIDEO_HEIGHT * 0.85,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 12 - 4,
                    life: 0,
                    maxLife: 80 + Math.random() * 60
                });
            }
        }
        
        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            particle.life++;
            
            const alpha = 1 - (particle.life / particle.maxLife);
            if (alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }
            
            const colorIndex = Math.floor((particle.x / VIDEO_WIDTH) * imageColors.length);
            const color = imageColors[colorIndex] || imageColors[0] || '#67e8f9';
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Enhanced frequency bars
        const barCount = Math.min(bufferLength, 80);
        const barWidth = (VIDEO_WIDTH * 0.7) / barCount;
        const startX = VIDEO_WIDTH * 0.15;
        const vizHeight = VIDEO_HEIGHT * 0.15;
        const vizY = VIDEO_HEIGHT * 0.82;
        
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * bufferLength);
            const barHeight = (dataArray[dataIndex] / 255) * vizHeight;
            const x = startX + i * (barWidth + 3);
            
            // Create gradient for each bar
            const barGradient = ctx.createLinearGradient(x, vizY, x, vizY - barHeight);
            const colorIndex = i % imageColors.length;
            const color = imageColors[colorIndex] || '#67e8f9';
            barGradient.addColorStop(0, color + '80');
            barGradient.addColorStop(0.5, color);
            barGradient.addColorStop(1, color + '40');
            
            ctx.fillStyle = barGradient;
            ctx.fillRect(x, vizY - barHeight, barWidth, barHeight);
            
            // Add glow effect
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fillRect(x, vizY - barHeight, barWidth, barHeight);
            ctx.shadowBlur = 0;
            
            // Draw reflection
            const reflectionGradient = ctx.createLinearGradient(x, vizY, x, vizY + barHeight * 0.4);
            reflectionGradient.addColorStop(0, color + '30');
            reflectionGradient.addColorStop(1, color + '00');
            ctx.fillStyle = reflectionGradient;
            ctx.fillRect(x, vizY, barWidth, barHeight * 0.4);
        }

        // Enhanced Lyrics with background
        const currentTime = audio.currentTime;
        let currentLyric = '';
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].startTime) {
                currentLyric = lyrics[i].text;
                break;
            }
        }
        if (currentLyric) {
            // Lyric background
            ctx.save();
            const textMetrics = ctx.measureText(currentLyric);
            const textWidth = textMetrics.width;
            const textHeight = FONT_SIZE * 1.2;
            const bgX = (VIDEO_WIDTH - textWidth) / 2 - 40;
            const bgY = VIDEO_HEIGHT * 0.6 - textHeight / 2 - 20;
            const bgWidth = textWidth + 80;
            const bgHeight = textHeight + 40;
            
            // Rounded rectangle background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 20);
            ctx.fill();
            
            // Border glow
            ctx.strokeStyle = imageColors[0] || '#67e8f9';
            ctx.lineWidth = 2;
            ctx.shadowColor = imageColors[0] || '#67e8f9';
            ctx.shadowBlur = 20;
            ctx.stroke();
            ctx.restore();
            
            // Lyric text
            ctx.font = fontString;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.shadowColor = imageColors[0] || 'rgba(103, 232, 249, 0.8)';
            ctx.shadowBlur = 30;
            ctx.fillText(currentLyric, VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.6);
            ctx.shadowBlur = 0;
        }

        // Enhanced Info section
        const infoY = VIDEO_HEIGHT - 120;
        const infoX = 60;
        
        // Info background
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(infoX - 20, infoY - 60, 400, 100, 15);
        ctx.fill();
        
        // Info border
        ctx.strokeStyle = imageColors[1] || '#a78bfa';
        ctx.lineWidth = 2;
        ctx.shadowColor = imageColors[1] || '#a78bfa';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
        
        // Info text
        ctx.textAlign = 'left';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.font = `700 ${FONT_SIZE * 0.6}px Inter`;
        ctx.fillText(songName, infoX, infoY - 20);
        ctx.font = `400 ${FONT_SIZE * 0.45}px Inter`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(`by ${creatorName}`, infoX, infoY + 15);
        ctx.shadowBlur = 0;

        animationFrameId = requestAnimationFrame(renderFrame);
    };

    audio.onended = () => {
        recorder.stop();
        cancelAnimationFrame(animationFrameId);
        audioContext.close();
    };
    
    await audio.play();
    recorder.start();
    renderFrame();
};
