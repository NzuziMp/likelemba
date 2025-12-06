/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2ee',
          100: '#fde5dd',
          200: '#fbcbbb',
          300: '#f9b099',
          400: '#f79677',
          500: '#f57c55',
          600: '#ef5631',
          700: '#d13f1c',
          800: '#9e2f15',
          900: '#6b200e',
        },
        secondary: {
          50: '#e8fbf4',
          100: '#c8f6e3',
          200: '#a4f0d1',
          300: '#7eebbd',
          400: '#5ce6ac',
          500: '#2ede98',
          600: '#29c886',
          700: '#229d6b',
          800: '#1a7a53',
          900: '#12583c',
        },
      },
    },
  },
  plugins: [],
};
