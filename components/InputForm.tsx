
import React, { useState, useRef, useMemo } from 'react';
import { UploadIcon } from './icons/Icons';
import { AspectRatio, HindiFont } from '../types';

interface InputFormProps {
  onSubmit: (data: { audio: File; image: File; lyrics: string; songName: string; creatorName: string; aspectRatio: AspectRatio; hindiFont: HindiFont; }) => void;
  initialData: {
    lyrics: string;
    songName: string;
    creatorName: string;
    aspectRatio: AspectRatio;
    hindiFont: HindiFont;
  };
  error: string | null;
}

const fonts: { key: HindiFont, name: string, className: string }[] = [
    { key: 'Mukta', name: 'Default', className: 'font-mukta' },
    { key: 'Tiro', name: 'Elegant', className: 'font-tiro' },
    { key: 'Baloo', name: 'Bold', className: 'font-baloo' },
];

const InputForm: React.FC<InputFormProps> = ({ onSubmit, initialData, error }) => {
  const [audio, setAudio] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState<string>(initialData.lyrics);
  const [songName, setSongName] = useState<string>(initialData.songName);
  const [creatorName, setCreatorName] = useState<string>(initialData.creatorName);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialData.aspectRatio);
  const [hindiFont, setHindiFont] = useState<HindiFont>(initialData.hindiFont);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = useMemo(() => audio && image && lyrics.trim().length > 0 && songName.trim().length > 0 && creatorName.trim().length > 0, [audio, image, lyrics, songName, creatorName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit({ audio, image, lyrics, songName, creatorName, aspectRatio, hindiFont });
    }
  };

  const FileInput = ({
    label,
    file,
    onFileChange,
    inputRef,
    accept,
  }: {
    label: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    accept: string;
  }) => (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-24 md:h-32 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300 hover:bg-gray-700/30"
      >
        <UploadIcon className="w-6 h-6 md:w-8 md:h-8 mb-2" />
        <span className="text-xs md:text-sm font-semibold text-center px-2">{file ? file.name : `Click to upload`}</span>
        {file && <span className="text-xs mt-1 text-gray-500">{`${(file.size / 1024 / 1024).toFixed(2)} MB`}</span>}
      </button>
      <input
        type="file"
        ref={inputRef}
        onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
        accept={accept}
        className="hidden"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-6 md:space-y-8 animate-fade-in px-4">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center text-sm md:text-base">
          {error}
        </div>
      )}
      
      <div className="glass rounded-xl p-4 md:p-6 animate-slide-up">
        <h3 className="text-base md:text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-cyan-400 text-gray-900 rounded-full flex items-center justify-center text-sm font-bold">1</span>
          Upload Your Files
        </h3>
        <div className="flex flex-col md:flex-row gap-8">
          <FileInput
            label="Audio File (MP3, WAV)"
            file={audio}
            onFileChange={setAudio}
            inputRef={audioInputRef}
            accept="audio/mpeg,audio/wav,audio/ogg"
          />
          <FileInput
            label="Background Image (JPG, PNG)"
            file={image}
            onFileChange={setImage}
            inputRef={imageInputRef}
            accept="image/jpeg,image/png,image/webp"
          />
        </div>
      </div>

      <div className="glass rounded-xl p-4 md:p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-base md:text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-400 text-gray-900 rounded-full flex items-center justify-center text-sm font-bold">2</span>
          Add Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="songName" className="block text-sm font-medium text-gray-300 mb-2">Song Name</label>
            <input type="text" id="songName" value={songName} onChange={e => setSongName(e.target.value)} placeholder="e.g., 'Mera Safar'" className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:bg-gray-700" required />
          </div>
          <div>
            <label htmlFor="creatorName" className="block text-sm font-medium text-gray-300 mb-2">Creator Name</label>
            <input type="text" id="creatorName" value={creatorName} onChange={e => setCreatorName(e.target.value)} placeholder="e.g., 'Aarav Kumar'" className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:bg-gray-700" required />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Video Format</label>
          <div className="grid grid-cols-2 gap-4">
            {(['16:9', '9:16'] as const).map(ratio => (
              <label key={ratio} className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all duration-300 ${aspectRatio === ratio ? 'border-cyan-400 bg-cyan-900/50 animate-pulse-glow' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'}`}>
                <input type="radio" name="aspectRatio" value={ratio} checked={aspectRatio === ratio} onChange={() => setAspectRatio(ratio)} className="sr-only" />
                <span className="text-sm md:text-base">{ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}</span>
              </label>
            ))}
          </div>
        </div>
         <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Lyric Font Style</label>
          <div className="grid grid-cols-3 gap-4">
            {fonts.map(font => (
              <label key={font.key} className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all duration-300 ${hindiFont === font.key ? 'border-cyan-400 bg-cyan-900/50 animate-pulse-glow' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'}`}>
                <input type="radio" name="hindiFont" value={font.key} checked={hindiFont === font.key} onChange={() => setHindiFont(font.key)} className="sr-only" />
                <span className={`${font.className} text-lg md:text-xl`}>{font.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-4 md:p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-base md:text-lg font-semibold text-pink-400 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-pink-400 text-gray-900 rounded-full flex items-center justify-center text-sm font-bold">3</span>
          Paste Hindi Lyrics
        </h3>
        <textarea
          id="lyrics"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="यहाँ अपने गीत के बोल पेस्ट करें..."
          className={`w-full h-40 md:h-48 p-4 bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 hover:bg-gray-700 text-base md:text-lg ${fonts.find(f => f.key === hindiFont)?.className}`}
          required
        />
      </div>
      
      <div className="text-center pt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          type="submit"
          disabled={!isFormValid}
          className="px-8 md:px-12 py-3 md:py-4 text-base md:text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-pulse-glow min-w-[200px]"
        >
          Create Video Preview
        </button>
        </div>
      </div>
    </form>
  );
};

export default InputForm;
