import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        monm: {
          primary: '#00C9B7',
          secondary: '#8B5CF6',
          accent: '#F472B6',
          gold: '#FBBF24',
          sky: '#38BDF8',
          dark: '#1F2937',
          bg: '#FAF8FC',
          'glass': 'rgba(255,255,255,0.85)',
          'glass-border': 'rgba(203,213,225,0.5)',
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
        'glow': '0 0 24px rgba(0, 201, 183, 0.35), 0 0 48px rgba(0, 201, 183, 0.15)',
        'glow-pink': '0 0 24px rgba(244, 114, 182, 0.3)',
        'glow-purple': '0 0 24px rgba(139, 92, 246, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
