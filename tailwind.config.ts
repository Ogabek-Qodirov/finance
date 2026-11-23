import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F8F5EC',
        forest: {
          DEFAULT: '#234B38',
          light: '#2D6349',
          dark: '#1A3828',
        },
        mustard: {
          DEFAULT: '#E5B94F',
          light: '#ECC86A',
          dark: '#D4A43A',
        },
        tomato: {
          DEFAULT: '#D9654D',
          light: '#E0785E',
          dark: '#C4523A',
        },
        softOrange: '#E99B63',
        darkText: '#252820',
        mutedText: '#77786F',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(37,40,32,0.06), 0 4px 16px rgba(37,40,32,0.04)',
        'card-hover': '0 4px 12px rgba(37,40,32,0.1), 0 8px 24px rgba(37,40,32,0.06)',
        modal: '0 20px 60px rgba(37,40,32,0.2)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.4s ease-out',
        slideInLeft: 'slideInLeft 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        scaleIn: 'scaleIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
