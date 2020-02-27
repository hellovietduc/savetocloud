const http = require('http');
const express = require('express');
const EventEmitter = require('events');
const nodeCleanup = require('node-cleanup');
const loaders = require('./loaders');
const subscribers = require('./subscribers');
const env = require('./config/env');
const events = require('./config/events').server;

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  await loaders.init({
    express: app,
    socketio: server,
    redis: true
  });

  const eventEmitter = new EventEmitter();
  eventEmitter.events = events;
  subscribers.subscribe('server', eventEmitter);

  server.listen(env.PORT, env.HOSTNAME, () => {
    console.log(`server running on port ${env.PORT}`);
    eventEmitter.emit(events.serverStart);
  });

  nodeCleanup((exitCode, signal) => {
    console.log(`\nexit code: ${exitCode}, signal: ${signal}`);
    eventEmitter.emit(events.serverExit);
  });
}

startServer();
