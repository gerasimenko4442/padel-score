import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the production build works when deployed to any
  // GitHub Pages sub-path (username.github.io/repo-name/) with zero extra config.
  base: './',
  plugins: [react(), tailwindcss()],
})
