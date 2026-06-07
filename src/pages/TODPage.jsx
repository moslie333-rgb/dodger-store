import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Tv, Trophy, Zap, Headphones, Check, Crown, Play, Star, Smartphone, Laptop, Tablet, Gamepad2, CheckCircle, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQAccordion from '../components/FAQAccordion';
import WhatsAppSlider from '../components/WhatsAppSlider';
import AudioPlayer from '../components/AudioPlayer';
import VideoPlayer from '../components/VideoPlayer';
import voice1 from '../../asset/فويس/فويس 1.mp3';
import voice2 from '../../asset/فويس/فويس 2.mp3';
import voice3 from '../../asset/فويس/فويس 3.mp3';
import chat1 from '../../asset/الراي في تود/WhatsApp Image 2026-05-15 at 3.03.10 PM.jpeg';
import chat2 from '../../asset/الراي في تود/WhatsApp Image 2026-05-15 at 3.04.51 PM.jpeg';
import chat3 from '../../asset/الراي في تود/WhatsApp Image 2026-05-15 at 3.06.36 PM.jpeg';
import chat4 from '../../asset/الراي في تود/WhatsApp Image 2026-05-15 at 3.08.12 PM.jpeg';

// Memoized Card for performance
const TODPricingCard = memo(({ plan, getContent }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`card-premium p-8 md:p-10 flex flex-col ${plan.is_popular ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-[#121212]'} relative group h-full`}
  >
    {plan.is_popular && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest shadow-xl flex items-center gap-2">
        <Crown size={14} />
        {getContent('tod_popular_badge', 'الأكثر مبيعاً')}
      </div>
    )}

    <div className="mb-8">
      <h3 className="text-2xl md:text-3xl font-black mb-3">{plan.name}</h3>
      <p className={`opacity-70 text-lg ${plan.is_popular ? 'text-white' : 'text-primary-light'}`}>
        {getContent('tod_plan_subtitle', 'مشاهدة غير محدودة')}
      </p>
    </div>

    <div className={`rounded-3xl p-6 md:p-8 mb-8 flex-grow ${plan.is_popular ? 'bg-white/10' : 'bg-background-secondary dark:bg-white/5'}`}>
      <div className="space-y-6">
        {plan.prices.map((price, i) => (
          <div key={i} className="flex justify-between items-center border-b border-white/10 pb-6 last:border-0 last:pb-0">
            <div className="flex flex-col">
              <span className="opacity-60 text-sm mb-1">{price.label}</span>
              <span className="font-bold text-2xl">{price.price}</span>
            </div>
            {price.old_price && (
              <span className="text-lg opacity-40 line-through">{price.old_price}</span>
            )}
          </div>
        ))}
      </div>
    </div>

    <a href="https://wa.me/96898911606" className={`btn-premium w-full text-xl py-6 ${plan.is_popular ? 'bg-white text-accent' : 'bg-accent text-white'}`}>
      {getContent('tod_card_btn', 'اشترك الآن')}
    </a>
  </motion.div>
));

