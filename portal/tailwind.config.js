/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f3f9',
          100: '#dce3f0',
          200: '#b8c7e1',
          300: '#8fa7cf',
          400: '#6687bd',
          500: '#3d67ab',
          600: '#2e4f87',
          700: '#1e3461',
          800: '#14243f',
          900: '#0a1220',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
