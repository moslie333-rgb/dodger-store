import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FloatingWhatsApp = () => {
  return (
    <motion.a
      href="https://wa.me/96898911606"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-50 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-premium hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-300 group"
      aria-label="تواصل معنا عبر واتساب"
    >
      <MessageCircle size={36} className="relative z-10" />
      
      {/* Pulse effect rings */}
      <span className="absolute inset-0 rounded-full border border-[#25D366] animate-ping opacity-75"></span>
      <span className="absolute inset-[-8px] rounded-full bg-[#25D366] opacity-20 group-hover:opacity-40 transition-opacity duration-300 blur-sm"></span>
    </motion.a>
  );
};

export default FloatingWhatsApp;
