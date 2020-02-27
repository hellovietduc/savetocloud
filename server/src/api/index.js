/* eslint-disable global-require, no-unused-vars */

module.exports = app => {
  app.use('/auth', require('./auth'));
  app.use('*', (req, res) => res.status(404).end());

  app.use((err, req, res, next) => {
    res.status(err.status || 500).end();
    console.error(err);
  });
};
