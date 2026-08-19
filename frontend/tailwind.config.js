/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rkmbg: '#0a1729', rkmcard: '#0f2138', rkmcard2: '#132a45',
        rkmborder: '#1e3550', rkmborder2: '#274a6e', rkmaccent: '#3b82f6',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
