
import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
    activeScreen: string;
    onNavigate: (screen: any) => void;
    onLogout: () => void;
    showSidebar: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onNavigate, onLogout, showSidebar }) => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans" dir="rtl">
            {showSidebar && (
                <Sidebar
                    activeScreen={activeScreen}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                />
            )}
            <main className="flex-1 overflow-y-auto relative">
                {children}
            </main>
        </div>
    );
};

export default Layout;
