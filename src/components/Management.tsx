import React, { useState } from 'react';

interface AdminLink {
    title: string;
    url: string;
    description: string;
    emoji: string;
}

interface AdminGroup {
    id: string;
    name: string;
    icon: React.ReactNode;
    links: AdminLink[];
}

const adminGroups: AdminGroup[] = [
    {
        id: 'microsoft',
        name: 'Microsoft',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#F25022" d="M1 1h10v10H1V1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13V1z" />
                <path fill="#00A4EF" d="M1 13h10v10H1v-10z" />
                <path fill="#FFB900" d="M13 13h10v10H13v-10z" />
            </svg>
        ),
        links: [
            {
                emoji: '⚡',
                title: 'Power Platform Admin',
                url: 'https://admin.powerplatform.microsoft.com/home',
                description: 'Quản trị Power Platform, Environments, và Solutions.'
            },
            {
                emoji: '💼',
                title: 'Business Management',
                url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?settingsonly=true#438100364',
                description: 'Cấu hình hệ thống và quản lý dữ liệu Dynamics 365.'
            },
            {
                emoji: '📊',
                title: 'Power BI Admin',
                url: 'https://app.powerbi.com/admin-portal/tenantSettings?experience=fabric-developer&clientSideAuth=0',
                description: 'Quản trị báo cáo, dataset và thiết lập Power BI / Fabric.'
            },
            {
                emoji: '🤖',
                title: 'Copilot studio',
                url: 'https://copilotstudio.microsoft.com/environments/de210e4b-cd22-e605-91ca-8e841aad4b8e/bots',
                description: 'Thiết kế và quản trị các AI chatbot (Copilots).'
            },
            {
                emoji: '🏢',
                title: 'Microsoft 365 Admin',
                url: 'https://admin.cloud.microsoft/?#/homepage',
                description: 'Trung tâm quản trị tổng thể dịch vụ Microsoft 365.'
            },
            {
                emoji: '💬',
                title: 'MS Teams Admin',
                url: 'https://admin.teams.microsoft.com/users',
                description: 'Quản lý người dùng, thiết bị và chính sách Microsoft Teams.'
            },
            {
                emoji: '📧',
                title: 'Exchange Admin',
                url: 'https://admin.exchange.microsoft.com/#/',
                description: 'Quản trị hòm thư, nhóm và bảo mật email Exchange.'
            },
            {
                emoji: '🔑',
                title: 'Microsoft Entra',
                url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/EntraLanding.ReactView',
                description: 'Trung tâm quản trị định danh và truy cập Microsoft Entra.'
            },
            {
                emoji: '📂',
                title: 'SharePoint Admin',
                url: 'https://wecarei-admin.sharepoint.com/_layouts/15/online/AdminHome.aspx#/home',
                description: 'Quản trị SharePoint Online, Sites và OneDrive.'
            },
            {
                emoji: '🛡️',
                title: 'Microsoft Purview',
                url: 'https://purview.microsoft.com/home?tid=08dd70ab-ac3b-4a33-acd1-ef3fe1729e61',
                description: 'Quản lý tuân thủ, bảo mật dữ liệu và quản trị thông tin.'
            },
            {
                emoji: '🔍',
                title: 'Graph Explorer',
                url: 'https://developer.microsoft.com/en-us/graph/graph-explorer',
                description: 'Công cụ thử nghiệm và tra cứu Microsoft Graph API.'
            },
            {
                emoji: '🤝',
                title: 'MS Partner Center',
                url: 'https://partner.microsoft.com/dashboard/v2/account-settings/account-management/home',
                description: 'Cổng thông tin đối tác và quản lý tài khoản Microsoft Partner.'
            }
        ]
    },
    {
        id: 'azure',
        name: 'Azure',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#0089D6" d="M12 1L2 6v12l10 5 10-5V6l-10-5zm0 18.5L4.5 15V8.5L12 5l7.5 3.5V15L12 19.5z" />
                <path fill="#0089D6" d="M12 7l-5 2.5v5l5 2.5 5-2.5v-5L12 7z" opacity="0.5" />
            </svg>
        ),
        links: [
            {
                emoji: '🔐',
                title: 'Azure Portal (AD)',
                url: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview/query/wecare',
                description: 'Quản lý định danh và bảo mật Microsoft Entra (Azure AD).'
            },
            {
                emoji: '☁️',
                title: 'Azure Home',
                url: 'https://portal.azure.com/#home',
                description: 'Trang chủ quản trị dịch vụ Azure Cloud.'
            }
        ]
    },
    {
        id: 'google',
        name: 'Google',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
        ),
        links: [
            {
                emoji: '👥',
                title: 'Google Admin',
                url: 'https://admin.google.com/ac/home',
                description: 'Quản lý người dùng và dịch vụ Google Workspace.'
            },
            {
                emoji: '🛠️',
                title: 'Google Cloud Console',
                url: 'https://console.cloud.google.com/welcome?project=wecare-ai-studio',
                description: 'Quản trị hạ tầng đám mây và dự án Google Cloud.'
            },
            {
                emoji: '🚀',
                title: 'Google Cloud Run',
                url: 'https://console.cloud.google.com/run/overview?project=wecare-ai-studio',
                description: 'Quản lý các dịch vụ Cloud Run serverless.'
            }
        ]
    },
    {
        id: 'zoho',
        name: 'Zoho',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#00AEEF" d="M2,2H11V11H2V2Z" />
                <path fill="#ED1C24" d="M13,2H22V11H13V2Z" />
                <path fill="#7FBA00" d="M2,13H11V22H2V13Z" />
                <path fill="#FFB900" d="M13,13H22V22H13V13Z" />
            </svg>
        ),
        links: [
            {
                emoji: '📪',
                title: 'Zoho Mail Admin',
                url: 'https://mailadmin.zoho.com/cpanel/home.do#dashboard',
                description: 'Trang quản trị hệ thống email Zoho.'
            },
            {
                emoji: '📧',
                title: 'Zoho Mail',
                url: 'https://mail.zoho.com/zm/',
                description: 'Truy cập vào hòm thư điện tử cá nhân Zoho Mail.'
            }
        ]
    }
];

export const Management: React.FC = () => {
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
        zoho: true,
        google: true
    });

    const toggleGroup = (id: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="management-container">
            <div className="management-sections">
                {adminGroups.map((group) => (
                    <div key={group.id} className={`management-group ${collapsedGroups[group.id] ? 'collapsed' : ''}`}>
                        <div className="management-group-header" onClick={() => toggleGroup(group.id)}>
                            <div className="group-title-area">
                                <span className="group-icon">{group.icon}</span>
                                <h2 className="group-name">{group.name}</h2>
                            </div>
                            <span className="toggle-icon">{collapsedGroups[group.id] ? '➕' : '➖'}</span>
                        </div>

                        {!collapsedGroups[group.id] && (
                            <div className="management-grid">
                                {group.links.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="management-card"
                                    >
                                        <div className="management-card-content">
                                            <h3>{link.emoji} {link.title}</h3>
                                            <p>{link.description}</p>
                                        </div>
                                        <div className="management-card-arrow-container">
                                            <span className="management-card-arrow">↗</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
