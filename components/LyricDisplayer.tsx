import React from 'react';

interface LyricDisplayerProps {
  currentLyric: string;
  previousLyric: string;
  nextLyric: string;
  fontClass: string;
}

const LyricDisplayer: React.FC<LyricDisplayerProps> = ({ 
  currentLyric, 
  previousLyric, 
  nextLyric, 
  fontClass 
}) => {
  return (
    <div className="w-full max-w-4xl text-center space-y-4 px-4">
      {/* Previous Lyric */}
      {previousLyric && (
        <div className="opacity-40 transform scale-90">
          <p className={`text-lg md:text-xl text-gray-300 ${fontClass} transition-all duration-500`}>
            {previousLyric}
          </p>
        </div>
      )}
      
      {/* Current Lyric */}
      {currentLyric && (
        <div className="glass rounded-2xl p-6 md:p-8 backdrop-blur-lg border border-white/20">
          <p 
            className={`text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight ${fontClass} animate-lyric-glow`}
            style={{
              textShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(103, 232, 249, 0.9), 0 0 90px rgba(167, 139, 250, 0.6)',
              fontWeight: fontClass === 'font-baloo' ? '800' : fontClass === 'font-mukta' ? '700' : '600'
            }}
          >
            {currentLyric.split(' ').map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-2 md:mr-3">
                {word.split('').map((char, charIndex) => (
                  <span 
                      key={charIndex} 
                      className="inline-block animate-char-in"
                      style={{ animationDelay: `${wordIndex * 100 + charIndex * 50}ms`}}
                  >
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </p>
        </div>
      )}
      
      {/* Next Lyric */}
      {nextLyric && (
        <div className="opacity-30 transform scale-85">
          <p className={`text-base md:text-lg text-gray-400 ${fontClass} transition-all duration-500`}>
            {nextLyric}
          </p>
        </div>
      )}
    </div>
  );
};

export default LyricDisplayer;