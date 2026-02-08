import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5174'),
    host: process.env.VITE_HOST || 'localhost',
    hmr: { host: 'localhost' },
    proxy: {
      '/_renderer': {
        target: process.env.VITE_GO_SERVER_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_GO_SERVER_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
