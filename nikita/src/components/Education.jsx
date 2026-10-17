import React from 'react';
import { GraduationCap, Calendar, BookOpen, CheckCircle2 } from 'lucide-react';
import { educationData } from '../data/resumeData';

export default function Education() {
  return (
    <section id="education" className="education-section" aria-label="Education and Academic Background">
      <div className="container">
        {/* Section Header */}
        <div className="section-header" style={{ textAlign: 'center' }}>
          <div className="section-eyebrow">
            <span>Academic Qualifications</span>
          </div>
          <h2 className="section-title">
            Education & <em>Academic Pathway</em>
          </h2>
          <p className="section-description" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Verified educational credentials strictly matching resume facts and enrollment timelines.
          </p>
        </div>

        {/* Education Timeline Cards */}
        <div className="education-timeline">
          {educationData.map((item) => (
            <div key={item.id} className="education-card">
              <div className="education-card-header">
                <div>
                  <h3 className="education-degree">{item.degree}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    <BookOpen size={15} aria-hidden="true" />
                    <span>{item.status}</span>
                  </div>
                </div>

                <div className="education-duration-pill">
                  <Calendar size={13} style={{ marginRight: '0.35rem', display: 'inline' }} aria-hidden="true" />
                  <span>{item.duration}</span>
                </div>
              </div>

              <p className="education-description">
                {item.description}
              </p>

              <ul className="education-highlights-list" role="list">
                {item.highlights.map((highlight, idx) => (
                  <li key={idx} className="education-highlight-item">
                    <CheckCircle2 size={15} color="var(--text-primary)" aria-hidden="true" style={{ flexShrink: 0 }} />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
