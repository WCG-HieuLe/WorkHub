import React, { useState } from 'react';
import {
    ExternalLink, ChevronDown, ChevronRight,
    // Admin icons
    Zap, Briefcase, Building2, KeyRound, Mail, MessageSquare,
    FolderOpen, Bot, Handshake, BarChart3, Lock, Cloud,
    Users, MailOpen,
    // Billing icons
    DollarSign, CreditCard, Landmark,
    // Log icons
    Shield, Search,
    // Data icons
    Compass, Rocket, Wrench,
    // Dev Tools icons
    Github, PenTool, TrendingUp, GraduationCap, Database, Inbox,
    // Domains
    Globe, ShieldCheck,
    // License
    Key, Server,
    // Security
    ShieldAlert, ScanLine, Bug,
    // Compliance
    FileCheck, ClipboardCheck, BookOpen, UserCheck,
} from 'lucide-react';
import { PP_ENV_ID, TENANT_ID } from '@/config/authConfig';

interface AdminLink {
    icon: React.ReactNode;
    title: string;
    url: string;
    description: string;
}

interface ManagementSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    links: AdminLink[];
}

const managementSections: ManagementSection[] = [
    {
        id: 'admin',
        title: 'Admin Portals',
        icon: <Building2 size={18} />,
        links: [
            { icon: <Zap size={18} />, title: 'Power Platform Admin', url: 'https://admin.powerplatform.microsoft.com/home', description: 'Quản trị Power Platform, Environments' },
            { icon: <Briefcase size={18} />, title: 'Business Management', url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?settingsonly=true#438100364', description: 'Cấu hình Dynamics 365' },
            { icon: <Building2 size={18} />, title: '365 Admin', url: 'https://admin.cloud.microsoft/?#/homepage', description: 'Trung tâm quản trị Microsoft 365' },
            { icon: <KeyRound size={18} />, title: 'MS Entra', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/EntraLanding.ReactView', description: 'Quản trị định danh và truy cập' },
            { icon: <Mail size={18} />, title: 'Exchange Admin', url: 'https://admin.exchange.microsoft.com/#/', description: 'Quản trị email Exchange' },
            { icon: <MessageSquare size={18} />, title: 'Teams Admin', url: 'https://admin.teams.microsoft.com/users', description: 'Quản lý người dùng Teams' },
            { icon: <FolderOpen size={18} />, title: 'SharePoint Admin', url: 'https://wecarei-admin.sharepoint.com/_layouts/15/online/AdminHome.aspx#/home', description: 'Quản trị SharePoint Online' },
            { icon: <Bot size={18} />, title: 'Copilot Studio', url: `https://copilotstudio.microsoft.com/environments/${PP_ENV_ID}/bots`, description: 'Quản trị AI Copilots' },
            { icon: <Handshake size={18} />, title: 'MS Partner Center', url: 'https://partner.microsoft.com/dashboard/v2/account-settings/account-management/home', description: 'Cổng thông tin đối tác Microsoft' },
            { icon: <BarChart3 size={18} />, title: 'Power BI Admin', url: 'https://app.powerbi.com/admin-portal/tenantSettings?experience=fabric-developer&clientSideAuth=0', description: 'Quản trị Power BI / Fabric' },
            { icon: <Lock size={18} />, title: 'Azure Portal (AD)', url: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview/query/wecare', description: 'Azure Active Directory' },
            { icon: <Cloud size={18} />, title: 'Azure Home', url: 'https://portal.azure.com/#home', description: 'Azure Cloud Portal' },
            { icon: <Users size={18} />, title: 'Google Admin', url: 'https://admin.google.com/ac/home', description: 'Quản lý Google Workspace' },
            { icon: <MailOpen size={18} />, title: 'Zoho Mail Admin', url: 'https://mailadmin.zoho.com/cpanel/home.do#dashboard', description: 'Quản trị email Zoho' },
        ],
    },
    {
        id: 'billing',
        title: 'Billing',
        icon: <DollarSign size={18} />,
        links: [
            { icon: <Cloud size={18} />, title: 'Azure Cost Management', url: 'https://portal.azure.com/#view/Microsoft_Cost_Management/Menu/~/overview', description: 'Azure billing & cost analysis' },
            { icon: <CreditCard size={18} />, title: 'Microsoft 365 Billing', url: 'https://admin.cloud.microsoft/?#/billoverview', description: 'MS 365 subscription & billing' },
            { icon: <Landmark size={18} />, title: 'Google Cloud Billing', url: 'https://console.cloud.google.com/billing?project=wecare-ai-studio', description: 'Google Cloud billing dashboard' },
            { icon: <CreditCard size={18} />, title: 'Azure Invoices', url: 'https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/invoices', description: 'Download Azure invoices' },
            { icon: <Landmark size={18} />, title: 'M365 Billing Accounts', url: 'https://admin.microsoft.com/Adminportal/Home#/BillingAccounts', description: 'M365 billing accounts management' },
        ],
    },
    {
        id: 'log',
        title: 'Logs & Audit',
        icon: <Shield size={18} />,
        links: [
            { icon: <Shield size={18} />, title: 'MS Purview', url: `https://purview.microsoft.com/home?tid=${TENANT_ID}`, description: 'Quản lý tuân thủ, bảo mật dữ liệu' },
            { icon: <Search size={18} />, title: 'Audit Logs', url: 'https://audit-log-viewer-573735243623.us-west1.run.app/', description: 'Xem audit logs hệ thống' },
            { icon: <KeyRound size={18} />, title: 'Entra Sign-in Logs', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/SignInEventsV3Blade', description: 'Azure AD sign-in history' },
            { icon: <Shield size={18} />, title: 'Entra Audit Logs', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/AuditLogsBlade', description: 'Azure AD audit trail' },
            { icon: <Cloud size={18} />, title: 'Azure Activity Log', url: 'https://portal.azure.com/#view/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/~/activityLog', description: 'Azure resource activity' },
            { icon: <Users size={18} />, title: 'Google Admin Audit', url: 'https://admin.google.com/ac/reporting/audit/login', description: 'Google Workspace login audit' },
        ],
    },
    {
        id: 'data',
        title: 'Data',
        icon: <Database size={18} />,
        links: [
            { icon: <Compass size={18} />, title: 'Graph Explorer', url: 'https://developer.microsoft.com/en-us/graph/graph-explorer', description: 'Tra cứu Microsoft Graph API' },
            { icon: <Rocket size={18} />, title: 'Google Cloud Run', url: 'https://console.cloud.google.com/run/overview?project=wecare-ai-studio', description: 'Quản lý Cloud Run services' },
            { icon: <Wrench size={18} />, title: 'Google Cloud Console', url: 'https://console.cloud.google.com/welcome?project=wecare-ai-studio', description: 'Google Cloud dashboard' },
            { icon: <Zap size={18} />, title: 'Power Apps Maker', url: 'https://make.powerapps.com', description: 'Power Apps maker portal' },
            { icon: <Database size={18} />, title: 'Dataverse Admin', url: 'https://admin.powerplatform.microsoft.com/environments', description: 'Dataverse environment management' },
        ],
    },
    {
        id: 'devtools',
        title: 'Dev Tools',
        icon: <Wrench size={18} />,
        links: [
            { icon: <Github size={18} />, title: 'GitHub', url: 'https://github.com/orgs/WCG-HieuLe/repositories', description: 'Organization repositories' },
            { icon: <PenTool size={18} />, title: 'Figma', url: 'https://www.figma.com/files/team/1160476424433627132/recents-and-sharing?fuid=1160476417594164077', description: 'Team design workspace' },
            { icon: <TrendingUp size={18} />, title: 'Project Tracker', url: 'https://wcg-hieule.github.io/Project-Tracker/', description: 'Theo dõi tiến độ dự án' },
            { icon: <GraduationCap size={18} />, title: 'Technology Training', url: 'https://technology-training-573735243623.us-west1.run.app/', description: 'Nền tảng đào tạo nội bộ' },
            { icon: <Zap size={18} />, title: 'PP Admin Center', url: 'https://power-platform-admin-center-573735243623.us-west1.run.app/', description: 'Power Platform Admin (Cloud Run)' },
            { icon: <Inbox size={18} />, title: 'Zoho Mail', url: 'https://mail.zoho.com/zm/', description: 'Hòm thư Zoho Mail' },
        ],
    },
    {
        id: 'domains',
        title: 'Domains',
        icon: <Globe size={18} />,
        links: [
            { icon: <Globe size={18} />, title: 'GoDaddy', url: 'https://dcc.godaddy.com/domains', description: 'Domain registrar management' },
            { icon: <ShieldCheck size={18} />, title: 'Cloudflare', url: 'https://dash.cloudflare.com/', description: 'DNS & CDN management' },
        ],
    },
    {
        id: 'license',
        title: 'License',
        icon: <Key size={18} />,
        links: [
            { icon: <Key size={18} />, title: 'M365 Admin Licenses', url: 'https://admin.microsoft.com/Adminportal/Home#/licenses', description: 'Microsoft 365 license management' },
            { icon: <Server size={18} />, title: 'PP Admin Capacity', url: 'https://admin.powerplatform.microsoft.com/resources/capacity', description: 'Power Platform capacity & storage' },
        ],
    },
    {
        id: 'security',
        title: 'Security',
        icon: <ShieldAlert size={18} />,
        links: [
            { icon: <ShieldAlert size={18} />, title: 'Microsoft Defender', url: 'https://security.microsoft.com', description: 'Microsoft Security portal' },
            { icon: <KeyRound size={18} />, title: 'Entra Conditional Access', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_ConditionalAccess', description: 'Conditional Access policies' },
            { icon: <ScanLine size={18} />, title: 'GitHub Security', url: 'https://github.com/orgs/WCG-HieuLe/security', description: 'GitHub security scanning' },
            { icon: <Bug size={18} />, title: 'Azure Security Center', url: 'https://portal.azure.com/#view/Microsoft_Azure_Security/SecurityMenuBlade', description: 'Azure security overview' },
        ],
    },
    {
        id: 'compliance',
        title: 'Compliance',
        icon: <ClipboardCheck size={18} />,
        links: [
            { icon: <FileCheck size={18} />, title: 'Microsoft Purview Compliance', url: 'https://compliance.microsoft.com', description: 'Compliance manager & policies' },
            { icon: <ClipboardCheck size={18} />, title: 'Compliance Checklist', url: '#', description: 'Internal compliance tracking (coming soon)' },
            { icon: <BookOpen size={18} />, title: 'Data Retention Policy', url: '#', description: 'Data retention documentation' },
            { icon: <UserCheck size={18} />, title: 'Training Records', url: '#', description: 'Security awareness training' },
        ],
    },
];

export type ManagementSubView = 'admin' | 'billing' | 'log' | 'data' | 'reports' | 'devtools' | 'domains' | 'license' | 'security' | 'compliance';

interface ManagementViewProps {
    activeSubView?: ManagementSubView;
}

export const ManagementView: React.FC<ManagementViewProps> = ({ activeSubView = 'admin' }) => {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (id: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const sectionsToShow = activeSubView
        ? managementSections.filter(s => s.id === activeSubView)
        : managementSections;

    return (
        <div className="management-container">
            <div className="management-sections">
                {sectionsToShow.map((section) => (
                    <div key={section.id} className={`management-group ${collapsedSections[section.id] ? 'collapsed' : ''}`}>
                        {!activeSubView && (
                            <button
                                className="management-group-header"
                                onClick={() => toggleSection(section.id)}
                            >
                                <span className="management-group-title">
                                    <span className="management-group-emoji">{section.icon}</span>
                                    {section.title}
                                    <span className="management-group-count">{section.links.length}</span>
                                </span>
                                {collapsedSections[section.id]
                                    ? <ChevronRight size={18} />
                                    : <ChevronDown size={18} />
                                }
                            </button>
                        )}

                        {!collapsedSections[section.id] && (
                            <div className="management-grid">
                                {section.links.map((link) => (
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
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
