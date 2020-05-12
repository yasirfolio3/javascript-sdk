## Rollup example

### Setup
```
npm install
```
Note: This was tested with Node v14 and npm v6.14.4

### Running


First, add your SDK key on line 6 of `src/index.js`
```js
const instance = optimizelySdk.createInstance({
  sdkKey: '<sdk key>', // replace '<sdk key>' with your SDK key
});
```

Then
1. `npm run build` to build bundle.
2. In another shell, `npm run serve` to start a local server serving a blank HTML page with the bundle.
3. Open `localhost:5000` in a browser
