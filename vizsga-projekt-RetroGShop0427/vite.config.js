// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser', // Erősebb minification
    terserOptions: {
      compress: {
        drop_console: true, // Eltávolítja a console.log-okat
        drop_debugger: true, // Eltávolítja a debugger-t
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // Ezeket is eltávolítja
      },
      mangle: {
        toplevel: true, // Változónevek összekeverése
        properties: {
          regex: /^_/ // Az _-el kezdődő property-ket is
        }
      },
      output: {
        beautify: false, // Ne szépítse
        comments: false, // Ne legyenek kommentek
      }
    },
    sourcemap: false, // Ne legyen source map
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
})