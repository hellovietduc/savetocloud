import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LinearProgress from '@material-ui/core/LinearProgress';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Header from './components/Header';
import InputUrl from './components/InputUrl';
import InputService from './components/InputService';
import InputFilename from './components/InputFilename';
import BtnSave from './components/BtnSave';
import NotiMessage from './components/NotiMessage';
import FileHistory from './components/FileHistory';
import Footer from './components/Footer';
import API from './services/api';
import Realtime from './services/realtime';
import { services } from './config/constants';
import env from './config/env';
import utils from './helper/utils';
import './index.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      socketId: '',
      auth: [],
      isReconnecting: false,
      isProcessing: false,
      url: '',
      service: services[0].value,
      filename: '',
      message: {
        type: '',
        content: ''
      },
      fileHistory: []
    };
    this.handleChangeInput = this.handleChangeInput.bind(this);
    this.handleClickSave = this.handleClickSave.bind(this);
    this.postRequest = this.postRequest.bind(this);
    this.removeAuth = this.removeAuth.bind(this);
  }

  handleChangeInput(name) {
    return event => this.setState({ [name]: event.target.value });
  }

  handleClickSave() {
    this.setState({ isProcessing: true });

    const url = utils.formatUrl(this.state.url);
    if (!url) {
      return this.setState({
        message: { type: 'error', content: 'Please enter a valid URL' },
        isProcessing: false
      });
    }

    this.setState({ url });
    if (this.state.auth.includes(this.state.service)) return this.postRequest();

    const state = utils.encodeUrl({ socketId: this.state.socketId, serviceCode: this.state.service });
    if (this.state.service === 'onedrive') {
      window.open(
        utils.getOneDriveAuthUrl({
          clientId: env.ONEDRIVE_APP_ID,
          redirectUri: env.AUTH_REDIRECT_URI,
          state
        }),
        '_blank'
      );
    }
    if (this.state.service === 'dropbox') {
      window.open(
        utils.getDropboxAuthUrl({
          clientId: env.DROPBOX_APP_ID,
          redirectUri: env.AUTH_REDIRECT_URI,
          state
        }),
        '_blank'
      );
    }
    if (this.state.service === 'google-drive') {
      this.setState({
        message: { type: 'info', content: 'Google Drive is not yet supported' },
        isProcessing: false
      });
    }
  }

  postRequest() {
    API.post('/files', {
      socketId: this.state.socketId,
      url: this.state.url,
      service: this.state.service,
      filename: this.state.filename
    }).catch(err => {
      const errMessage = err.response.data.msg ? `: ${err.response.data.msg}` : '';
      this.setState({
        message: {
          type: 'error',
          content: `Request failed with status ${err.response.status}${errMessage}`
        },
        isProcessing: false
      });
    });
  }

  removeAuth(serviceCode) {
    const auth = [...this.state.auth];
    auth.splice(auth.indexOf(serviceCode), 1);
    this.setState({ auth });
  }

  componentDidMount() {
    Realtime.on('connect', () => {
      this.setState({
        auth: [],
        isReconnecting: false,
        isProcessing: false,
        message: { type: '', content: '' }
      });
    });

    Realtime.on('socketId', socketId => {
      this.setState({ socketId });
    });

    Realtime.on('maxRequestsExceeded', async () => {
      let secs = 60;
      do {
        if (!this.state.isReconnecting)
          this.setState({
            message: { type: 'error', content: `Max number of requests exceeded, please wait for ${secs}s` },
            isProcessing: true
          });
        secs--;
        await new Promise(r => setTimeout(r, 1000));
      } while (secs > 0);
      this.setState({
        message: { type: '', content: '' },
        isProcessing: false
      });
    });

    Realtime.on('downloadStart', () => {
      this.setState({ message: { type: 'info', content: 'Downloading file to server' } });
    });

    Realtime.on('downloadDone', () => {
      this.setState({ message: { type: 'success', content: 'Downloaded file to server' } });
    });

    Realtime.on('downloadError', err => {
      this.setState({
        message: { type: 'error', content: `File download error: ${err.message}` },
        isProcessing: false
      });
    });

    Realtime.on('validateStart', () => {
      this.setState({ message: { type: 'info', content: 'Validating file' } });
    });

    Realtime.on('validateDone', () => {
      this.setState({ message: { type: 'success', content: 'File is valid' } });
    });

    Realtime.on('validateError', err => {
      this.setState({
        message: { type: 'error', content: `File is invalid: ${err.message}` },
        isProcessing: false
      });
    });

    Realtime.on('saveToCloudStart', service => {
      this.setState({ message: { type: 'info', content: `Saving file to ${service.name}` } });
      Realtime.emit('credential', this.state.credential);
    });

    Realtime.on('saveToCloudDone', fileInfo => {
      const fileHistory = [...this.state.fileHistory];
      fileHistory.push({
        id: fileInfo.id,
        name: fileInfo.name,
        url: fileInfo.url
      });
      this.setState({
        url: '',
        filename: '',
        message: { type: 'success', content: 'File is saved' },
        isProcessing: false,
        fileHistory
      });
    });

    Realtime.on('saveToCloudError', err => {
      this.setState({
        message: { type: 'error', content: `File save error: ${err.message}` },
        isProcessing: false
      });
    });

    Realtime.on('onedrive:authenticated', () => {
      this.setState({ auth: [...this.state.auth, 'onedrive'] });
      this.postRequest();
      setTimeout(this.removeAuth, 3600000, 'onedrive');
    });

    Realtime.on('dropbox:authenticated', () => {
      this.setState({ auth: [...this.state.auth, 'dropbox'] });
      this.postRequest();
      setTimeout(this.removeAuth, 3600000, 'dropbox');
    });

    Realtime.on('google-drive:authenticated', () => {
      this.setState({ auth: [...this.state.auth, 'google-drive'] });
      this.postRequest();
      setTimeout(this.removeAuth, 3600000, 'google-drive');
    });

    Realtime.on('connect_error', async () => {
      this.setState({
        message: { type: 'error', content: 'Server connection error, reconnecting...' },
        isProcessing: true,
        isReconnecting: true
      });
    });
  }

  render() {
    return (
      <React.Fragment>
        <LinearProgress style={{ display: this.state.isProcessing ? 'block' : 'none' }} />
        <Card>
          <CardContent>
            <Header />
            <Grid container spacing={1} justify="space-around">
              <Grid item xs={4}>
                <InputUrl value={this.state.url} onChange={this.handleChangeInput} />
              </Grid>
              <Grid item xs={3}>
                <InputService value={this.state.service} services={services} onChange={this.handleChangeInput} />
              </Grid>
              <Grid item xs={3}>
                <InputFilename value={this.state.filename} onChange={this.handleChangeInput} />
              </Grid>
              <Grid item xs={2} className="container-center">
                <BtnSave disabled={this.state.isProcessing} onClick={this.handleClickSave} />
              </Grid>
            </Grid>
            <NotiMessage type={this.state.message.type} message={this.state.message.content} />
            <FileHistory files={this.state.fileHistory} />
          </CardContent>
        </Card>
        <Footer />
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
