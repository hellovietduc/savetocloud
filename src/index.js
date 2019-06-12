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
import { SERVICES } from './config/enum';
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
      service: SERVICES[0].value,
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
      return this.showMessage('error', 'Please enter a valid URL');
    }
    this.setState({ url });

    if (!this.state.auth.has(this.state.service)) {
      const serviceName = utils.getServiceName(this.state.service);
      return this.showMessage('error', `Please login by clicking on the ${serviceName} icon first`);
    }

    if (this.state.changeFilename && !this.state.filename.trim()) {
      return this.showMessage('error', 'Please enter filename');
    }

    this.postRequest();
  }

  handleClearUploadHistory() {
    const newUploadHistory = this.state.uploadHistory.filter(upload => upload.status !== 'completed');
    this.setState({ uploadHistory: newUploadHistory });
  }

  showMessage(variant, message, cb) {
    this.setState({ message: { type: variant, content: message, open: true } }, cb);
    setTimeout(() => this.setState({ message: { type: '', content: '', open: false } }), 5000);
  }

  postRequest() {
    Realtime.emit('newUpload', {
      url: this.state.url,
      service: this.state.service,
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

    Realtime.on('ONEDRIVE:authenticated', () => {
      const newAuth = new Set();
      const entries = this.state.auth.entries();
      for (const entry of entries) {
        newAuth.add(entry[0]);
      }
      newAuth.add('ONEDRIVE');
      this.setState({
        auth: newAuth,
        message: { type: '', content: '', open: false }
      });
      setTimeout(this.removeAuth, 3600000, 'ONEDRIVE');
    });

    Realtime.on('DROPBOX:authenticated', () => {
      const newAuth = new Set();
      const entries = this.state.auth.entries();
      for (const entry of entries) {
        newAuth.add(entry[0]);
      }
      newAuth.add('DROPBOX');
      this.setState({
        auth: newAuth,
        message: { type: '', content: '', open: false }
      });
      setTimeout(this.removeAuth, 3600000, 'DROPBOX');
    });

    Realtime.on('GOOGLE_DRIVE:authenticated', () => {
      const newAuth = new Set();
      const entries = this.state.auth.entries();
      for (const entry of entries) {
        newAuth.add(entry[0]);
      }
      newAuth.add('GOOGLE_DRIVE');
      this.setState({
        auth: newAuth,
        message: { type: '', content: '', open: false }
      });
      setTimeout(this.removeAuth, 3600000, 'GOOGLE_DRIVE');
    });

    Realtime.on('invalidUpload', err => {
      this.showMessage('error', err.message);
    });

    Realtime.on('queue:newPendingJob', data => {
      const { jobId, filename, serviceCode } = data;
      this.showMessage('info', `Upload added to the queue: ${filename}`);
      const newUploadHistory = [...this.state.uploadHistory];
      newUploadHistory.unshift({
        id: jobId,
        name: filename,
        service: utils.getServiceName(serviceCode),
        status: 'pending'
      });
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('queue:jobProcessing', data => {
      const { jobId, filename } = data;
      this.showMessage('info', `Processing upload: ${filename}`);
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.status = 'uploading';
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('queue:jobDone', data => {
      const { jobId, filename } = data;
      this.showMessage('info', `Upload done: ${filename}`);
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.status = 'completed';
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('queue:jobRetry', data => {
      const { jobId, filename } = data;
      this.showMessage('info', `Retry upload: ${filename}`);
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.status = 'retrying';
      this.setState({ uploadHistory: newUploadHistory });
    });

    Realtime.on('queue:jobFailed', data => {
      const { jobId, filename } = data;
      this.showMessage('info', `Upload failed: ${filename}`);
      const newUploadHistory = [...this.state.uploadHistory];
      const file = newUploadHistory.find(one => one.id === jobId);
      file.status = 'failed';
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
      this.showMessage('error', 'Server connection error, reconnecting...', () => {
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
                <InputService value={this.state.service} services={SERVICES} onChange={this.handleChangeInput} />
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
