import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#2c52a4',
        'navy-dark': '#213d7b',
      },
      fontFamily: {
        sans: [
          'Helvetica Neue',
          'Arial',
          'Hiragino Kaku Gothic ProN',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

export default config
