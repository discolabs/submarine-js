import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    //lib: {
    //entry: path.resolve(__dirname, 'lib/submarine.js'),
    //  name: 'submarine-js',
    //  fileName: (format) => `submarine.${format}.js`
    //},
    rollupOptions: {
      input: {
        submarine: resolve(__dirname, 'lib/submarine.js')
      },
      output: [
        {
          format: 'es',
          entryFileNames: 'submarine.es.js',
          dir: resolve(__dirname, 'dist')
        },
        {
          format: 'iife',
          entryFileNames: 'submarine.js',
          dir: resolve(__dirname, 'dist'),
          name: 'Submarine'
        }
      ]
    }
  },
  plugins: [
    react()
    //legacy({
    //  targets: ['ie >= 11'],
    //  additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    //})
  ]
});
