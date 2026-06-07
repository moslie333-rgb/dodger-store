import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CurrencyProvider } from './context/CurrencyContext';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import ScrollToTop from './components/ScrollToTop';

// Lazy Load Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TODPage = lazy(() => import('./pages/TODPage'));
const BeinPage = lazy(() => import('./pages/BeinPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.4)]"></div>
  </div>
);

function App() {
  return (
    <CurrencyProvider>
      <Router>
        <ScrollToTop />
        <FloatingWhatsApp />
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/tod" element={<TODPage />} />
              <Route path="/bein" element={<BeinPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </Router>
    </CurrencyProvider>
  );
}

export default App;
