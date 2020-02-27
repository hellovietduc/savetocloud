import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LinearProgress from '@material-ui/core/LinearProgress';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import MessageBar from './components/MessageBar';
import Header from './components/Header';
import ServicesBar from './components/ServicesBar';
import InputUrl from './components/InputUrl';
import InputService from './components/InputService';
import InputFilename from './components/InputFilename';
import BtnSave from './components/BtnSave';
import UploadHistory from './components/UploadHistory';
import Footer from './components/Footer';
import Realtime from './services/realtime';
import { SERVICES, SERVICE_CODES, MESSAGES, UPLOAD_STATUS } from './config/enum';
import env from './config/env';
import utils from './helper/utils';
import './index.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isReconnecting: false,
      socketId: '',
      auth: new Set(),
      message: { type: '', content: '', open: false },
      url: '',
      serviceCode: SERVICES[0].value,
      filename: '',
      changeFilename: false,
      uploadHistory: []
    };
    this.handleChangeInput = this.handleChangeInput.bind(this);
    this.toggleChangeFilename = this.toggleChangeFilename.bind(this);
    this.handleClickSave = this.handleClickSave.bind(this);
    this.handleClearUploadHistory = this.handleClearUploadHistory.bind(this);
    this.showMessage = this.showMessage.bind(this);
    this.postRequest = this.postRequest.bind(this);
    this.getAuthUrls = this.getAuthUrls.bind(this);
    this.removeAuth = this.removeAuth.bind(this);
  }

  handleChangeInput(name) {
    return event => this.setState({ [name]: event.target.value });
  }

  toggleChangeFilename() {
    this.setState({ changeFilename: !this.state.changeFilename });
  }

  handleClickSave() {
    const url = utils.formatUrl(this.state.url);
    if (!url) {
      return this.showMessage('error', MESSAGES.INVALID_URL);
    }
    this.setState({ url });

    if (!this.state.auth.has(this.state.serviceCode)) {
      const serviceName = utils.getServiceName(this.state.serviceCode);
      return this.showMessage('error', MESSAGES.NOT_LOGGED_IN(serviceName));
    }

    if (this.state.changeFilename && !this.state.filename.trim()) {
      return this.showMessage('error', MESSAGES.INVALID_FILENAME);
    }

    this.postRequest();
  }

  handleClearUploadHistory() {
    const newUploadHistory = this.state.uploadHistory.filter(
      upload => upload.status !== UPLOAD_STATUS.COMPLETED && upload.status !== UPLOAD_STATUS.FAILED
    );
    this.setState({ uploadHistory: newUploadHistory });
  }

  showMessage(variant, message, cb) {
    this.setState({ message: { type: variant, content: message, open: true } }, cb);
    setTimeout(() => this.setState({ message: { type: '', content: '', open: false } }), env.NOTI_DISP_TIME);
  }

  postRequest() {
    Realtime.emit('newUpload', {
      url: this.state.url,
      serviceCode: this.state.serviceCode,
      filename: this.state.filename
    });
    this.setState({
      url: '',
      filename: ''
    });
  }

  getAuthUrls() {
    const urls = {};
    for (const service of SERVICES) {
      urls[service.value] = utils.getAuthUrl(service.value, this.state.socketId);
    }
    return urls;
  }

  removeAuth(serviceCode) {
    const newAuth = new Set();
    const entries = this.state.auth.entries();
    for (const entry of entries) {
      if (entry[0] !== serviceCode) newAuth.add(entry[0]);
    }
    this.setState({ auth: newAuth });
  }

  componentDidMount() {
    Realtime.on('connect', () => {
      this.setState({
        isReconnecting: false,
        auth: new Set(),
        message: { type: '', content: '', open: false }
      });
    });

    Realtime.on('socketId', socketId => {
      this.setState({ socketId });
    });

    Object.values(SERVICE_CODES).forEach(code => {
      Realtime.on(`${code}:authenticated`, () => {
        const newAuth = new Set();
        const entries = this.state.auth.entries();
        for (const entry of entries) {
          newAuth.add(entry[0]);
        }
        newAuth.add(code);
        this.setState({
          auth: newAuth,
          message: { type: '', content: '', open: false }
        });
        setTimeout(this.removeAuth, env.TOKEN_EXP_TIME, code);
      });
    });

    Realtime.on('invalidUpload', err => {
      this.showMessage('error', err.message);
    });

    Realtime.on('queue:newPendingJob', data => {
      const { jobId, filename, serviceCode } = data;
      this.showMessage('info', MESSAGES.UPLOAD_ADDED(filename));
      const newUploadHistory = [...this.state.uploadHistory];
      newUploadHistory.unshift({
        id: jobId,
        name: filename,
        serviceName: utils.getServiceName(serviceCode),
        status: UPLOAD_STATUS.PENDING
      });
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('queue:jobProcessing', data => {
      const { jobId, filename } = data;
      this.showMessage('info', MESSAGES.UPLOAD_PROCESSING(filename));
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.status = UPLOAD_STATUS.UPLOADING;
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('queue:jobDone', data => {
      const { jobId, filename } = data;
      this.showMessage('info', MESSAGES.UPLOAD_DONE(filename));
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.status = UPLOAD_STATUS.COMPLETED;
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('queue:jobRetry', data => {
      const { jobId, filename } = data;
      this.showMessage('info', MESSAGES.UPLOAD_RETRY(filename));
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.status = UPLOAD_STATUS.RETRYING;
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('queue:jobFailed', data => {
      const { jobId, filename } = data;
      this.showMessage('info', MESSAGES.UPLOAD_FAILED(filename));
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.status = UPLOAD_STATUS.FAILED;
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('job:downloadDone', data => {
      const { jobId, fileSize } = data;
      if (!fileSize) return;
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.size = fileSize;
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('job:saveToCloudDone', data => {
      const { jobId, fileSize } = data;
      if (!fileSize) return;
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.size = fileSize;
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('job:uploadProgress', data => {
      const { jobId, progress } = data;
      if (!progress) return;
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.progress = progress;
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('connect_error', async () => {
      this.showMessage('error', MESSAGES.RECONNECTING, () => {
        this.setState({ isReconnecting: true });
      });
    });
  }

  render() {
    return (
      <React.Fragment>
        <MessageBar message={this.state.message} />
        <LinearProgress style={{ display: this.state.isReconnecting ? 'block' : 'none' }} />
        <Card>
          <CardContent>
            <Header />
            <ServicesBar auth={this.state.auth} urls={this.getAuthUrls()} Realtime={Realtime} />
            <Grid container spacing={1} justify="space-around">
              <Grid item xs={7}>
                <InputUrl value={this.state.url} onChange={this.handleChangeInput} />
              </Grid>
              <Grid item xs={3}>
                <InputService value={this.state.serviceCode} services={SERVICES} onChange={this.handleChangeInput} />
              </Grid>
              <Grid item xs={2} className="container-center">
                <BtnSave disabled={this.state.isReconnecting} onClick={this.handleClickSave} />
              </Grid>
            </Grid>
            <InputFilename
              disabled={!this.state.changeFilename}
              value={this.state.filename}
              onChange={this.handleChangeInput}
              onToggle={this.toggleChangeFilename}
            />
            <UploadHistory files={this.state.uploadHistory} onClear={this.handleClearUploadHistory} />
          </CardContent>
        </Card>
        <Footer />
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
