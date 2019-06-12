import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Button from '@material-ui/core/Button';
import utils from '../../helper/utils';
import './UploadHistory.css';

function UploadHistory(props) {
  return (
    <section className="upload-history">
      <Typography variant="h5" gutterBottom>
        Upload history
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Filename</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.files.map((file, index) => {
            const cell = {
              index: index + 1,
              name: utils.trimFilename(file.name, 25),
              serviceName: file.serviceName,
              size: file.size || '?',
              progress: file.status === 'completed' ? '100%' : file.progress ? `${file.progress}%` : '?',
              status: file.status
            };
            return (
              <TableRow key={file.id} hover={true}>
                <TableCell>{cell.index}</TableCell>
                <TableCell>{cell.name}</TableCell>
                <TableCell>{cell.serviceName}</TableCell>
                <TableCell>{cell.size}</TableCell>
                <TableCell>{cell.progress}</TableCell>
                <TableCell className={cell.status}>{cell.status}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {props.files.length > 0 ? (
        <div className="btn-clear">
          <Button onClick={props.onClear} size="small" color="secondary">
            Clear
          </Button>
        </div>
      ) : null}
    </section>
  );
}

UploadHistory.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      serviceName: PropTypes.string,
      size: PropTypes.string,
      progress: PropTypes.number,
      status: PropTypes.string.isRequired
    })
  ).isRequired,
  onClear: PropTypes.func.isRequired
};

export default UploadHistory;
