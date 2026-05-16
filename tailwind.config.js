/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#121212',
          light: '#5a5a5a',
        },
        accent: {
          DEFAULT: '#d4af37',
          dark: '#b8962d',
          glow: 'rgba(212, 175, 55, 0.2)',
        },
        background: {
          DEFAULT: '#ffffff',
          secondary: '#fdfaf5',
          dark: '#000000',
          card: '#ffffff',
          'card-dark': '#0f0f0f',
        },
        whatsapp: {
          DEFAULT: '#d4af37',
          dark: '#b8962d',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontFamily: {
        alexandria: ['Alexandria', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
