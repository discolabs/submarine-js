import nodeResolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import replace from 'rollup-plugin-replace';
import pkg from './package.json';

const globals = {
  '@discolabs/custard-js': 'custard',
  payform: 'payform'
};

const config = {
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      indent: false,
      globals
    },
    {
      file: pkg.module,
      format: 'es',
      indent: false,
      globals
    },
    {
      file: 'dist/index.mjs.js',
      format: 'es',
      indent: false,
      plugins: [terser()],
      globals
    },
    {
      file: pkg.unpkg,
      format: 'umd',
      name: 'Submarine',
      indent: false,
      globals
    },
    {
      file: 'dist/submarine.min.js',
      format: 'umd',
      name: 'Submarine',
      indent: false,
      plugins: [terser()],
      globals
    }
  ],
  external: Object.keys(pkg.dependencies).concat(['fs', 'path']),
  plugins: [
    nodeResolve(),
    babel({
      exclude: 'node_modules/**'
    }),
    commonjs({
      include: /node_modules/,
      namedExports: {
        'node_modules/lodash/index.js': ['get']
      }
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
};

export default config;
