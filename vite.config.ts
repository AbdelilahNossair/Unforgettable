import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    // This creates a global process.env object with your environment variables
    'process.env': {
      FACE_API_URL: JSON.stringify(process.env.VITE_FACE_API_URL || 'http://localhost:5000'),
      SUPABASE_URL: JSON.stringify(process.env.VITE_SUPABASE_URL),
      SUPABASE_KEY: JSON.stringify(process.env.VITE_SUPABASE_KEY),
      SUPABASE_ANON_KEY: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_KEY: JSON.stringify(process.env.VITE_SUPABASE_SERVICE_KEY),
      // Add any other environment variables you're using in your app
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }

});
