import React from 'react';
import { Award, Trophy, Users, CheckCircle2 } from 'lucide-react';
import { certificationsData, achievementsData } from '../data/resumeData';

export default function Certifications() {
  return (
    <section id="certifications" className="certifications-section" aria-label="Certifications and Achievements">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Verified Credentials</span>
          </div>
          <h2 className="section-title">
            Certifications & <em>Campus Leadership</em>
          </h2>
          <p className="section-description">
            Recognized coursework completions and technical co-curricular involvement confirmed in academic records.
          </p>
        </div>

        {/* Two Column Layout: Certifications on Left, Activities on Right */}
        <div className="certifications-achievements-grid">
          {/* Certifications Column */}
          <div className="certifications-column">
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="var(--text-primary)" aria-hidden="true" />
              <span>Certifications & Training</span>
            </h3>

            {certificationsData.map((cert) => (
              <div key={cert.id} className="cert-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <h4 className="cert-title">{cert.title}</h4>
                  <span className="badge-tag">{cert.badge}</span>
                </div>
                <p className="cert-focus">{cert.focus}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={13} color="var(--text-primary)" aria-hidden="true" />
                  <span>Verified Curriculum Completion</span>
                </div>
              </div>
            ))}
          </div>

          {/* Achievements & Activities Column */}
          <div className="achievements-column">
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={20} color="var(--text-primary)" aria-hidden="true" />
              <span>Achievements & Activities</span>
            </h3>

            {achievementsData.map((item) => (
              <div key={item.id} className="achievement-card">
                <div className="achievement-icon-box" aria-hidden="true">
                  {item.icon === 'trophy' ? <Trophy size={20} /> : <Users size={20} />}
                </div>
                <div>
                  <h4 className="achievement-title">{item.title}</h4>
                  <p className="achievement-detail">{item.detail}</p>
                </div>
              </div>
            ))}

            {/* Factual Statement Card */}
            <div className="premium-card" style={{ marginTop: '1.5rem', padding: '1.75rem', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Commitment to Growth
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Committed to expanding practical web development and algorithmic knowledge through continuous peer programming and technical events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
