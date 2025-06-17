import React from 'react';
import './footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="aws-text-container">
        <p>AWS generative AI services</p>
        <img src="/images/aws_logo.png" alt="AWS Logo" className="aws-logo" />
        </div>
        <p className="copyright">AI Interview Helper &copy; 2025</p>
      </div>
    </footer>
  );
}

export default Footer;