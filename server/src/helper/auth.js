const base64url = require('base64url');

module.exports.decodeState = state => JSON.parse(base64url.decode(state));
