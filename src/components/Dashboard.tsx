import React from 'react';
import {
    Calendar, Clock, ExternalLink, Layout, Shield,
    Zap, Cloud, Users, KeyRound, FolderOpen, Building2,
} from 'lucide-react';

interface StatCard {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

interface QuickLink {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    url: string;
    iconColor: string;
    iconBg: string;
}

interface DashboardProps {
    userName?: string;
}

const stats: StatCard[] = [
    { label: 'Admin Systems', value: '19', icon: <Layout size={20} />, color: 'var(--accent-primary)', bgColor: 'rgba(167, 139, 250, 0.1)' },
    { label: 'Active Tools', value: '6', icon: <Shield size={20} />, color: 'var(--success)', bgColor: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Pending Requests', value: '—', icon: <Clock size={20} />, color: 'var(--warning)', bgColor: 'rgba(245, 158, 11, 0.1)' },
    { label: 'This Month', value: '—', icon: <Calendar size={20} />, color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.1)' },
];

const quickLinks: QuickLink[] = [
    { icon: <Zap size={22} />, title: 'Power Platform', subtitle: 'Automation & Apps', url: 'https://admin.powerplatform.microsoft.com/home', iconColor: 'var(--accent-primary)', iconBg: 'rgba(167, 139, 250, 0.1)' },
    { icon: <Cloud size={22} />, title: 'Azure Portal', subtitle: 'Cloud Infrastructure', url: 'https://portal.azure.com/#home', iconColor: '#60a5fa', iconBg: 'rgba(96, 165, 250, 0.1)' },
    { icon: <Users size={22} />, title: 'Google Admin', subtitle: 'Workspace Control', url: 'https://admin.google.com/ac/home', iconColor: '#f87171', iconBg: 'rgba(248, 113, 113, 0.1)' },
    { icon: <KeyRound size={22} />, title: 'MS Entra', subtitle: 'Identity & Access', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/EntraLanding.ReactView', iconColor: '#818cf8', iconBg: 'rgba(129, 140, 248, 0.1)' },
    { icon: <FolderOpen size={22} />, title: 'SharePoint', subtitle: 'Content Management', url: 'https://wecarei-admin.sharepoint.com/_layouts/15/online/AdminHome.aspx#/home', iconColor: '#2dd4bf', iconBg: 'rgba(45, 212, 191, 0.1)' },
    { icon: <Building2 size={22} />, title: '365 Admin', subtitle: 'Service Operations', url: 'https://admin.cloud.microsoft/?#/homepage', iconColor: '#fb923c', iconBg: 'rgba(251, 146, 60, 0.1)' },
];

export const Dashboard: React.FC<DashboardProps> = ({ userName = 'User' }) => {
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
    const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="dashboard">
            <div className="dashboard-welcome">
                <h2>{greeting}, {userName} 👋</h2>
                <p className="text-muted">{dateStr}</p>
            </div>

            <div className="dashboard-stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-label">{stat.label}</span>
                            <div className="stat-icon" style={{ color: stat.color, background: stat.bgColor }}>
                                {stat.icon}
                            </div>
                        </div>
                        <span className="stat-value">{stat.value}</span>
                    </div>
                ))}
            </div>

            <div className="dashboard-section">
                <h3>Quick Access</h3>
                <div className="quick-links-grid">
                    {quickLinks.map((link) => (
                        <a
                            key={link.title}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="quick-link-card"
                        >
                            <span className="quick-link-emoji" style={{ color: link.iconColor, background: link.iconBg }}>
                                {link.icon}
                            </span>
                            <div className="quick-link-info">
                                <span className="quick-link-title">{link.title}</span>
                                <span className="quick-link-subtitle">{link.subtitle}</span>
                            </div>
                            <ExternalLink size={16} className="quick-link-arrow" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};
