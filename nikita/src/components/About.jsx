import React from 'react';
import { Layout, Code2, Database, Users } from 'lucide-react';
import { personalInfo } from '../data/resumeData';

export default function About() {
  const highlights = [
    {
      icon: <Layout size={20} />,
      title: "Web Design & Front-End",
      desc: "Passionate about creating clean, accessible, and responsive user interfaces with semantic HTML, modern CSS, and JavaScript fundamentals."
    },
    {
      icon: <Code2 size={20} />,
      title: "Core Programming & OOP",
      desc: "Strong foundation in Java (core concepts), C, and C++ with hands-on practice in object-oriented architecture and clean code principles."
    },
    {
      icon: <Database size={20} />,
      title: "Data & Systems Foundations",
      desc: "Applied knowledge of MySQL, SQL queries, JDBC connectivity, and essential data structures including linked lists, stacks, and binary trees."
    },
    {
      icon: <Users size={20} />,
      title: "Community & Collaborative Growth",
      desc: "Active member of the college Computer Science / Coding Club and participant in collegiate coding contests and technical events."
    }
  ];

  return (
    <section id="about" className="about-section" aria-label="About Nikita Itkar">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span>About Me</span>
          </div>
          <h2 className="section-title">
            Combining Design Fundamentals with <em>Practical Code</em>
          </h2>
          <p className="section-description">
            A dedicated Computer Science & Engineering student focused on building intuitive, responsive digital experiences with clean design and robust technical standards.
          </p>
        </div>

        {/* Content Grid */}
        <div className="about-grid">
          {/* Narrative Column */}
          <div className="about-narrative">
            <h3 className="about-statement">
              “Eager to create clean, responsive, user-friendly websites and apply design fundamentals, HTML, CSS, and JavaScript skills in practical projects while continuing to learn.”
            </h3>
            
            <p className="about-paragraph">
              Currently pursuing a B.E./B.Tech in Computer Science & Engineering (2023–2027), I focus on the intersection of structured software engineering and thoughtful web aesthetics. I believe effective front-end development is rooted in strong foundational knowledge—from semantic markup and responsive CSS layout systems to clean JavaScript logic.
            </p>

            <p className="about-paragraph">
              Beyond front-end design, my academic curriculum has given me solid proficiency in object-oriented programming with Java, relational database systems with MySQL, and data structure implementations. I enjoy transforming theoretical concepts into functional desktop applications and clean web interfaces.
            </p>

            <div style={{ marginTop: '2rem' }}>
              <a href="#skills" className="btn-secondary">
                <span>View My Technical Skills</span>
              </a>
            </div>
          </div>

          {/* Pillars Cards Column */}
          <div className="about-cards-column">
            {highlights.map((item, idx) => (
              <div key={idx} className="about-highlight-box">
                <div className="about-highlight-title">
                  <div style={{ color: 'var(--text-primary)' }} aria-hidden="true">
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </div>
                <p className="about-highlight-desc">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
