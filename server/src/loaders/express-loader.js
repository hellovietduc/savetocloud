const express = require('express');
const cors = require('cors');
const compression = require('compression');
const route = require('../api');

module.exports = app => {
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.disable('x-powered-by');
  app.enable('trust proxy');

  app.get('/_status', (req, res) => res.sendStatus(200));

  route(app);

  console.log('express initialized');

  return app;
};
