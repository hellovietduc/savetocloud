import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';

function InputService(props) {
  return (
    <TextField
      required
      select
      id="service"
      label="Cloud Service"
      value={props.value}
      onChange={props.onChange('service')}
      fullWidth
      margin="normal"
      variant="filled"
    >
      {props.services.map(service => (
        <MenuItem key={service.value} value={service.value}>
          {service.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

InputService.propTypes = {
  value: PropTypes.string,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired
};

export default InputService;
