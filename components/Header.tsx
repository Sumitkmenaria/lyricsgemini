
import React from 'react';
import { FilmIcon, MusicNoteIcon } from './icons/Icons';

const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl text-center mb-8">
      <div className="flex items-center justify-center gap-4 mb-2">
        <MusicNoteIcon className="w-10 h-10 text-cyan-400" />
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-500">
          AI Lyric Video Generator
        </h1>
        <FilmIcon className="w-10 h-10 text-purple-400" />
      </div>
      <p className="text-lg text-gray-400">
        Bring your music to life. Upload audio, an image, and lyrics to create a beautiful video preview.
      </p>
    </header>
  );
};

export default Header;
