import React, { useState } from 'react';
import { ArrowUpRight, FolderGit2, CheckCircle, Terminal, Layers } from 'lucide-react';
import { academicProjects } from '../data/resumeData';

export default function Projects() {
  const [activeTab, setActiveTab] = useState(0);

  const codeSnippets = [
    `// Java Desktop / Console Architecture Sample
public class DatabaseManager {
    private Connection conn;
    
    public void initDatabase() throws SQLException {
        String url = "jdbc:mysql://localhost:3306/academic_db";
        conn = DriverManager.getConnection(url, "user", "password");
    }
    
    public void saveRecord(AcademicRecord record) {
        // OOP Entity Persistence via PreparedStatement
        String query = "INSERT INTO records (title, status) VALUES (?, ?)";
        // Structured JDBC execution & resource cleanup
    }
}`,
    `// Data Structures: Binary Tree & Linked List Node Implementation
public class TreeNode<T extends Comparable<T>> {
    T data;
    TreeNode<T> left, right;

    public TreeNode(T item) {
        this.data = item;
        left = right = null;
    }
}
// Time Complexity: Search O(log n) avg, O(n) worst case
// Space Complexity: O(h) where h is tree height`
  ];

  return (
    <section id="projects" className="projects-section" aria-label="Academic Projects">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Verified Work</span>
          </div>
          <h2 className="section-title">
            Academic <em>Projects</em>
          </h2>
          <p className="section-description">
            Hands-on software projects completed as part of academic curriculum and technical training. Built with core Java, object-oriented design, and algorithmic problem-solving.
          </p>
        </div>

        {/* Project Cards Stack */}
        <div className="projects-stack">
          {academicProjects.map((project, index) => (
            <article key={project.id} className="project-full-card">
              {/* Left Column: Project Details */}
              <div className="project-info-column">
                <div className="project-meta-eyebrow">
                  <span className="badge-tag">
                    <FolderGit2 size={13} aria-hidden="true" />
                    <span>{project.type}</span>
                  </span>
                  <span className="badge-tag">{project.badge}</span>
                </div>

                <h3 className="project-title">{project.title}</h3>
                
                <p className="project-overview">
                  {project.overview}
                </p>

                <ul className="project-features-list" role="list">
                  {project.keyPoints.map((point, pIdx) => (
                    <li key={pIdx} className="project-feature-item">
                      <span className="feature-bullet" aria-hidden="true">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="project-tech-pills">
                  {project.techStack.map((tech, tIdx) => (
                    <span key={tIdx} className="badge-tag">
                      {tech}
                    </span>
                  ))}
                </div>

                <div>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    aria-label={`View ${project.title} on Nikita's GitHub profile (opens in new tab)`}
                  >
                    <span>View on GitHub</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Right Column: Code & Architecture Blueprint Preview */}
              <div className="project-interactive-preview">
                <div className="preview-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Terminal size={15} color="var(--text-primary)" aria-hidden="true" />
                    <span className="preview-title">Architecture Snapshot</span>
                  </div>
                  <span className="preview-tag">Source Verified</span>
                </div>

                <pre className="preview-code-block" tabIndex={0} aria-label="Code structure preview">
                  <code>{codeSnippets[index] || '// Code snippet available on GitHub'}</code>
                </pre>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} color="var(--text-primary)" aria-hidden="true" />
                  <span>Strictly mapped to resume project specifications</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
