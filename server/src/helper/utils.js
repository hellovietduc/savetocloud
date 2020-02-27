const http = require('http');
const https = require('https');
const fs = require('fs');
const readChunk = require('read-chunk');
const fileType = require('file-type');
const { SERVICES } = require('../config/enum');

module.exports.sleep = t => new Promise(r => setTimeout(r, t));

const regex = {
  whitespace: new RegExp(/\s+/g),
  filename: new RegExp(/[^A-Za-z0-9\-_.]/g)
};

module.exports.formatUrl = url => {
  url = url.trim();
  if (!url.startsWith('https://') && !url.startsWith('http://')) return null;
  if (url.lastIndexOf('/') <= 7) return null;
  return regex.whitespace.test(url) ? null : url;
};

module.exports.formatServiceCode = name => {
  name = name.trim();
  if (regex.whitespace.test(name)) return null;
  if (!Object.keys(SERVICES).includes(name)) return null;
  return name;
};

module.exports.formatFilename = name => {
  name = name.trim();
  return name.replace(regex.filename, '_');
};

module.exports.getLastUrlPath = path => {
  path = path || '';
  path = path.replace(/\/+$/, '');
  return path.substring(path.lastIndexOf('/') + 1, path.length);
};

module.exports.getServiceName = serviceCode => {
  return SERVICES[serviceCode];
};

const one = {
  gb: 1024 * 1024 * 1024,
  mb: 1024 * 1024,
  kb: 1024,
  b: 1
};

module.exports.beautifyFileSize = value => {
  for (const unit of Object.keys(one)) {
    if (value >= one[unit]) {
      value = value / one[unit];
      value = +value.toFixed(2);
      return `${value} ${unit.toUpperCase()}`;
    }
  }
};

module.exports.getFileExtension = filename => {
  if (!filename.includes('.')) return '';
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length);
};

module.exports.findMimeType = async filePath => {
  const buffer = readChunk.sync(filePath, 0, fileType.minimumBytes);
  const { mime } = (await fileType(buffer)) || {};
  if (mime) return mime;

  if (filePath.endsWith('.zip')) return 'application/zip';
  if (filePath.endsWith('.rar')) return 'application/x-rar-compressed';
};

const downloader = { http, https };

module.exports.downloadFile = (url, dest) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    downloader[url.substring(0, url.indexOf('://'))]
      .get(url, response => {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', err => {
        fs.unlink(dest);
        reject(err);
      });
  });
