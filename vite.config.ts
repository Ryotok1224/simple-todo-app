import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 開発中は /api へのリクエストを npm run dev:server のサーバーに転送する
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
