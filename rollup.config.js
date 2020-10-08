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
      globals
    },
    {
      file: pkg.module,
      format: 'es'
    },
    {
      file: 'dist/index.mjs.js',
      format: 'es',
      plugins: [terser()],
      globals
    },
    {
      file: pkg.unpkg,
      format: 'umd',
      name: 'SubmarineJS',
      globals
    },
    {
      file: 'dist/submarine.min.js',
      format: 'umd',
      name: 'SubmarineJS',
      plugins: [terser()],
      globals
    },
    {
      file: 'dist/submarine.iife.js',
      format: 'iife',
      name: 'SubmarineJS',
      indent: false,
      plugins: [terser()]
    }
  ],
  external: Object.keys(pkg.dependencies).concat(['fs', 'path']),
  plugins: [
    commonjs({
      include: /node_modules/
    }),
    nodeResolve(),
    babel({
      exclude: 'node_modules/**'
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
};

export default config;
