import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/zest-jq.esm.js', format: 'esm' },
    { file: 'dist/zest-jq.iife.js', format: 'iife', name: 'ZestJQ' },
  ],
  plugins: [resolve(), commonjs()],
};
