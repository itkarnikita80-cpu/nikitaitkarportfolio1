import React from 'react';
import { ArrowRight, ArrowUpRight, GraduationCap, Sparkles, Download } from 'lucide-react';
import { GithubIcon, LinkedinIcon, InstagramIcon } from './SocialIcons';
import { personalInfo } from '../data/resumeData';

export default function Hero() {
  const { name, role, heroTagline, statusBadge, bio, portraitImage, socialLinks } = personalInfo;

  return (
    <section id="home" className="hero-section" aria-label="Hero Introduction">
      <div className="container">
        <div className="hero-grid">
          {/* Left Column: Editorial Content */}
          <div className="hero-text-content">
            {/* Status Pill Badge */}
            <div className="hero-badge-pill" role="status">
              <Sparkles size={14} className="sparkle" aria-hidden="true" />
              <span>{statusBadge}</span>
            </div>

            {/* Editorial Headline matching prompt & reference */}
            <h1 className="hero-heading">
              Designing Clean,<br />
              <em>Thoughtful</em><br />
              Digital Experiences.
            </h1>

            {/* Role / Subtitle */}
            <div className="hero-role-title">
              {role}
            </div>

            {/* Concise Factual Introduction */}
            <p className="hero-factual-intro">
              {bio}
            </p>

            {/* Primary Action Buttons */}
            <div className="hero-action-buttons">
              <a href="#projects" className="btn-primary">
                <span>Explore My Work</span>
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a href="#contact" className="btn-secondary">
                <span>Connect With Me</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a
                href="/Nikita-Itkar-Resume.pdf"
                download="Nikita-Itkar-Resume.pdf"
                className="btn-secondary"
                aria-label="Download Nikita Itkar's Resume as PDF"
                title="Download Resume PDF"
              >
                <Download size={17} aria-hidden="true" />
                <span>Resume</span>
              </a>
            </div>

            {/* Social Links Row (Strictly LinkedIn, GitHub, Instagram) */}
            <div className="hero-social-strip">
              <span className="social-strip-label">Profiles:</span>
              
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="Nikita Itkar's GitHub Profile (opens in new tab)"
                title="GitHub"
              >
                <GithubIcon size={19} aria-hidden="true" />
              </a>

              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="Nikita Itkar's LinkedIn Profile (opens in new tab)"
                title="LinkedIn"
              >
                <LinkedinIcon size={19} aria-hidden="true" />
              </a>

              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="Nikita Itkar's Instagram Profile (opens in new tab)"
                title="Instagram"
              >
                <InstagramIcon size={19} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right Column: Visual Portrait Composition matching reference */}
          <div className="hero-visual-wrapper">
            <div className="hero-portrait-frame-container">
              {/* Outer decorative dashed ring */}
              <div className="arch-outer-ring" aria-hidden="true"></div>

              {/* Top Floating Badge */}
              <div className="floating-badge-top">
                <Sparkles size={13} aria-hidden="true" />
                <span>Web Design & Front-End</span>
              </div>

              {/* Arch Frame with Natural Portrait */}
              <div className="portrait-arch">
                <img
                  src={portraitImage}
                  alt="Portrait of Nikita Itkar, Computer Science & Engineering student"
                  className="portrait-natural-image"
                  width="500"
                  height="540"
                  loading="eager"
                />
              </div>

              {/* Floating Bottom Card matching the reference layout */}
              <div className="floating-status-card">
                <div className="floating-icon-box" aria-hidden="true">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div className="floating-text-primary">CSE Student</div>
                  <div className="floating-text-secondary">2023–2027 (Expected)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
