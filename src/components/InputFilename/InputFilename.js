import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

function InputFilename(props) {
  return (
    <TextField
      id="filename"
      label="Filename to save"
      value={props.value}
      onChange={props.onChange('filename')}
      fullWidth
      margin="normal"
      variant="filled"
    />
  );
}

InputFilename.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default InputFilename;
