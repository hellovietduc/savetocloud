import base64url from 'base64url';
import env from '../config/env';
import GoogleAuth from './google-auth';

const regex = {
  whitespace: new RegExp(/\s+/g)
};

export default {
  sleep: t => new Promise(r => setTimeout(r, t)),

  getOneDriveAuthUrl: state => {
    return (
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
      `?client_id=${env.ONEDRIVE_APP_ID}` +
      '&scope=files.readwrite' +
      '&response_type=token' +
      `&redirect_uri=${env.AUTH_REDIRECT_URI}` +
      `&state=${state}`
    );
  },

  getDropboxAuthUrl: state => {
    return (
      'https://www.dropbox.com/oauth2/authorize' +
      `?client_id=${env.DROPBOX_APP_ID}` +
      '&response_type=token' +
      `&redirect_uri=${env.AUTH_REDIRECT_URI}` +
      `&state=${state}`
    );
  },

  getGoogleDriveAuthUrl: state => {
    const client = GoogleAuth.getClient();
    return GoogleAuth.getAuthUrl(client, ['https://www.googleapis.com/auth/drive']) + `&state=${state}`;
  },

  encodeUrl: obj => base64url.encode(JSON.stringify(obj)),

  formatUrl: url => {
    url = url.trim();
    if (!url.startsWith('https://') && !url.startsWith('http://')) return null;
    if (url.lastIndexOf('/') <= 7) return null;
    return regex.whitespace.test(url) ? '' : url;
  }
};
