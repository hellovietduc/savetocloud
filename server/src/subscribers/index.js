/* eslint-disable global-require */

const fs = require('fs');
const path = require('path');

const subscribersDir = path.normalize(`${process.cwd()}/src/subscribers`);

class Subscriber {
  constructor(subsDir) {
    this.channels = new Map();
    this._subsDir = subsDir;
  }

  subscribe(name, emitter) {
    this.channels.set(name, emitter);
    this._loadSubs(name);
  }

  getChannel(name) {
    return this.channels.get(name);
  }

  _loadSubs(name) {
    const fileList = fs.readdirSync(this._subsDir);
    for (const file of fileList) {
      if (!file.endsWith('.js')) continue;
      if (file === 'index.js') continue;
      if (!file.startsWith(name)) continue;
      require(`${subscribersDir}/${file}`);
    }
  }
}

module.exports = new Subscriber(subscribersDir);
