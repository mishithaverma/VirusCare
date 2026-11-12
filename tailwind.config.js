/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f2a52',
          50: '#eef3fb',
          100: '#d6e2f4',
          200: '#adc3e6',
          300: '#7f9fd4',
          400: '#5078bd',
          500: '#2f589f',
          600: '#1d3f7d',
          700: '#163463',
          800: '#102a52',
          900: '#0b1f3e',
        },
        brand: {
          DEFAULT: '#1763c6',
          soft: '#e8f1fc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 42, 82, 0.04), 0 4px 16px rgba(15, 42, 82, 0.06)',
        pop: '0 10px 40px rgba(15, 42, 82, 0.18)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.1rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in': { from: { opacity: 0, transform: 'translateX(12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
