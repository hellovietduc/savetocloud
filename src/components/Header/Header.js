import React from 'react';
import Typography from '@material-ui/core/Typography';

function Header() {
  return (
    <header>
      <Typography variant="h3" gutterBottom>
        SaveToDrive
      </Typography>
      <Typography variant="h5" gutterBottom>
        Upload files from URL to Cloud Services
      </Typography>
    </header>
  );
}

export default Header;
