import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#2c52a4',
          dark: '#243f82',
          light: '#eef2ff',
        },
      },
      fontFamily: {
        sans: ["'Helvetica Neue'", 'Arial', "'Hiragino Kaku Gothic ProN'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
