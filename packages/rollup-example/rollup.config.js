import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    dir: 'out',
    format: 'iife',
  },
  plugins: [
    resolve({ mainFields: ['module', 'browser'] }),
    commonjs({
      namedExports: {
        '@optimizely/js-sdk-logging': [
          'ConsoleLogHandler',
          'getLogger',
          'setLogLevel',
          'LogLevel',
          'setLogHandler',
          'setErrorHandler',
          'getErrorHandler'
        ],
        '@optimizely/js-sdk-event-processor': [
          'LogTierV1EventProcessor',
          'LocalStoragePendingEventsDispatcher'
        ]
      }
    }),
  ],
};
