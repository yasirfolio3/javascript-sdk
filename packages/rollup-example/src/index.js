import * as optimizelySdk from '@optimizely/optimizely-sdk';

optimizelySdk.setLogLevel('debug');

const instance = optimizelySdk.createInstance({
  sdkKey: '<sdk key>',
});

instance.onReady().then(result => {
  console.log(JSON.stringify(result));
  instance.close();
});
