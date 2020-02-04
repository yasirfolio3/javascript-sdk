const typescript = require('rollup-plugin-typescript2')
const commonjs = require('rollup-plugin-commonjs')
const resolve = require('rollup-plugin-node-resolve')
const  { terser } = require('rollup-plugin-terser');


const config = {
  input: 'lib/index.browser.js',
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs({
      include: /node_modules/,
      // namedExports: { 'uuid': ['v4'] },
    }),
    typescript(),
    terser(),
  ]
}
//./node_modules/.bin/rollup -c scripts/config.js -f cjs -o dist/${packageName}.js

module.exports = config
