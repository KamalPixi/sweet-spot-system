import React, { useState } from 'react';
import { 
    Bell, ChevronDown, LogOut, RefreshCw, Users, X, Sparkles, Clock, 
    CheckCircle2, Plus, QrCode, Printer, ExternalLink, ShieldCheck, 
    Activity, Store, Search
} from 'lucide-react';

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
    activeTab,
    onTabChange,
    orderSummary = {},
}) {
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 pt-2.5 lg:pt-3 pr-2.5 lg:pr-3 pl-0 pb-1.5 bg-[#F5EFEB]/90 backdrop-blur-md">
            {/* Top Bar Floating Curved Card */}
            <div className="bg-surface rounded-2xl border border-stone-200/60 shadow-xs px-4 lg:px-5 py-2 flex items-center justify-between gap-3.5">
                {/* Left: Atelier Identity & Section Breadcrumb */}
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex items-center gap-3">
                        {/* Status Icon Pillar */}
                        <div className="w-8 h-8 rounded-xl bg-primary text-accent flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                            <Store size={15} className="text-accent" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 leading-none mb-1">
                                <span className="text-[11px] font-black text-primary uppercase tracking-wider font-mono">
                                    SWEET SPOT ATELIER
                                </span>
                                <span className="text-stone-300 text-[10px]">/</span>
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest truncate">
                                    {sectionLabel}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
                                    <Clock size={10} className="text-stone-400" />
                                    {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} GMT
                                </span>
                                <span className="w-1 h-1 rounded-full bg-stone-300" />
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                    Store Live
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center / Operational Quick Hub (Desktop) */}
                <div className="hidden xl:flex items-center gap-2">
                    {/* Active Queue Action Button */}
                    <button
                        type="button"
                        onClick={onOpenOrders}
                        className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface hover:bg-stone-50 border border-stone-200/80 text-xs font-semibold text-stone-700 hover:text-primary hover:border-stone-400 transition-all duration-150 cursor-pointer shadow-2xs"
                        title="View Live Kitchen Orders"
                    >
                        <Activity size={13} className="text-secondary group-hover:scale-110 transition-transform" />
                        <span>Live Orders</span>
                        {orderSummary?.active > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-white text-[10px] font-black font-mono">
                                {orderSummary.active}
                            </span>
                        ) : (
                            <span className="px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-mono">
                                0
                            </span>
                        )}
                    </button>

                    {/* Quick Table Floorplan Button */}
                    <button
                        type="button"
                        onClick={() => onTabChange && onTabChange('tables')}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface hover:bg-stone-50 border border-stone-200/80 text-xs font-semibold text-stone-700 hover:text-primary hover:border-stone-400 transition-all duration-150 cursor-pointer shadow-2xs"
                        title="Floorplan & Table QR Codes"
                    >
                        <QrCode size={13} className="text-stone-500" />
                        <span>Tables QR</span>
                    </button>

                    {/* Star CloudPRNT Queue Button */}
                    <button
                        type="button"
                        onClick={() => onTabChange && onTabChange('printers')}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface hover:bg-stone-50 border border-stone-200/80 text-xs font-semibold text-stone-700 hover:text-primary hover:border-stone-400 transition-all duration-150 cursor-pointer shadow-2xs"
                        title="Star TSP100 Cloud Printing"
                    >
                        <Printer size={13} className="text-stone-500" />
                        <span>Star TSP100</span>
                    </button>
                </div>

                {/* Right Actions Deck: New Action, Sync, Notifications, Profile */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                    {/* Primary "+ Quick Action" Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setQuickActionsOpen(prev => !prev);
                                setNotificationsOpen(false);
                                setAccountMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary-hover active:scale-98 text-white text-xs font-bold tracking-tight transition-all duration-150 shadow-xs cursor-pointer"
                        >
                            <Plus size={14} className="stroke-[3] text-white" />
                            <span className="hidden sm:inline">New Action</span>
                            <ChevronDown size={12} className={`text-white/80 transition-transform duration-200 ${quickActionsOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {quickActionsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-surface text-primary border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                                <div className="px-3.5 py-2.5 bg-canvas border-b border-stone-200/80">
                                    <span className="text-[9.5px] font-black uppercase tracking-wider text-stone-500">
                                        Quick Operations
                                    </span>
                                </div>
                                <div className="p-1 space-y-0.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuickActionsOpen(false);
                                            onTabChange && onTabChange('products');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-800 hover:bg-canvas hover:text-primary transition-colors text-left cursor-pointer"
                                    >
                                        <Plus size={13} className="text-secondary" />
                                        <span>Create Product</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuickActionsOpen(false);
                                            onTabChange && onTabChange('categories');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-800 hover:bg-canvas hover:text-primary transition-colors text-left cursor-pointer"
                                    >
                                        <Plus size={13} className="text-secondary" />
                                        <span>Create Category</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuickActionsOpen(false);
                                            onTabChange && onTabChange('tables');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-800 hover:bg-canvas hover:text-primary transition-colors text-left cursor-pointer"
                                    >
                                        <QrCode size={13} className="text-stone-500" />
                                        <span>Add Dine-In Table</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuickActionsOpen(false);
                                            window.open('/', '_blank');
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors text-left cursor-pointer border-t border-stone-100"
                                    >
                                        <span className="flex items-center gap-2">
                                            <ExternalLink size={13} />
                                            <span>View Storefront</span>
                                        </span>
                                        <span className="text-[9px] text-stone-400 font-mono">Live</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sync / Refresh Button */}
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="p-2 rounded-xl bg-surface hover:bg-stone-50 border border-stone-200/80 text-stone-600 hover:text-primary hover:border-stone-400 transition-all cursor-pointer shadow-2xs"
                        title="Refresh live metrics"
                    >
                        <RefreshCw size={14} />
                    </button>

                    {/* Activity & Notifications Button */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setNotificationsOpen(prev => !prev);
                                setAccountMenuOpen(false);
                                setQuickActionsOpen(false);
                            }}
                            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                                notificationsOpen
                                    ? 'bg-surface border-primary text-primary ring-1 ring-primary/20'
                                    : 'bg-surface hover:bg-stone-50 border-stone-200/80 text-stone-700 hover:text-primary hover:border-stone-400'
                            }`}
                            title="Open notifications"
                        >
                            <Bell size={14} className={unreadNotificationCount > 0 ? 'text-secondary' : 'text-stone-400'} />
                            <span className="hidden md:inline">Activity</span>
                            {unreadNotificationCount > 0 && (
                                <span className="min-w-4 h-4 px-1 rounded-full bg-secondary text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                                    {unreadNotificationCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown Panel */}
                        {notificationsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-surface text-primary border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                                <div className="px-4 py-3 bg-canvas border-b border-stone-200/80 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xs font-black text-primary uppercase tracking-wider">Atelier Activity Log</h2>
                                        <p className="text-[10px] text-stone-500 mt-0.5">{unreadNotificationCount} unread events</p>
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
                                            <p className="text-[10px] text-stone-400 mt-1">Orders, courier dispatches, and table scans arrive here live.</p>
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
                                                        className={`group w-full text-left px-4 py-3 hover:bg-[#FAF7F2]/80 transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                                                            isUnread ? 'bg-amber-50/50' : 'bg-white'
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

                    {/* Admin Profile Command Menu (Avatar Only) */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setAccountMenuOpen(prev => !prev);
                                setNotificationsOpen(false);
                                setQuickActionsOpen(false);
                            }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer shadow-2xs ${
                                accountMenuOpen
                                    ? 'bg-primary text-accent ring-2 ring-primary/30 scale-105'
                                    : 'bg-primary text-accent hover:bg-primary-hover hover:scale-105'
                            }`}
                            title={`Account: ${adminDisplayName}`}
                            aria-label="Open profile menu"
                        >
                            <span className="font-serif font-black text-[13px] tracking-wide">
                                {adminDisplayName[0]?.toUpperCase() || 'A'}
                            </span>
                        </button>

                        {accountMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-surface text-primary border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                                <div className="px-4 py-3 bg-canvas border-b border-stone-200/80">
                                    <p className="text-xs font-bold text-primary truncate">{adminDisplayName}</p>
                                    <p className="text-[10px] text-stone-500 truncate mt-0.5">{userEmail}</p>
                                    <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wider">
                                        {adminRole}
                                    </span>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAccountMenuOpen(false);
                                            onOpenProfile();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold text-stone-700 hover:bg-[#FAF7F2] hover:text-[#261B16] transition-colors text-left cursor-pointer"
                                    >
                                        <Users size={13} className="text-amber-700" />
                                        Admin Profile
                                    </button>
                                </div>
                                <div className="p-1.5 border-t border-stone-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAccountMenuOpen(false);
                                            onLogout();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
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

