const typescript = require('rollup-plugin-typescript2')
const commonjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const resolve = require('rollup-plugin-node-resolve')
const { uglify } = require('rollup-plugin-uglify')


function getPlugins(browser) {
  // const plugins = [resolve()]
  let plugins = []
  console.log('browser', JSON.stringify(browser))

  plugins.push(
    replace({
      'process.env.BROWSER': JSON.stringify(browser),
    }),
  )

  plugins.push(
    typescript(),
    // commonjs({
    //   include: /node_modules/,
    // }),
  )

  return plugins
}

const config = {
  input: 'src/index.ts',
  plugins: getPlugins(process.env.BROWSER),
}

module.exports = config
