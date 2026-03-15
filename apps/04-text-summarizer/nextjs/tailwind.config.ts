import type { Config } from 'tailwindcss'

// Tailwind CSS設定
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
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

export default config
