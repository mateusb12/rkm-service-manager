/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
