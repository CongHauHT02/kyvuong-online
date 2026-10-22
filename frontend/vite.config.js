import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5235',
        changeOrigin: true,
      },
      '/gameHub': {
        target: 'http://localhost:5235',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
