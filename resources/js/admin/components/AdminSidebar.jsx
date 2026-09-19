import React from 'react';
import { ChevronLeft, ChevronRight, LogOut, Sparkles, User, X } from 'lucide-react';

export default function AdminSidebar({
    collapsed,
    onToggleCollapsed,
    activeTab,
    onTabChange,
    onLogout,
    sections,
    adminDisplayName = 'Alex Morgan',
    userEmail = 'alex.morgan@email.com',
    adminRole = 'Store Admin',
}) {
    const handleItemClick = (tabId) => {
        onTabChange(tabId);
        // On mobile, automatically close drawer after clicking a link
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            onToggleCollapsed();
        }
    };
    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {!collapsed && (
                <div
                    onClick={onToggleCollapsed}
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
                    aria-hidden="true"
                />
            )}

            <aside
                className={`transition-all duration-300 ${
                    collapsed
                        ? 'max-md:-translate-x-full md:w-[76px] md:p-2'
                        : 'max-md:translate-x-0 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 md:w-[268px] p-2.5 lg:p-3'
                } flex flex-col justify-between h-screen sticky top-0 shrink-0 bg-canvas select-none z-30 max-md:w-[280px]`}
            >
                <div className="flex flex-col h-full overflow-hidden space-y-3">
                {/* 1. Deep Espresso / Brand Profile Hero Card */}
                {!collapsed ? (
                    <div className="relative overflow-hidden rounded-2xl bg-primary text-white p-4 shadow-sm border border-white/5">
                        {/* Decorative background radial glow */}
                        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 rounded-full bg-secondary/20 blur-xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-20 h-20 rounded-full bg-accent/15 blur-lg pointer-events-none" />
                        
                        <div className="relative z-10 flex items-start justify-between gap-2">
                            {/* Avatar Circle */}
                            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                <User size={18} className="text-accent" />
                            </div>

                            {/* Collapse / Close Toggle Button */}
                            <button
                                onClick={onToggleCollapsed}
                                className="p-1 rounded-md text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Close Menu"
                            >
                                <span className="md:hidden">
                                    <X size={16} />
                                </span>
                                <span className="hidden md:inline">
                                    <ChevronLeft size={14} />
                                </span>
                            </button>
                        </div>

                        {/* Name and Email */}
                        <div className="mt-3">
                            <h3 className="text-sm font-bold tracking-tight text-white truncate">
                                {adminDisplayName}
                            </h3>
                            <p className="text-[10.5px] text-stone-300/80 truncate font-light mt-0.5">
                                {userEmail}
                            </p>
                        </div>

                        {/* Brand Badge */}
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light border border-white/10 text-accent text-[10px] font-semibold tracking-wide">
                            <Sparkles size={11} className="text-accent" />
                            <span>Sweet Spot · {adminRole}</span>
                        </div>
                    </div>
                ) : (
                    /* Collapsed Avatar Header */
                    <div className="flex flex-col items-center gap-2 py-2">
                        <div
                            onClick={() => onTabChange('dashboard')}
                            className="w-11 h-11 rounded-2xl bg-primary text-accent border border-white/5 flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm hover:scale-105 transition-transform"
                            title={adminDisplayName}
                        >
                            <User size={18} className="text-accent" />
                        </div>
                        <button
                            onClick={onToggleCollapsed}
                            className="p-1 rounded-md text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                            title="Expand Menu"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {/* 2. Floating Navigation Links Card */}
                <div className="flex-grow overflow-y-auto bg-surface rounded-2xl p-3 shadow-xs border border-stone-200/60 space-y-4 scrollbar-thin scrollbar-thumb-stone-200">
                    {sections.map(section => (
                        <div key={section.label} className="space-y-1">
                            {!collapsed && (
                                <div className="px-3 pt-1 pb-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
                                    {section.label}
                                </div>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map(item => {
                                    const isActive = activeTab === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleItemClick(item.id)}
                                            className={`w-full flex items-center transition-all duration-150 ${
                                                collapsed ? 'justify-center p-2.5 relative' : 'gap-3 px-3.5 py-2.5'
                                            } text-[12.5px] font-semibold rounded-xl cursor-pointer ${
                                                isActive
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'text-stone-600 hover:text-stone-950 hover:bg-canvas'
                                            }`}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <span
                                                className={`shrink-0 transition-colors ${
                                                    isActive
                                                        ? 'text-accent'
                                                        : 'text-stone-400 group-hover:text-stone-600'
                                                }`}
                                            >
                                                {item.icon}
                                            </span>
                                            {!collapsed && (
                                                <>
                                                    <span className="flex-grow text-left truncate tracking-tight">
                                                        {item.label}
                                                    </span>
                                                    {item.badge && (
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                isActive
                                                                    ? 'bg-secondary text-white'
                                                                    : 'bg-secondary text-white'
                                                            }`}
                                                        >
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {collapsed && item.badge && (
                                                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-secondary text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Bottom Links: Profile & Log Out */}
                    <div className="pt-2 border-t border-stone-100 space-y-0.5">
                        <button
                            onClick={() => handleItemClick('profile')}
                            className={`w-full flex items-center transition-colors ${
                                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2'
                            } text-[12px] font-semibold text-stone-600 hover:text-stone-950 hover:bg-canvas rounded-xl cursor-pointer`}
                            title="Admin Settings"
                        >
                            <User size={15} className="text-stone-400 shrink-0" />
                            {!collapsed && <span>Account Settings</span>}
                        </button>
                        <button
                            onClick={onLogout}
                            className={`w-full flex items-center transition-colors ${
                                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2'
                            } text-[12px] font-semibold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer`}
                            title="Log Out"
                        >
                            <LogOut size={15} className="text-rose-600 shrink-0" />
                            {!collapsed && <span>Log Out</span>}
                        </button>
                    </div>
                </div>
            </div>
            </aside>
        </>
    );
}
