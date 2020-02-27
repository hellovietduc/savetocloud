const subscriber = require('./index');
const tasks = require('../helper/tasks');

const channel = subscriber.getChannel('server');
const { events } = channel;

channel.on(events.serverStart, () => {
  tasks.onStart(err => {
    if (err) {
      console.error('failed to start server\nexiting...');
      process.exit(0);
    }
  });
});

channel.on(events.serverExit, () => {
  tasks.onExit(err => {
    if (err) {
      console.error('failed to clean up when stopping server');
    }
  });
});
