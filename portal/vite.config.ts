import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync, lstatSync, rmSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-apps',
      buildStart() {
        const src = resolve(__dirname, '../apps')
        const dest = resolve(__dirname, 'public/apps')
        if (existsSync(dest)) {
          const stat = lstatSync(dest)
          if (stat.isSymbolicLink()) {
            rmSync(dest)
          } else {
            return
          }
        }
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true })
        }
      },
    },
  ],
})
