const axios = require('axios');
const AuthService = require('../../services/auth');
const AuthModel = require('../../models/auth');
const utils = require('../../helper/utils');
const env = require('../../config/env');
const { SERVICE_CODES } = require('../../config/enum');

const authService = new AuthService(AuthModel);

module.exports.downloadFile = () => Promise.resolve();

module.exports.validateFile = () => Promise.resolve();

module.exports.saveToCloud = async (data, notifier) => {
  const { url, filename, serviceCode, jobId } = data;
  const socketId = notifier.id;
  notifier.emit('job:saveToCloudStart', { name: utils.getServiceName(serviceCode), jobId });

  const { accessToken } = await authService.getAuthInfo(socketId, serviceCode);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const postData = {
    '@microsoft.graph.sourceUrl': url,
    name: filename,
    file: {}
  };

  try {
    const response = await axios.post(env.ONEDRIVE_UPLOAD_URL, postData, {
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'respond-async' }
    });
    const { location } = response.headers;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: upload } = await axios.get(location);
      notifier.emit('job:uploadProgress', { jobId, progress: Math.round(upload.percentageComplete) });
      if (upload.status === 'completed') {
        const { data: uploadedFile } = await axios.get(`${env.ONEDRIVE_ITEM_URL}/${upload.resourceId}`, { headers });
        notifier.emit('job:saveToCloudDone', {
          ...uploadedFile,
          url: uploadedFile['@microsoft.graph.downloadUrl'],
          jobId,
          fileSize: utils.beautifyFileSize(uploadedFile.size)
        });
        break;
      }
      await utils.sleep(1000);
    }
  } catch (err) {
    if (err.response) {
      notifier.emit('job:saveToCloudError', { ...err.response.data, jobId });
      console.error(`${socketId}:job:saveToCloudError:${SERVICE_CODES.ONEDRIVE}:`, { ...err.response.data, jobId });
    } else {
      notifier.emit('job:saveToCloudError', { message: 'Unknown', jobId });
      console.error(`${socketId}:job:saveToCloudError:${SERVICE_CODES.ONEDRIVE}:`, { ...err, jobId });
    }
  }
};
