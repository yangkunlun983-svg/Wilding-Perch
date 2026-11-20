import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Wilding-Perch/',
  server: { host: '0.0.0.0' },
})
