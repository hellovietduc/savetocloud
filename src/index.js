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
import { services } from './config/constants';
import utils from './helper/utils';
import './index.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      socketId: '',
      auth: new Set(),
      message: { type: '', content: '', open: false },
      url: '',
      service: services[0].value,
      filename: '',
      uploadHistory: [],
      isReconnecting: false
    };
    this.handleChangeInput = this.handleChangeInput.bind(this);
    this.handleClickSave = this.handleClickSave.bind(this);
    this.showMessage = this.showMessage.bind(this);
    this.postRequest = this.postRequest.bind(this);
    this.getAuthUrls = this.getAuthUrls.bind(this);
    this.removeAuth = this.removeAuth.bind(this);
  }

  handleChangeInput(name) {
    return event => this.setState({ [name]: event.target.value });
  }

  handleClickSave() {
    const url = utils.formatUrl(this.state.url);
    if (!url) {
      return this.showMessage('error', 'Please enter a valid URL');
    }

    this.setState({ url });
    if (this.state.auth.has(this.state.service)) return this.postRequest();

    const serviceName = utils.getServiceName(this.state.service);
    this.showMessage('error', `Please login by clicking on the ${serviceName} icon first`);
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
    for (const service of services) {
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
        auth: new Set(),
        message: { type: '', content: '', open: false },
        isReconnecting: false
      });
    });

    Realtime.on('socketId', socketId => {
      this.setState({ socketId });
    });

    Realtime.on('onedrive:authenticated', () => {
      const newAuth = new Set();
      const entries = this.state.auth.entries();
      for (const entry of entries) {
        newAuth.add(entry[0]);
      }
      newAuth.add('onedrive');
      this.setState({
        auth: newAuth,
        message: { type: '', content: '', open: false }
      });
      setTimeout(this.removeAuth, 3600000, 'onedrive');
    });

    Realtime.on('dropbox:authenticated', () => {
      const newAuth = new Set();
      const entries = this.state.auth.entries();
      for (const entry of entries) {
        newAuth.add(entry[0]);
      }
      newAuth.add('dropbox');
      this.setState({
        auth: newAuth,
        message: { type: '', content: '', open: false }
      });
      setTimeout(this.removeAuth, 3600000, 'dropbox');
    });

    Realtime.on('google-drive:authenticated', () => {
      const newAuth = new Set();
      const entries = this.state.auth.entries();
      for (const entry of entries) {
        newAuth.add(entry[0]);
      }
      newAuth.add('google-drive');
      this.setState({
        auth: newAuth,
        message: { type: '', content: '', open: false }
      });
      setTimeout(this.removeAuth, 3600000, 'google-drive');
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
                <InputService value={this.state.service} services={services} onChange={this.handleChangeInput} />
              </Grid>
              <Grid item xs={2} className="container-center">
                <BtnSave onClick={this.handleClickSave} />
              </Grid>
            </Grid>
            <InputFilename value={this.state.filename} onChange={this.handleChangeInput} />
            <UploadHistory files={this.state.uploadHistory} />
          </CardContent>
        </Card>
        <Footer />
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
