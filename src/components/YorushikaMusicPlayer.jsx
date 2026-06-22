import { useState, useRef, useEffect } from 'react';

const PLAYLIST = [
  { src: '/track1.mp3', title: 'アルジャーノン (Algernon)', artist: 'Yorushika' },
  { src: '/track2.mp3', title: '春泥棒 (Haru Dorobou)', artist: 'Yorushika' },
];

export default function YorushikaMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
    }
  }, []);

  const handleEnded = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % PLAYLIST.length);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
    }
  }, [currentTrackIndex, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const playPrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
  };

  const currentTrack = PLAYLIST[currentTrackIndex];
  const showExpanded = isHovered;

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <audio 
        ref={audioRef} 
        src={currentTrack.src} 
        onEnded={handleEnded}
      />

      <div className="relative flex items-center justify-end h-16">
        {/* Expanded Player */}
        <div 
          className={`absolute right-0 flex items-center gap-4 bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-2 pr-5 shadow-2xl border border-primary/20 transition-all duration-500 origin-right ${
            showExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1 bg-primary/5 rounded-full p-1 shrink-0">
            <button 
              onClick={playPrev}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined">skip_previous</span>
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-12 h-12 bg-gradient-to-br from-[#ce8093] to-[#8c3a56] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all relative"
            >
              {isPlaying && <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-50" />}
              <span className="material-symbols-outlined icon-fill text-2xl">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button 
              onClick={playNext}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          </div>

          <div className="flex flex-col justify-center min-w-[140px] pr-2">
            <p className="text-[9px] font-black text-primary tracking-[0.15em] uppercase mb-0.5">
              {isPlaying ? 'Memutar' : 'Jeda'} ({currentTrackIndex + 1}/{PLAYLIST.length})
            </p>
            <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{currentTrack.title}</p>
            <p className="text-[10px] font-medium text-slate-500">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Floating Mini Button (when collapsed) */}
        <button 
          onClick={togglePlay}
          className={`w-14 h-14 bg-gradient-to-br from-[#ce8093] to-[#8c3a56] rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 transition-all duration-500 absolute right-0 ${
            showExpanded ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100 hover:scale-110'
          }`}
        >
          <span className="material-symbols-outlined icon-fill text-2xl">music_note</span>
        </button>
      </div>
    </div>
  );
}
