import React from 'react';
import { useTheme } from '../context/ThemeContext';


interface SidebarProps {
    currentView: 'personal' | 'team' | 'audit' | 'management';
    onChangeView: (view: 'personal' | 'team' | 'audit' | 'management') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onChangeView
}) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Attendance</h2>
                <button
                    className="theme-toggle-sidebar"
                    onClick={toggleTheme}
                    title={theme === 'zinc' ? 'Switch to Slate' : 'Switch to Zinc'}
                >
                    {theme === 'zinc' ? '🌑' : '🌌'}
                </button>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={`nav-item ${currentView === 'personal' ? 'active' : ''}`}
                    onClick={() => onChangeView('personal')}
                >
                    <span className="icon">📅</span>
                    <span className="label">Attendance</span>
                </button>

                <button
                    className={`nav-item ${currentView === 'team' ? 'active' : ''}`}
                    onClick={() => onChangeView('team')}
                >
                    <span className="icon">📝</span>
                    <span className="label">Registration</span>
                </button>

                <button
                    className={`nav-item ${currentView === 'audit' ? 'active' : ''}`}
                    onClick={() => onChangeView('audit')}
                >
                    <span className="icon">📋</span>
                    <span className="label">Audit Logs</span>
                </button>

                <button
                    className={`nav-item ${currentView === 'management' ? 'active' : ''}`}
                    onClick={() => onChangeView('management')}
                >
                    <span className="icon">⚙️</span>
                    <span className="label">Management</span>
                </button>
            </nav>

            <div className="sidebar-footer">
                <div className="version-info">
                    v1.0.0
                </div>
            </div>
        </aside>
    );
};
