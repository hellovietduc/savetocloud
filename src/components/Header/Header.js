import React from 'react';
import Typography from '@material-ui/core/Typography';
import './Header.css';

function Header() {
  return (
    <header>
      <Typography variant="h3" color="primary" gutterBottom>
        SaveToCloud
        {/* <span className="beta"> beta</span> */}
      </Typography>
      <Typography variant="h5" gutterBottom>
        Upload files from URL to Cloud Services
      </Typography>
    </header>
  );
}

export default Header;
