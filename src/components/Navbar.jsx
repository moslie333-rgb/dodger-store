import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../context/CurrencyContext';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('dodger_theme') || 'light');
  const [content, setContent] = useState([]);
  const location = useLocation();
  const { getGeneralWhatsAppLink } = useCurrency();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dodger_theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase.from('site_content').select('*').eq('page', 'common');
      setContent(data || []);
    };
    fetchContent();

    const channel = supabase.channel('navbar_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, fetchContent)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getContent = (key, fallback) => {
    const item = content.find(c => c.key === key);
    return item ? item.content : fallback;
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'TOD', path: '/tod' },
    { name: 'beIN', path: '/bein' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-2 glass shadow-lg' : 'py-4 bg-transparent'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src={logo} 
            alt="DODGER STORE" 
            className="h-10 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-lg font-medium transition-colors hover:text-accent relative group ${location.pathname === link.path ? 'text-accent' : 'text-primary'}`}
            >
              {link.name}
              <span className={`absolute -bottom-1 right-0 h-0.5 bg-accent transition-all duration-300 ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full glass hover:bg-accent hover:text-white transition-all duration-300"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <a
            href={getGeneralWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full font-bold hover:bg-accent-dark transition-all duration-300 shadow-lg shadow-accent/20 active:scale-95"
          >
            <MessageCircle size={20} />
            <span>{getContent('nav_cta_btn', 'تواصل معنا')}</span>
          </a>

          <button
            className="md:hidden p-3 rounded-full glass"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full glass border-t border-black/5 dark:border-white/5 md:hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-xl font-bold p-4 rounded-2xl ${location.pathname === link.path ? 'bg-accent/10 text-accent' : 'text-primary'}`}
                >
                  {link.name}
                </Link>
              ))}
              <a
                href={getGeneralWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-accent text-white p-4 rounded-2xl font-bold shadow-lg"
              >
                <MessageCircle size={20} />
                <span>{getContent('whatsapp_btn_text', 'تواصل عبر واتساب')}</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
