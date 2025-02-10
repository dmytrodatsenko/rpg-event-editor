import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [],
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    terserOptions: {
      compress: {
        drop_console: true
      }
    },
  }
});