/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        xs: ['var(--font-xs)', { lineHeight: 'var(--leading-xs)' }],
        sm: ['var(--font-sm)', { lineHeight: 'var(--leading-sm)' }],
        base: ['var(--font-base)', { lineHeight: 'var(--leading-base)' }],
        lg: ['var(--font-lg)', { lineHeight: 'var(--leading-lg)' }],
        xl: ['var(--font-xl)', { lineHeight: 'var(--leading-xl)' }],
        '2xl': ['var(--font-2xl)', { lineHeight: 'var(--leading-2xl)' }],
        '3xl': ['var(--font-3xl)', { lineHeight: 'var(--leading-3xl)' }],
        '4xl': ['var(--font-4xl)', { lineHeight: 'var(--leading-4xl)' }],
      },

      colors: {
        // Dark baseline. Light mode is overridden by html:not(.dark)
        // rules in styles.css.
        rkmbg: '#0a1729', rkmcard: '#0f2138', rkmcard2: '#132a45',
        rkmborder: '#1e3550', rkmborder2: '#cbd8e8', rkmaccent: '#1682ff',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
