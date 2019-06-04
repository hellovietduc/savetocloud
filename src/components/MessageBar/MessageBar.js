import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import { makeStyles } from '@material-ui/core/styles';
import { amber, green } from '@material-ui/core/colors';
import './MessageBar.css';

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon
};

const useStyles = makeStyles(theme => ({
  success: {
    backgroundColor: green[600]
  },
  warning: {
    backgroundColor: amber[700]
  },
  error: {
    backgroundColor: theme.palette.error.dark
  },
  info: {
    backgroundColor: theme.palette.primary.dark
  }
}));

function MessageBar(props) {
  const { message } = props;
  if (!message.type) message.type = 'info';

  const classes = useStyles();
  const Icon = variantIcon[message.type];

  return (
    <Snackbar open={message.open} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <SnackbarContent
        message={
          <span className="flex-center">
            <Icon className="icon" />
            {message.content}
          </span>
        }
        className={clsx(classes[message.type])}
      />
    </Snackbar>
  );
}

MessageBar.propTypes = {
  message: PropTypes.shape({
    type: PropTypes.string,
    content: PropTypes.string,
    open: PropTypes.bool.isRequired
  }).isRequired
};

export default MessageBar;
