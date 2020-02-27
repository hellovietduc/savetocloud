const expressLoader = require('./express-loader');
const socketioLoader = require('./socketio-loader');
const redisLoader = require('./redis-loader');

const globals = {
  express: null,
  socketio: null,
  redis: null
};

module.exports = globals;

module.exports.init = async ({ express, socketio, redis }) => {
  const loaders = [expressLoader(express), socketioLoader(socketio), redisLoader(redis)];
  const loaded = await Promise.all(loaders);
  globals.express = loaded[0];
  globals.socketio = loaded[1];
  globals.redis = loaded[2];
};
