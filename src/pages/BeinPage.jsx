import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Tv, Trophy, Zap, MessageCircle, Check, Box, RefreshCw, Info, HelpCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQAccordion from '../components/FAQAccordion';
import VideoReviewsSlider from '../components/VideoReviewsSlider';
import VideoPlayer from '../components/VideoPlayer';

// Memoized Pricing Card for performance
const PricingCard = memo(({ plan, type, getContent }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`card-premium p-10 flex flex-col ${plan.is_popular ? 'bg-[#6A2B86] text-white border-purple-500/30' : 'bg-white dark:bg-[#121212]'} relative group h-full`}
  >
    {plan.is_popular && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest shadow-xl">
        {getContent('bein_popular_badge', 'الأكثر طلباً')}
      </div>
    )}

    <div className="mb-10">
      <h3 className="text-2xl md:text-3xl font-black mb-3">{plan.name}</h3>
      <p className={`opacity-70 text-lg ${plan.is_popular ? 'text-white' : 'text-primary-light'}`}>
        {type === 'new' ? getContent('bein_new_subtitle', 'جهاز جديد + باقة') : getContent('bein_renewal_subtitle', 'تجديد باقة سارية')}
      </p>
    </div>

    <div className={`rounded-3xl p-8 mb-10 flex-grow ${plan.is_popular ? 'bg-white/10' : 'bg-background-secondary dark:bg-white/5'}`}>
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

    <a href="https://wa.me/96898911606" className={`btn-premium w-full text-xl py-6 ${plan.is_popular ? 'bg-white text-[#6A2B86]' : 'bg-[#6A2B86] text-white'}`}>
      {getContent('bein_card_btn', 'تواصل للاشتراك')}
    </a>
  </motion.div>
));

