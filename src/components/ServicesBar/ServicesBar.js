import React from 'react';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import env from '../../config/env';
import utils from '../../helper/utils';
import './ServicesBar.css';

function ServicesBar(props) {
  const { auth, urls } = props;
  const services = [];
  for (const serviceCode in urls) {
    const service = {
      name: utils.getServiceName(serviceCode),
      code: serviceCode
    };
    if (auth.has(serviceCode)) {
      service.loggedIn = true;
      service.authUrl = '#';
    } else {
      service.loggedIn = false;
      service.authUrl = urls[serviceCode];
    }
    services.push(service);
  }

  return (
    <section className="services-bar">
      <Grid container justify="center">
        {services.map(service => (
          <Grid item xs={4} key={service.code} className="service">
            <Tooltip title={`${service.name} - ${service.loggedIn ? 'Logged In' : 'Logged Out'}`}>
              <img
                src={env.PUBLIC_URL + `/img/${service.code}${service.loggedIn ? '' : '-bw'}.png`}
                alt={service.name}
                onClick={() => window.open(service.authUrl, '_blank')}
              />
            </Tooltip>
            {service.loggedIn ? <img src={env.PUBLIC_URL + '/img/tick.png'} alt="tick" className="tick-icon" /> : null}
          </Grid>
        ))}
      </Grid>
    </section>
  );
}

ServicesBar.propTypes = {
  auth: PropTypes.object.isRequired,
  urls: PropTypes.object.isRequired
};

export default ServicesBar;
