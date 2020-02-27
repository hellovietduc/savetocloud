import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import './BtnSave.css';

function BtnSave(props) {
  return (
    <Button disabled={props.disabled} onClick={props.onClick} size="large" fullWidth={true} variant="contained">
      Save
      <CloudUploadIcon className="icon-cloud-upload" />
    </Button>
  );
}

BtnSave.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

export default BtnSave;