const BeinPage = () => {
  const [data, setData] = useState({ plans: [], content: [], videoUrl: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [plansRes, videoRes, contentPageRes, contentCommonRes] = await Promise.all([
        supabase.from('pricing_plans').select('*').order('group_order', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('site_videos').select('video_url').eq('page_name', 'bein').single(),
        supabase.from('site_content').select('*').eq('page', 'bein'),
        supabase.from('site_content').select('*').eq('page', 'common')
      ]);

      setData({
        plans: plansRes.data || [],
        videoUrl: videoRes.data?.video_url || '',
        content: [...(contentPageRes.data || []), ...(contentCommonRes.data || [])]
      });
    } catch (err) {
      console.error('[BeinPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('bein_cms_updates').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const groupedPlans = useMemo(() => {
    const newPlans = data.plans.filter(p => p.category === 'BEIN_NEW');

    // Build a map: plan_name -> card object, preserving sort_order
    const planMap = {};
    newPlans.forEach(p => {
      if (!planMap[p.plan_name]) {
        planMap[p.plan_name] = {
          id: p.id,
          name: p.plan_name,
          sort_order: p.sort_order ?? 999,
          is_popular: false,
          prices: []
        };
      }
      planMap[p.plan_name].is_popular = planMap[p.plan_name].is_popular || !!p.highlighted;
      planMap[p.plan_name].prices.push({ label: p.duration, price: p.price, old_price: p.old_price, sort_order: p.sort_order ?? 999 });
    });

    // Sort prices within each card by sort_order, then by duration if sort_order is the same
    Object.values(planMap).forEach(card => {
      card.prices.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        const getMonths = (label) => {
          if (!label) return 999;
          const clean = label.trim().toUpperCase();
          if (/سنة|YEAR/.test(clean)) return 12;
          if (/شهر|شهور|أشهر|MONTH/.test(clean)) {
            const m = clean.match(/(\d+)/);
            return m ? parseInt(m[1], 10) : 1;
          }
          const m = clean.match(/(\d+)/);
          return m ? parseInt(m[1], 10) : 999;
        };
        return getMonths(a.label) - getMonths(b.label);
      });
    });

    const allCards = Object.values(planMap).sort((a, b) => a.sort_order - b.sort_order);

    // Split into ULTIMATE and PREMIUM groups by plan_name keyword
    const ultimate = allCards.filter(c => c.name.toUpperCase().includes('ULTIMATE'));
    const premium  = allCards.filter(c => c.name.toUpperCase().includes('PREMIUM'));
    // Fallback: any card that doesn't match either goes to premium
    const other    = allCards.filter(c => !c.name.toUpperCase().includes('ULTIMATE') && !c.name.toUpperCase().includes('PREMIUM'));

    // Sort each group by duration: 3 months → 6 months → 1 year
    const getDurationMonths = (name) => {
      const n = name.toUpperCase();
      if (/1\s*YEAR|\bYEAR\b|سنة/.test(n)) return 12;
      const m = n.match(/(\d+)\s*(MONTH|شهر|أشهر)/);
      if (m) return parseInt(m[1], 10);
      const num = n.match(/\d+/);
      return num ? parseInt(num[0], 10) : 999;
    };
    ultimate.sort((a, b) => getDurationMonths(a.name) - getDurationMonths(b.name));
    premium.sort((a, b)  => getDurationMonths(a.name) - getDurationMonths(b.name));
    other.sort((a, b)    => getDurationMonths(a.name) - getDurationMonths(b.name));

    const renewalPlans = data.plans.filter(p => p.category === 'BEIN_RENEWAL');
    const groupedRenewal = Array.from(new Set(renewalPlans.map(p => p.plan_name))).map(name => {
      const items = renewalPlans.filter(p => p.plan_name === name);
      return { id: items[0].id, name: name, is_popular: items.some(p => p.highlighted), prices: items.map(p => ({ label: p.duration, price: p.price, old_price: p.old_price })) };
    });

    return { ultimate, premium: [...premium, ...other], renewal: groupedRenewal };
  }, [data.plans]);

  const { ultimate: beinUltimatePlans, premium: beinPremiumPlans, renewal: beinRenewalPlans } = groupedPlans;

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
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-background text-primary overflow-hidden glow-bein">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 md:pt-48 pb-20 px-6 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <h1 className="text-4xl md:text-7xl font-black mb-8 leading-tight">
                <span dangerouslySetInnerHTML={{ __html: getContent('bein_hero_title', 'اشتراك <span className="text-[#6A2B86] text-glow">beIN</span> <br /> بوابتك لعالم الرياضة').replace('\n', '<br />') }} />
              </h1>
              <p className="text-lg md:text-2xl text-primary-light mb-12 leading-relaxed">
                {getContent('bein_hero_desc', 'شاهد الدوري الإنجليزي، دوري أبطال أوروبا، وجميع البطولات الكبرى بدقة عالية مع اشتراك رسمي وتفعيل فوري.')}
              </p>
              <motion.div variants={fadeInUp}>
                <a href="https://wa.me/96898911606" className="btn-premium bg-[#6A2B86] text-white text-xl shadow-2xl shadow-purple-500/20 hover:scale-105 active:scale-95">
                  {getContent('bein_cta_btn', 'تواصل معنا للاشتراك')}
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
                    url={data.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-31422-large.mp4"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[inherit] pointer-events-none" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-background-secondary">
        <div className="container mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-glow">{getContent('bein_features_title', 'ماذا ستحصل مع beIN؟')}</h2>
          <p className="text-xl text-primary-light max-w-2xl mx-auto">{getContent('bein_features_desc', 'تغطية رياضية حصرية وشاملة لأكبر الأحداث العالمية في مكان واحد.')}</p>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { icon: <Trophy />, title: getContent('bein_f1_title', 'بطولات حصرية'), desc: getContent('bein_f1_desc', 'دوري أبطال أوروبا، الدوري الإنجليزي، الإسباني وغيرها الكثير.') },
            { icon: <Tv />, title: getContent('bein_f2_title', 'قنوات ترفيهية'), desc: getContent('bein_f2_desc', 'مجموعة واسعة من القنوات الترفيهية، الأفلام، والبرامج الوثائقية.') },
            { icon: <Zap />, title: getContent('bein_f3_title', 'تغطية 24/7'), desc: getContent('bein_f3_desc', 'تحليلات رياضية، برامج مباشرة، وتغطية مستمرة على مدار الساعة.') },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="group p-10 card-premium flex flex-col items-center text-center h-[450px] justify-center"
            >
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center text-[#6A2B86] mb-8 group-hover:bg-[#6A2B86] group-hover:text-white transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="text-3xl font-black mb-6">{feature.title}</h3>
              <p className="text-xl text-primary-light leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 1 — شراء الجهاز + الاشتراك */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-6">

          {/* Section Title */}
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 bg-[#6A2B86]/10 rounded-xl flex items-center justify-center text-[#6A2B86]">
              <Box size={28} />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-glow">{getContent('bein_new_title', 'اشتراك beIN + الجهاز')}</h2>
          </div>

          {/* ULTIMATE Group */}
          {beinUltimatePlans.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-2 h-8 rounded-full bg-accent inline-block" />
                <h3 className="text-2xl md:text-3xl font-black text-accent tracking-wide">ULTIMATE</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {beinUltimatePlans.map((plan, index) => (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className={`card-premium p-10 flex flex-col ${plan.is_popular ? 'border-2 border-[#6A2B86]/20 shadow-2xl relative overflow-hidden' : ''}`}>
                    {plan.is_popular && (
                      <div className="absolute top-4 left-4 bg-[#6A2B86] text-white px-4 py-1 rounded-full text-sm font-bold">{getContent('bein_popular_badge', 'الأكثر طلباً')}</div>
                    )}
                    <h3 className="text-2xl font-black mb-8 p-4 bg-[#6A2B86]/5 rounded-2xl text-center">{plan.name}</h3>
                    <div className="space-y-4 mb-12 flex-grow">
                      {(plan.prices || []).map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                          <span className="opacity-70 text-xl">{item.label}</span>
                          <div className="flex flex-col text-left">
                            {item.old_price && <span className="text-sm line-through opacity-50">{item.old_price}</span>}
                            <span className="font-bold text-[#6A2B86] text-glow text-2xl">{item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <a href="https://wa.me/96898911606" className={`btn-premium bg-[#6A2B86] text-white w-full text-xl hover:scale-105 ${plan.is_popular ? 'shadow-xl shadow-[#6A2B86]/20' : ''}`}>
                      {getContent('bein_new_btn', 'اشترك الآن')}
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* PREMIUM Group */}
          {beinPremiumPlans.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-2 h-8 rounded-full bg-[#6A2B86] inline-block" />
                <h3 className="text-2xl md:text-3xl font-black text-[#6A2B86] tracking-wide">PREMIUM</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {beinPremiumPlans.map((plan, index) => (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className={`card-premium p-10 flex flex-col ${plan.is_popular ? 'border-2 border-[#6A2B86]/20 shadow-2xl relative overflow-hidden' : ''}`}>
                    {plan.is_popular && (
                      <div className="absolute top-4 left-4 bg-[#6A2B86] text-white px-4 py-1 rounded-full text-sm font-bold">{getContent('bein_popular_badge', 'الأكثر طلباً')}</div>
                    )}
                    <h3 className="text-2xl font-black mb-8 p-4 bg-[#6A2B86]/5 rounded-2xl text-center">{plan.name}</h3>
                    <div className="space-y-4 mb-12 flex-grow">
                      {(plan.prices || []).map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                          <span className="opacity-70 text-xl">{item.label}</span>
                          <div className="flex flex-col text-left">
                            {item.old_price && <span className="text-sm line-through opacity-50">{item.old_price}</span>}
                            <span className="font-bold text-[#6A2B86] text-glow text-2xl">{item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <a href="https://wa.me/96898911606" className={`btn-premium bg-[#6A2B86] text-white w-full text-xl hover:scale-105 ${plan.is_popular ? 'shadow-xl shadow-[#6A2B86]/20' : ''}`}>
                      {getContent('bein_new_btn', 'اشترك الآن')}
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* SECTION 2 — تجديد الاشتراك */}
      <section className="py-24 md:py-32 bg-background-secondary">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <RefreshCw size={28} />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-glow">{getContent('bein_renewal_title', 'أسعار تجديد الاشتراك')}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {beinRenewalPlans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-[#121212] rounded-[40px] p-8 md:p-12 shadow-xl border border-black/5 flex flex-col justify-between">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                   <div className="w-2 h-8 rounded-full bg-[#6A2B86]" />
                   <span className="text-glow">{plan.name}</span>
                </h3>
                <div className="space-y-4">
                  {(plan.prices || []).map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-6 bg-background-secondary dark:bg-white/5 rounded-2xl">
                      <span className="text-xl font-bold">{item.label}</span>
                      <div className="flex flex-col text-left">
                        {item.old_price && <span className="text-sm line-through opacity-50">{item.old_price}</span>}
                        <span className="text-3xl font-black text-glow text-[#6A2B86]">{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-3 text-xl font-bold text-green-600 dark:text-green-400">
             <Check className="w-8 h-8 p-1 bg-green-500/10 rounded-full" />
             <span>{getContent('bein_renewal_note', 'التجديد يتم بدون الحاجة لشراء جهاز')}</span>
          </div>
        </div>
      </section>

      {/* SECTION 3 — الفرق بين الباقات */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <div className="flex flex-col items-center gap-4 mb-20">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-4">
              <Info size={32} />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-glow">{getContent('bein_compare_title', 'الفرق بين باقات beIN')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
             <div className="card-premium p-12 text-right">
                <h3 className="text-3xl font-black mb-8 border-r-4 border-[#6A2B86] pr-4">Premium</h3>
                <ul className="space-y-6 text-xl">
                  {[getContent('bein_comp_1', 'جميع القنوات الرياضية والترفيهية'), getContent('bein_comp_2', 'لا تشمل قناة 4K'), getContent('bein_comp_3', 'يمكن إضافة بطولات إضافية')].map((t, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="text-[#6A2B86] mt-1 flex-shrink-0" size={24} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
             </div>

             <div className="card-premium p-12 text-right relative border-2 border-accent shadow-2xl">
                <div className="absolute top-6 left-6 bg-accent text-white px-6 py-2 rounded-full font-bold text-sm">{getContent('bein_best_badge', 'الأفضل')}</div>
                <h3 className="text-3xl font-black mb-8 border-r-4 border-accent pr-4 text-accent">Ultimate</h3>
                <ul className="space-y-6 text-xl">
                  {[getContent('bein_comp_4', 'جميع القنوات الرياضية والترفيهية'), getContent('bein_comp_5', 'تشمل قناة 4K'), getContent('bein_comp_6', 'تشمل البطولات القارية'), getContent('bein_comp_7', 'أفضل تجربة مشاهدة')].map((t, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="text-accent mt-1 flex-shrink-0" size={24} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
             </div>
          </div>
        </div>
      </section>

      {/* Video Reviews Slider */}
      <VideoReviewsSlider />

      {/* SECTION 4 — FAQ Section */}
      <section className="py-32 bg-background px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-4 text-center mb-20">
             <div className="w-16 h-16 bg-[#6A2B86]/10 rounded-full flex items-center justify-center text-[#6A2B86] mb-4">
                <HelpCircle size={32} />
             </div>
             <h2 className="text-4xl md:text-6xl font-black">{getContent('bein_faq_title', 'الأسئلة الشائعة حول beIN')}</h2>
          </div>
          
          <FAQAccordion faqs={[
            { question: 'هل الاشتراك رسمي؟', answerAr: 'نعم، الاشتراك رسمي وموثّق ويعمل عبر الأقمار الصناعية لضمان استقرار البث.', answerEn: 'Yes, the subscription is official and works via satellite for stability.' },
            { question: 'هل أحتاج إنترنت؟', answerAr: 'لا، الجهاز يعمل بدون إنترنت عبر طبق الاستقبال (الدش).', answerEn: 'No, the device works via satellite dish without internet.' },
            { question: 'كم يستغرق التفعيل؟', answerAr: 'غالبًا يتم التفعيل بشكل فوري بعد إتمام عملية الدفع والتأكد من بيانات البطاقة.', answerEn: 'Activation is usually instant after payment and card verification.' },
            { question: 'هل يمكن التجديد من أي مكان؟', answerAr: 'نعم، يمكن التجديد باستخدام رقم البطاقة فقط وبسرعة فائقة من أي دولة.', answerEn: 'Yes, renewal is done quickly using only the card number from any country.' },
            { question: 'هل الأجهزة العربية مختلفة؟', answerAr: 'لا يوجد فرق في الجودة أو القنوات، الفرق فقط في سعر التجديد حسب الدولة المخصصة لها.', answerEn: 'There is no difference in quality or channels, only in renewal price per country.' },
          ]} />

          <div className="mt-16 flex flex-col items-center text-center gap-12 bg-background-secondary p-12 rounded-[50px] border border-black/5 shadow-2xl">
             <div className="text-2xl font-black text-primary">
                {getContent('bein_save_note', '✔️ نوفر أفضل سعر تجديد يصل إلى أقل بنسبة 65%')}
             </div>
             <div className="space-y-6">
                <h3 className="text-3xl md:text-4xl font-black text-[#6A2B86]">{getContent('bein_footer_cta', '📩 للتفعيل والتفاصيل تواصل معنا الآن')}</h3>
                <a href="https://wa.me/96898911606" className="btn-premium bg-[#25D366] text-white px-12 py-6 text-2xl hover:scale-105 shadow-xl shadow-green-500/20">
                   <MessageCircle className="mr-2" />
                   <span>{getContent('whatsapp_btn_text', 'تواصل عبر واتساب')}</span>
                </a>
             </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BeinPage;
