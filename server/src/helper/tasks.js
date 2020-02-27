const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const rootDir = __dirname.substring(0, __dirname.lastIndexOf('/'));
const staticPath = 'api/_static';
const staticDir = path.normalize(`${rootDir}/${staticPath}`);

const replaceServerUrlInStaticFiles = () =>
  new Promise((resolve, reject) => {
    try {
      const files = fs.readdirSync(staticDir);
      files.forEach(file => {
        const filePath = `${staticDir}/${file}`;
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        fs.writeFileSync(filePath, fileContent.replace('$SERVER_URL', env.SERVER_URL), 'utf-8');
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });

const reverseServerUrlInStaticFiles = () =>
  new Promise((resolve, reject) => {
    try {
      const files = fs.readdirSync(staticDir);
      files.forEach(file => {
        const filePath = `${staticDir}/${file}`;
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        fs.writeFileSync(filePath, fileContent.replace(env.SERVER_URL, '$SERVER_URL'), 'utf-8');
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });

module.exports.onStart = callback => {
  replaceServerUrlInStaticFiles()
    .then(callback)
    .catch(callback);
};

module.exports.onExit = callback => {
  reverseServerUrlInStaticFiles()
    .then(callback)
    .catch(callback);
};
