import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import './InputFilename.css';

function InputFilename(props) {
  const onChange = props.onChange('filename');

  const toggleInput = () => {
    props.onToggle();
    onChange({ target: { value: '' } });
  };

  return (
    <div className="input-filename">
      <FormControlLabel label="Change filename" control={<Checkbox color="primary" />} onChange={toggleInput} />
      <TextField
        id="filename"
        label="Filename to save"
        value={props.value}
        onChange={onChange}
        disabled={props.disabled}
        margin="normal"
        variant="filled"
      />
    </div>
  );
}

InputFilename.propTypes = {
  disabled: PropTypes.bool.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default InputFilename;
