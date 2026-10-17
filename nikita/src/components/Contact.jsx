import React, { useState } from 'react';
import { ArrowUpRight, Copy, Check, MessageSquare } from 'lucide-react';
import { GithubIcon, LinkedinIcon, InstagramIcon } from './SocialIcons';
import { personalInfo } from '../data/resumeData';

export default function Contact() {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {
      // Fallback
    });
  };

  const contactChannels = [
    {
      key: 'linkedin',
      name: 'LinkedIn',
      handle: 'nikita-itkar-148344384',
      url: personalInfo.socialLinks.linkedin,
      desc: 'Connect for internships, web design opportunities, and professional engineering networking.',
      icon: <LinkedinIcon size={26} />,
      ctaLabel: 'View LinkedIn'
    },
    {
      key: 'github',
      name: 'GitHub',
      handle: 'itkarnikita80-cpu',
      url: personalInfo.socialLinks.github,
      desc: 'Explore code repositories, academic Java programs, and front-end development experiments.',
      icon: <GithubIcon size={26} />,
      ctaLabel: 'Visit GitHub'
    },
    {
      key: 'instagram',
      name: 'Instagram',
      handle: '@nikiiiiiiii_7788',
      url: personalInfo.socialLinks.instagram,
      desc: 'Connect socially and follow creative design explorations and student activities.',
      icon: <InstagramIcon size={26} />,
      ctaLabel: 'View Instagram'
    }
  ];

  return (
    <section id="contact" className="contact-section" aria-label="Contact and Social Connect Hub">
      <div className="container">
        <div className="contact-content-center">
          {/* Eyebrow & Title */}
          <div className="section-eyebrow">
            <MessageSquare size={14} aria-hidden="true" />
            <span>Get In Touch</span>
          </div>
          
          <h2 className="section-title">
            Let's <em>Connect</em>
          </h2>

          <p className="section-description" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Open to internships, front-end development collaborations, and academic discussions. Connect with me directly on any of my verified professional profiles below.
          </p>

          {/* Connect Cards Grid (Strictly LinkedIn, GitHub, Instagram) */}
          <div className="contact-cards-grid">
            {contactChannels.map((channel) => (
              <div key={channel.key} className="connect-card">
                <div className="connect-icon-circle" aria-hidden="true">
                  {channel.icon}
                </div>

                <div>
                  <h3 className="connect-network-name">{channel.name}</h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {channel.handle}
                  </div>
                </div>

                <p className="connect-network-desc">
                  {channel.desc}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', marginTop: 'auto' }}>
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="connect-action-pill"
                    aria-label={`Open Nikita's ${channel.name} in a new tab`}
                  >
                    <span>{channel.ctaLabel}</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(channel.url, channel.key)}
                    className="copy-feedback-pill"
                    aria-label={`Copy ${channel.name} URL to clipboard`}
                  >
                    {copiedKey === channel.key ? (
                      <span style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Check size={13} aria-hidden="true" /> Link Copied!
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Copy size={13} aria-hidden="true" /> Copy Profile URL
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto' }}>
            Looking forward to collaborating on thoughtful web applications and front-end engineering challenges.
          </div>
        </div>
      </div>
    </section>
  );
}
