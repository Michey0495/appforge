/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#2c52a4',
          dark: '#234291',
          light: '#eef2f9',
        },
      },
      fontFamily: {
        sans: ["'Helvetica Neue'", 'Arial', "'Hiragino Kaku Gothic ProN'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
