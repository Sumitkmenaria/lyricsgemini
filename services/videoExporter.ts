
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
    const FONT_SIZE = aspectRatio === '16:9' ? 48 : 42;
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
    analyser.fftSize = 256;
    
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

    const renderFrame = () => {
        // Background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.drawImage(image, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

        // Visualizer
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        const barWidth = (VIDEO_WIDTH / bufferLength) * 1.5;
        let x = (VIDEO_WIDTH - (bufferLength * (barWidth + 2))) / 2;
        const vizHeight = VIDEO_HEIGHT * 0.1;
        const vizY = VIDEO_HEIGHT * 0.8;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * vizHeight;
            const gradient = ctx.createLinearGradient(x, vizY, x, vizY - barHeight);
            imageColors.forEach((color, index) => gradient.addColorStop(index / (imageColors.length -1 || 1), color));
            ctx.fillStyle = gradient;
            ctx.fillRect(x, vizY - barHeight, barWidth, barHeight);
            x += barWidth + 2;
        }

        // Lyrics
        const currentTime = audio.currentTime;
        let currentLyric = '';
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].startTime) {
                currentLyric = lyrics[i].text;
                break;
            }
        }
        if (currentLyric) {
            ctx.font = fontString;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'rgba(103, 232, 249, 0.7)';
            ctx.shadowBlur = 20;
            ctx.fillText(currentLyric, VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.7);
            ctx.shadowBlur = 0;
        }

        // Info
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `700 ${FONT_SIZE * 0.5}px Inter`;
        ctx.fillText(songName, 40, VIDEO_HEIGHT - 60);
        ctx.font = `400 ${FONT_SIZE * 0.4}px Inter`;
        ctx.fillText(`by ${creatorName}`, 40, VIDEO_HEIGHT - 30);

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
