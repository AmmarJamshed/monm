import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        monm: {
          primary: '#00D4AA',
          secondary: '#7C3AED',
          accent: '#F472B6',
          dark: '#0F172A',
          bg: '#0C0A14',
          'glass': 'rgba(255,255,255,0.06)',
          'glass-border': 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'ping-ring': 'ping-ring 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards',
        'msg-pop': 'msg-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'glow': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'ping-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'msg-pop': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '60%': { transform: 'scale(1.02)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0,212,170,0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(0,212,170,0.4), 0 0 40px rgba(0,212,170,0.3)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 170, 0.3)',
        'glow-pink': '0 0 20px rgba(244, 114, 182, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
