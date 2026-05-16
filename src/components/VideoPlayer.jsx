import React, { useState, useMemo } from 'react';
import { Play } from 'lucide-react';

const VideoPlayer = ({ url, className }) => {
  const [isStarted, setIsStarted] = useState(false);

  // Fallback Placeholder Component (Premium Gradient)
  const Fallback = () => (
    <div className={`w-full h-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent animate-pulse" />
      <div className="w-12 h-12 border border-white/5 rounded-full flex items-center justify-center animate-pulse">
        <div className="w-1.5 h-1.5 bg-accent/20 rounded-full" />
      </div>
    </div>
  );

  // Minimal Premium Play Button Overlay
  const PlayOverlay = () => (
    <div 
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer group transition-all duration-700 hover:bg-black/10"
      onClick={(e) => {
        e.stopPropagation();
        setIsStarted(true);
      }}
    >
      <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:bg-white/20 group-hover:border-white/40 transition-all duration-500 ease-out">
        <Play size={28} fill="white" className="text-white ml-1 drop-shadow-lg" />
      </div>
    </div>
  );

  // Robust parsing using useMemo for performance
  const videoData = useMemo(() => {
    if (!url) return null;

    // YouTube logic
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return { type: 'youtube', id: ytMatch[1] };
    }

    // Vimeo logic
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return { type: 'vimeo', id: vimeoMatch[1] };
    }

    // Direct MP4
    return { type: 'direct', url: url };
  }, [url]);

  if (!videoData || !url) return <Fallback />;

  return (
    <div className={`relative overflow-hidden select-none bg-black rounded-[inherit] ${className}`}>
      {!isStarted && <PlayOverlay />}
      
      <div className="w-full h-full relative">
        {videoData.type === 'youtube' && (
          <>
            {isStarted ? (
              <iframe
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full"
                style={{ width: '177.77777778vh', height: '56.25vw', pointerEvents: 'auto' }}
                src={`https://www.youtube.com/embed/${videoData.id}?autoplay=1&mute=0&loop=1&playlist=${videoData.id}&controls=1&modestbranding=1&rel=0`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="YouTube Video"
              />
            ) : (
              <img 
                src={`https://img.youtube.com/vi/${videoData.id}/maxresdefault.jpg`} 
                className="w-full h-full object-cover opacity-60 transition-opacity duration-700" 
                alt="Thumbnail"
                onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoData.id}/0.jpg`; }}
              />
            )}
          </>
        )}

        {videoData.type === 'vimeo' && (
          <>
            {isStarted ? (
              <iframe
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full"
                style={{ width: '177.77777778vh', height: '56.25vw', pointerEvents: 'auto' }}
                src={`https://player.vimeo.com/video/${videoData.id}?autoplay=1&muted=0&loop=1&autopause=0&controls=1`}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                title="Vimeo Video"
              />
            ) : (
              <Fallback />
            )}
          </>
        )}

        {videoData.type === 'direct' && (
          <video
            className="w-full h-full object-cover"
            src={videoData.url}
            autoPlay={isStarted}
            controls={isStarted}
            loop
            muted={!isStarted}
            playsInline
            preload="metadata"
          />
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
