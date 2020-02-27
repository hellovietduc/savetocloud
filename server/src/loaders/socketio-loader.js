const socketio = require('socket.io');
const handleSocket = require('../socket');

module.exports = server => {
  if (!server) return;

  const io = socketio(server);

  handleSocket(io);

  console.log('socket.io initialized');

  return io;
};
