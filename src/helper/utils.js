import base64url from 'base64url';
import { SERVICES, SERVICE_CODES } from '../config/enum';
import env from '../config/env';
import GoogleAuth from './google-auth';

const regex = {
  whitespace: new RegExp(/\s+/g)
};

export default {
  sleep: t => new Promise(r => setTimeout(r, t)),

  trimFilename: (filename, maxLength) => {
    if (filename.length <= maxLength) return filename;
    const charNum = maxLength - 3;
    const head = [];
    const tail = [];
    filename = filename.split('');
    for (let i = 0; i < charNum; i++) {
      if (i % 2 === 0) {
        head.push(filename.shift());
      } else {
        tail.unshift(filename.pop());
      }
    }
    return head.join('') + '...' + tail.join('');
  },

  getServiceName: serviceCode => SERVICES.find(s => s.value === serviceCode).label,

  getAuthUrl: (serviceCode, socketId) => {
    if (serviceCode === SERVICE_CODES.ONEDRIVE) {
      const state = base64url.encode(JSON.stringify({ socketId, serviceCode: SERVICE_CODES.ONEDRIVE }));
      return (
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
        `?client_id=${env.ONEDRIVE_APP_ID}` +
        '&scope=files.readwrite' +
        '&response_type=token' +
        `&redirect_uri=${env.AUTH_REDIRECT_URI}` +
        `&state=${state}`
      );
    }
    if (serviceCode === SERVICE_CODES.DROPBOX) {
      const state = base64url.encode(JSON.stringify({ socketId, serviceCode: SERVICE_CODES.DROPBOX }));
      return (
        'https://www.dropbox.com/oauth2/authorize' +
        `?client_id=${env.DROPBOX_APP_ID}` +
        '&response_type=token' +
        `&redirect_uri=${env.AUTH_REDIRECT_URI}` +
        `&state=${state}`
      );
    }
    if (serviceCode === SERVICE_CODES.GOOGLE_DRIVE) {
      const client = GoogleAuth.getClient();
      const state = base64url.encode(JSON.stringify({ socketId, serviceCode: SERVICE_CODES.GOOGLE_DRIVE }));
      return GoogleAuth.getAuthUrl(client, ['https://www.googleapis.com/auth/drive']) + `&state=${state}`;
    }
  },

  formatUrl: url => {
    url = url.trim();
    if (!url.startsWith('https://') && !url.startsWith('http://')) return null;
    if (url.lastIndexOf('/') <= 7) return null;
    return regex.whitespace.test(url) ? '' : url;
  }
};
