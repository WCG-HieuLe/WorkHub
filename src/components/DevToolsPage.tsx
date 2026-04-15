import React from 'react';
import { ExternalLink, Github, Figma, LayoutDashboard, Pencil } from 'lucide-react';

const TOOL_LINKS = [
    {
        icon: <Github size={20} />,
        title: 'GitHub',
        description: 'Repositories & source code',
        url: 'https://github.com',
        color: '#e6edf3',
    },
    {
        icon: <Pencil size={20} />,
        title: 'Stitch',
        description: 'UI design & prototyping',
        url: 'https://stitch.withgoogle.com',
        color: '#a78bfa',
    },
    {
        icon: <LayoutDashboard size={20} />,
        title: 'Project Tracker',
        description: 'Tasks & project management',
        url: 'https://wcg-hieule.github.io/Project-Tracker/',
        color: '#3b82f6',
    },
    {
        icon: <Figma size={20} />,
        title: 'Figma',
        description: 'Design & collaboration',
        url: 'https://figma.com',
        color: '#f24e1e',
    },
];

export const DevToolsPage: React.FC = () => {
    return (
        <div className="health-page">
            <div className="management-grid">
                {TOOL_LINKS.map(link => (
                    <a
                        key={link.title}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="management-card"
                    >
                        <div className="management-card-content">
                            <span
                                className="management-card-icon"
                                style={{ color: link.color }}
                            >
                                {link.icon}
                            </span>
                            <div>
                                <h3>{link.title}</h3>
                                <p>{link.description}</p>
                            </div>
                        </div>
                        <span className="management-card-arrow-container">
                            <ExternalLink size={14} className="management-card-arrow" />
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
};
