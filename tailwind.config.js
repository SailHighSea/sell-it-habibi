const { brand, canvas, surface, line, ink, muted, hero, danger } = require('./constants/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 'class' so Settings can force light or dark; with no choice made the app follows the system.
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: { brand, canvas, surface, line, ink, muted, hero, danger },
      borderRadius: { card: 28, 'card-sm': 24 },
    },
  },
  plugins: [],
};
