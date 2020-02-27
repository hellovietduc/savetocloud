const EventEmitter = require('events');
const subscribers = require('../subscribers');
const env = require('../config/env');
const events = require('../config/events').auth;

class AuthService {
  constructor(Model) {
    this.AuthModel = Model;
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.events = events;
    subscribers.subscribe('auth', this.eventEmitter);
  }

  async saveAuthInfo(info) {
    try {
      const auth = new this.AuthModel(info);
      await auth.save();
      this.eventEmitter.emit(events.authInfoSaved, auth);
      setTimeout(auth.delete(), env.TOKEN_EXP_TIME);
      return auth;
    } catch (err) {
      this.eventEmitter.emit(events.authInfoSaveFailed, err);
      console.error(err);
    }
  }

  async deleteAuthInfo(socketId, serviceCode) {
    try {
      const plainAuthInfo = await this.AuthModel.find(socketId, serviceCode);
      const authInfo = new this.AuthModel(plainAuthInfo);
      await authInfo.delete();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  getAuthInfo(socketId, serviceCode) {
    try {
      return this.AuthModel.find(socketId, serviceCode);
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

module.exports = AuthService;
