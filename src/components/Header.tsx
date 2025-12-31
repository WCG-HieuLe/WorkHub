import { AccountInfo } from '@azure/msal-browser';

interface HeaderProps {
    year: number;
    month: number;
    onMonthChange: (year: number, month: number) => void;
    title: string;
    showDateNav: boolean;
    user: AccountInfo | null;
    isAuthenticated: boolean;
    onLogin: () => void;
    onLogout: () => void;
}

const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export const Header: React.FC<HeaderProps> = ({
    year,
    month,
    onMonthChange,
    title,
    showDateNav,
    user,
    isAuthenticated,
    onLogin,
    onLogout
}) => {

    const handlePrevMonth = () => {
        if (month === 0) {
            onMonthChange(year - 1, 11);
        } else {
            onMonthChange(year, month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 11) {
            onMonthChange(year + 1, 0);
        } else {
            onMonthChange(year, month + 1);
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="app-title">{title}</h1>
                </div>

                <div className="header-right">

                    {showDateNav && (
                        <div className="month-selector">
                            <button className="nav-btn" onClick={handlePrevMonth} aria-label="Tháng trước">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <span className="current-month">
                                {monthNames[month]} {year}
                            </span>
                            <button className="nav-btn" onClick={handleNextMonth} aria-label="Tháng sau">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    )}
                    {isAuthenticated && user ? (
                        <div className="user-profile-header">
                            <span className="user-name-header">{user.name}</span>
                            <button className="logout-icon-btn" onClick={onLogout} title="Đăng xuất">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button className="login-btn-header" onClick={onLogin}>
                            <span>🔑</span> Đăng nhập
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
