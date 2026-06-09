import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8001';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/health': backendUrl,
      '/api': backendUrl,
    },
  },
});
