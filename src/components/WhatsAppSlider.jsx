import { Star } from 'lucide-react';

const WhatsAppSlider = ({ testimonials = [] }) => {
  // Duplicate array twice to ensure smooth infinite looping without gaps
  const displayItems = [...testimonials, ...testimonials];

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-24 group">
      <div 
        className="flex w-max gap-12 md:gap-16 will-change-transform group-hover:[animation-play-state:paused] py-10"
        style={{
          animation: 'marquee-rtl 40s linear infinite',
        }}
      >
        {displayItems.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-[300px] sm:w-[380px] md:w-[450px] relative group/card transition-all duration-700"
          >
            {/* Premium Glow Aura */}
            <div className={`absolute inset-10 -z-10 rounded-[40px] transition-all duration-700 blur-[60px] md:blur-[100px] 
              ${index % 2 === 0 ? 'bg-accent/10 group-hover/card:bg-accent/25' : 'bg-purple-500/10 group-hover/card:bg-purple-500/25'}
              dark:opacity-20 dark:group-hover/card:opacity-35`} 
            />

            {/* Base Card - Glassmorphism */}
            <div className="absolute inset-0 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/20 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover/card:shadow-premium" />
            
            {/* Content Layer */}
            <div 
              className={`relative -top-12 px-6 pb-6 h-auto min-h-[400px] md:min-h-[480px] transition-all duration-700 ease-out group-hover/card:-translate-y-4 group-hover/card:scale-105 ${
                index % 2 === 0 ? 'rotate-[-1deg]' : 'rotate-[1deg]'
              } group-hover/card:rotate-0`}
            >
              {item.image && !item.review_text ? (
                /* Original Image-only format (WhatsApp screenshots) */
                <div className="w-full h-[400px] md:h-[500px] relative rounded-3xl overflow-hidden bg-white dark:bg-[#1a232b] p-3 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] border border-white/50 dark:border-white/10">
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                  <img 
                    src={item.image} 
                    alt="Customer Testimonial" 
                    className="w-full h-full object-contain relative z-10"
                  />
                  <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(255,255,255,0.1)] pointer-events-none z-20" />
                </div>
              ) : (
                /* New Dynamic Review Card format */
                <div className="w-full h-full p-8 md:p-10 flex flex-col bg-white dark:bg-[#1a232b] rounded-3xl shadow-xl border border-white/50 dark:border-white/5">
                  <div className="flex items-center gap-5 mb-8">
                    {item.customer_image ? (
                      <img src={item.customer_image} className="w-16 h-16 rounded-full object-cover border-2 border-accent/20" alt={item.customer_name} loading="lazy" />
                    ) : (
                      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent font-black text-2xl shadow-inner border border-accent/20">
                        {item.customer_name?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-2xl text-primary">{item.customer_name || 'عميل محترم'}</h4>
                      <div className="flex gap-1 mt-2 text-accent">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < (item.rating || 5) ? "currentColor" : "none"} strokeWidth={2} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-background-secondary dark:bg-white/5 p-8 rounded-3xl rounded-tr-none text-right relative shadow-inner border border-black/5 dark:border-white/5 flex-grow flex items-center">
                    <p className="text-primary text-xl whitespace-normal leading-relaxed font-medium italic">
                      " {item.review_text || item.text} "
                    </p>
                  </div>
                  <div className="mt-8 flex items-center justify-between opacity-50">
                    <span className="text-sm font-bold tracking-tighter">VERIFIED CUSTOMER</span>
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                      <Star size={14} fill="currentColor" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Gradient Overlays for smooth edges */}
      <div className="absolute top-0 left-0 w-20 md:w-40 h-full bg-gradient-to-r from-background to-transparent z-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-20 md:w-40 h-full bg-gradient-to-l from-background to-transparent z-30 pointer-events-none" />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-rtl {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(50%, 0, 0); }
        }
      `}} />
    </div>
  );
};

export default WhatsAppSlider;
