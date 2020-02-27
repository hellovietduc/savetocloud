const EventEmittter = require('events');

const pool = new Map();

module.exports = channel => {
  if (!pool.has(channel)) {
    const eventEmitter = new EventEmittter();
    pool.set(channel, eventEmitter);
    return eventEmitter;
  }
  return pool.get(channel);
};
