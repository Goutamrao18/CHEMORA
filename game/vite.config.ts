import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The game is published inside the CHEMORA website at /play/.
// `vite build` therefore emits /play/-prefixed asset URLs; `vite dev` stays at `/`.
// Override with VITE_BASE=/ for a standalone deployment.
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === 'build' ? '/play/' : '/'),
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 },
}));
