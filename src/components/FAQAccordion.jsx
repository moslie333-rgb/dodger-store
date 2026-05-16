import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQAccordion = ({ faqs }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="space-y-4 max-w-3xl mx-auto w-full">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="bg-white dark:bg-background-card-dark rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden transition-all duration-300"
        >
          <button
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
            className="w-full p-6 flex justify-between items-center text-right group"
          >
            <span className="text-xl font-bold text-primary transition-colors group-hover:text-accent">
              {faq.question}
            </span>
            <motion.div
              animate={{ rotate: activeIndex === index ? 180 : 0 }}
              className="text-accent"
            >
              <ChevronDown size={24} />
            </motion.div>
          </button>
          <AnimatePresence>
            {activeIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="p-6 pt-0 text-lg text-primary-light leading-relaxed">
                  <p className="mb-2">{faq.answerAr}</p>
                  <p className="text-sm opacity-60 font-normal">{faq.answerEn}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default FAQAccordion;
