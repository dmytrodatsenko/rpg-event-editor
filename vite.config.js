import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
});