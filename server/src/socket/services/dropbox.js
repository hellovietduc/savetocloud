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
  const postData = { path: `/${filename}`, url };

  try {
    const response = await axios.post(env.DROPBOX_UPLOAD_URL, postData, { headers });
    if (response.data['.tag'] === 'complete') {
      const fileSize = utils.beautifyFileSize(response.data.size);
      return notifier.emit('job:saveToCloudDone', { ...response.data, jobId, fileSize });
    }
    const { async_job_id } = response.data;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: jobStatus } = await axios.post(env.DROPBOX_UPLOAD_STATUS_URL, { async_job_id }, { headers });
      if (jobStatus['.tag'] === 'complete') {
        const fileSize = utils.beautifyFileSize(response.data.size);
        notifier.emit('job:saveToCloudDone', { ...jobStatus, jobId, fileSize });
        break;
      }
      if (jobStatus['.tag'] === 'failed') {
        notifier.emit('job:saveToCloudError', { message: 'Unknown', jobId });
        console.error(`${socketId}:job:saveToCloudError:${SERVICE_CODES.DROPBOX}:`, { ...jobStatus, jobId });
        break;
      }
      await utils.sleep(1000);
    }
  } catch (err) {
    if (err.response) {
      notifier.emit('job:saveToCloudError', { ...err.response.data, jobId });
      console.error(`${socketId}:job:saveToCloudError:${SERVICE_CODES.DROPBOX}:`, { ...err.response.data, jobId });
    } else {
      notifier.emit('job:saveToCloudError', { message: 'Unknown', jobId });
      console.error(`${socketId}:job:saveToCloudError:${SERVICE_CODES.DROPBOX}:`, { ...err, jobId });
    }
  }
};
