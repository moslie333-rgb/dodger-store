import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';

const VideoReviewsSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const [dbVideos, setDbVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase.from('videos').select('*').order('id');
      if (error) {
        console.error('[VideoSlider] Fetch error:', error.message);
        return;
      }
      console.log('[VideoSlider] Fetched videos:', data?.length);
      if (data && data.length > 0) {
        const validVideos = data.filter(v => v.video_url && v.video_url.trim() !== '');
        setDbVideos(validVideos);
      }
    };
    fetchVideos();

    const channel = supabase.channel('videos_slider_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => fetchVideos())
      .subscribe((s) => console.log('[VideoSlider] Realtime:', s));

    return () => supabase.removeChannel(channel);
  }, []);

  const videos = dbVideos;

  // Hide the entire section if no valid videos exist
  if (videos.length === 0) {
    return null;
  }

  const nextSlide = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const prevSlide = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <section className="py-24 bg-background-secondary/50 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">تجارب عملائنا بالفيديو</h2>
          <p className="text-xl text-primary-light">آراء حقيقية من مشتركين حقيقيين</p>
        </div>

        <div className="relative max-w-[320px] md:max-w-[400px] mx-auto flex items-center justify-center">
          
          {/* Navigation - Right (Previous in RTL) */}
          <button 
            onClick={nextSlide} 
            className="absolute -right-6 md:-right-20 z-20 w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-[#1f2937] border border-black/5 dark:border-white/10 rounded-full flex items-center justify-center text-primary shadow-soft hover:shadow-premium transition-all hover:scale-105 active:scale-95"
            aria-label="التالي"
          >
            <ChevronRight size={28} />
          </button>

          {/* Slider Container - Reel Format */}
          <div className="cinematic-video-frame w-full aspect-[9/16] group">
            <div className="w-full h-full relative overflow-hidden rounded-[inherit] bg-black">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute inset-0 w-full h-full"
                >
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover cursor-pointer"
                    loop 
                    playsInline
                    preload="metadata"
                    onClick={togglePlay}
                  >
                    <source src={videos[currentIndex].video_url} type="video/mp4" />
                  </video>
                  
                  {/* Central Play Button Overlay */}
                  {!isPlaying && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10"
                      onClick={togglePlay}
                    >
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/40 hover:scale-110 transition-transform duration-300">
                        <Play size={40} fill="currentColor" className="text-white ml-2" />
                      </div>
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 text-white flex flex-col items-center text-center pointer-events-none z-20">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black mb-2 drop-shadow-md">{videos[currentIndex].title}</h3>
                      <p className="text-sm md:text-base opacity-90 font-medium">{videos[currentIndex].name} — {videos[currentIndex].role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation - Left (Next in RTL) */}
          <button 
            onClick={prevSlide} 
            className="absolute -left-6 md:-left-20 z-20 w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-[#1f2937] border border-black/5 dark:border-white/10 rounded-full flex items-center justify-center text-primary shadow-soft hover:shadow-premium transition-all hover:scale-105 active:scale-95"
            aria-label="السابق"
          >
            <ChevronLeft size={28} />
          </button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-3 mt-10">
          {videos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-500 ${currentIndex === idx ? 'w-10 bg-[#6A2B86]' : 'w-2 bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoReviewsSlider;
