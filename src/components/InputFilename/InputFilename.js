import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import './InputFilename.css';

class InputFilename extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidden: true
    };
    this.toggleInput = this.toggleInput.bind(this);
    this.onChange = this.props.onChange('filename');
  }

  toggleInput() {
    this.setState({
      hidden: !this.state.hidden
    });
    this.onChange({ target: { value: '' } });
  }

  render() {
    return (
      <div className="input-filename">
        <FormControlLabel label="Change filename" control={<Checkbox color="primary" />} onChange={this.toggleInput} />
        <TextField
          id="filename"
          label="Filename to save"
          value={this.props.value}
          onChange={this.onChange}
          disabled={this.state.hidden}
          margin="normal"
          variant="filled"
        />
      </div>
    );
  }
}

InputFilename.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default InputFilename;
