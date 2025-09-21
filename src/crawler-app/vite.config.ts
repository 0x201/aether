import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: parseInt(process.env.PORT ?? "5174"),
    proxy: {
      '/api': {
        target: process.env.services__crawlerapi__http__0 || process.env.services__crawlerapi__https__0,
        changeOrigin: true,
        //rewrite: (path) => path.replace(/^\/api/, ''),
        secure: process.env["NODE_ENV"] !== "development"
      },
    }
  }
})
