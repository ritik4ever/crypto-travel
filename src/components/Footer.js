// src/components/Footer.js
import React from 'react';
import './Footer.css'; // We'll create this next

const Footer = ({ githubRepo }) => {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          Made with <span className="heart">❤️</span> by Ayush •{' '}
          <a 
            href={githubRepo || "https://github.com/yourusername/yourrepo"} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Source Code
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
