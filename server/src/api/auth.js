const router = require('express').Router();
const AuthService = require('../services/auth');
const AuthModel = require('../models/auth');
const authUtils = require('../helper/auth');
const GoogleAuth = require('../helper/google-auth');
const path = require('path');

const authService = new AuthService(AuthModel);
const authParser = path.normalize(`${__dirname}/_static/parse-auth.html`);
const tabCloser = path.normalize(`${__dirname}/_static/close-tab.html`);

router.get('/', (req, res) => {
  const isReqParsable = Object.keys(req.query).length > 0 && req.query.code && req.query.state;
  if (!isReqParsable) return res.sendFile(authParser);
  res.sendFile(tabCloser);

  // parsable request is from Google
  const authInfo = GoogleAuth.parseRequest(req.query);
  authService.saveAuthInfo(authInfo);
});

router.post('/', (req, res) => {
  res.sendStatus(204);
  const { access_token: accessToken, state } = req.body;
  if (!accessToken || !state) return;

  const { serviceCode, socketId } = authUtils.decodeState(state);
  const authInfo = { serviceCode, socketId, accessToken };
  authService.saveAuthInfo(authInfo);
});

router.all('/', (req, res) => res.status(405).end());

module.exports = router;
