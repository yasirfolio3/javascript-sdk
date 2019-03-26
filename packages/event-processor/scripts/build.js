const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;

process.chdir(path.resolve(__dirname, ".."));

function exec(command, extraEnv) {
  return execSync(command, {
    stdio: "inherit",
    env: Object.assign({}, process.env, extraEnv)
  });
}

const packageName = 'event-processor';

console.log("\nBuilding Node CommonJS modules...");

exec(`./node_modules/.bin/rollup -c scripts/config.js -f cjs -o dist/${packageName}.js`);

console.log("\nBuilding Browser CommonJS modules...");

exec(`./node_modules/.bin/rollup -c scripts/config.js -f cjs -o dist/${packageName}.browser.js`, {
  BROWSER: true
});