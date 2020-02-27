const handleUpload = require('./upload-handler');
const AuthService = require('../services/auth');
const AuthModel = require('../models/auth');
const notifier = require('../helper/notifier');
const { SERVICES } = require('../config/enum');

const authService = new AuthService(AuthModel);

module.exports = io => {
  io.on('connection', socket => {
    // client connected, send it the socket id
    socket.emit('socketId', socket.id);

    Object.keys(SERVICES).forEach(serviceCode => {
      // client starts authenticating
      socket.on(`${serviceCode}:authenticating`, () => {
        // listen to authenticated events only once
        notifier('auth').once(`${socket.id}:${serviceCode}:authenticated`, () => {
          socket.emit(`${serviceCode}:authenticated`);
        });
      });
    });

    // client uploads file
    socket.on('newUpload', data => handleUpload(data, socket));

    // client disconnects, clean up its resources
    socket.on('disconnect', () => {
      Object.keys(SERVICES).forEach(serviceCode => {
        authService.deleteAuthInfo(socket.id, serviceCode);
      });
    });
  });
};
