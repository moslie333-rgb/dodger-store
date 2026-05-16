import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const AudioPlayer = ({ src, label, isPlaying, onTogglePlay }) => {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // For RTL layout, the starting point (0%) is on the right.
    // e.clientX is from the left of the screen.
    const clickX = e.clientX - rect.left;
    const percent = 1 - (clickX / rect.width);
    
    if (audioRef.current) {
      audioRef.current.currentTime = percent * audioRef.current.duration;
      setProgress(percent * 100);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-[#121212] p-8 rounded-[35px] border border-black/5 dark:border-white/5 flex flex-col gap-6 shadow-soft hover:shadow-premium transition-all duration-500 group hover:-translate-y-1">
      <div className="flex items-center gap-5">
        <button 
          onClick={onTogglePlay}
          className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white shadow-lg shadow-accent/20 hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label={isPlaying ? "إيقاف" : "تشغيل"}
        >
          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>
        <div>
          <h4 className="font-bold text-xl mb-1">{label}</h4>
          <p className="text-xs text-primary-light uppercase tracking-widest">تسجيل صوتي</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div 
        className="h-2 bg-black/5 dark:bg-white/5 rounded-full relative cursor-pointer" 
        onClick={handleSeek}
      >
        {/* Fill - RTL logic: right to left */}
        <div 
          className="absolute top-0 right-0 h-full bg-accent rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
          style={{ width: `${progress}%` }} 
        />
        {/* Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full shadow-lg transition-all duration-100 ease-linear" 
          style={{ right: `calc(${progress}% - 8px)` }} 
        />
      </div>
      
      <div className="flex justify-between text-sm opacity-60 font-medium font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <audio 
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => onTogglePlay()} // This will trigger pause since it toggles
      />
    </div>
  );
};

export default AudioPlayer;
