import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    cors: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.jsx',
      external: ['react', 'react-dom'],
      output: {
        format: 'iife',
        entryFileNames: 'bundle.js',
        assetFileNames: 'assets/[name].[ext]',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})


