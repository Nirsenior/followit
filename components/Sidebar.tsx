
import React from 'react';
import {
    LayoutDashboard,
    Users,
    User,
    LogOut,
    Zap
} from 'lucide-react';

interface SidebarProps {
    activeScreen: string;
    onNavigate: (screen: any) => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'דשבורד', icon: LayoutDashboard },
        { id: 'journal', label: 'יומן לקוחות', icon: Users },
        { id: 'profile', label: 'פרופיל', icon: User },
    ];

    return (
        <aside className="w-[240px] bg-slate-950 text-white flex flex-col py-8 z-50 transition-all border-l border-white/5 relative shadow-2xl overflow-hidden">
            {/* Brand Logo Section */}
            <div className="mb-10 px-6 relative group cursor-pointer" onClick={() => onNavigate('dashboard')}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-sky-600 to-sky-400 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/40 border border-white/20 shrink-0">
                        <Zap className="w-6 h-6 text-white fill-white/20" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight text-white leading-none">followit<span className="text-sky-400">360</span></span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-1">Professional CRM</span>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 flex flex-col gap-2 w-full px-4">
                {menuItems.map((item) => {
                    const isActive = activeScreen === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`
                                flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 w-full group
                                ${isActive
                                    ? 'bg-sky-500 text-white shadow-xl shadow-sky-500/20 font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-sm tracking-wide">{item.label}</span>

                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className="absolute -left-4 w-1.5 h-8 bg-sky-400 rounded-r-full shadow-[0_0_15px_#38bdf8]"></div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="mt-auto px-4 w-full">
                <div className="h-px bg-slate-800/50 w-full mb-6"></div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all duration-300 w-full group"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">התנתקות</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
