import React from 'react';
import { ArrowUp } from 'lucide-react';
import { GithubIcon, LinkedinIcon, InstagramIcon } from './SocialIcons';
import { personalInfo } from '../data/resumeData';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="minimal-footer" aria-label="Site Footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand Info */}
          <div className="footer-brand-info">
            <span className="footer-name">{personalInfo.name}</span>
            <span className="footer-tagline">
              Computer Science & Engineering Student | Web Designing & Front-End Development
            </span>
          </div>

          {/* Social Links (Strictly the same three confirmed links) */}
          <div className="footer-social-links">
            <a
              href={personalInfo.socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Nikita's LinkedIn Profile"
            >
              <LinkedinIcon size={17} aria-hidden="true" />
              <span>LinkedIn</span>
            </a>

            <a
              href={personalInfo.socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Nikita's GitHub Profile"
            >
              <GithubIcon size={17} aria-hidden="true" />
              <span>GitHub</span>
            </a>

            <a
              href={personalInfo.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Nikita's Instagram Profile"
            >
              <InstagramIcon size={17} aria-hidden="true" />
              <span>Instagram</span>
            </a>

            <button
              type="button"
              onClick={scrollToTop}
              className="footer-social-link"
              aria-label="Scroll back to top of page"
              style={{ marginLeft: '1rem', background: 'var(--bg-tertiary)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)' }}
            >
              <ArrowUp size={15} aria-hidden="true" />
              <span>Top</span>
            </button>
          </div>

          {/* Copyright notice */}
          <div className="footer-copyright">
            © {new Date().getFullYear()} Nikita Itkar. All rights reserved. Built with React & Vite.
          </div>
        </div>
      </div>
    </footer>
  );
}
