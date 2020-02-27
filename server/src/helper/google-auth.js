const { google } = require('googleapis');
const authUtils = require('./auth');
const env = require('../config/env');

const getClient = () =>
  new google.auth.OAuth2(env.GOOGLE_DRIVE_APP_ID, env.GOOGLE_DRIVE_APP_PASSWD, env.AUTH_REDIRECT_URL);

const getAuthUrl = (client, scopes) =>
  client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

const getTokens = (client, authCode) =>
  new Promise((resolve, reject) => {
    client.getToken(authCode, (err, tokens) => {
      if (err) return reject(err);
      resolve(tokens);
    });
  });

const authClient = (client, token) => {
  client.setCredentials(token);
  return client;
};

const parseRequest = async query => {
  const client = getClient();
  const tokens = await getTokens(client, query.code);
  const { serviceCode, socketId } = authUtils.decodeState(query.state);
  return {
    serviceCode,
    socketId,
    accessToken: tokens.access_token,
    raw: tokens
  };
};

module.exports = {
  getClient,
  getAuthUrl,
  getTokens,
  authClient,
  parseRequest
};