const TODPage = () => {
  const [data, setData] = useState({ plans: [], content: [], videoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const fetchData = async () => {
    try {
      const [plansRes, videoRes, contentPageRes, contentCommonRes] = await Promise.all([
        supabase.from('pricing_plans').select('*').order('group_order', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('site_videos').select('video_url').eq('page_name', 'tod').single(),
        supabase.from('site_content').select('*').eq('page', 'tod'),
        supabase.from('site_content').select('*').eq('page', 'common')
      ]);

      setData({
        plans: plansRes.data || [],
        videoUrl: videoRes.data?.video_url || '',
        content: [...(contentPageRes.data || []), ...(contentCommonRes.data || [])]
      });
    } catch (err) {
      console.error('[TODPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('tod_cms_updates').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const plans = useMemo(() => ({
    mobile: data.plans.filter(p => p.category === 'TOD_MOBILE'),
    premium: data.plans.filter(p => p.category === 'TOD_PREMIUM'),
    standard: data.plans.filter(p => p.category === 'TOD_STANDARD')
  }), [data.plans]);

  const audioReviews = useMemo(() => [
    { id: 1, src: voice1, label: 'رأي العميل 1' },
    { id: 2, src: voice2, label: 'رأي العميل 2' },
    { id: 3, src: voice3, label: 'رأي العميل 3' },
  ], []);

  const groupedPlans = useMemo(() => {
    const todPlans = data.plans.filter(p => p.category === 'TOD');
    if (todPlans.length === 0) return [];
    return Array.from(new Set(todPlans.map(p => p.plan_name))).map(name => {
      const items = todPlans.filter(p => p.plan_name === name);
      return { id: items[0].id, name: name, is_popular: items.some(p => p.highlighted), prices: items.map(p => ({ label: p.duration, price: p.price, old_price: p.old_price })) };
    });
  }, [data.plans]);

  const getContent = useCallback((key, fallback) => {
    const item = data.content.find(c => c.key === key);
    return item ? item.content : fallback;
  }, [data.content]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.4)]"></div>
      </div>
    );
  }

  return (
    <div className="bg-background text-primary overflow-hidden glow-tod">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 md:pt-48 pb-20 px-6 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-accent/10 text-accent px-6 py-2 rounded-full font-bold text-sm mb-8 border border-accent/20 uppercase tracking-widest">
                <Star size={14} fill="currentColor" />
                {getContent('tod_hero_badge', 'اشتراك رسمي · Official Reseller')}
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-4xl md:text-7xl font-black mb-8 leading-tight">
                <span dangerouslySetInnerHTML={{ __html: getContent('tod_hero_title', 'اشتراك <span className="text-accent text-glow">TOD</span> <br /> الرسمي والمضمون').replace('\n', '<br />') }} />
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-primary-light mb-12 leading-relaxed">
                {getContent('tod_hero_desc', 'استمتع بمشاهدة أقوى البطولات الرياضية الحصرية، أحدث الأفلام والمسلسلات، وبجودة تصل إلى 4K على جميع أجهزتك.')}
              </motion.p>
              <motion.div variants={fadeInUp}>
                <a href="https://wa.me/96898911606" className="btn-premium bg-accent text-white text-xl shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95">
                  {getContent('tod_cta_btn', 'اشترك الآن عبر واتساب')}
                </a>
              </motion.div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 1 }} 
              className="relative flex justify-center"
            >
              <div className="cinematic-video-frame w-full max-w-[280px] md:max-w-[320px] aspect-[9/16] group flex-shrink-0 mx-auto">
                <div className="w-full h-full relative overflow-hidden rounded-[inherit] bg-black">
                  <VideoPlayer 
                    url={data.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-sport-video-of-a-soccer-player-kicking-a-ball-32943-large.mp4"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[inherit] pointer-events-none" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-24 md:py-32 bg-background-secondary">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {groupedPlans.map((plan) => (
            <TODPricingCard key={plan.id} plan={plan} getContent={getContent} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-glow">{getContent('tod_features_title', 'مزايا الاشتراك معنا')}</h2>
          <p className="text-xl text-primary-light max-w-2xl mx-auto">{getContent('tod_features_desc', 'نقدم لك أكثر من مجرد اشتراك، نقدم لك تجربة متكاملة.')}</p>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {[
            { icon: <Tv />, title: getContent('tod_f1_title', 'مشاهدة بدون تقطيع'), desc: getContent('tod_f1_desc', 'استمتع ببث مباشر بجودة عالية بدون تقطيع أو تأخير في أهم المباريات.') },
            { icon: <Trophy />, title: getContent('tod_f2_title', 'مباريات حصرية'), desc: getContent('tod_f2_desc', 'تابع أهم البطولات العالمية والمباريات الحصرية أول بأول.') },
            { icon: <Headphones />, title: getContent('tod_f3_title', 'دعم فني سريع'), desc: getContent('tod_f3_desc', 'خدمة دعم متاحة لمساعدتك في أي وقت لضمان أفضل تجربة مشاهدة.') },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial="visible"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="group p-8 md:p-10 card-premium flex flex-col items-center text-center md:h-[450px] justify-center"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-8 group-hover:bg-accent group-hover:text-white transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-6">{feature.title}</h3>
              <p className="text-lg md:text-xl text-primary-light leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 md:py-32 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-glow">{getContent('tod_pricing_title', 'خطط اشتراك TOD الرسمية')}</h2>
            <p className="text-xl text-primary-light max-w-2xl mx-auto font-medium">{getContent('tod_pricing_desc', 'استمتع بأقوى البطولات بجودة ممتازة ودعم متواصل')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-stretch max-w-7xl mx-auto mb-20">
            {/* PLAN 1 — TOD Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card-premium p-10 flex flex-col bg-white dark:bg-[#121212] border-black/5 dark:border-white/5 group"
            >
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2">TOD Mobile 📱</h3>
                <p className="text-primary-light">{getContent('tod_p1_subtitle', 'مناسبة للاستخدام الشخصي')}</p>
              </div>

              <div className="bg-background-secondary dark:bg-white/5 rounded-3xl p-6 mb-8 flex-grow">
                <div className="space-y-4">
                  {plans.mobile.map((row, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                      <span className="opacity-70 text-lg">{row.duration}</span>
                      <span className="font-bold text-xl">{row.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a href="https://wa.me/96898911606" className="btn-premium bg-[#121212] dark:bg-white text-white dark:text-[#121212] w-full text-xl hover:scale-105">
                {getContent('tod_p1_btn', 'اشترك الآن')}
              </a>
            </motion.div>

            {/* PLAN 2 — TOD Premium (Center & Highlighted) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card-premium p-10 flex flex-col bg-[#121212] dark:bg-white text-white dark:text-[#121212] relative lg:scale-105 z-10 border-2 border-accent shadow-[0_0_30px_rgba(212,175,55,0.15)] group"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest whitespace-nowrap shadow-xl">
                {getContent('tod_p2_badge', 'الأكثر طلباً')}
              </div>

              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-accent text-white group-hover:scale-110 transition-transform">
                  <Crown size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2 text-glow">TOD Premium 👑</h3>
                <p className="opacity-80">{getContent('tod_p2_subtitle', 'باقة النخبة والحسابات الكاملة')}</p>
              </div>

              <div className="bg-white/10 dark:bg-black/5 border border-white/10 dark:border-black/10 rounded-3xl p-6 mb-8 flex-grow">
                <div className="space-y-4 mb-4">
                   {(plans.premium[0]?.features ? plans.premium[0].features.split(' | ') : ['حسابين كاملين', 'مشاهدة على جهازين بنفس الوقت', 'ضمان ذهبي + دعم فني']).map((feat, i) => (
                     <div key={i} className="flex items-center gap-2 text-sm">
                       <CheckCircle size={16} className="text-accent" />
                       <span>{feat}</span>
                     </div>
                   ))}
                </div>
                <div className="text-center py-4 border-t border-white/10 mt-4">
                  <div className="text-sm opacity-60 mb-2 font-bold">{getContent('tod_p2_price_label', 'السعر السنوي')}</div>
                  <div className="text-5xl font-black text-accent text-glow">{plans.premium[0]?.price || '34 ر.ع'}</div>
                </div>
              </div>

              <a href="https://wa.me/96898911606" className="btn-premium bg-accent text-white w-full text-xl hover:scale-105 shadow-xl shadow-accent/20">
                {getContent('tod_p2_btn', 'احصل على Premium')}
              </a>
            </motion.div>

            {/* PLAN 3 — TOD العادية */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card-premium p-10 flex flex-col bg-white dark:bg-[#121212] border-black/5 dark:border-white/5 group"
            >
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                  <Tv size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2">TOD العادية 📺</h3>
                <p className="text-primary-light">{getContent('tod_p3_subtitle', 'مناسبة للاستخدام المنزلي')}</p>
              </div>

              <div className="bg-background-secondary dark:bg-white/5 rounded-3xl p-6 mb-8 flex-grow">
                <div className="space-y-4">
                  {plans.standard.map((row, i) => (
                    <div key={i} className={`flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4 last:border-0 last:pb-0 ${row.highlighted ? 'text-accent font-black' : ''}`}>
                      <span className="opacity-70 text-lg">{row.duration}</span>
                      <span className="font-bold text-xl">{row.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a href="https://wa.me/96898911606" className="btn-premium bg-[#121212] dark:bg-white text-white dark:text-[#121212] w-full text-xl hover:scale-105">
                {getContent('tod_p3_btn', 'ابدأ الاشتراك')}
              </a>
            </motion.div>

            {/* PLAN 4 — World Cup + 1 Year Entertainment Package */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card-premium p-10 flex flex-col bg-white dark:bg-[#121212] border-black/5 dark:border-white/5 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest whitespace-nowrap shadow-xl">
                عرض لفترة محدودة
              </div>

              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                  <Trophy size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <span>باقة كأس العالم + سنة ترفيه</span>
                  <span>🏆</span>
                </h3>
                <p className="text-primary-light">World Cup + 1 Year Entertainment</p>
              </div>

              <div className="bg-background-secondary dark:bg-white/5 rounded-3xl p-6 mb-8 flex-grow flex flex-col justify-between">
                <div className="space-y-4 mb-4">
                  {[
                    'مشاهدة بطولة كأس العالم FIFA',
                    'اشتراك ترفيهي كامل لمدة سنة',
                    'تسجيل حتى 5 أجهزة',
                    'مشاهدة متزامنة على جهازين',
                    'تفعيل رسمي عبر إيميلك أو رقمك',
                    'يتم إرسال قسيمة للتفعيل الذاتي'
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-accent flex-shrink-0" />
                      <span className="opacity-90">{feat}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center py-4 border-t border-black/5 dark:border-white/10 mt-auto">
                  <div className="text-sm opacity-60 mb-2 font-bold">السعر</div>
                  <div className="text-5xl font-black text-accent text-glow">25 SAR</div>
                </div>
              </div>

              <a 
                href="https://wa.me/96898911606?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Dodger%20Store%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D8%A8%D9%80%3A%0A%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9%3A%20%D8%A8%D8%A7%D9%82%D8%A9%20%D9%83%D8%A3%D8%B3%20%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85%20%2B%20%D8%B3%D9%86%D8%A9%20%D8%AA%D8%B1%D9%81%D9%8A%D9%87%20%F0%9F%8F%86%0A%D8%A7%D9%84%D8%B3%D8%B5%D8%B1%3A%2025%20SAR" 
                className="btn-premium bg-[#121212] dark:bg-white text-white dark:text-[#121212] w-full text-xl hover:scale-105"
              >
                تواصل للاشتراك
              </a>
            </motion.div>
          </div>

          {/* Global CTA */}
          <div className="text-center mt-20">
             <div className="inline-flex flex-col items-center gap-8 bg-background-secondary dark:bg-[#121212] p-10 md:p-16 rounded-[40px] md:rounded-[60px] border border-black/5 dark:border-white/5 w-full max-w-4xl shadow-2xl">
                <h3 className="text-2xl md:text-4xl font-black text-black dark:text-white text-glow drop-shadow-sm">{getContent('tod_footer_cta', '📩 للتفعيل والتفاصيل تواصل معنا الآن')}</h3>
                <a href="https://wa.me/96898911606" className="btn-premium bg-[#25D366] text-white px-12 py-6 text-2xl hover:scale-105 shadow-xl shadow-green-500/20">
                   <MessageCircle className="mr-2" />
                   <span>{getContent('whatsapp_btn_text', 'تواصل عبر واتساب')}</span>
                </a>
             </div>
          </div>
        </div>
      </section>

      {/* Audio Testimonials */}
      <section className="py-32 bg-background-secondary">
        <div className="container mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-glow">آراء عملائنا الصوتية</h2>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {audioReviews.map((audio) => (
            <motion.div
              key={audio.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <AudioPlayer 
                src={audio.src} 
                label={audio.label} 
                isPlaying={playingAudioId === audio.id}
                onTogglePlay={() => setPlayingAudioId(playingAudioId === audio.id ? null : audio.id)}
              />
            </motion.div>
          ))}
        </div>
      </section>



      {/* WhatsApp Testimonials Slider */}
      <section className="py-32 bg-background-secondary overflow-hidden">
        <div className="container mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-glow">محادثات عملائنا</h2>
        </div>
        <WhatsAppSlider testimonials={[
          { image: chat1 },
          { image: chat2 },
          { image: chat3 },
          { image: chat4 },
        ]} />
      </section>



      {/* FAQ Section */}
      <section className="py-32 bg-background-secondary px-6">
        <div className="container mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-glow">الأسئلة الشائعة</h2>
        </div>
        <FAQAccordion faqs={[
          { question: 'هل الاشتراك رسمي؟', answerAr: 'نعم، جميع اشتراكاتنا رسمية ومضمونة 100% طوال فترة الاشتراك.', answerEn: 'Yes, all our subscriptions are 100% official and guaranteed.' },
          { question: 'كم يستغرق وقت التفعيل؟', answerAr: 'التفعيل فوري، عادة ما يستغرق من 5 إلى 15 دقيقة بعد تأكيد الطلب.', answerEn: 'Activation is instant, usually 5-15 minutes after confirmation.' },
          { question: 'ما هي طرق الدفع المتاحة؟', answerAr: 'نوفر عدة طرق دفع آمنة لتناسب جميع العملاء في المنطقة.', answerEn: 'We provide several secure payment methods to suit all customers.' },
        ]} />
      </section>

      <Footer />
    </div>
  );
};

export default TODPage;
