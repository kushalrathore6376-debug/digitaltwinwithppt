import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all network interfaces, not just localhost, so devices on
    // the same Wi-Fi (an iPad, a phone) can reach the dev server directly
    // by IP without anything being deployed/hosted.
    host: true,
  },
})
