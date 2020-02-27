const Redis = require('ioredis');
const env = require('../config/env');

module.exports = init => {
  if (!init) return;

  const redis = new Redis(env.REDIS_URI);

  console.log('redis initialized');

  return redis;
};
