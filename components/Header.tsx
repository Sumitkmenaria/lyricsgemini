
import React from 'react';
import { FilmIcon, MusicNoteIcon } from './icons/Icons';

const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl text-center mb-6 md:mb-8 px-4">
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-2 animate-slide-up">
        <MusicNoteIcon className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-500">
          AI Lyric Video Generator
        </h1>
        <FilmIcon className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
      </div>
      <p className="text-sm md:text-lg text-gray-400 animate-fade-in px-2">
        Bring your music to life. Upload audio, an image, and lyrics to create a beautiful video preview.
      </p>
    </header>
  );
};

export default Header;
