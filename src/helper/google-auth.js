import { google } from 'googleapis';
import env from '../config/env';

export default {
  getClient: () => new google.auth.OAuth2(env.GOOGLE_DRIVE_APP_ID, env.GOOGLE_DRIVE_APP_PASSWD, env.AUTH_REDIRECT_URI),

  getAuthUrl: (client, scopes) =>
    client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    }),

  getAccessToken: (client, authCode) =>
    new Promise((resolve, reject) => {
      client.getToken(authCode, (err, token) => {
        if (err) return reject(err);
        resolve(token);
      });
    }),

  authClient: (client, token) => {
    client.setCredentials(token);
    return client;
  }
};
