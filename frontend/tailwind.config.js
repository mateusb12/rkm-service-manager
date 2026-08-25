/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rkmbg: '#f7f9fc', rkmcard: '#ffffff', rkmcard2: '#f8fbff',
        rkmborder: '#d9e2ef', rkmborder2: '#cbd8e8', rkmaccent: '#1682ff',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
