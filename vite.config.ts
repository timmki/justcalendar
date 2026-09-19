import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api/v1/ics': 'http://127.0.0.1:8787',
    },
  },
});
