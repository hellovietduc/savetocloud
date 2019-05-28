import base64url from 'base64url';

const regex = {
  whitespace: new RegExp(/\s+/g)
};

export default {
  getOneDriveAuthUrl: opts => {
    return (
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
      `?client_id=${opts.clientId}` +
      '&scope=files.readwrite' +
      '&response_type=token' +
      `&redirect_uri=${opts.redirectUri}` +
      `&state=${opts.state}`
    );
  },

  getDropboxAuthUrl: opts => '',

  getGoogleDriveAuthUrl: opts => '',

  encodeUrl: obj => base64url.encode(JSON.stringify(obj)),

  formatUrl: url => {
    url = url.trim();
    if (!url.startsWith('https://') && !url.startsWith('http://')) return null;
    if (url.lastIndexOf('/') <= 7) return null;
    return regex.whitespace.test(url) ? '' : url;
  }
};
