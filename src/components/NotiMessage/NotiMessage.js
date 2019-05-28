import React from 'react';
import PropTypes from 'prop-types';
import './NotiMessage.css';

function NotiMessage(props) {
  return (
    <section className={props.type || 'info'}>
      <p>{props.message}</p>
    </section>
  );
}

NotiMessage.propTypes = {
  type: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
};

export default NotiMessage;
