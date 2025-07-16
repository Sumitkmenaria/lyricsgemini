
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
        className="w-full h-32 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors duration-300"
      >
        <UploadIcon className="w-8 h-8 mb-2" />
        <span className="text-sm font-semibold">{file ? file.name : `Click to upload`}</span>
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
    <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-8 animate-fade-in">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}
      
      <div className="bg-gray-800/50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Step 1: Upload Your Files</h3>
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

      <div className="bg-gray-800/50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-400 mb-4">Step 2: Add Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="songName" className="block text-sm font-medium text-gray-300 mb-2">Song Name</label>
            <input type="text" id="songName" value={songName} onChange={e => setSongName(e.target.value)} placeholder="e.g., 'Mera Safar'" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" required />
          </div>
          <div>
            <label htmlFor="creatorName" className="block text-sm font-medium text-gray-300 mb-2">Creator Name</label>
            <input type="text" id="creatorName" value={creatorName} onChange={e => setCreatorName(e.target.value)} placeholder="e.g., 'Aarav Kumar'" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" required />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Video Format</label>
          <div className="flex gap-4">
            {(['16:9', '9:16'] as const).map(ratio => (
              <label key={ratio} className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${aspectRatio === ratio ? 'border-cyan-400 bg-cyan-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                <input type="radio" name="aspectRatio" value={ratio} checked={aspectRatio === ratio} onChange={() => setAspectRatio(ratio)} className="sr-only" />
                <span>{ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}</span>
              </label>
            ))}
          </div>
        </div>
         <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Lyric Font Style</label>
          <div className="grid grid-cols-3 gap-4">
            {fonts.map(font => (
              <label key={font.key} className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${hindiFont === font.key ? 'border-cyan-400 bg-cyan-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                <input type="radio" name="hindiFont" value={font.key} checked={hindiFont === font.key} onChange={() => setHindiFont(font.key)} className="sr-only" />
                <span className={`${font.className} text-xl`}>{font.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-pink-400 mb-4">Step 3: Paste Hindi Lyrics</h3>
        <textarea
          id="lyrics"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="यहाँ अपने गीत के बोल पेस्ट करें..."
          className={`w-full h-48 p-4 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg ${fonts.find(f => f.key === hindiFont)?.className}`}
          required
        />
      </div>
      
      <div className="text-center pt-4">
        <button
          type="submit"
          disabled={!isFormValid}
          className="px-12 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Create Video Preview
        </button>
      </div>
    </form>
  );
};

export default InputForm;
