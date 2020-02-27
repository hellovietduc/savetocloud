const subscriber = require('./index');
const notifier = require('../helper/notifier');

const channel = subscriber.getChannel('auth');
const { events } = channel;

channel.on(events.authInfoSaved, authInfo => {
  const { serviceCode, socketId } = authInfo;
  notifier('auth').emit(`${socketId}:${serviceCode}:authenticated`);
});
