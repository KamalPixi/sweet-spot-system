import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../../AppContext';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import useRealtimeChannel from '../../hooks/useRealtimeChannel';
import {
    Activity, ArrowRight, Bell, CheckCheck, ChevronRight, Clock,
    Loader2, LogOut, Mail, MapPin, Package, Pencil, Save, ShoppingBag,
    Trash2, User, X, Phone, CircleCheck,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────── */

const formatDateTime = (value) => {
    if (!value) return 'Unknown';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const formatDate = (value) => {
    if (!value) return 'Unknown';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_CONFIG = {
    pending:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500',  step: 0 },
    preparing:  { label: 'Preparing',  bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   step: 1 },
    ready:      { label: 'Ready',      bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500',step: 2 },
    completed:  { label: 'Completed',  bg: 'bg-neutral-100',text: 'text-neutral-500',border: 'border-neutral-200',dot: 'bg-neutral-400',step: 3 },
    cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-500',    step: -1 },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-200', dot: 'bg-neutral-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

const OrderStepper = ({ status, type }) => {
    const cfg = STATUS_CONFIG[status];
    const currentStep = cfg?.step ?? 0;
    const isCancelled = status === 'cancelled';
    const isDelivery = type === 'delivery';

    const steps = [
        'Placed',
        'Preparing',
        isDelivery ? 'On Delivery' : 'Ready',
        isDelivery ? 'Delivered' : 'Collected'
    ];

    if (isCancelled) {
        return (
            <div className="flex items-center gap-2 py-2">
                <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                    ✕ Order Cancelled
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-0 w-full mt-3">
            {steps.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                const isLast = idx === steps.length - 1;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                done
                                    ? 'bg-[#8e5233] border-[#8e5233] text-white'
                                    : 'bg-white border-neutral-200 text-neutral-300'
                            } ${active ? 'ring-2 ring-[#8e5233]/20 scale-110' : ''}`}>
                                {done ? <CircleCheck size={14} /> : <span className="text-[9px] font-bold">{idx + 1}</span>}
                            </div>
                            <p className={`text-[9px] font-bold mt-1 whitespace-nowrap ${done ? 'text-[#8e5233]' : 'text-neutral-300'}`}>
                                {step}
                            </p>
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-0.5 mx-1 mb-4 ${done && idx < currentStep ? 'bg-[#8e5233]' : 'bg-neutral-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

/* ─── Main Component ──────────────────────────────────── */

const TABS = [
    { id: 'overview',       label: 'Overview',       icon: Activity },
    { id: 'orders',         label: 'My Orders',       icon: ShoppingBag },
    { id: 'notifications',  label: 'Notifications',   icon: Bell },
    { id: 'profile',        label: 'Profile',         icon: User },
];

export default function CustomerPortal() {
    const navigate = useNavigate();
    const { token, user, userType, logout, cartItemCount, isSearchOpen, setIsSearchOpen, catalog } = useApp();

    /* state */
    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile]     = useState(user || null);
    const [orders, setOrders]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    /* orders pagination */
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [activeOrders, setActiveOrders] = useState(0);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [completedPage, setCompletedPage] = useState(1);
    const [completedTotalPages, setCompletedTotalPages] = useState(1);
    const [completedTotalOrders, setCompletedTotalOrders] = useState(0);

    /* notifications */
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]     = useState(0);

    /* profile editing */
    const [isEditing, setIsEditing]   = useState(false);
    const [editForm, setEditForm]     = useState({});
    const [saving, setSaving]         = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [changingPassword, setChangingPassword] = useState(false);

    /* ─── Auth guard ─── */
    useEffect(() => {
        if (!token) {
            navigate('/login');
        } else if (userType === 'admin') {
            navigate('/admin');
        } else if (userType !== 'customer') {
            navigate('/login');
        }
    }, [token, userType, navigate]);

    /* ─── Data fetching ─── */

    const fetchNotifications = useCallback(async () => {
        if (!token || userType !== 'customer') return;
        try {
            const res  = await fetch('/api/notifications', {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setNotifications(data.data.notifications || []);
                setUnreadCount(data.data.unread_count || 0);
            }
        } catch (err) { console.error('fetchNotifications:', err); }
    }, [token, userType]);

    const fetchOrders = useCallback(async (page = 1) => {
        if (!token || userType !== 'customer') return;
        try {
            const res  = await fetch(`/api/customer/orders?status=active&page=${page}&per_page=5`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data || []);
                if (data.meta) {
                    setTotalPages(data.meta.last_page    || 1);
                    setTotalOrders(data.meta.total_all ?? data.meta.total ?? 0);
                    setActiveOrders(data.meta.active_count ?? 0);
                    setCompletedTotalOrders(prev => data.meta.completed_count ?? prev);
                }
            }
        } catch (err) { console.error('fetchOrders:', err); }
    }, [token, userType]);

    const fetchCompletedOrders = useCallback(async (page = 1) => {
        if (!token || userType !== 'customer') return;
        try {
            const res = await fetch(`/api/customer/orders?status=completed&page=${page}&per_page=8`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setCompletedOrders(data.data || []);
                if (data.meta) {
                    setCompletedTotalPages(data.meta.last_page || 1);
                    setCompletedTotalOrders(data.meta.total || 0);
                    setTotalOrders(prev => data.meta.total_all ?? prev);
                    setActiveOrders(prev => data.meta.active_count ?? prev);
                }
            }
        } catch (err) { console.error('fetchCompletedOrders:', err); }
    }, [token, userType]);

    const fetchPortalData = useCallback(async () => {
        if (!token || userType !== 'customer') return;
        setLoading(true);
        setError(null);
        try {
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            const meRes   = await fetch('/api/me', { headers });
            const meData  = await meRes.json();
            if (meData.success && meData.type === 'customer') setProfile(meData.data);
            await fetchOrders(1);
            await fetchCompletedOrders(1);
            await fetchNotifications();
            setCurrentPage(1);
            setCompletedPage(1);
        } catch (err) {
            console.error(err);
            setError('Unable to load your account right now.');
        } finally {
            setLoading(false);
        }
    }, [token, userType, fetchOrders, fetchCompletedOrders, fetchNotifications]);

    useEffect(() => { fetchPortalData(); }, [fetchPortalData]);
    useEffect(() => { if (!loading) fetchOrders(currentPage); }, [currentPage]);
    useEffect(() => { if (!loading) fetchCompletedOrders(completedPage); }, [completedPage]);

    /* ─── Realtime ─── */

    const handleRealtimeMessage = (payload) => {
        if (!payload) return;
        const eventType = payload.event_type || payload.event || '';
        if (eventType === 'order.status_updated' || eventType === 'order.updated') {
            toast(payload.message || 'Your order has been updated.');
            setOrders(prev => prev.map(o =>
                o.order_number === payload.order_number ? { ...o, status: payload.status || o.status } : o
            ));
            fetchNotifications();
        }
    };

    useRealtimeChannel({
        token,
        channel: profile?.id ? `customer.live.${profile.id}` : null,
        onMessage: handleRealtimeMessage,
        fallbackPoll: fetchPortalData,
        fallbackInterval: 30000,
        enabled: !!token && userType === 'customer' && !!profile?.id,
    });

    /* ─── Notification actions ─── */

    const handleMarkAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) { console.error(err); }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) { console.error(err); }
    };

    const handleClearAll = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) { console.error(err); }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) { console.error(err); }
    };

    /* ─── Profile edit actions ─── */

    const startEdit = () => {
        setEditForm({ first_name: profile?.first_name || '', last_name: profile?.last_name || '', phone: profile?.phone || '' });
        setIsEditing(true);
    };

    const cancelEdit = () => setIsEditing(false);

    const saveProfile = async () => {
        setSaving(true);
        try {
            const res  = await fetch('/api/customer/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setIsEditing(false);
                toast.success('Profile updated!');
            } else {
                toast.error(data.message || 'Could not save changes.');
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const savePassword = async () => {
        if (!passwordForm.current_password || !passwordForm.password || !passwordForm.password_confirmation) {
            toast.error('Enter current password, new password, and confirmation.');
            return;
        }

        if (passwordForm.password.length < 8) {
            toast.error('New password must be at least 8 characters.');
            return;
        }

        if (passwordForm.password !== passwordForm.password_confirmation) {
            toast.error('New password and confirmation do not match.');
            return;
        }

        setChangingPassword(true);
        try {
            const res = await fetch('/api/customer/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(passwordForm),
            });
            const data = await res.json();
            if (data.success) {
                setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
                toast.success('Password changed successfully.');
            } else {
                toast.error(data.message || 'Could not change password.');
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setChangingPassword(false);
        }
    };

    /* ─── Derived values ─── */

    const latestActiveOrder = orders.find(o => !['completed', 'cancelled'].includes(o.status)) || orders[0];
    const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || '?';

    /* ─── Render ─── */

    return (
        <div className="min-h-screen bg-[#fdfaf5] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <Header
                setIsMenuOpen={setIsMenuOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                navigate={navigate}
                cartItemCount={cartItemCount}
                user={user}
            />

            <main className="w-full flex-grow mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-4 pt-6 pb-10 md:px-12 md:pt-10 md:pb-16"
                style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                <div className="max-w-5xl mx-auto w-full">

                    {/* ── Page header ── */}
                    <div className="flex items-center gap-4 mb-7">
                        <div className="w-14 h-14 rounded-full bg-[#8e5233] text-white flex items-center justify-center text-lg font-black shrink-0 shadow-md shadow-[#8e5233]/20">
                            {initials}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#8e5233] uppercase tracking-widest">Account Center</p>
                            <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
                                Hi, {profile?.first_name || 'there'} 👋
                            </h1>
                            <p className="text-xs text-neutral-400 mt-0.5">{profile?.email || profile?.phone}</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('notifications')}
                                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow cursor-pointer animate-pulse"
                            >
                                <Bell size={12} />
                                {unreadCount} new
                            </button>
                        )}
                    </div>

                    {/* ── Tab bar ── */}
                    <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-[16px] mb-7 overflow-x-auto scrollbar-none">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-1 justify-center ${
                                    activeTab === id
                                        ? 'bg-white text-[#8F5336] shadow-sm shadow-[#8e5233]/10'
                                        : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/60'
                                }`}
                            >
                                <Icon size={13} />
                                {label}
                                {id === 'notifications' && unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Content ── */}
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="animate-spin text-[#8e5233]" size={36} />
                        </div>
                    ) : error ? (
                        <div className="bg-white border border-neutral-200/60 rounded-[24px] p-8 shadow-sm">
                            <p className="text-sm text-red-700">{error}</p>
                            <button type="button" onClick={fetchPortalData}
                                className="mt-4 px-5 py-2.5 rounded-full bg-[#8e5233] text-white text-xs font-bold hover:bg-[#723e25] cursor-pointer transition-colors">
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ════════ OVERVIEW TAB ════════ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-5">
                                    {/* Stat cards */}
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {[
                                            { label: 'Total Orders',  value: totalOrders,  icon: ShoppingBag, color: 'text-[#8e5233]', bg: 'bg-[#8e5233]/8' },
                                            { label: 'Active Orders', value: activeOrders, icon: Package,     color: 'text-blue-600',   bg: 'bg-blue-50' },
                                            { label: 'Notifications', value: unreadCount,  icon: Bell,        color: 'text-amber-600',  bg: 'bg-amber-50' },
                                        ].map(({ label, value, icon: Icon, color, bg }) => (
                                            <div key={label} className="bg-white border border-neutral-200/60 rounded-[18px] p-3 sm:p-4 shadow-sm min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="min-w-0">
                                                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-neutral-400 truncate">{label}</p>
                                                        <p className="text-xl sm:text-2xl font-bold text-neutral-800 mt-1">{value}</p>
                                                    </div>
                                                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${bg} flex items-center justify-center ${color} shrink-0`}>
                                                        <Icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Active order progress */}
                                    {latestActiveOrder && (
                                        <div className="bg-white border border-neutral-200/60 rounded-[24px] p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Latest Order Progress</p>
                                                    <p className="text-sm font-bold text-neutral-800 mt-0.5">{latestActiveOrder.order_number}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/track/${latestActiveOrder.order_number}`)}
                                                    className="flex items-center gap-1 text-xs text-[#8e5233] font-bold hover:underline cursor-pointer"
                                                >
                                                    Track <ChevronRight size={13} />
                                                </button>
                                            </div>
                                            <p className="text-xs text-neutral-400 mb-1">
                                                {latestActiveOrder.items?.[0]?.product_name || 'Your order'}
                                                {latestActiveOrder.items?.length > 1 ? ` + ${latestActiveOrder.items.length - 1} more` : ''}
                                            </p>
                                            <OrderStepper status={latestActiveOrder.status} type={latestActiveOrder.type} />
                                        </div>
                                    )}

                                    {/* Recent notifications preview */}
                                    {notifications.length > 0 && (
                                        <div className="bg-white border border-neutral-200/60 rounded-[24px] p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-sm font-bold text-neutral-800">Recent Notifications</h2>
                                                <button type="button" onClick={() => setActiveTab('notifications')}
                                                    className="text-[10px] text-[#8e5233] font-bold hover:underline cursor-pointer">
                                                    See all
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {notifications.slice(0, 3).map(notif => {
                                                    const isUnread = !notif.read_at;
                                                    return (
                                                        <div key={notif.id}
                                                            onClick={() => { if (isUnread) handleMarkAsRead(notif.id); if (notif.data?.action_url) navigate(notif.data.action_url); }}
                                                            className={`flex items-start gap-3 p-3 rounded-[12px] border cursor-pointer transition-all ${isUnread ? 'bg-[#8e5233]/4 border-[#8e5233]/20 hover:bg-[#8e5233]/8' : 'bg-neutral-50/50 border-neutral-100 hover:bg-neutral-50'}`}>
                                                            <Bell size={14} className={isUnread ? 'text-[#8e5233] mt-0.5 shrink-0' : 'text-neutral-300 mt-0.5 shrink-0'} />
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-xs font-medium truncate ${isUnread ? 'text-neutral-800' : 'text-neutral-500'}`}>
                                                                    {notif.data?.message || 'Notification received.'}
                                                                </p>
                                                                <p className="text-[10px] text-neutral-400 mt-0.5">{formatDateTime(notif.created_at)}</p>
                                                            </div>
                                                            {isUnread && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 mt-1.5" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick actions */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => navigate('/categories')}
                                            className="flex items-center justify-between px-5 py-4 rounded-[18px] bg-[#8e5233] hover:bg-[#723e25] text-white text-xs font-bold shadow-md shadow-[#8e5233]/20 transition-all cursor-pointer">
                                            <span>Shop Again</span>
                                            <img src="/images/icons/bag.png" alt="Cart" className="w-[16px] h-[16px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                                        </button>
                                        <button type="button" onClick={() => setActiveTab('orders')}
                                            className="flex items-center justify-between px-5 py-4 rounded-[18px] bg-white border border-neutral-200 hover:border-[#8e5233]/40 text-xs font-bold text-neutral-700 transition-all cursor-pointer">
                                            <span>All Orders</span>
                                            <Package size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ════════ ORDERS TAB ════════ */}
                            {activeTab === 'orders' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-neutral-900">My Orders</h2>
                                            <p className="text-xs text-neutral-400 mt-0.5">{totalOrders} orders total</p>
                                        </div>
                                    </div>

                                    {orders.length === 0 && completedOrders.length === 0 ? (
                                        <div className="py-20 text-center bg-white border border-dashed border-neutral-200 rounded-[24px]">
                                            <ShoppingBag size={30} className="mx-auto text-neutral-300 mb-3" />
                                            <p className="text-sm font-bold text-neutral-600">No orders yet</p>
                                            <p className="text-xs text-neutral-400 mt-1 mb-4">Once you place an order, it will appear here.</p>
                                            <button type="button" onClick={() => navigate('/categories')}
                                                className="px-5 py-2.5 rounded-full bg-[#8e5233] text-white text-xs font-bold cursor-pointer hover:bg-[#723e25] transition-colors">
                                                Start Shopping
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {orders.length > 0 && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">Active Orders</h3>
                                                        <p className="text-[11px] text-neutral-400 mt-0.5">{activeOrders} currently in progress</p>
                                                    </div>
                                                    {orders.map(order => (
                                                        <div key={order.id}
                                                            onClick={() => navigate(`/track/${order.order_number}`)}
                                                            className="bg-white border border-neutral-200/60 rounded-[20px] p-5 hover:border-[#8e5233]/40 hover:shadow-sm transition-all cursor-pointer group">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <p className="text-sm font-bold text-neutral-900">{order.order_number}</p>
                                                                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[9px] font-bold uppercase tracking-wider rounded-full">
                                                                            {order.type}
                                                                        </span>
                                                                        <StatusBadge status={order.status} />
                                                                    </div>
                                                                    <p className="text-xs text-neutral-500 mt-1 truncate">
                                                                        {order.items?.[0]?.product_name || 'Order'}
                                                                        {order.items?.length > 1 ? ` + ${order.items.length - 1} more` : ''}
                                                                    </p>
                                                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400">
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <Clock size={10} />
                                                                            {formatDate(order.created_at)}
                                                                        </span>
                                                                        <span>·</span>
                                                                        <span>{order.items?.length || 0} items</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <p className="text-base font-bold text-[#8F5336]">£{parseFloat(order.total || 0).toFixed(2)}</p>
                                                                    <ChevronRight size={14} className="text-neutral-300 mt-1 ml-auto group-hover:text-[#8e5233] transition-colors" />
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 pt-3 border-t border-neutral-100">
                                                                <OrderStepper status={order.status} type={order.type} />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {totalPages > 1 && (
                                                        <div className="flex justify-between items-center pt-2">
                                                            <button type="button"
                                                                disabled={currentPage === 1}
                                                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                                                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                                                                Previous
                                                            </button>
                                                            <span className="text-xs text-neutral-500 font-medium">
                                                                Active page {currentPage} of {totalPages}
                                                            </span>
                                                            <button type="button"
                                                                disabled={currentPage === totalPages}
                                                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                                                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                                                                Next
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {completedOrders.length > 0 && (
                                                <div className="bg-white border border-neutral-200/60 rounded-[20px] overflow-hidden">
                                                    <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-3">
                                                        <div>
                                                            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">Completed Orders</h3>
                                                            <p className="text-[11px] text-neutral-400 mt-0.5">{completedTotalOrders} fulfilled orders</p>
                                                        </div>
                                                        <StatusBadge status="completed" />
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left min-w-[640px]">
                                                            <thead className="bg-neutral-50 border-b border-neutral-100">
                                                                <tr className="text-[10px] uppercase tracking-wider text-neutral-400">
                                                                    <th className="px-5 py-3 font-black">Order</th>
                                                                    <th className="px-4 py-3 font-black">Date</th>
                                                                    <th className="px-4 py-3 font-black">Type</th>
                                                                    <th className="px-4 py-3 font-black text-center">Items</th>
                                                                    <th className="px-4 py-3 font-black text-right">Total</th>
                                                                    <th className="px-5 py-3 font-black text-right">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-neutral-100">
                                                                {completedOrders.map(order => (
                                                                    <tr key={order.id} className="hover:bg-[#8e5233]/5 transition-colors">
                                                                        <td className="px-5 py-3">
                                                                            <p className="text-xs font-black text-neutral-900">{order.order_number}</p>
                                                                            <p className="text-[11px] text-neutral-400 truncate max-w-[190px]">
                                                                                {order.items?.[0]?.product_name || 'Order'}
                                                                            </p>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-xs text-neutral-600">{formatDate(order.created_at)}</td>
                                                                        <td className="px-4 py-3">
                                                                            <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                                                                                {order.type}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-xs text-neutral-600 text-center">{order.items?.length || 0}</td>
                                                                        <td className="px-4 py-3 text-xs font-black text-[#8F5336] text-right">£{parseFloat(order.total || 0).toFixed(2)}</td>
                                                                        <td className="px-5 py-3 text-right">
                                                                            <button type="button"
                                                                                onClick={() => navigate(`/track/${order.order_number}`)}
                                                                                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-500 hover:border-[#8e5233]/40 hover:text-[#8e5233] cursor-pointer transition-colors">
                                                                                View <ArrowRight size={11} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {completedTotalPages > 1 && (
                                                        <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                                                            <button type="button"
                                                                disabled={completedPage === 1}
                                                                onClick={() => setCompletedPage(p => Math.max(p - 1, 1))}
                                                                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                                                                Previous
                                                            </button>
                                                            <span className="text-xs text-neutral-500 font-medium">
                                                                Completed page {completedPage} of {completedTotalPages}
                                                            </span>
                                                            <button type="button"
                                                                disabled={completedPage === completedTotalPages}
                                                                onClick={() => setCompletedPage(p => Math.min(p + 1, completedTotalPages))}
                                                                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                                                                Next
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ════════ NOTIFICATIONS TAB ════════ */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-neutral-900">Notifications</h2>
                                            <p className="text-xs text-neutral-400 mt-0.5">
                                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                            </p>
                                        </div>
                                        {notifications.length > 0 && (
                                            <div className="flex items-center gap-3">
                                                <button onClick={handleMarkAllAsRead} title="Mark all as read"
                                                    className="flex items-center gap-1.5 text-xs text-[#8e5233] font-bold hover:text-[#723e25] cursor-pointer transition-colors">
                                                    <CheckCheck size={15} /> Mark all read
                                                </button>
                                                <button onClick={handleClearAll} title="Clear all"
                                                    className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold hover:text-red-500 cursor-pointer transition-colors">
                                                    <Trash2 size={14} /> Clear all
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="py-24 text-center bg-white border border-dashed border-neutral-200 rounded-[24px]">
                                            <Bell size={32} className="mx-auto text-neutral-200 mb-3" />
                                            <p className="text-sm font-bold text-neutral-600">All caught up!</p>
                                            <p className="text-xs text-neutral-400 mt-1">You have no notifications right now.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {notifications.map(notif => {
                                                const isUnread = !notif.read_at;
                                                return (
                                                    <div key={notif.id}
                                                        className={`flex items-start gap-3 p-4 rounded-[16px] border transition-all ${isUnread ? 'bg-[#8e5233]/4 border-[#8e5233]/20' : 'bg-white border-neutral-100'}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUnread ? 'bg-[#8e5233]/10 text-[#8e5233]' : 'bg-neutral-100 text-neutral-400'}`}>
                                                            <Bell size={14} />
                                                        </div>
                                                        <div
                                                            className="flex-1 min-w-0 cursor-pointer"
                                                            onClick={() => { if (isUnread) handleMarkAsRead(notif.id); if (notif.data?.action_url) navigate(notif.data.action_url); }}
                                                        >
                                                            <p className={`text-xs font-medium ${isUnread ? 'text-neutral-800' : 'text-neutral-500'}`}>
                                                                {notif.data?.message || 'Notification received.'}
                                                            </p>
                                                            <p className="text-[10px] text-neutral-400 mt-1">{formatDateTime(notif.created_at)}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {isUnread && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                                                            <button
                                                                onClick={() => handleDeleteNotification(notif.id)}
                                                                className="text-neutral-300 hover:text-red-400 cursor-pointer transition-colors p-0.5"
                                                                title="Remove"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ════════ PROFILE TAB ════════ */}
                            {activeTab === 'profile' && (
                                <div className="space-y-5">
                                    {/* Profile info card */}
                                    <div className="bg-white border border-neutral-200/60 rounded-[24px] p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-5">
                                            <h2 className="text-base font-bold text-neutral-900">Personal Details</h2>
                                            {!isEditing ? (
                                                <button type="button" onClick={startEdit}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#8e5233]/30 text-[#8e5233] text-xs font-bold hover:bg-[#8e5233]/5 cursor-pointer transition-all">
                                                    <Pencil size={12} /> Edit
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={cancelEdit}
                                                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-bold hover:bg-neutral-50 cursor-pointer transition-all">
                                                        <X size={12} /> Cancel
                                                    </button>
                                                    <button type="button" onClick={saveProfile} disabled={saving}
                                                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#8e5233] text-white text-xs font-bold hover:bg-[#723e25] disabled:opacity-60 cursor-pointer transition-all shadow-sm">
                                                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                        {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* First name */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">First Name</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.first_name}
                                                        onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                                                        className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all"
                                                    />
                                                ) : (
                                                    <div className="bg-neutral-50/60 border border-neutral-200/45 rounded-xl px-4 py-3 text-xs text-neutral-800 font-medium select-none">
                                                        {profile?.first_name || '—'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Last name */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Last Name</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.last_name}
                                                        onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                                                        className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all"
                                                    />
                                                ) : (
                                                    <div className="bg-neutral-50/60 border border-neutral-200/45 rounded-xl px-4 py-3 text-xs text-neutral-800 font-medium select-none">
                                                        {profile?.last_name || '—'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
                                                    <span className="text-[9px] text-neutral-400 font-normal">read-only</span>
                                                </div>
                                                <div className="bg-neutral-50/40 border border-neutral-200/30 rounded-xl px-4 py-3 text-xs text-neutral-400 select-none">
                                                    {profile?.email || '—'}
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Phone Number</label>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        value={editForm.phone}
                                                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                                        className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all"
                                                        placeholder="e.g. +44 7700 000000"
                                                    />
                                                ) : (
                                                    <div className="bg-neutral-50/60 border border-neutral-200/45 rounded-xl px-4 py-3 text-xs text-neutral-800 font-medium select-none">
                                                        {profile?.phone || '—'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password card */}
                                    <div className="bg-white border border-neutral-200/60 rounded-[24px] p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-5">
                                            <div>
                                                <h2 className="text-base font-bold text-neutral-900">Password</h2>
                                                <p className="text-xs text-neutral-400 mt-0.5">Update the password used to sign in to your account.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.current_password}
                                                    onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                                                    className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all"
                                                    placeholder="Current password"
                                                    autoComplete="current-password"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.password}
                                                    onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                                                    className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all"
                                                    placeholder="At least 8 characters"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.password_confirmation}
                                                    onChange={e => setPasswordForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                                    className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all"
                                                    placeholder="Repeat new password"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end mt-5">
                                            <button type="button" onClick={savePassword} disabled={changingPassword}
                                                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#8e5233] text-white text-xs font-bold hover:bg-[#723e25] disabled:opacity-60 cursor-pointer transition-all shadow-sm">
                                                {changingPassword ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                                {changingPassword ? 'Updating…' : 'Update Password'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Account actions */}
                                    <div className="bg-white border border-neutral-200/60 rounded-[24px] p-6 shadow-sm space-y-2">
                                        <h2 className="text-base font-bold text-neutral-900 mb-4">Account</h2>
                                        <button type="button" onClick={() => navigate('/categories')}
                                            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#8e5233] text-white text-xs font-bold hover:bg-[#723e25] transition-colors shadow-sm cursor-pointer">
                                            <span>Shop Again</span>
                                            <ArrowRight size={14} />
                                        </button>
                                        <button type="button"
                                            onClick={() => { logout(); navigate('/'); }}
                                            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer">
                                            <span>Sign Out</span>
                                            <LogOut size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer catalog={catalog} navigate={navigate} />

            <Sidebar
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                navigate={navigate}
                cartItemCount={cartItemCount}
                user={user}
                logout={logout}
            />
        </div>
    );
}
