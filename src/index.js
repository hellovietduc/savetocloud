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
import './index.css';

const services = [
  { label: 'Google Drive', value: 'google-drive' },
  { label: 'OneDrive', value: 'onedrive' },
  { label: 'Dropbox', value: 'dropbox' }
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      service: services[0].value
    };
    this.handleChangeService = this.handleChangeService.bind(this);
  }

  handleChangeService(event) {
    this.setState({ service: event.target.value });
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
                Upload to Cloud Services via URL
              </Typography>
            </header>
            <Grid container spacing={1} justify="space-around">
              <Grid item xs={4}>
                <TextField required id="url" label="File URL" margin="normal" fullWidth variant="filled" />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  required
                  select
                  id="service"
                  label="Cloud Service"
                  value={this.state.service}
                  onChange={this.handleChangeService}
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
                <TextField id="filename" label="Filename to save" margin="normal" fullWidth variant="filled" />
              </Grid>
              <Grid item xs={2} className="container-center">
                <Button size="large" variant="contained">
                  Save
                  <CloudUploadIcon className="icon-cloud-upload" />
                </Button>
              </Grid>
            </Grid>
            <footer />
          </CardContent>
        </Card>
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
