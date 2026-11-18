import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // production se pahle in dono line ko remove krna host ki 
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            if (err?.code !== 'ECONNRESET') {
              console.warn('[vite proxy warning]:', err.message)
            }
          })
        },
      },
    },
  },
})
