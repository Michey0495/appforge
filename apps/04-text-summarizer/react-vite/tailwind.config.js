/** @type {import('tailwindcss').Config} */
// Tailwind CSS設定
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
          dark: '#1e3d7a',
          light: '#3d65b8',
        },
      },
      fontFamily: {
        sans: ["'Helvetica Neue'", 'Arial', "'Hiragino Kaku Gothic ProN'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
