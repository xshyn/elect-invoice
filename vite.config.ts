import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// GitHub Pages: از مسیر نسبی استفاده می‌کنیم تا با هر نام ریپو کار کند.
// چون از HashRouter استفاده شده، نیازی به rewrite规则 سمت سرور نیست.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
