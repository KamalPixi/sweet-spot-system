import React from 'react';
import { Bell, ChevronDown, LogOut, RefreshCw, Users, X, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export default function AdminTopbar({
    sectionLabel,
    adminRole,
    adminDisplayName,
    userEmail,
    unreadNotificationCount,
    notifications,
    notificationsLoading,
    notificationsOpen,
    setNotificationsOpen,
    accountMenuOpen,
    setAccountMenuOpen,
    onRefresh,
    onOpenOrders,
    onMarkAllNotificationsRead,
    onClearAllNotifications,
    onDeleteNotification,
    onOpenProfile,
    onLogout,
    onNotificationClick,
    formatNotificationTime,
}) {
    return (
        <header className="sticky top-0 z-30 px-6 lg:px-8 py-3 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-stone-200/70 shadow-[0_4px_20px_-10px_rgba(180,140,110,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Left Title & Section Breadcrumb */}
                <div className="flex items-center gap-3 min-w-0">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-extrabold text-amber-700/80 uppercase tracking-[0.15em] leading-none">
                                {sectionLabel}
                            </span>
                            <span className="text-stone-300 text-[10px]">•</span>
                            <span className="text-[10px] font-medium text-stone-500 flex items-center gap-1">
                                <Clock size={10} className="text-stone-400" />
                                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} GMT
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-lg font-serif font-black text-[#261B16] tracking-tight leading-none">
                                Sweet Spot Management
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[9.5px] font-extrabold uppercase tracking-wider">
                                {adminRole}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Actions: Notifications, Refresh, User Profile */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {/* Live Sync Beacon */}
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-stone-200/60 shadow-xs text-[10.5px] font-semibold text-stone-600">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Live Sync</span>
                    </div>

                    {/* Notifications Button & Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setNotificationsOpen(prev => !prev);
                                setAccountMenuOpen(false);
                            }}
                            className={`relative flex items-center gap-2 bg-white/90 border rounded-xl px-3 py-2 text-[11px] font-bold transition-all shadow-xs cursor-pointer ${
                                notificationsOpen
                                    ? 'border-[#261B16] text-[#261B16] bg-white ring-2 ring-stone-200/50'
                                    : 'border-stone-200/80 text-stone-700 hover:border-stone-400 hover:text-stone-950 hover:bg-white'
                            }`}
                            title="Open notifications"
                        >
                            <Bell size={14} className="text-amber-700/80" />
                            <span className="hidden sm:inline">Activity</span>
                            {unreadNotificationCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-[#FAF7F2] shadow-xs animate-bounce">
                                    {unreadNotificationCount}
                                </span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 top-full mt-2.5 w-[370px] max-w-[calc(100vw-2rem)] bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                                <div className="px-4 py-3 bg-[#FAF7F2]/80 border-b border-stone-200/70 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xs font-black text-[#261B16] uppercase tracking-wider">Atelier Notifications</h2>
                                        <p className="text-[10px] text-stone-500 mt-0.5">{unreadNotificationCount} unread updates</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {unreadNotificationCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={onMarkAllNotificationsRead}
                                                className="text-[10px] font-bold text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={onClearAllNotifications}
                                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
                                    {notificationsLoading ? (
                                        <div className="py-10 flex items-center justify-center text-stone-400">
                                            <RefreshCw size={18} className="animate-spin text-amber-600" />
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="px-5 py-10 text-center">
                                            <Bell size={24} className="mx-auto text-stone-300 mb-2" />
                                            <p className="text-xs font-bold text-stone-600">All caught up!</p>
                                            <p className="text-[10px] text-stone-400 mt-1">Orders and store events will arrive in real time.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {notifications.map(notification => {
                                                const isUnread = !notification.read_at;
                                                const priority = notification.data?.priority || 'normal';
                                                return (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => onNotificationClick(notification)}
                                                        className={`group w-full text-left px-4 py-3 hover:bg-[#FAF7F2]/60 transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                                                            isUnread ? 'bg-amber-50/40' : 'bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0 flex-grow">
                                                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                                                                isUnread
                                                                    ? priority === 'high' ? 'bg-rose-500 ring-2 ring-rose-200' : 'bg-amber-500 ring-2 ring-amber-200'
                                                                    : 'bg-stone-200'
                                                            }`} />
                                                            <div className="min-w-0 flex-grow">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <p className="text-xs font-black text-[#261B16] leading-snug">{notification.data?.title || 'Notification'}</p>
                                                                    <span className="text-[9.5px] text-stone-400 whitespace-nowrap">{formatNotificationTime(notification.created_at)}</span>
                                                                </div>
                                                                <p className="text-[11px] text-stone-600 leading-snug mt-1">{notification.data?.message || 'You have a new update.'}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[9px] font-bold uppercase tracking-wider">{notification.data?.category || 'general'}</span>
                                                                    {isUnread && <span className="text-[9px] font-bold text-amber-700">New</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteNotification(notification.id);
                                                            }}
                                                            className="p-1 rounded-md text-stone-300 hover:bg-stone-200 hover:text-stone-700 transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none cursor-pointer"
                                                            title="Clear notification"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="p-2 bg-white/90 border border-stone-200/80 rounded-xl text-stone-500 hover:text-[#261B16] hover:border-stone-400 hover:bg-white transition-all shadow-xs cursor-pointer"
                        title="Refresh store metrics"
                    >
                        <RefreshCw size={14} />
                    </button>

                    {/* User Profile Menu */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setAccountMenuOpen(prev => !prev);
                                setNotificationsOpen(false);
                            }}
                            className={`flex items-center gap-2 bg-white/90 border rounded-xl px-2.5 py-1.5 transition-all shadow-xs cursor-pointer ${
                                accountMenuOpen
                                    ? 'border-[#261B16] ring-2 ring-stone-200/50 bg-white'
                                    : 'border-stone-200/80 hover:border-stone-400 hover:bg-white'
                            }`}
                            title="Open account menu"
                        >
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D97706] to-[#78350F] text-white flex items-center justify-center text-[11px] font-serif font-black shrink-0 shadow-xs">
                                {adminDisplayName[0].toUpperCase()}
                            </div>
                            <div className="text-left min-w-0 hidden sm:block">
                                <p className="text-[11px] font-black text-[#261B16] truncate max-w-36 leading-tight">{adminDisplayName}</p>
                                <p className="text-[9px] text-stone-400 truncate max-w-36 leading-tight">{userEmail || adminRole}</p>
                            </div>
                            <ChevronDown
                                size={12}
                                className={`text-stone-400 shrink-0 transition-transform duration-200 ${accountMenuOpen ? 'rotate-180 text-stone-800' : ''}`}
                            />
                        </button>

                        {accountMenuOpen && (
                            <div className="absolute right-0 top-full mt-2.5 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                                <div className="px-4 py-3.5 bg-[#FAF7F2]/80 border-b border-stone-200/70">
                                    <p className="text-xs font-black text-[#261B16] truncate">{adminDisplayName}</p>
                                    <p className="text-[10px] text-stone-500 truncate mt-0.5">{userEmail}</p>
                                    <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
                                        {adminRole}
                                    </span>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        type="button"
                                        onClick={onOpenProfile}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-[#FAF7F2] hover:text-[#261B16] transition-colors text-left cursor-pointer"
                                    >
                                        <Users size={13} className="text-amber-700" />
                                        Admin Profile
                                    </button>
                                </div>
                                <div className="p-1.5 border-t border-stone-100">
                                    <button
                                        type="button"
                                        onClick={onLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                                    >
                                        <LogOut size={13} />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
