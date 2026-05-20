import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // 1. Tell Vite to use the React plugin to compile JSX (.tsx) files
  plugins: [react()],
  
  // 2. Configure the development web server environment settings
  server: {
    port: 5173,      // Forces the development server to always run on port 5173
    host: true,      // Exposes the project to your local network if needed
    strictPort: true // If 5173 is busy, fail immediately instead of randomly switching ports
  },

  // 3. Optional: Define absolute path aliases if your project uses them
  resolve: {
    alias: {
      '@': '/src',   // Allows you to clean up imports using '@/' instead of '../../'
    },
  },
});