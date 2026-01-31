import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy Canvas API to avoid CORS when calling from localhost.
      '/canvas-api': {
        target: 'https://canvas.ucsd.edu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/canvas-api/, ''),
        secure: true,
      },
    },
  },
})
