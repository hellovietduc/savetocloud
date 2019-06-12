export const SERVICES = [
  { label: 'OneDrive', value: 'ONEDRIVE' },
  { label: 'Dropbox', value: 'DROPBOX' },
  { label: 'Google Drive', value: 'GOOGLE_DRIVE' }
];

export const SERVICE_CODES = {
  ONEDRIVE: 'ONEDRIVE',
  DROPBOX: 'DROPBOX',
  GOOGLE_DRIVE: 'GOOGLE_DRIVE'
};

export const MESSAGES = {
  RECONNECTING: 'Server connection error, reconnecting...',
  NOT_LOGGED_IN: serviceName => `Please login by clicking on the ${serviceName} icon first`,
  INVALID_URL: 'Please enter a valid URL',
  INVALID_FILENAME: 'Please enter filename',
  UPLOAD_ADDED: filename => `Upload added to the queue: ${filename}`,
  UPLOAD_PROCESSING: filename => `Processing upload: ${filename}`,
  UPLOAD_DONE: filename => `Upload done: ${filename}`,
  UPLOAD_RETRY: filename => `Retry upload: ${filename}`,
  UPLOAD_FAILED: filename => `Upload failed: ${filename}`
};

export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  COMPLETED: 'completed',
  RETRYING: 'retrying',
  FAILED: 'failed'
};
