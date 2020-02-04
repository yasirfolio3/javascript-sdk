const glob = require('glob');
const childProcess = require('child_process');
const fs = require('fs');
const mkdirp = require('mkdirp')
const path = require('path');

glob('./lib/**/*.js', (err, files) => {
  files.forEach(relativePath => {
    const updatedPath = relativePath.replace(/^\.\/lib/, './fixed')
    childProcess.execSync(`esnext -o ${updatedPath} ${relativePath} -w modules.commonjs`)
  });
});

glob('./lib/**/*.ts', (err, files) => {
  files.forEach(relativePath => {
    const updatedPath = relativePath.replace(/^\.\/lib/, './fixed')
    mkdirp.sync(path.dirname(updatedPath));
    fs.copyFileSync(relativePath, updatedPath);
  });
});
