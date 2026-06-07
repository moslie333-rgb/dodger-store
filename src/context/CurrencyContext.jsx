/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ─── Configuration ──────────────────────────────────────────────────────────
const BASE_CURRENCY = 'OMR';

const WHATSAPP_NUMBERS = {
  SA: '966511499659',
  DEFAULT: '96898911606',
};

// Base prices in OMR — single source of truth
export const BASE_PRICES = {
  '1_MONTH':  2.5,
  '3_MONTHS': 7,
  '6_MONTHS': 12,
  '1_YEAR':   17,
  'WORLD_CUP': 25,
};

// Country → currency mapping for Gulf + popular regions
const COUNTRY_CURRENCY_MAP = {
  SA: 'SAR',
  OM: 'OMR',
  AE: 'AED',
  KW: 'KWD',
  BH: 'BHD',
  QA: 'QAR',
  EG: 'EGP',
  JO: 'JOD',
  IQ: 'IQD',
  LB: 'LBP',
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
};

// Currency display symbols (Arabic-friendly)
const CURRENCY_SYMBOLS = {
  OMR: 'ر.ع',
  SAR: 'ر.س',
  AED: 'د.إ',
  KWD: 'د.ك',
  BHD: 'د.ب',
  QAR: 'ر.ق',
  EGP: 'ج.م',
  JOD: 'د.أ',
  IQD: 'د.ع',
  LBP: 'ل.ل',
  USD: '$',
  GBP: '£',
  EUR: '€',
};

// Hardcoded fallback rates relative to 1 OMR
const FALLBACK_RATES = {
  OMR: 1,
  SAR: 9.74,
  AED: 9.54,
  KWD: 0.796,
  BHD: 0.979,
  QAR: 9.46,
  EGP: 129.3,
  JOD: 1.84,
  IQD: 3405,
  LBP: 232500,
  USD: 2.6,
  GBP: 2.06,
  EUR: 2.38,
};

const CACHE_KEYS = {
  COUNTRY: 'dodger_detected_country',
  RATES: 'dodger_exchange_rates',
  RATES_TS: 'dodger_exchange_rates_ts',
};

const RATES_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Context ────────────────────────────────────────────────────────────────
const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};

