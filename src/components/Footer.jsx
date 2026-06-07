import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Camera, SendHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../context/CurrencyContext';
import logo from '../assets/logo.png';

const Footer = () => {
  const [content, setContent] = useState([]);
  const { getGeneralWhatsAppLink } = useCurrency();

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase.from('site_content').select('*').eq('page', 'common');
      setContent(data || []);
    };
    fetchContent();

    const channel = supabase.channel('footer_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, fetchContent)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getContent = (key, fallback) => {
    const item = content.find(c => c.key === key);
    return item ? item.content : fallback;
  };

  return (
    <footer className="bg-background-secondary py-20 border-t border-black/5 dark:border-white/5">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-8 group">
            <img 
              src={logo} 
              alt="DODGER STORE" 
              className="h-16 md:h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
          </Link>
          
          <p className="text-xl text-primary-light max-w-lg mb-12 leading-relaxed">
            {getContent('footer_desc', 'وجهتك الموثوقة لاشتراكات TOD و beIN الرسمية. نضمن لك جودة المشاهدة وخدمة متميزة على مدار الساعة.')}
          </p>

          <div className="flex gap-6 mb-12">
            {[
              { icon: <MessageCircle size={24} />, link: getGeneralWhatsAppLink() },
              { icon: <Camera size={24} />, link: '#' },
              { icon: <SendHorizontal size={24} />, link: '#' },
            ].map((social, i) => (
              <a
                key={i}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-full glass flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all duration-300 shadow-lg"
              >
                {social.icon}
              </a>
            ))}
          </div>

          <div className="w-full h-px bg-black/5 dark:bg-white/5 mb-8" />

          <p className="text-primary-light font-medium">
            &copy; {new Date().getFullYear()} DODGER STORE. جميع الحقوق محفوظة.
          </p>

          <a 
            href="#" 
            className="mt-6 text-sm text-primary-light/50 hover:text-accent transition-colors duration-300 font-light tracking-wide"
          >
            Designed & Developed by <span className="font-medium">Mohamed Aly</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
