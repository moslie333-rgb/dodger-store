import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Headphones, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const { data } = await supabase.from('site_content').select('*').in('page', ['home', 'common']);
      if (data) setContent(data);
    } catch (err) {
      console.error('[LandingPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
    const channel = supabase.channel('site_content_home').on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, fetchContent).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchContent]);

  const getContent = useCallback((key, fallback) => {
    const item = content.find(c => c.key === key);
    return item ? item.content : fallback;
  }, [content]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.4)]"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Floating Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            y: [0, 40, 0],
            x: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px]"
        />
      </div>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-accent/10 text-accent px-6 py-2 rounded-full font-bold text-sm mb-8 border border-accent/20"
            >
              <Shield size={16} />
              <span>{getContent('home_badge', 'وكيل معتمد · Authorized Reseller')}</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-8xl font-black mb-8 leading-[1.2] tracking-tight text-primary"
            >
              <span dangerouslySetInnerHTML={{ __html: getContent('home_hero_title', 'وجهتك الأولى لعالم <br /> الرياضة والترفيه').replace('\n', '<br />') }} />
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-primary-light max-w-3xl mx-auto mb-16 leading-relaxed"
            >
              {getContent('home_hero_desc', 'نقدم لك تجربة مشاهدة سينمائية لا مثيل لها مع تفعيل فوري ودعم متواصل يضمن لك المتعة والراحة.')}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col md:flex-row justify-center gap-6 mb-24"
            >
              <button
                onClick={() => navigate('/bein')}
                className="group relative overflow-hidden bg-[#121212] dark:bg-white text-white dark:text-[#121212] px-10 py-6 rounded-3xl font-black text-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20"
              >
                <div className="relative z-10 flex flex-col items-center">
                  <span>{getContent('home_btn_bein', 'اشتراك beIN')}</span>
                  <span className="text-sm font-normal opacity-60">beIN Sports Premium</span>
                </div>
                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.23,1,0.32,1]" />
              </button>

              <button
                onClick={() => navigate('/tod')}
                className="group relative overflow-hidden glass border-2 border-accent text-accent px-10 py-6 rounded-3xl font-black text-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-accent/10"
              >
                <div className="relative z-10 flex flex-col items-center">
                  <span>{getContent('home_btn_tod', 'اشتراك TOD')}</span>
                  <span className="text-sm font-normal opacity-60">TOD Entertainment & Sports</span>
                </div>
                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.23,1,0.32,1]" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-16 md:py-24 bg-background-secondary border-y border-black/5 dark:border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
            {[
              { icon: <Shield size={32} />, title: getContent('trust_1_title', 'خدمة موثوقة'), sub: 'Trusted Service' },
              { icon: <Zap size={32} />, title: getContent('trust_2_title', 'تفعيل سريع'), sub: 'Fast Activation' },
              { icon: <Headphones size={32} />, title: getContent('trust_3_title', 'دعم فوري'), sub: '24/7 Support' },
              { icon: <CheckCircle size={32} />, title: getContent('trust_4_title', 'ضمان الخدمة'), sub: 'Service Guarantee' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-6"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white dark:bg-[#121212] rounded-2xl flex items-center justify-center text-accent shadow-xl shadow-accent/5 border border-accent/10">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">{item.title}</h3>
                  <p className="text-sm text-primary-light uppercase tracking-widest">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Highlights */}
      <section className="py-32 px-6 bg-background-secondary/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                {getContent('home_why_title', 'لماذا تختار')} <br />
                <span className="text-accent">DODGER STORE؟</span>
              </h2>
              <ul className="space-y-6">
                {[
                  getContent('why_1', 'تفعيل اشتراكك خلال دقائق معدودة فور إتمام الدفع.'),
                  getContent('why_2', 'جميع حساباتنا أصلية ورسمية 100% لضمان تجربة بلا انقطاع.'),
                  getContent('why_3', 'دعم فني جاهز لمساعدتك في أي وقت عبر الواتساب.'),
                  getContent('why_4', 'ضمان كامل طوال فترة الاشتراك مع إمكانية الاستبدال الفوري.')
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-4 text-xl text-primary-light">
                    <div className="mt-1.5 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-1 md:order-2 relative"
            >
              <div className="w-full aspect-square bg-gradient-to-br from-accent/20 to-accent-dark/20 rounded-[60px] flex items-center justify-center p-12 overflow-hidden shadow-2xl">
                 <Shield size={200} className="text-accent/40" />
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
