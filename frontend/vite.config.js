import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import purgeCss from 'vite-plugin-purgecss'
import path from 'path'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag === 'iconify-icon'
        }
      }
    }),
    purgeCss({
      content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
      ],
      safelist: ['show', /^icon-/, /^bg-/, /^text-/, /^col-/, /^row-/, /^sidebar/, /^breadcrumb/],
    }),
  ],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('X-Accel-Buffering', 'no');
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true
      }
    }
  }
})
