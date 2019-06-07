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
    API.post('/files', {
      socketId: this.state.socketId,
      url: this.state.url,
      service: this.state.service,
      filename: this.state.filename
    })
      .then(res => {
        this.showMessage('info', res.data.msg);
      })
      .catch(err => {
        const errMessage = err.response.data.msg ? `: ${err.response.data.msg}` : '';
        this.showMessage('error', `Request failed with status ${err.response.status}${errMessage}`);
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
        message: { type: '', content: '', open: false }
      });
    });

    Realtime.on('socketId', socketId => {
      this.setState({ socketId });
    });

    Realtime.on('job:downloadStart', info => {
      const { jobId } = info;
      this.showMessage('info', 'Downloading file to server');
    });

    Realtime.on('job:downloadDone', info => {
      const { jobId } = info;
      this.showMessage('success', 'Downloaded file to server');
    });

    Realtime.on('job:downloadError', err => {
      const { jobId } = err;
      this.showMessage('error', `File download error: ${err.message}`, false);
    });

    Realtime.on('job:validateStart', info => {
      const { jobId } = info;
      this.showMessage('info', 'Validating file');
    });

    Realtime.on('job:validateDone', info => {
      const { jobId } = info;
      this.showMessage('success', 'File is valid');
    });

    Realtime.on('job:validateError', err => {
      const { jobId } = err;
      this.showMessage('error', `File is invalid: ${err.message}`);
    });

    Realtime.on('job:saveToCloudStart', info => {
      const { jobId } = info;
      this.showMessage('info', `Saving file to ${info.name}`);
    });

    Realtime.on('job:saveToCloudDone', info => {
      const { jobId } = info;
      const fileHistory = [...this.state.fileHistory];
      fileHistory.unshift({
        id: info.id,
        name: info.name,
        url: info.url
      });
      this.showMessage('success', 'File is saved', () => {
        this.setState({
          url: '',
          filename: '',
          fileHistory
        });
      });
    });

    Realtime.on('job:saveToCloudError', err => {
      const { jobId } = err;
      this.showMessage('error', `File save error: ${err.message}`);
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
            <ServicesBar auth={this.state.auth} urls={this.getAuthUrls()} />
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
            <FileHistory files={this.state.fileHistory} />
          </CardContent>
        </Card>
        <Footer />
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
