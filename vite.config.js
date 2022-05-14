const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/submarine.js'),
      formats: ['es', 'iife', 'umd'],
      name: 'Submarine',
      fileName: (format) => format === 'iife' ? 'submarine.js' : `submarine.${format}.js`
    }
  }
});