import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import utils from '../../helper/utils';
import './UploadHistory.css';

function UploadHistory(props) {
  return (
    <section className="upload-history">
      <Typography variant="h5" gutterBottom>
        Upload history
      </Typography>
      <Table className="table">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Filename</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Speed</TableCell>
            <TableCell>Time left</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.files.map((file, index) => (
            <TableRow key={file.id} hover={true}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{utils.trimFilename(file.name, 20)}</TableCell>
              <TableCell>{file.service}</TableCell>
              <TableCell>{file.size || '?'}</TableCell>
              <TableCell>{file.speed || '?'}</TableCell>
              <TableCell>{file.timeLeft || '?'}</TableCell>
              <TableCell className={file.status}>{file.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

UploadHistory.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      service: PropTypes.string,
      size: PropTypes.number,
      speed: PropTypes.number,
      timeLeft: PropTypes.number,
      status: PropTypes.string.isRequired
    })
  ).isRequired
};

export default UploadHistory;
