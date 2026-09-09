import React from 'react';
import { Bell, ChevronDown, LogOut, RefreshCw, Users, X } from 'lucide-react';

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
        <header className="sticky top-0 z-30 px-8 py-2.5 bg-white/95 backdrop-blur border-b border-neutral-200 shadow-xs">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                    <div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">{sectionLabel}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-base font-black text-neutral-950 tracking-tight leading-none">Pudding London Admin</h1>
                            <span className="px-2 py-0.5 rounded-full bg-neutral-950 text-white text-[9px] font-bold uppercase tracking-wider">{adminRole}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setNotificationsOpen(prev => !prev);
                                setAccountMenuOpen(false);
                            }}
                            className={`relative flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${
                                notificationsOpen
                                    ? 'border-neutral-950 text-neutral-950'
                                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-950 hover:text-neutral-950'
                            }`}
                            title="Open notifications"
                        >
                            <Bell size={14} />
                            <span>Notifications</span>
                            {unreadNotificationCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                                    {unreadNotificationCount}
                                </span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xs font-black text-neutral-900">Notifications</h2>
                                        <p className="text-[10px] text-neutral-400 mt-0.5">{unreadNotificationCount} unread</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {unreadNotificationCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={onMarkAllNotificationsRead}
                                                className="text-[10px] font-bold text-neutral-400 hover:text-neutral-950 transition-colors"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={onClearAllNotifications}
                                                className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {notificationsLoading ? (
                                        <div className="py-10 flex items-center justify-center text-neutral-400">
                                            <RefreshCw size={18} className="animate-spin" />
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="px-5 py-10 text-center">
                                            <Bell size={22} className="mx-auto text-neutral-300 mb-2" />
                                            <p className="text-xs font-bold text-neutral-500">No notifications yet</p>
                                            <p className="text-[10px] text-neutral-400 mt-1">New orders and important updates will appear here.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-neutral-100">
                                            {notifications.map(notification => {
                                                const isUnread = !notification.read_at;
                                                const priority = notification.data?.priority || 'normal';
                                                return (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => onNotificationClick(notification)}
                                                        className={`group w-full text-left px-4 py-3 hover:bg-neutral-50/80 transition-colors flex items-start justify-between gap-3 cursor-pointer border-b border-neutral-100/50 last:border-0 ${
                                                            isUnread ? 'bg-amber-50/35' : 'bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0 flex-grow">
                                                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                                                                isUnread
                                                                    ? priority === 'high' ? 'bg-red-500' : 'bg-amber-500'
                                                                    : 'bg-neutral-200'
                                                            }`} />
                                                            <div className="min-w-0 flex-grow">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <p className="text-xs font-black text-neutral-900 leading-snug">{notification.data?.title || 'Notification'}</p>
                                                                    <span className="text-[9px] text-neutral-400 whitespace-nowrap">{formatNotificationTime(notification.created_at)}</span>
                                                                </div>
                                                                <p className="text-[11px] text-neutral-500 leading-snug mt-1">{notification.data?.message || 'You have a new update.'}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[9px] font-bold uppercase tracking-wider">{notification.data?.category || 'general'}</span>
                                                                    {isUnread && <span className="text-[9px] font-bold text-amber-700">Unread</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Delete Button (Visible on hover) */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteNotification(notification.id);
                                                            }}
                                                            className="p-1 rounded-md text-neutral-300 hover:bg-neutral-100 hover:text-neutral-700 transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
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

                    <button
                        type="button"
                        onClick={onRefresh}
                        className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-neutral-950 hover:border-neutral-950 transition-colors"
                        title="Refresh current section"
                    >
                        <RefreshCw size={14} />
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setAccountMenuOpen(prev => !prev);
                                setNotificationsOpen(false);
                            }}
                            className={`flex items-center gap-2 bg-white border rounded-lg px-2.5 py-1.5 transition-colors ${
                                accountMenuOpen
                                    ? 'border-neutral-950'
                                    : 'border-neutral-200 hover:border-neutral-950'
                            }`}
                            title="Open account menu"
                        >
                            <div className="w-7 h-7 rounded-full bg-neutral-950 text-[#C5A880] flex items-center justify-center text-[10px] font-black shrink-0">
                                {adminDisplayName[0].toUpperCase()}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[11px] font-black text-neutral-900 truncate max-w-40 leading-tight">{adminDisplayName}</p>
                                <p className="text-[9px] text-neutral-400 truncate max-w-40 leading-tight">{userEmail || adminRole}</p>
                            </div>
                            <ChevronDown
                                size={13}
                                className={`text-neutral-400 shrink-0 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {accountMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-neutral-100">
                                    <p className="text-xs font-black text-neutral-900 truncate">{adminDisplayName}</p>
                                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">{userEmail}</p>
                                    <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[9px] font-bold uppercase tracking-wider">{adminRole}</span>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        type="button"
                                        onClick={onOpenProfile}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors text-left"
                                    >
                                        <Users size={13} />
                                        Admin Profile
                                    </button>
                                </div>
                                <div className="p-1.5 border-t border-neutral-100">
                                    <button
                                        type="button"
                                        onClick={onLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
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
