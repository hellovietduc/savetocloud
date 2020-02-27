import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

function InputUrl(props) {
  return (
    <TextField
      required
      id="url"
      label="File URL"
      value={props.value}
      onChange={props.onChange('url')}
      error={!props.value}
      autoFocus
      fullWidth
      margin="normal"
      variant="filled"
    />
  );
}

InputUrl.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default InputUrl;
