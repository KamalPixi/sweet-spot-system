import React from 'react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

export default function AdminSidebar({
    collapsed,
    onToggleCollapsed,
    activeTab,
    onTabChange,
    onLogout,
    sections,
}) {
    return (
        <aside className={`transition-all duration-300 ${collapsed ? 'w-20 p-3' : 'w-64 p-5'} border-r border-neutral-200 bg-white flex flex-col justify-between h-screen sticky top-0 shrink-0 shadow-sm`}>
            <div>
                <div className={`flex items-center ${collapsed ? 'flex-col space-y-4' : 'justify-between'} mb-8`}>
                    {!collapsed ? (
                        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onTabChange('dashboard')}>
                            <div className="w-8 h-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                                P
                            </div>
                            <div className="text-left leading-none">
                                <span className="text-sm font-black tracking-widest text-neutral-950 block">PUDDING</span>
                                <span className="text-[9px] text-[#C5A880] font-bold tracking-wider uppercase block mt-0.5">Admin Portal</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center cursor-pointer w-8 h-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-black shadow-sm" onClick={() => onTabChange('dashboard')}>
                            P
                        </div>
                    )}
                    <button
                        onClick={onToggleCollapsed}
                        className="p-1.5 rounded-full border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-950 hover:bg-neutral-50 transition-colors shadow-sm"
                        title={collapsed ? 'Expand Menu' : 'Collapse Menu'}
                    >
                        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                    </button>
                </div>

                <div className="space-y-5">
                    {sections.map(section => (
                        <div key={section.label} className="space-y-1.5">
                            {!collapsed && (
                                <div className="px-3 text-[9px] font-black uppercase tracking-widest text-neutral-300">
                                    {section.label}
                                </div>
                            )}
                            <div className="space-y-1">
                                {section.items.map(item => {
                                    const isActive = activeTab === item.id;
                                    const badgeClasses = item.badgeTone === 'amber'
                                        ? 'bg-amber-100 text-amber-700'
                                        : item.badgeTone === 'red'
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-neutral-100 text-neutral-500';

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onTabChange(item.id)}
                                            className={`w-full flex items-center transition-all ${
                                                collapsed ? 'justify-center p-3 relative' : 'gap-3 px-3.5 py-2.5'
                                            } text-[13px] font-bold rounded-lg ${
                                                isActive
                                                    ? 'bg-neutral-950 text-white shadow-sm'
                                                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                                            }`}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <span className={`shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`}>{item.icon}</span>
                                            {!collapsed && (
                                                <>
                                                    <span className="flex-grow text-left">{item.label}</span>
                                                    {item.badge && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white/15 text-white' : badgeClasses}`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {collapsed && item.badge && (
                                                <span className={`absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${isActive ? 'bg-white text-neutral-950' : badgeClasses}`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`space-y-2 pt-4 border-t border-neutral-200 ${collapsed ? 'text-center' : ''}`}>
                <button
                    onClick={onLogout}
                    className={`w-full py-2 bg-transparent text-neutral-400 hover:text-red-650 hover:bg-red-50/50 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        collapsed ? 'px-0' : 'space-x-1.5'
                    }`}
                    title="Log Out Portal"
                >
                    <LogOut size={12} />
                    {!collapsed && <span>Log Out Portal</span>}
                </button>
            </div>
        </aside>
    );
}
