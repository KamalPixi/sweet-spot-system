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
    Trash2, User, X, Phone, CircleCheck, ExternalLink,
    Lock, ChefHat, AlertCircle, ArrowUpRight, LayoutDashboard
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
    pending:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-800',  border: 'border-amber-300/80',  dot: 'bg-amber-500',  step: 0 },
    preparing:  { label: 'Preparing',  bg: 'bg-blue-50',    text: 'text-blue-800',   border: 'border-blue-300/80',   dot: 'bg-blue-500',   step: 1 },
    ready:      { label: 'Ready',      bg: 'bg-emerald-50', text: 'text-emerald-800',border: 'border-emerald-300/80',dot: 'bg-emerald-500',step: 2 },
    completed:  { label: 'Completed',  bg: 'bg-neutral-100',text: 'text-neutral-600',border: 'border-neutral-200',dot: 'bg-neutral-400',step: 3 },
    cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-300/80',    dot: 'bg-red-500',    step: -1 },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200', dot: 'bg-neutral-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'preparing' || status === 'pending' ? 'animate-pulse' : ''}`} />
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
                <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <X size={12} /> Order Cancelled
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
                                    ? 'bg-[#24161b] border-[#24161b] text-[#e5b582]'
                                    : 'bg-white border-neutral-200 text-neutral-300'
                            } ${active ? 'ring-2 ring-[#e5b582]/60 scale-110 shadow-sm' : ''}`}>
                                {done ? <CircleCheck size={14} /> : <span className="text-[9px] font-bold">{idx + 1}</span>}
                            </div>
                            <p className={`text-[9px] font-bold mt-1.5 whitespace-nowrap ${done ? 'text-[#24161b]' : 'text-neutral-300'}`}>
                                {step}
                            </p>
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-0.5 mx-1.5 mb-5 transition-colors ${done && idx < currentStep ? 'bg-[#24161b]' : 'bg-neutral-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

/* ─── Tabs Config ─────────────────────────────────────── */

const TABS = [
    { id: 'overview',       label: 'Overview',       icon: LayoutDashboard },
    { id: 'orders',         label: 'My Orders',       icon: ShoppingBag },
    { id: 'notifications',  label: 'Notifications',   icon: Bell },
    { id: 'profile',        label: 'Profile & Details', icon: User },
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

    /* orders filter & pagination */
    const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'active' | 'completed'
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
            toast.success('All notifications marked as read.');
        } catch (err) { console.error(err); }
    };

    const handleClearAll = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
            toast.success('All notifications cleared.');
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
                toast.success('Profile updated successfully!');
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
    const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || 'SP';

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#24161b] text-neutral-900 font-sans selection:bg-rose-500 selection:text-white relative">
            {/* Dark Plum Header Bar */}
            <Header
                setIsMenuOpen={setIsMenuOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                navigate={navigate}
                cartItemCount={cartItemCount}
                user={user}
            />

            {/* Main Floating Artisanal Container */}
            <main className="w-full flex-grow mb-[-32px] md:mb-[-48px] rounded-b-2xl md:rounded-b-3xl rounded-t-none relative z-30 px-4 pt-4 pb-12 sm:px-8 md:px-12 md:pt-8 md:pb-16 bg-[#faf7f2] shadow-2xl border-b border-black/[0.04]">
                <div className="max-w-5xl mx-auto w-full">

                    {/* ════════ HERO CUSTOMER IDENTITY BANNER ════════ */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#24161b] via-[#2d1b22] to-[#1c1115] text-white p-6 sm:p-8 shadow-xl shadow-[#24161b]/20 border border-white/10 mb-7">
                        {/* Ambient Gold Glow Corner */}
                        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#e5b582]/15 blur-3xl pointer-events-none" />
                        <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            {/* Left: Avatar + Details */}
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-tr from-[#1c1115] to-[#3a222c] border-2 border-[#e5b582] text-[#e5b582] flex items-center justify-center text-xl sm:text-2xl font-serif font-black shadow-lg shadow-black/30 shrink-0">
                                    {initials}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#e5b582]/20 text-[#e5b582] border border-[#e5b582]/30">
                                            Sweet Spot Member
                                        </span>
                                        {unreadCount > 0 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                                                {unreadCount} new update{unreadCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight leading-tight">
                                        Welcome back, {profile?.first_name || 'Friend'}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-300/80 flex-wrap">
                                        {profile?.email && (
                                            <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                                                <Mail size={12} className="text-[#e5b582]" />
                                                {profile.email}
                                            </span>
                                        )}
                                        {profile?.phone && (
                                            <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                                                <Phone size={12} className="text-[#e5b582]" />
                                                {profile.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Quick Action Buttons */}
                            <div className="flex items-center gap-2.5 w-full sm:w-auto self-stretch sm:self-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#e5b582] hover:bg-[#edd0ae] text-[#24161b] text-xs font-bold transition-all shadow-md shadow-[#24161b]/30 cursor-pointer group"
                                >
                                    <ShoppingBag size={14} className="text-[#24161b]" />
                                    <span>Browse Treats</span>
                                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { logout(); navigate('/'); }}
                                    title="Sign Out"
                                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-all cursor-pointer flex items-center justify-center"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ════════ SEGMENTED NAVIGATION TAB BAR ════════ */}
                    <div className="flex items-center justify-start sm:justify-center mb-8 overflow-x-auto scrollbar-none py-1">
                        <div className="inline-flex items-center gap-1.5 bg-white/90 p-1.5 rounded-xl border border-neutral-200/90 shadow-sm w-full sm:w-auto">
                            {TABS.map(({ id, label, icon: Icon }) => {
                                const isActive = activeTab === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setActiveTab(id)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none flex-1 sm:flex-initial justify-center ${
                                            isActive
                                                ? 'bg-[#24161b] text-[#e5b582] shadow-md shadow-[#24161b]/20 font-black'
                                                : 'text-neutral-600 hover:text-[#24161b] hover:bg-neutral-100/70 font-semibold'
                                        }`}
                                    >
                                        <Icon size={14} className={isActive ? 'text-[#e5b582]' : 'text-neutral-500'} />
                                        <span>{label}</span>
                                        {id === 'notifications' && unreadCount > 0 && (
                                            <span className="ml-0.5 bg-red-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                        {id === 'orders' && activeOrders > 0 && (
                                            <span className="ml-0.5 bg-[#e5b582] text-[#24161b] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                                {activeOrders}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ════════ MAIN CONTENT AREA ════════ */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-28 text-neutral-400 gap-3">
                            <Loader2 className="animate-spin text-[#24161b]" size={36} />
                            <p className="text-xs font-semibold text-neutral-500">Preparing your Sweet Spot account...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center max-w-md mx-auto">
                            <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-neutral-900 mb-1">Couldn't Load Account</h3>
                            <p className="text-xs text-neutral-600 mb-4">{error}</p>
                            <button
                                type="button"
                                onClick={fetchPortalData}
                                className="px-5 py-2.5 rounded-full bg-[#24161b] text-[#e5b582] text-xs font-bold hover:bg-[#341f27] cursor-pointer transition-colors shadow-sm"
                            >
                                Retry Connection
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ══════════════ TAB 1: OVERVIEW ══════════════ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-7">
                                    {/* 1. Stat Metric Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Card 1: Total Orders */}
                                        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#e5b582]/60 transition-all flex flex-col justify-between">
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Total Orders</span>
                                                <div className="w-9 h-9 rounded-xl bg-[#24161b]/8 text-[#24161b] flex items-center justify-center">
                                                    <ShoppingBag size={18} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-serif font-black text-[#24161b]">{totalOrders}</p>
                                                <p className="text-[11px] text-neutral-500 mt-1 font-medium">Sweet treats ordered to date</p>
                                            </div>
                                        </div>

                                        {/* Card 2: Active Orders */}
                                        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#e5b582]/60 transition-all flex flex-col justify-between">
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Active In-Flight</span>
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center relative">
                                                    <Package size={18} />
                                                    {activeOrders > 0 && (
                                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white animate-ping" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-serif font-black text-[#24161b]">{activeOrders}</p>
                                                <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                                                    {activeOrders > 0 ? 'Currently baking or on the way' : 'No orders in progress'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card 3: Notifications */}
                                        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#e5b582]/60 transition-all flex flex-col justify-between">
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Notifications</span>
                                                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                                                    <Bell size={18} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-serif font-black text-[#24161b]">{unreadCount}</p>
                                                <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                                                    {unreadCount > 0 ? 'Unread updates waiting for you' : 'All messages caught up'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Active Order Tracker OR Bakery Invitation Banner */}
                                    {latestActiveOrder && !['completed', 'cancelled'].includes(latestActiveOrder.status) ? (
                                        <div className="bg-white border-2 border-[#e5b582]/50 rounded-2xl p-6 sm:p-7 shadow-lg shadow-[#24161b]/5 relative overflow-hidden">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8e5233]">
                                                             Live Order Progress
                                                        </span>
                                                        <StatusBadge status={latestActiveOrder.status} />
                                                    </div>
                                                    <h3 className="text-lg font-serif font-black text-[#24161b]">
                                                        Order #{latestActiveOrder.order_number}
                                                    </h3>
                                                    <p className="text-xs text-neutral-500 mt-0.5">
                                                        {latestActiveOrder.items?.[0]?.product_name || 'Fresh Bakery Items'}
                                                        {latestActiveOrder.items?.length > 1 ? ` + ${latestActiveOrder.items.length - 1} more` : ''} · £{parseFloat(latestActiveOrder.total || 0).toFixed(2)}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/track/${latestActiveOrder.order_number}`)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#24161b] hover:bg-[#38222b] text-[#e5b582] text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                                                >
                                                    <span>Live Tracker</span>
                                                    <ArrowUpRight size={14} />
                                                </button>
                                            </div>

                                            <div className="pt-2">
                                                <OrderStepper status={latestActiveOrder.status} type={latestActiveOrder.type} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50/70 via-[#fefbf6] to-white border border-[#e5b582]/40 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
                                            <div className="flex items-center gap-4">
                                                <div className="w-13 h-13 rounded-xl bg-[#24161b] text-[#e5b582] flex items-center justify-center shrink-0 shadow-md">
                                                    <ChefHat size={26} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-serif font-black text-[#24161b]">
                                                        Craving something warm and freshly baked?
                                                    </h3>
                                                    <p className="text-xs text-neutral-600 mt-0.5 max-w-lg">
                                                        Our master bakers are rolling dough today. Order ahead for lightning collection or warm door-to-door delivery.
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/products')}
                                                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#24161b] hover:bg-[#38222b] text-[#e5b582] text-xs font-bold transition-all shadow-sm cursor-pointer"
                                            >
                                                <ShoppingBag size={14} />
                                                <span>Explore Today's Menu</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* 3. Two-Column Dashboard Split: Recent Orders & Recent Notifications */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                        {/* Left: Recent Orders Preview (7 cols) */}
                                        <div className="lg:col-span-7 space-y-4 flex flex-col">
                                            <div className="flex items-center justify-between h-6">
                                                <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                                                    Recent Orders
                                                </h2>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('orders')}
                                                    className="text-xs font-bold text-[#24161b] hover:text-[#8e5233] transition-colors cursor-pointer flex items-center gap-1"
                                                >
                                                    <span>View all</span>
                                                    <ChevronRight size={13} />
                                                </button>
                                            </div>

                                            {orders.length === 0 && completedOrders.length === 0 ? (
                                                <div className="bg-white border border-dashed border-neutral-200/90 rounded-2xl p-6 sm:p-8 text-center flex-1 flex flex-col items-center justify-center min-h-[190px] shadow-xs">
                                                    <ShoppingBag size={28} className="mx-auto text-neutral-300 mb-2" />
                                                    <p className="text-xs font-bold text-neutral-700">No orders placed yet</p>
                                                    <p className="text-[11px] text-neutral-400 mt-0.5 mb-3">Your previous treat orders will appear here.</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/products')}
                                                        className="text-xs font-bold text-[#8e5233] hover:underline cursor-pointer"
                                                    >
                                                        Start your first order →
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {[...orders, ...completedOrders].slice(0, 3).map(order => (
                                                        <div
                                                            key={order.id}
                                                            onClick={() => navigate(`/track/${order.order_number}`)}
                                                            className="bg-white border border-neutral-200/70 hover:border-[#e5b582] rounded-xl p-4.5 transition-all shadow-xs hover:shadow-sm cursor-pointer group flex items-center justify-between gap-4"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    <span className="font-serif font-black text-sm text-[#24161b]">
                                                                        #{order.order_number}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[9px] font-bold uppercase tracking-wider">
                                                                        {order.type}
                                                                    </span>
                                                                    <StatusBadge status={order.status} />
                                                                </div>
                                                                <p className="text-xs text-neutral-600 truncate">
                                                                    {order.items?.[0]?.product_name || 'Baked Delights'}
                                                                    {order.items?.length > 1 ? ` + ${order.items.length - 1} more` : ''}
                                                                </p>
                                                                <p className="text-[10px] text-neutral-400 mt-1">
                                                                    {formatDate(order.created_at)} · {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-sm font-serif font-black text-[#24161b]">
                                                                    £{parseFloat(order.total || 0).toFixed(2)}
                                                                </p>
                                                                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-400 group-hover:text-[#24161b] mt-1 transition-colors">
                                                                    <span>Track</span>
                                                                    <ChevronRight size={12} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Notifications Feed & Quick Shortcuts (5 cols) */}
                                        <div className="lg:col-span-5 space-y-4 flex flex-col">
                                            <div className="flex items-center justify-between h-6">
                                                <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                                                    Recent Alerts
                                                </h2>
                                                {notifications.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('notifications')}
                                                        className="text-xs font-bold text-[#24161b] hover:text-[#8e5233] transition-colors cursor-pointer flex items-center gap-1"
                                                    >
                                                        <span>See all</span>
                                                        <ChevronRight size={13} />
                                                    </button>
                                                )}
                                            </div>

                                            {notifications.length === 0 ? (
                                                <div className="bg-white border border-dashed border-neutral-200/90 rounded-2xl p-6 sm:p-8 text-center flex-1 flex flex-col items-center justify-center min-h-[190px] shadow-xs">
                                                    <Bell size={28} className="mx-auto text-neutral-300 mb-2" />
                                                    <p className="text-xs font-bold text-neutral-700">All caught up!</p>
                                                    <p className="text-[11px] text-neutral-400 mt-0.5">No recent alerts or order updates.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    {notifications.slice(0, 3).map(notif => {
                                                        const isUnread = !notif.read_at;
                                                        return (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => {
                                                                    if (isUnread) handleMarkAsRead(notif.id);
                                                                    if (notif.data?.action_url) navigate(notif.data.action_url);
                                                                }}
                                                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                                                    isUnread
                                                                        ? 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50'
                                                                        : 'bg-white border-neutral-200/70 hover:bg-neutral-50/60'
                                                                }`}
                                                            >
                                                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                                    isUnread ? 'bg-[#24161b] text-[#e5b582]' : 'bg-neutral-100 text-neutral-400'
                                                                }`}>
                                                                    <Bell size={13} />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className={`text-xs font-medium leading-relaxed ${isUnread ? 'text-neutral-900 font-bold' : 'text-neutral-600'}`}>
                                                                        {notif.data?.message || 'Notification received.'}
                                                                    </p>
                                                                    <p className="text-[10px] text-neutral-400 mt-1">
                                                                        {formatDateTime(notif.created_at)}
                                                                    </p>
                                                                </div>
                                                                {isUnread && (
                                                                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════ TAB 2: MY ORDERS ══════════════ */}
                            {activeTab === 'orders' && (
                                <div className="space-y-6">
                                    {/* Subheader & Filter Pill Switcher */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/70">
                                        <div>
                                            <h2 className="text-xl font-serif font-black text-[#24161b]">My Orders</h2>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                Track active preparations or revisit your past delicious purchases.
                                            </p>
                                        </div>

                                        <div className="inline-flex items-center p-1 bg-white border border-neutral-200 rounded-xl shadow-xs self-start sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => setOrderFilter('all')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    orderFilter === 'all'
                                                        ? 'bg-[#24161b] text-[#e5b582] shadow-xs'
                                                        : 'text-neutral-600 hover:text-neutral-900'
                                                }`}
                                            >
                                                All ({totalOrders})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOrderFilter('active')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    orderFilter === 'active'
                                                        ? 'bg-[#24161b] text-[#e5b582] shadow-xs'
                                                        : 'text-neutral-600 hover:text-neutral-900'
                                                }`}
                                            >
                                                Active ({activeOrders})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOrderFilter('completed')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    orderFilter === 'completed'
                                                        ? 'bg-[#24161b] text-[#e5b582] shadow-xs'
                                                        : 'text-neutral-600 hover:text-neutral-900'
                                                }`}
                                            >
                                                Fulfilled ({completedTotalOrders})
                                            </button>
                                        </div>
                                    </div>

                                    {orders.length === 0 && completedOrders.length === 0 ? (
                                        <div className="py-20 sm:py-24 text-center bg-white border border-dashed border-neutral-200/90 rounded-2xl w-full p-8 shadow-xs">
                                            <div className="w-14 h-14 rounded-xl bg-[#24161b]/5 text-[#24161b] flex items-center justify-center mx-auto mb-4">
                                                <ShoppingBag size={28} />
                                            </div>
                                            <h3 className="text-base font-serif font-black text-[#24161b]">No orders yet</h3>
                                            <p className="text-xs text-neutral-500 mt-1 mb-5 max-w-sm mx-auto">
                                                When you place an order for fresh artisan treats, you will be able to follow its preparation live here.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/products')}
                                                className="px-6 py-2.5 rounded-xl bg-[#24161b] hover:bg-[#341f27] text-[#e5b582] text-xs font-bold cursor-pointer transition-all shadow-md"
                                            >
                                                Browse Sweet Treats
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* 1. Active Orders Section */}
                                            {(orderFilter === 'all' || orderFilter === 'active') && orders.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                                        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-700">
                                                            Active In Progress ({activeOrders})
                                                        </h3>
                                                    </div>

                                                    {orders.map(order => (
                                                        <div
                                                            key={order.id}
                                                            onClick={() => navigate(`/track/${order.order_number}`)}
                                                            className="bg-white border-2 border-[#e5b582]/40 rounded-2xl p-5 sm:p-6 hover:border-[#e5b582] hover:shadow-md transition-all cursor-pointer group"
                                                        >
                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                        <span className="font-serif font-black text-sm text-[#24161b]">
                                                                            #{order.order_number}
                                                                        </span>
                                                                        <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                                                            {order.type}
                                                                        </span>
                                                                        <StatusBadge status={order.status} />
                                                                    </div>
                                                                    <p className="text-xs font-medium text-neutral-700 mt-1 truncate">
                                                                        {order.items?.[0]?.product_name || 'Baked item'}
                                                                        {order.items?.length > 1 ? ` + ${order.items.length - 1} more items` : ''}
                                                                    </p>
                                                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-400">
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <Clock size={11} />
                                                                            {formatDate(order.created_at)}
                                                                        </span>
                                                                        <span>·</span>
                                                                        <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                                                                    <p className="text-lg font-serif font-black text-[#24161b]">
                                                                        £{parseFloat(order.total || 0).toFixed(2)}
                                                                    </p>
                                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8e5233] mt-1 group-hover:underline">
                                                                        Live Tracker <ChevronRight size={13} />
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-5 pt-4 border-t border-neutral-100">
                                                                <OrderStepper status={order.status} type={order.type} />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {totalPages > 1 && (
                                                        <div className="flex justify-between items-center pt-2">
                                                            <button
                                                                type="button"
                                                                disabled={currentPage === 1}
                                                                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(p - 1, 1)); }}
                                                                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                                                            >
                                                                Previous
                                                            </button>
                                                            <span className="text-xs text-neutral-500 font-semibold">
                                                                Page {currentPage} of {totalPages}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={currentPage === totalPages}
                                                                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(p + 1, totalPages)); }}
                                                                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                                                            >
                                                                Next
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 2. Fulfilled Orders Section */}
                                            {(orderFilter === 'all' || orderFilter === 'completed') && completedOrders.length > 0 && (
                                                <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-xs">
                                                    <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between gap-3 bg-neutral-50/50">
                                                        <div>
                                                            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-700">
                                                                Fulfilled Orders
                                                            </h3>
                                                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                                                {completedTotalOrders} total completed orders
                                                            </p>
                                                        </div>
                                                        <StatusBadge status="completed" />
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left min-w-[640px]">
                                                            <thead className="bg-neutral-50/70 border-b border-neutral-100">
                                                                <tr className="text-[10px] uppercase tracking-wider text-neutral-400 font-black">
                                                                    <th className="px-6 py-3.5">Order</th>
                                                                    <th className="px-4 py-3.5">Date</th>
                                                                    <th className="px-4 py-3.5">Fulfillment</th>
                                                                    <th className="px-4 py-3.5 text-center">Items</th>
                                                                    <th className="px-4 py-3.5 text-right">Total</th>
                                                                    <th className="px-6 py-3.5 text-right">Receipt</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-neutral-100">
                                                                {completedOrders.map(order => (
                                                                    <tr key={order.id} className="hover:bg-[#24161b]/3 transition-colors">
                                                                        <td className="px-6 py-4">
                                                                            <p className="text-xs font-black font-serif text-neutral-900">
                                                                                #{order.order_number}
                                                                            </p>
                                                                            <p className="text-[11px] text-neutral-500 truncate max-w-[200px]">
                                                                                {order.items?.[0]?.product_name || 'Baked item'}
                                                                            </p>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-xs text-neutral-600">
                                                                            {formatDate(order.created_at)}
                                                                        </td>
                                                                        <td className="px-4 py-4">
                                                                            <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-wider">
                                                                                {order.type}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-xs text-neutral-600 text-center font-medium">
                                                                            {order.items?.length || 0}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-xs font-black font-serif text-[#24161b] text-right">
                                                                            £{parseFloat(order.total || 0).toFixed(2)}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => navigate(`/track/${order.order_number}`)}
                                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700 hover:border-[#24161b] hover:text-[#24161b] cursor-pointer transition-all bg-white hover:shadow-xs"
                                                                            >
                                                                                <span>Details</span>
                                                                                <ArrowRight size={11} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {completedTotalPages > 1 && (
                                                        <div className="px-6 py-3.5 border-t border-neutral-100 flex items-center justify-between gap-3 bg-neutral-50/50">
                                                            <button
                                                                type="button"
                                                                disabled={completedPage === 1}
                                                                onClick={() => setCompletedPage(p => Math.max(p - 1, 1))}
                                                                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                                                            >
                                                                Previous
                                                            </button>
                                                            <span className="text-xs text-neutral-500 font-medium">
                                                                Page {completedPage} of {completedTotalPages}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={completedPage === completedTotalPages}
                                                                onClick={() => setCompletedPage(p => Math.min(p + 1, completedTotalPages))}
                                                                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                                                            >
                                                                Next
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ══════════════ TAB 3: NOTIFICATIONS ══════════════ */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/70">
                                        <div>
                                            <h2 className="text-xl font-serif font-black text-[#24161b]">Notifications</h2>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up with no unread alerts'}
                                            </p>
                                        </div>

                                        {notifications.length > 0 && (
                                            <div className="flex items-center gap-3 self-start sm:self-auto">
                                                <button
                                                    type="button"
                                                    onClick={handleMarkAllAsRead}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-700 hover:border-[#24161b] hover:text-[#24161b] cursor-pointer transition-all shadow-xs"
                                                >
                                                    <CheckCheck size={14} className="text-[#8e5233]" />
                                                    <span>Mark all read</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleClearAll}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50/70 border border-red-200/70 text-xs font-bold text-red-600 hover:bg-red-100 cursor-pointer transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                    <span>Clear all</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="py-20 sm:py-24 text-center bg-white border border-dashed border-neutral-200/90 rounded-2xl w-full p-8 shadow-xs">
                                            <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                                                <Bell size={28} />
                                            </div>
                                            <h3 className="text-base font-serif font-black text-[#24161b]">Your inbox is clear</h3>
                                            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                                                Order status updates, bakery alerts, and delivery confirmations will arrive right here.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {notifications.map(notif => {
                                                const isUnread = !notif.read_at;
                                                return (
                                                    <div
                                                        key={notif.id}
                                                        className={`p-4 sm:p-5 rounded-xl border transition-all flex items-start gap-4 ${
                                                            isUnread
                                                                ? 'bg-gradient-to-r from-amber-50/70 via-white to-white border-l-4 border-l-[#e5b582] border-y border-r border-amber-200/80 shadow-xs'
                                                                : 'bg-white border-neutral-200/70 hover:bg-neutral-50/50'
                                                        }`}
                                                    >
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                            isUnread ? 'bg-[#24161b] text-[#e5b582] shadow-sm' : 'bg-neutral-100 text-neutral-400'
                                                        }`}>
                                                            <Bell size={16} />
                                                        </div>

                                                        <div
                                                            className="flex-1 min-w-0 cursor-pointer"
                                                            onClick={() => {
                                                                if (isUnread) handleMarkAsRead(notif.id);
                                                                if (notif.data?.action_url) navigate(notif.data.action_url);
                                                            }}
                                                        >
                                                            <p className={`text-xs sm:text-sm leading-relaxed ${isUnread ? 'text-neutral-900 font-bold' : 'text-neutral-600 font-medium'}`}>
                                                                {notif.data?.message || 'Notification update received.'}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {formatDateTime(notif.created_at)}
                                                                </span>
                                                                {notif.data?.action_url && (
                                                                    <span className="text-[#8e5233] font-bold inline-flex items-center gap-0.5 hover:underline">
                                                                        View details <ExternalLink size={10} />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0 self-center">
                                                            {isUnread && (
                                                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" title="Unread" />
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notif.id); }}
                                                                className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-all"
                                                                title="Delete notice"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ══════════════ TAB 4: PROFILE & DETAILS ══════════════ */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div className="pb-2 border-b border-neutral-200/70">
                                        <h2 className="text-xl font-serif font-black text-[#24161b]">Profile & Security</h2>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            Update your personal information and maintain account login credentials.
                                        </p>
                                    </div>

                                    {/* 1. Personal Details Card */}
                                    <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#24161b]/8 text-[#24161b] flex items-center justify-center">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-serif font-black text-[#24161b]">Personal Information</h3>
                                                    <p className="text-xs text-neutral-400">Your registered name and direct contact details</p>
                                                </div>
                                            </div>

                                            {!isEditing ? (
                                                <button
                                                    type="button"
                                                    onClick={startEdit}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/70 text-[#24161b] text-xs font-bold cursor-pointer transition-all"
                                                >
                                                    <Pencil size={13} />
                                                    <span>Edit Details</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="px-3.5 py-1.5 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-bold hover:bg-neutral-50 cursor-pointer transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={saveProfile}
                                                        disabled={saving}
                                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#24161b] text-[#e5b582] text-xs font-bold hover:bg-[#341f27] disabled:opacity-60 cursor-pointer transition-all shadow-sm"
                                                    >
                                                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                                        <span>{saving ? 'Saving…' : 'Save Changes'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                            {/* First Name */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-neutral-700">First Name</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.first_name}
                                                        onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                                                        placeholder="e.g. Jane"
                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                    />
                                                ) : (
                                                    <div className="h-11 bg-neutral-50/60 border border-neutral-200/70 rounded-xl px-3.5 flex items-center text-xs sm:text-sm font-semibold text-neutral-800">
                                                        {profile?.first_name || '—'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Last Name */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-neutral-700">Last Name</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.last_name}
                                                        onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                                                        placeholder="e.g. Doe"
                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                    />
                                                ) : (
                                                    <div className="h-11 bg-neutral-50/60 border border-neutral-200/70 rounded-xl px-3.5 flex items-center text-xs sm:text-sm font-semibold text-neutral-800">
                                                        {profile?.last_name || '—'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Email (Read only) */}
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-neutral-700">Email Address</label>
                                                    <span className="text-[10px] text-neutral-400 font-medium">Primary Login</span>
                                                </div>
                                                <div className="h-11 bg-neutral-100/70 border border-neutral-200/50 rounded-xl px-3.5 flex items-center text-xs sm:text-sm text-neutral-500 font-medium select-none">
                                                    {profile?.email || '—'}
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-neutral-700">Mobile Phone</label>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        value={editForm.phone}
                                                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                                        placeholder="e.g. 07700 900077"
                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                    />
                                                ) : (
                                                    <div className="h-11 bg-neutral-50/60 border border-neutral-200/70 rounded-xl px-3.5 flex items-center text-xs sm:text-sm font-semibold text-neutral-800">
                                                        {profile?.phone || '—'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Security & Password Card */}
                                    <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                                                <Lock size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-serif font-black text-[#24161b]">Security & Password</h3>
                                                <p className="text-xs text-neutral-400">Keep your account safe by updating your secret password</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-neutral-700">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.current_password}
                                                    onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                                                    placeholder="Enter current password"
                                                    autoComplete="current-password"
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-neutral-700">New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.password}
                                                    onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                                                    placeholder="Min. 8 characters"
                                                    autoComplete="new-password"
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-neutral-700">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.password_confirmation}
                                                    onChange={e => setPasswordForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                                    placeholder="Repeat new password"
                                                    autoComplete="new-password"
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end mt-6 pt-4 border-t border-neutral-100">
                                            <button
                                                type="button"
                                                onClick={savePassword}
                                                disabled={changingPassword}
                                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#24161b] text-[#e5b582] text-xs font-bold hover:bg-[#341f27] disabled:opacity-60 cursor-pointer transition-all shadow-sm"
                                            >
                                                {changingPassword ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                                <span>{changingPassword ? 'Updating Password…' : 'Update Password'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 3. Account Actions Card */}
                                    <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
                                        <h3 className="text-base font-serif font-black text-[#24161b] mb-4">Account Shortcuts</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/products')}
                                                className="flex items-center justify-between p-4 rounded-xl bg-[#24161b] text-[#e5b582] text-xs font-bold hover:bg-[#341f27] transition-all cursor-pointer shadow-sm"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <ShoppingBag size={16} />
                                                    <span>Order Delicious Treats</span>
                                                </div>
                                                <ArrowRight size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => { logout(); navigate('/'); }}
                                                className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/60 text-red-600 text-xs font-bold hover:bg-red-100/70 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <LogOut size={16} />
                                                    <span>Sign Out of Account</span>
                                                </div>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Global Footer */}
            <Footer catalog={catalog} navigate={navigate} />

            {/* Sidebar Navigation Drawer */}
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
