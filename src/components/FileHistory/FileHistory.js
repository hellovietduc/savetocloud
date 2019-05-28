import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import './FileHistory.css';

function FileHistory(props) {
  return (
    <section className="file-history">
      {props.files.length > 0 ? (
        <div>
          <Typography variant="h5" gutterBottom>
            File history
          </Typography>
        </div>
      ) : null}
      {props.files.map(file => (
        <div key={file.id} className="download">
          <a href={file.url}>{file.name}</a>
        </div>
      ))}
    </section>
  );
}

FileHistory.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired
};

export default FileHistory;
