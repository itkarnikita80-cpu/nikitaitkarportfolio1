import React from 'react';
import { 
  Palette, 
  Code2, 
  Database, 
  Wrench, 
  Binary, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { skillsData } from '../data/resumeData';

export default function Skills() {
  const priorityCategory = skillsData.find((cat) => cat.priority);
  const otherCategories = skillsData.filter((cat) => !cat.priority);

  const getCategoryIcon = (categoryName) => {
    switch (categoryName) {
      case "Programming Languages":
        return <Code2 size={20} />;
      case "Database & Data Management":
        return <Database size={20} />;
      case "Tools & Developer Environments":
        return <Wrench size={20} />;
      case "Computer Science Fundamentals":
        return <Binary size={20} />;
      default:
        return <Palette size={20} />;
    }
  };

  return (
    <section id="skills" className="skills-section" aria-label="Technical Skills and Expertise">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Core Competencies</span>
          </div>
          <h2 className="section-title">
            Skills & <em>Technical Toolkit</em>
          </h2>
          <p className="section-description">
            Prioritizing modern Web Designing and Front-End Development, complemented by verified academic foundations in software engineering and database systems.
          </p>
        </div>

        <div className="skills-categories-grid">
          {/* Priority Featured Banner: Web Design & Front-End Development */}
          {priorityCategory && (
            <div className="skills-priority-banner">
              <div className="priority-badge-eyebrow">
                <Sparkles size={13} aria-hidden="true" />
                <span>Primary Specialization</span>
              </div>
              <h3 className="priority-category-title">
                {priorityCategory.category}
              </h3>
              <p className="priority-category-desc">
                {priorityCategory.description}
              </p>

              <div className="priority-skills-grid">
                {priorityCategory.skills.map((skill, idx) => (
                  <div key={idx} className="priority-skill-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <CheckCircle2 size={16} color="#FFFFFF" aria-hidden="true" />
                      <div className="priority-skill-name">{skill.name}</div>
                    </div>
                    <div className="priority-skill-detail">{skill.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remaining Resume-Confirmed Categories */}
          {otherCategories.map((cat, idx) => (
            <div key={idx} className="skill-category-card">
              <div className="category-card-header">
                <div className="category-icon-box" aria-hidden="true">
                  {getCategoryIcon(cat.category)}
                </div>
                <h3 className="category-title">{cat.category}</h3>
              </div>
              <p className="category-description">{cat.description}</p>

              <div className="skills-pill-list">
                {cat.skills.map((skill, sIdx) => (
                  <div key={sIdx} className="skill-item-row">
                    <span className="skill-item-name">{skill.name}</span>
                    <span className="skill-item-detail">{skill.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
