import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/submarine.js'),
      name: 'Submarine',
      fileName: (format) => `submarine.${format}.js`
    },
    rollupOptions: {
      external: ['react']
    }
  },
  plugins: [react()]
})
