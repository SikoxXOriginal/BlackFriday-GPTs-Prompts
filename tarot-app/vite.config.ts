import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Im Dev-Modus läuft der optionale Claude-Proxy auf Port 8787 (npm run server).
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
})
