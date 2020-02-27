const Redis = require('../loaders').redis;

class Auth {
  constructor(info) {
    this.serviceCode = info.serviceCode;
    this.socketId = info.socketId;
    this.accessToken = info.accessToken;
    this.raw = info.raw;
    this._key = `authInfo:${this.serviceCode}`;
  }

  toJson() {
    const obj = {};
    for (const [key, val] of Object.entries(this)) {
      if (!key.startsWith('_')) obj[key] = val;
    }
    return JSON.stringify(obj);
  }

  save() {
    return Redis.hset(this._key, this.socketId, this.toJson());
  }

  delete() {
    return Redis.hdel(this._key, this.socketId);
  }

  static async find(socketId, serviceCode) {
    const key = `authInfo:${serviceCode}`;
    const json = await Redis.hget(key, socketId);
    return JSON.parse(json);
  }
}

module.exports = Auth;
