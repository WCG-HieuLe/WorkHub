import React from 'react';
import { useTheme } from '../context/ThemeContext';


interface SidebarProps {
    currentView: 'personal' | 'team' | 'audit' | 'management' | 'tools';
    onChangeView: (view: 'personal' | 'team' | 'audit' | 'management' | 'tools') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onChangeView
}) => {
    const { theme, toggleTheme } = useTheme();
    const [managementOpen, setManagementOpen] = React.useState(true);
    const [attendanceOpen, setAttendanceOpen] = React.useState(true);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>WorkHub</h2>
                <button
                    className="theme-toggle-sidebar"
                    onClick={toggleTheme}
                    title={theme === 'zinc' ? 'Switch to Slate' : 'Switch to Zinc'}
                >
                    {theme === 'zinc' ? '🌑' : '🌌'}
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-group">
                    <button
                        className="nav-group-header"
                        onClick={() => setManagementOpen(!managementOpen)}
                    >
                        <span className="group-title">Management</span>
                        <span className="group-toggle">{managementOpen ? '▼' : '▶'}</span>
                    </button>

                    {managementOpen && (
                        <div className="nav-group-items">
                            <button
                                className={`nav-item ${currentView === 'management' ? 'active' : ''}`}
                                onClick={() => onChangeView('management')}
                            >
                                <span className="icon">⚙️</span>
                                <span className="label">Admin Page</span>
                            </button>
                            <button
                                className={`nav-item ${currentView === 'tools' ? 'active' : ''}`}
                                onClick={() => onChangeView('tools')}
                            >
                                <span className="icon">🛠️</span>
                                <span className="label">Tools</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="nav-group">
                    <button
                        className="nav-group-header"
                        onClick={() => setAttendanceOpen(!attendanceOpen)}
                    >
                        <span className="group-title">Attendance</span>
                        <span className="group-toggle">{attendanceOpen ? '▼' : '▶'}</span>
                    </button>

                    {attendanceOpen && (
                        <div className="nav-group-items">
                            <button
                                className={`nav-item ${currentView === 'personal' ? 'active' : ''}`}
                                onClick={() => onChangeView('personal')}
                            >
                                <span className="icon">📅</span>
                                <span className="label">TimeSheet</span>
                            </button>

                            <button
                                className={`nav-item ${currentView === 'team' ? 'active' : ''}`}
                                onClick={() => onChangeView('team')}
                            >
                                <span className="icon">📝</span>
                                <span className="label">Adjustment Request</span>
                            </button>

                            <button
                                className={`nav-item ${currentView === 'audit' ? 'active' : ''}`}
                                onClick={() => onChangeView('audit')}
                            >
                                <span className="icon">📋</span>
                                <span className="label">Change History</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="version-info">
                    v1.0.0
                </div>
            </div>
        </aside>
    );
};
