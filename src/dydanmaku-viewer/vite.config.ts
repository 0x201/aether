import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          advancedChunks: {
            groups: [
              {
                name: 'react-vendor',
                test: /\/react(?:-dom)?/
              },
              {
                name: 'antd-vendor',
                test: /antd/
              },
              {
                name: 'signalr-vendor',
                test: /@microsoft\/signalr/
              },
              {
                name: 'icons-vendor',
                test: /@ant-design\/icons/
              },
              {
                name: 'lodash-vendor',
                test: /lodash/
              },
              {
                name: 'date-fns-vendor',
                test: /date-fns/
              }
            ]
          },
        },
      },
    },
    server: {
      host: true,
      port: parseInt(process.env.PORT ?? "5175"),
      proxy: {
        '/api': {
          target: process.env.services__dydanmakuapi__http__0 || process.env.services__dydanmakuapi__https__0,
          changeOrigin: true,
          secure: process.env["NODE_ENV"] !== "development",
          rewrite: (path) => path.replace(/^\/api/, '')
        },
      }
    }
  };
})