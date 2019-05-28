import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import LinearProgress from '@material-ui/core/LinearProgress';
import Header from './components/Header';
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
      isAuthenticated: false,
      url: '',
      service: services[0].value,
      filename: '',
      message: {
        type: '',
        content: ''
      },
      isProcessing: false,
      fileHistory: []
    };
    this.postRequest = this.postRequest.bind(this);
    this.handleChangeInput = this.handleChangeInput.bind(this);
    this.handleClickSave = this.handleClickSave.bind(this);
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

  handleChangeInput(name) {
    return event => this.setState({ [name]: event.target.value });
  }

  handleClickSave() {
    this.setState({ isProcessing: true });

    const url = utils.formatUrl(this.state.url);
    if (!url)
      return this.setState({
        message: { type: 'error', content: 'Please enter a valid URL' },
        isProcessing: false
      });

    this.setState({ url });
    if (this.state.isAuthenticated) return this.postRequest();

    if (this.state.service === 'onedrive') {
      const clientId = env.ONEDRIVE_APP_ID;
      const redirectUri = env.AUTH_REDIRECT_URI;
      const state = utils.encodeUrl({ socketId: this.state.socketId });
      window.open(utils.getOneDriveAuthUrl({ clientId, redirectUri, state }), '_blank');
    }
    if (this.state.service === 'dropbox') {
      this.setState({
        message: { type: 'info', content: 'Dropbox is not yet supported' },
        isProcessing: false
      });
    }
    if (this.state.service === 'google-drive') {
      this.setState({
        message: { type: 'info', content: 'Google Drive is not yet supported' },
        isProcessing: false
      });
    }
  }

  componentDidMount() {
    Realtime.on('socketId', socketId => {
      this.setState({ socketId });
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

    Realtime.on('authenticated', () => {
      this.setState({ isAuthenticated: true });
      this.postRequest();
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
                <TextField
                  required
                  id="url"
                  label="File URL"
                  value={this.state.url}
                  onChange={this.handleChangeInput('url')}
                  error={!this.state.url}
                  autoFocus={true}
                  margin="normal"
                  fullWidth
                  variant="filled"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  required
                  select
                  id="service"
                  label="Cloud Service"
                  value={this.state.service}
                  onChange={this.handleChangeInput('service')}
                  margin="normal"
                  fullWidth
                  variant="filled"
                >
                  {services.map(service => (
                    <MenuItem key={service.value} value={service.value}>
                      {service.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id="filename"
                  label="Filename to save"
                  value={this.state.filename}
                  onChange={this.handleChangeInput('filename')}
                  margin="normal"
                  fullWidth
                  variant="filled"
                />
              </Grid>
              <Grid item xs={2} className="container-center">
                <Button
                  onClick={this.handleClickSave}
                  disabled={this.state.isProcessing}
                  size="large"
                  variant="contained"
                >
                  Save
                  <CloudUploadIcon className="icon-cloud-upload" />
                </Button>
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
