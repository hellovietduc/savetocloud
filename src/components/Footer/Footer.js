import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer>
      <section>
        <span>
          <a href="/terms-of-service" target="_blank">
            Terms of Service
          </a>
        </span>
        <span> | </span>
        <span>
          <a href="/private-policy" target="_blank">
            Private Policy
          </a>
        </span>
      </section>
      <section className="author">
        <p>ⓒ SaveToDrive, 2019</p>
      </section>
    </footer>
  );
}

export default Footer;
