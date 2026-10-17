import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Projects', href: '#projects' },
    { label: 'Education', href: '#education' },
    { label: 'Photo Studio', href: '#studio' },
    { label: 'Doc Toolkit', href: '#doc-tools' },
    { label: 'Contact', href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      const sections = ['home', 'about', 'skills', 'projects', 'education', 'studio', 'doc-tools', 'contact'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      <nav className="container navbar-container" aria-label="Main Navigation">
        {/* Brand / Monogram */}
        <a 
          href="#home" 
          className="navbar-brand"
          onClick={(e) => handleNavClick(e, '#home')}
          aria-label="Nikita Itkar Portfolio Home"
        >
          <div className="brand-monogram" aria-hidden="true">N</div>
          <span className="brand-name">Nikita<span>.</span></span>
        </a>

        {/* Desktop Navigation Links */}
        <ul className="nav-desktop-links" role="list">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`nav-link ${activeSection === item.href.slice(1) ? 'active' : ''}`}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Header CTA */}
        <a
          href="#contact"
          className="nav-cta-btn"
          onClick={(e) => handleNavClick(e, '#contact')}
        >
          <span>Connect With Me</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span style={{ transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
          <span style={{ opacity: mobileMenuOpen ? 0 : 1 }}></span>
          <span style={{ transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <ul className="mobile-menu-links">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="mobile-nav-link"
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            className="btn-primary"
            onClick={(e) => handleNavClick(e, '#contact')}
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <span>Connect With Me</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      )}
    </header>
  );
}
