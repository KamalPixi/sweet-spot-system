import React from 'react';
import { ChevronLeft, ChevronRight, LogOut, Sparkles, Circle } from 'lucide-react';

export default function AdminSidebar({
    collapsed,
    onToggleCollapsed,
    activeTab,
    onTabChange,
    onLogout,
    sections,
}) {
    return (
        <aside
            className={`transition-all duration-300 ${
                collapsed ? 'w-[78px] p-2.5' : 'w-[260px] p-4'
            } border-r border-stone-200/70 bg-[#FAF7F2] flex flex-col justify-between h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_-8px_rgba(180,140,110,0.06)] z-20`}
        >
            <div className="flex flex-col h-full overflow-hidden">
                {/* Brand Header */}
                <div className={`flex items-center ${collapsed ? 'flex-col space-y-3' : 'justify-between'} mb-6 px-1 pt-1`}>
                    {!collapsed ? (
                        <div
                            className="flex items-center space-x-3 cursor-pointer group select-none"
                            onClick={() => onTabChange('dashboard')}
                        >
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D97706] via-[#B45309] to-[#78350F] text-white flex items-center justify-center font-serif font-black shadow-md shadow-amber-800/20 shrink-0 text-base tracking-tighter group-hover:scale-105 transition-transform duration-200">
                                <span>SS</span>
                            </div>
                            <div className="text-left leading-tight">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-black tracking-wider text-[#261B16] block uppercase">
                                        Sweet Spot
                                    </span>
                                    <Sparkles size={11} className="text-amber-600" />
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] text-stone-500 font-semibold tracking-wide uppercase">
                                        Atelier Live
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex items-center justify-center cursor-pointer w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D97706] via-[#B45309] to-[#78350F] text-white font-serif font-black shadow-md shadow-amber-800/20 text-sm hover:scale-105 transition-transform"
                            onClick={() => onTabChange('dashboard')}
                            title="Sweet Spot System"
                        >
                            SS
                        </div>
                    )}
                    <button
                        onClick={onToggleCollapsed}
                        className="p-1.5 rounded-xl border border-stone-200/80 bg-white/90 text-stone-400 hover:text-stone-800 hover:bg-white hover:border-stone-300 transition-all shadow-xs cursor-pointer"
                        title={collapsed ? 'Expand Menu' : 'Collapse Menu'}
                    >
                        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                    </button>
                </div>

                {/* Navigation Menu (Scrollable) */}
                <div className="flex-grow overflow-y-auto space-y-5 pr-0.5 scrollbar-thin scrollbar-thumb-stone-200">
                    {sections.map(section => (
                        <div key={section.label} className="space-y-1">
                            {!collapsed && (
                                <div className="px-3.5 pb-1 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-stone-400/90 select-none">
                                    {section.label}
                                </div>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map(item => {
                                    const isActive = activeTab === item.id;
                                    const badgeClasses = item.badgeTone === 'amber'
                                        ? 'bg-amber-100/80 text-amber-800 border border-amber-200/60'
                                        : item.badgeTone === 'red'
                                            ? 'bg-rose-100/80 text-rose-700 border border-rose-200/60'
                                            : 'bg-stone-200/70 text-stone-600 border border-stone-300/40';

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onTabChange(item.id)}
                                            className={`w-full flex items-center transition-all duration-200 ${
                                                collapsed ? 'justify-center p-2.5 relative' : 'gap-3 px-3.5 py-2.5'
                                            } text-[12.5px] font-bold rounded-xl cursor-pointer ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-[#2B1B15] to-[#1E130E] text-[#FFF9F2] shadow-sm shadow-[#2B1B15]/20'
                                                    : 'text-stone-600 hover:text-[#261B16] hover:bg-white/80 hover:shadow-xs'
                                            }`}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <span
                                                className={`shrink-0 transition-transform duration-200 ${
                                                    isActive
                                                        ? 'text-amber-400 scale-105'
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
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : badgeClasses}`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {collapsed && item.badge && (
                                                <span className={`absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${isActive ? 'bg-amber-400 text-stone-950 font-bold' : badgeClasses}`}>
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

            {/* Footer / Store Badge & Log Out */}
            <div className="pt-3 mt-2 border-t border-stone-200/80 space-y-2">
                {!collapsed && (
                    <div className="bg-white/70 border border-stone-200/60 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-stone-800 leading-tight">London HQ Store</p>
                                <p className="text-[9px] text-stone-400 leading-tight">Dine-In · Deliveries · Pickup</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className={`w-full py-2 bg-transparent text-stone-500 hover:text-rose-600 hover:bg-rose-50/70 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                        collapsed ? 'px-0' : 'space-x-2'
                    }`}
                    title="Log Out of Portal"
                >
                    <LogOut size={13} />
                    {!collapsed && <span>Log Out</span>}
                </button>
            </div>
        </aside>
    );
}
