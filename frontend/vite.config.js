import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 👈 Yeh line add karni hai (Electron production file paths ke liye)  production deploy krun tb suggest krna muje 
  server: {
    // production se pahle in dono line ko remove krna host ki 
    host: true,
    allowedHosts: ['.pinggy.net', '.pinggy-free.link', '.trycloudflare.com', 'jpcac-103-111-7-25.free.pinggy.net'],
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
