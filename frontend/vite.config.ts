import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy al backend FastAPI para evitar problemas de CORS en desarrollo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
