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
import FileHistory from './components/FileHistory';
import Footer from './components/Footer';
import API from './services/api';
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
      isReconnecting: false,
      isProcessing: false,
      url: '',
      service: services[0].value,
      filename: '',
      message: { type: '', content: '', open: false },
      fileHistory: []
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
    this.setState({ isProcessing: true });

    const url = utils.formatUrl(this.state.url);
    if (!url) {
      return this.showMessage('error', 'Please enter a valid URL', false);
    }

    this.setState({ url });
    if (this.state.auth.has(this.state.service)) return this.postRequest();

    const serviceName = utils.getServiceName(this.state.service);
    this.showMessage('error', `Please login by clicking on the ${serviceName} icon first`, false);
  }

  showMessage(variant, message, processing, cb) {
    if (processing === undefined && cb === undefined) {
      this.setState({ message: { type: variant, content: message, open: true } });
    } else if (typeof processing === 'boolean' && cb === undefined) {
      this.setState({
        message: { type: variant, content: message, open: true },
        isProcessing: processing
      });
    } else if (typeof processing === 'function' && cb === undefined) {
      cb = processing;
      this.setState({ message: { type: variant, content: message, open: true } }, cb);
    } else if (typeof processing === 'boolean' && typeof cb === 'function') {
      this.setState(
        {
          message: { type: variant, content: message, open: true },
          isProcessing: processing
        },
        cb
      );
    }
    setTimeout(() => this.setState({ message: { type: '', content: '', open: false } }), 5000);
  }

  postRequest() {
    API.post('/files', {
      socketId: this.state.socketId,
      url: this.state.url,
      service: this.state.service,
      filename: this.state.filename
    }).catch(err => {
      const errMessage = err.response.data.msg ? `: ${err.response.data.msg}` : '';
      this.showMessage('error', `Request failed with status ${err.response.status}${errMessage}`, false);
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
        isReconnecting: false,
        isProcessing: false,
        message: { type: '', content: '', open: false }
      });
    });

    Realtime.on('socketId', socketId => {
      this.setState({ socketId });
    });

    Realtime.on('maxRequestsExceeded', async () => {
      let secs = 60;
      do {
        if (!this.state.isReconnecting) {
          this.showMessage('error', `Max number of requests exceeded, please wait for ${secs}s`, true);
        }
        secs--;
        await utils.sleep(1000);
      } while (secs > 0);
      this.setState({
        message: { type: '', content: '' },
        isProcessing: false
      });
    });

    Realtime.on('downloadStart', () => {
      this.showMessage('info', 'Downloading file to server');
    });

    Realtime.on('downloadDone', () => {
      this.showMessage('success', 'Downloaded file to server');
    });

    Realtime.on('downloadError', err => {
      this.showMessage('error', `File download error: ${err.message}`, false);
    });

    Realtime.on('validateStart', () => {
      this.showMessage('info', 'Validating file');
    });

    Realtime.on('validateDone', () => {
      this.showMessage('success', 'File is valid');
    });

    Realtime.on('validateError', err => {
      this.showMessage('error', `File is invalid: ${err.message}`, false);
    });

    Realtime.on('saveToCloudStart', service => {
      this.showMessage('info', `Saving file to ${service.name}`);
    });

    Realtime.on('saveToCloudDone', fileInfo => {
      const fileHistory = [...this.state.fileHistory];
      fileHistory.unshift({
        id: fileInfo.id,
        name: fileInfo.name,
        url: fileInfo.url
      });
      this.showMessage('success', 'File is saved', () => {
        this.setState({
          url: '',
          filename: '',
          isProcessing: false,
          fileHistory
        });
      });
    });

    Realtime.on('saveToCloudError', err => {
      this.showMessage('error', `File save error: ${err.message}`, false);
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

    Realtime.on('connect_error', async () => {
      this.showMessage('error', 'Server connection error, reconnecting...', () => {
        this.setState({
          isProcessing: true,
          isReconnecting: true
        });
      });
    });
  }

  render() {
    return (
      <React.Fragment>
        <MessageBar message={this.state.message} />
        <LinearProgress style={{ display: this.state.isProcessing ? 'block' : 'none' }} />
        <Card>
          <CardContent>
            <Header />
            <ServicesBar auth={this.state.auth} urls={this.getAuthUrls()} />
            <Grid container spacing={1} justify="space-around">
              <Grid item xs={7}>
                <InputUrl value={this.state.url} onChange={this.handleChangeInput} />
              </Grid>
              <Grid item xs={3}>
                <InputService value={this.state.service} services={services} onChange={this.handleChangeInput} />
              </Grid>
              <Grid item xs={2} className="container-center">
                <BtnSave disabled={this.state.isProcessing} onClick={this.handleClickSave} />
              </Grid>
            </Grid>
            <InputFilename value={this.state.filename} onChange={this.handleChangeInput} />
            <FileHistory files={this.state.fileHistory} />
          </CardContent>
        </Card>
        <Footer />
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
