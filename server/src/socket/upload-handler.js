const uuid = require('uuid/v1');
const services = require('./services');
const Queue = require('../helper/queue');
const utils = require('../helper/utils');

const queueMap = new Map();

const validateData = data => {
  const url = utils.formatUrl(data.url);
  const serviceCode = utils.formatServiceCode(data.serviceCode);
  if (!url || !serviceCode) throw new Error('Invalid params');

  const inputFilename = utils.formatFilename(data.filename);
  const urlFilename = utils.formatFilename(utils.getLastUrlPath(url));
  const fileExtension = utils.getFileExtension(urlFilename);
  const filename = inputFilename ? `${inputFilename}.${fileExtension}`.replace(/\.+$/, '') : urlFilename;

  return {
    url,
    serviceCode,
    filename
  };
};

const handleRequest = async (data, notifier) => {
  await services[data.serviceCode].downloadFile(data, notifier);
  await services[data.serviceCode].validateFile(data, notifier);
  await services[data.serviceCode].saveToCloud(data, notifier);
};

module.exports = (data, socket) => {
  try {
    data = validateData(data);

    const jobId = uuid();
    const job = {
      id: jobId,
      data: { ...data, jobId },
      handler: handleRequest
    };

    if (!queueMap.has(socket.id)) {
      const queue = new Queue(socket.id, { notifier: socket });
      queueMap.set(socket.id, queue);
      queue.add(job);
    } else {
      const queue = queueMap.get(socket.id);
      queue.add(job);
    }
  } catch (err) {
    socket.emit('invalidUpload', { ...err, message: err.message || 'Unknown' });
  }
};
