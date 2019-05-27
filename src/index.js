import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import API from './services/api';
import Realtime from './services/realtime';
import base64url from 'base64url';
import './index.css';

const services = [
  { label: 'OneDrive', value: 'onedrive' },
  { label: 'Dropbox', value: 'dropbox' },
  { label: 'Google Drive', value: 'google-drive' }
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      socketId: '',
      isAuthenticated: false,
      url: '',
      service: services[0].value,
      filename: '',
      message: '',
      isProcessing: false,
      fileHistory: []
    };
    this.postRequest = this.postRequest.bind(this);
    this.handleChangeInput = this.handleChangeInput.bind(this);
    this.handleClickSave = this.handleClickSave.bind(this);
  }

  postRequest() {
    this.setState({ isProcessing: true });
    API.post('/files', {
      socketId: this.state.socketId,
      url: this.state.url,
      service: this.state.service,
      filename: this.state.filename
    }).catch(err => {
      this.setState({ message: `Request failed with status ${err.response.status}`, isProcessing: false });
    });
  }

  handleChangeInput(name) {
    return event => this.setState({ [name]: event.target.value });
  }

  handleClickSave() {
    if (!this.state.url) return this.setState({ message: 'Please enter file URL' });
    if (this.state.isAuthenticated) return this.postRequest();

    const clientId = process.env.REACT_APP_ONEDRIVE_APP_ID;
    const redirectUri = process.env.REACT_APP_AUTH_REDIRECT_URI;
    const state = base64url.encode(JSON.stringify({ socketId: this.state.socketId }));
    window.open(
      `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&scope=files.readwrite&response_type=token&redirect_uri=${redirectUri}&state=${state}`,
      '_blank'
    );
  }

  componentDidMount() {
    Realtime.on('socketId', socketId => {
      this.setState({ socketId });
    });

    Realtime.on('downloadStart', () => {
      this.setState({ message: 'Downloading file to server' });
    });

    Realtime.on('downloadDone', () => {
      this.setState({ message: 'Downloaded file to server' });
    });

    Realtime.on('downloadError', err => {
      this.setState({ message: `File download error: ${err.message}` });
    });

    Realtime.on('validateStart', () => {
      this.setState({ message: 'Validating file' });
    });

    Realtime.on('validateDone', () => {
      this.setState({ message: 'File is valid' });
    });

    Realtime.on('validateError', err => {
      this.setState({ message: `File is invalid: ${err.message}` });
    });

    Realtime.on('saveToCloudStart', service => {
      this.setState({ message: `Saving file to ${service.name}` });
      Realtime.emit('credential', this.state.credential);
    });

    Realtime.on('saveToCloudDone', fileInfo => {
      const fileHistory = [...this.state.fileHistory];
      fileHistory.push({ id: fileInfo.id, name: fileInfo.name, url: fileInfo.url });
      this.setState({
        url: '',
        filename: '',
        message: 'File is saved',
        isProcessing: false,
        fileHistory
      });
    });

    Realtime.on('saveToCloudError', err => {
      this.setState({ message: `File save error: ${err.message}`, isProcessing: false });
    });

    Realtime.on('authenticated', () => {
      this.setState({ isAuthenticated: true });
      this.postRequest();
    });
  }

  render() {
    return (
      <React.Fragment>
        <Card>
          <CardContent>
            <header>
              <Typography variant="h3" gutterBottom>
                SaveToDrive
              </Typography>
              <Typography variant="h5" gutterBottom>
                Upload files from URL to Cloud Services
              </Typography>
            </header>
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
            <div className="message">{this.state.message}</div>
            {this.state.fileHistory.map(file => (
              <div key={file.id} className="download">
                <a href={file.url}>{file.name}</a>
              </div>
            ))}
            <footer />
          </CardContent>
        </Card>
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
