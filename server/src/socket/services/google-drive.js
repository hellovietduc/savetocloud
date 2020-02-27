const { google } = require('googleapis');
const AuthService = require('../../services/auth');
const AuthModel = require('../../models/auth');
const utils = require('../../helper/utils');
const GoogleAuth = require('../../helper/google-auth');
const env = require('../../config/env');
const { SERVICE_CODES } = require('../../config/enum');
const fs = require('fs');
const path = require('path');

const authService = new AuthService(AuthModel);

module.exports.downloadFile = (data, notifier) =>
  new Promise((resolve, reject) => {
    const { url, jobId } = data;
    const socketId = notifier.id;
    notifier.emit('job:downloadStart', { jobId });

    data.filePath = path.normalize(`${env.TEMP_DIR}/${Date.now()}`);
    utils
      .downloadFile(url, data.filePath)
      .then(() => {
        const fileSize = fs.statSync(data.filePath).size;
        notifier.emit('job:downloadDone', { jobId, fileSize: utils.beautifyFileSize(fileSize) });
        data.fileSize = fileSize;
        resolve();
      })
      .catch(err => {
        notifier.emit('job:downloadError', { ...err, jobId });
        console.error(`${socketId}:job:downloadError:${SERVICE_CODES.GOOGLE_DRIVE}:`, { ...err, jobId });
        reject(err);
      });
  });

module.exports.validateFile = async (data, notifier) => {
  const { filePath, jobId } = data;
  const socketId = notifier.id;
  notifier.emit('job:validateStart', { jobId });

  try {
    const mimeType = await utils.findMimeType(filePath);
    notifier.emit('job:validateDone', { jobId });
    data.mimeType = mimeType;
  } catch (err) {
    notifier.emit('job:validateError', { ...err, jobId });
    console.error(`${socketId}:job:validateError:${SERVICE_CODES.GOOGLE_DRIVE}:`, { ...err, jobId });
  }
};

module.exports.saveToCloud = async (data, notifier) => {
  const { serviceCode, filename, filePath, mimeType, fileSize, jobId } = data;
  const socketId = notifier.id;
  notifier.emit('job:saveToCloudStart', { name: utils.getServiceName(serviceCode), jobId });

  const client = GoogleAuth.getClient();
  const { raw: authInfo } = await authService.getAuthInfo(socketId, serviceCode);
  client.setCredentials(authInfo);

  const drive = google.drive({ version: 'v3', auth: client });
  try {
    const { data: fileData } = await drive.files.create(
      {
        requestBody: {
          name: filename,
          mimeType
        },
        media: {
          body: fs.createReadStream(filePath),
          mimeType
        }
      },
      {
        onUploadProgress: event => {
          const progress = (event.bytesRead / fileSize) * 100;
          notifier.emit('job:uploadProgress', { jobId, progress: Math.round(progress) });
        }
      }
    );
    notifier.emit('job:saveToCloudDone', { ...fileData, jobId });
  } catch (err) {
    notifier.emit('job:saveToCloudError', { ...err, jobId });
    console.error(`${socketId}:job:saveToCloudError:${SERVICE_CODES.GOOGLE_DRIVE}:`, { ...err, jobId });
  }
  fs.unlink(filePath, err => {
    if (err) console.error(`${socketId}:job:unlinkFileError:${SERVICE_CODES.GOOGLE_DRIVE}`, { jobId });
  });
};
