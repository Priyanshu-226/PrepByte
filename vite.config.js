import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the client calls /api and Vite forwards it to the Express server.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8787' } }
});
