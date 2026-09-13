/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Monad Design Tokens
        parchment: '#f6f3f1',
        'lake-blue': '#2b59d1',
        'periwinkle-mist': '#cfdaf5',
        periwinkle: '#cfdaf5',
        'sky-blue': '#a0b5eb',
        mint: '#a7fccd',
        coral: '#ff9473',
        gold: '#ecda98',
        crimson: '#f37a0a',
        'off-black': '#242424',
        ink: '#000000',
        graphite: '#4e4d4d',
        smoke: '#615e5d',
        ash: '#cecac8',
      },
      fontFamily: {
        serif: ['Newsreader', 'Untitled Serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'ABC Diatype Mono', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Untitled Sans', 'Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        pill: '9999px',
      },
      boxShadow: {
        monad: 'rgba(0, 0, 0, 0.06) 0px 1px 3px 0px',
      },
    },
  },
  plugins: [],
};
