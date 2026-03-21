import React from 'react';
import { ExternalLink, Construction } from 'lucide-react';

interface PortalLink {
    icon: React.ReactNode;
    title: string;
    url: string;
    description: string;
}

interface PlaceholderPageProps {
    title: string;
    description?: string;
    links?: PortalLink[];
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
    title,
    description = 'Module này đang được phát triển.',
    links = [],
}) => {
    return (
        <div className="placeholder-page">
            <div className="placeholder-hero">
                <Construction size={48} className="placeholder-icon" />
                <h2>{title}</h2>
                <p>{description}</p>
            </div>

            {links.length > 0 && (
                <div className="placeholder-links">
                    <h3>Portal Links</h3>
                    <div className="management-grid">
                        {links.map((link) => (
                            <a
                                key={link.title}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="management-card"
                            >
                                <div className="management-card-content">
                                    <span className="management-card-icon">{link.icon}</span>
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
            )}
        </div>
    );
};