// ─── Provider ───────────────────────────────────────────────────────────────
export const CurrencyProvider = ({ children }) => {
  const [country, setCountry] = useState(() => {
    try { return localStorage.getItem(CACHE_KEYS.COUNTRY) || null; } catch { return null; }
  });
  const [rates, setRates] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.RATES);
      const ts = localStorage.getItem(CACHE_KEYS.RATES_TS);
      if (cached && ts && Date.now() - Number(ts) < RATES_TTL_MS) {
        return JSON.parse(cached);
      }
    } catch { /* ignore */ }
    return FALLBACK_RATES;
  });
  const [isReady, setIsReady] = useState(!!country);

  // ── Detect country via IP ─────────────────────────────────────────────
  useEffect(() => {
    if (country) {
      Promise.resolve().then(() => setIsReady(true));
      return;
    }

    let cancelled = false;
    const detect = async () => {
      try {
        // Primary: ipapi.co
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error('ipapi failed');
        const json = await res.json();
        if (!cancelled && json.country_code) {
          const cc = json.country_code.toUpperCase();
          setCountry(cc);
          try { localStorage.setItem(CACHE_KEYS.COUNTRY, cc); } catch { /* ignore */ }
          setIsReady(true);
          return;
        }
      } catch { /* fallback below */ }

      try {
        // Fallback: ipinfo.io
        const res = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error('ipinfo failed');
        const json = await res.json();
        if (!cancelled && json.country) {
          const cc = json.country.toUpperCase();
          setCountry(cc);
          try { localStorage.setItem(CACHE_KEYS.COUNTRY, cc); } catch { /* ignore */ }
          setIsReady(true);
          return;
        }
      } catch { /* final fallback */ }

      // Final fallback: default to Oman
      if (!cancelled) {
        setCountry('OM');
        try { localStorage.setItem(CACHE_KEYS.COUNTRY, 'OM'); } catch { /* ignore */ }
        setIsReady(true);
      }
    };

    detect();
    return () => { cancelled = true; };
  }, [country]);

  // ── Fetch exchange rates ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchRates = async () => {
      // Check cache freshness
      try {
        const ts = localStorage.getItem(CACHE_KEYS.RATES_TS);
        if (ts && Date.now() - Number(ts) < RATES_TTL_MS) return;
      } catch { /* ignore */ }

      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error('exchange rate API failed');
        const json = await res.json();
        if (!cancelled && json.rates) {
          setRates(json.rates);
          try {
            localStorage.setItem(CACHE_KEYS.RATES, JSON.stringify(json.rates));
            localStorage.setItem(CACHE_KEYS.RATES_TS, String(Date.now()));
          } catch { /* ignore */ }
        }
      } catch {
        // Keep using fallback or cached rates
      }
    };

    fetchRates();
    return () => { cancelled = true; };
  }, []);

  // ── Derived currency from country ─────────────────────────────────────
  const targetCurrency = useMemo(() => {
    if (!country) return BASE_CURRENCY;
    return COUNTRY_CURRENCY_MAP[country] || 'USD';
  }, [country]);

  // ── Core conversion: OMR amount → target currency amount ─────────────
  const convertOMR = useCallback((amountOMR) => {
    if (targetCurrency === BASE_CURRENCY) return amountOMR;
    const rate = rates[targetCurrency];
    if (!rate) return amountOMR;
    return amountOMR * rate;
  }, [rates, targetCurrency]);

  // ── Format helper: determines decimals + symbol for current currency ──
  const formatAmount = useCallback((amount) => {
    const symbol = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency;
    let decimals = 2;
    if (['KWD', 'BHD', 'OMR', 'JOD'].includes(targetCurrency)) decimals = 3;
    if (['EGP', 'IQD', 'LBP'].includes(targetCurrency)) decimals = 0;

    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${formatted} ${symbol}`;
  }, [targetCurrency]);

  // ── formatOMR: takes a raw OMR number → converts + formats to string ──
  const formatOMR = useCallback((amountOMR) => {
    if (typeof amountOMR !== 'number' || isNaN(amountOMR)) return '';
    const converted = convertOMR(amountOMR);
    return formatAmount(converted);
  }, [convertOMR, formatAmount]);

  // ── Parse a price string like "2.5 ر.ع" or "25 SAR" → OMR amount ────
  const parseToOMR = useCallback((priceStr) => {
    if (typeof priceStr !== 'string') return NaN;
    const cleaned = priceStr.replace(/[,،]/g, '');
    const numMatch = cleaned.match(/([\d.]+)/);
    if (!numMatch) return NaN;
    const amount = parseFloat(numMatch[1]);

    // Detect source currency from string
    const upper = cleaned.toUpperCase();
    if (upper.includes('SAR') || cleaned.includes('ر.س')) {
      return rates['SAR'] ? amount / rates['SAR'] : amount;
    }
    if (upper.includes('AED') || cleaned.includes('د.إ')) {
      return rates['AED'] ? amount / rates['AED'] : amount;
    }
    if (upper.includes('KWD') || cleaned.includes('د.ك')) {
      return rates['KWD'] ? amount / rates['KWD'] : amount;
    }
    if (upper.includes('EGP') || cleaned.includes('ج.م')) {
      return rates['EGP'] ? amount / rates['EGP'] : amount;
    }
    if (upper.includes('USD') || cleaned.includes('$')) {
      return rates['USD'] ? amount / rates['USD'] : amount;
    }
    // Default: assume OMR
    return amount;
  }, [rates]);

  // ── Convert and format a price string → display string ───────────────
  const convertAndFormat = useCallback((priceStr) => {
    if (!priceStr || typeof priceStr !== 'string') return priceStr || '';

    const amountOMR = parseToOMR(priceStr);
    if (isNaN(amountOMR)) return priceStr;

    const converted = convertOMR(amountOMR);
    return formatAmount(converted);
  }, [parseToOMR, convertOMR, formatAmount]);

  // ── WhatsApp link helpers ─────────────────────────────────────────────
  const whatsappNumber = useMemo(() => {
    return country === 'SA' ? WHATSAPP_NUMBERS.SA : WHATSAPP_NUMBERS.DEFAULT;
  }, [country]);

  /** Get WhatsApp link with optional plan name as pre-filled message */
  const getWhatsAppLink = useCallback((planName, customMessage) => {
    const base = `https://wa.me/${whatsappNumber}`;
    if (customMessage) {
      return `${base}?text=${encodeURIComponent(customMessage)}`;
    }
    if (planName) {
      const msg = `مرحباً، أرغب بالاشتراك في:\nالباقة: ${planName}`;
      return `${base}?text=${encodeURIComponent(msg)}`;
    }
    return base;
  }, [whatsappNumber]);

  /** Get WhatsApp link by country code — uses auto-detected country if none provided */
  const getWhatsappLink = useCallback((countryCode) => {
    const cc = countryCode || country;
    const num = cc === 'SA' ? WHATSAPP_NUMBERS.SA : WHATSAPP_NUMBERS.DEFAULT;
    return `https://wa.me/${num}`;
  }, [country]);

  const getGeneralWhatsAppLink = useCallback(() => {
    return `https://wa.me/${whatsappNumber}`;
  }, [whatsappNumber]);

  // ── Context value ─────────────────────────────────────────────────────
  const value = useMemo(() => ({
    country,
    targetCurrency,
    isReady,
    convertAndFormat,
    convertOMR,
    formatOMR,
    formatAmount,
    parseToOMR,
    whatsappNumber,
    getWhatsAppLink,
    getWhatsappLink,
    getGeneralWhatsAppLink,
    rates,
  }), [country, targetCurrency, isReady, convertAndFormat, convertOMR, formatOMR, formatAmount, parseToOMR, whatsappNumber, getWhatsAppLink, getWhatsappLink, getGeneralWhatsAppLink, rates]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
