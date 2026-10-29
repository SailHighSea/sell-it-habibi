const { brand, canvas, surface, line, ink, muted, hero, danger } = require('./constants/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: { brand, canvas, surface, line, ink, muted, hero, danger },
      borderRadius: { card: 24, 'card-sm': 20 },
    },
  },
  plugins: [],
};
