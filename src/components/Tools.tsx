import React from 'react';
import { Github, BarChart3, GraduationCap, ShieldCheck, Zap, Figma } from 'lucide-react';

const tools = [
    {
        name: 'Github',
        url: 'https://github.com/Wecare-tool?tab=repositories',
        icon: <Github size={48} strokeWidth={1.5} />
    },
    {
        name: 'Project Tracker',
        url: 'https://project-tracker-573735243623.us-west1.run.app/',
        icon: <BarChart3 size={48} strokeWidth={1.5} />
    },
    {
        name: 'Figma',
        url: 'https://www.figma.com/files/team/1160476424433627132/recents-and-sharing?fuid=1160476417594164077',
        icon: <Figma size={48} strokeWidth={1.5} />
    },
    {
        name: 'Technology Training',
        url: 'https://technology-training-573735243623.us-west1.run.app/',
        icon: <GraduationCap size={48} strokeWidth={1.5} />
    },
    {
        name: 'Audit Logs',
        url: 'https://audit-log-viewer-573735243623.us-west1.run.app/',
        icon: <ShieldCheck size={48} strokeWidth={1.5} />
    },
    {
        name: 'Power Platform Admin Center',
        url: 'https://power-platform-admin-center-573735243623.us-west1.run.app/',
        icon: <Zap size={48} strokeWidth={1.5} />
    }
];

export const Tools: React.FC = () => {
    return (
        <div className="tools-container" style={{ padding: '20px' }}>
            <div className="tools-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px'
            }}>
                {tools.map((tool) => (
                    <a
                        key={tool.name}
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tool-card"
                        style={{
                            padding: '30px 24px',
                            borderRadius: '16px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0, 0, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            marginBottom: '20px',
                            color: 'var(--accent-primary)',
                            padding: '16px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(167, 139, 250, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {tool.icon}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', letterSpacing: '0.01em' }}>{tool.name}</h3>
                    </a>
                ))}
            </div>
        </div>
    );
};
