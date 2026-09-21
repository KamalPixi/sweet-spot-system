import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../../AppContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import useRealtimeChannel from '../../hooks/useRealtimeChannel';
import useNotificationSound from '../../hooks/useNotificationSound';
import { getEchoSocketId } from '../../lib/realtime';
import {
    LayoutDashboard,
    ClipboardList,
    FolderTree,
    Mail,
    Settings,
    BarChart3,
    ShoppingBag,
    Users,
    Trash2,
    Loader2,
    ShieldAlert,
    Check,
    X,
    ArrowLeft,
    Bell,
    Printer,
    Truck,
    QrCode,
    ExternalLink,
    Navigation,
    Clock,
    CheckCircle2,
    Send,
    Compass,
    LineChart,
    ReceiptText,
    UtensilsCrossed,
    Receipt,
    CalendarClock,
    Tag,
    Package,
    UserCheck,
    SlidersHorizontal,
    ArchiveRestore,
    XCircle,
} from 'lucide-react';

const formatCurrency = (value) => `£${parseFloat(value || 0).toFixed(2)}`;

const formatDateTime = (value) => {
    if (!value) return 'Not scheduled';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function AdminOrderDetailPage() {
    const navigate = useNavigate();
    const { orderNumber } = useParams();
    const { adminToken: token, adminUser: user, logout } = useApp();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const notificationsSignatureRef = useRef('');
    const unreadNotificationCountRef = useRef(0);
    const hasLoadedNotificationsRef = useRef(false);
    const { playNotificationSound } = useNotificationSound();
    const [printing, setPrinting] = useState(false);
    const [cancellingPrint, setCancellingPrint] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('uber_direct');
    const [dispatchingCourier, setDispatchingCourier] = useState(false);
    const [advancingStatus, setAdvancingStatus] = useState(false);

    const handlePrintTicket = async () => {
        if (!order?.id) return;
        setPrinting(true);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const d = await res.json();
            if (d.success) {
                toast.success('Print job enqueued! The printer will print immediately.');
                fetchOrder();
            } else {
                toast.error(d.message || 'Failed to trigger print.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Print request failed.');
        } finally {
            setPrinting(false);
        }
    };

    const handleCancelOrderPrints = async () => {
        if (!order?.id) return;
        if (!confirm('Cancel all pending print jobs for this order?')) return;
        setCancellingPrint(true);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}/prints`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const d = await res.json();
            if (d.success) {
                toast.success(d.message || 'Print job(s) cancelled successfully.');
                fetchOrder();
            } else {
                toast.error(d.message || 'Failed to cancel print.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Cancel print request failed.');
        } finally {
            setCancellingPrint(false);
        }
    };

    const handleDispatchCourier = async () => {
        if (!order?.id) return;
        setDispatchingCourier(true);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}/dispatch-uber`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ provider: selectedProvider }),
            });
            const d = await res.json();
            if (d.success) {
                toast.success(d.message || 'Courier dispatched successfully!');
                fetchOrder();
            } else {
                toast.error(d.message || 'Failed to dispatch courier.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Courier dispatch failed.');
        } finally {
            setDispatchingCourier(false);
        }
    };

    const handleAdvanceCourierStatus = async () => {
        if (!order?.id) return;
        setAdvancingStatus(true);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}/advance-delivery-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const d = await res.json();
            if (d.success) {
                toast.success(d.message || 'Courier status advanced!');
                fetchOrder();
            } else {
                toast.error(d.message || 'Failed to advance status.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to advance courier status.');
        } finally {
            setAdvancingStatus(false);
        }
    };

    const orderStatusMeta = {
        pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
        preparing: { label: 'Preparing', classes: 'bg-blue-50 text-blue-700 border-blue-100' },
        ready: { label: 'Ready', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        completed: { label: 'Completed', classes: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
        cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-600 border-red-100' },
    };
    const orderPaymentMeta = {
        unpaid: { label: 'Unpaid', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
        paid: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        failed: { label: 'Failed', classes: 'bg-red-50 text-red-600 border-red-100' },
    };

    useEffect(() => {
        if (!token) {
            navigate('/admin/login');
        }
    }, [token, navigate]);

    const fetchOrder = async () => {
        if (!token || !orderNumber) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/orders/${orderNumber}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const d = await res.json();
            if (d.success) {
                setOrder(d.data);
            } else {
                setOrder(null);
                setError(d.message || 'Order details could not be loaded.');
            }
        } catch (err) {
            console.error(err);
            setOrder(null);
            setError('Failed to load order details.');
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        if (!token) return;
        setNotificationsLoading(true);
        try {
            const res = await fetch('/api/notifications', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const d = await res.json();
            if (d.success) {
                const nextNotifications = d.data.notifications || [];
                const nextUnreadCount = d.data.unread_count || 0;
                const nextSignature = nextNotifications
                    .slice(0, 5)
                    .map(notification => `${notification.id}:${notification.read_at ? 1 : 0}`)
                    .join('|');

                if (
                    hasLoadedNotificationsRef.current
                    && !adminLiveConnected
                    && nextUnreadCount > unreadNotificationCountRef.current
                    && nextSignature !== notificationsSignatureRef.current
                ) {
                    playNotificationSound('notification.created', 'high');
                }

                notificationsSignatureRef.current = nextSignature;
                unreadNotificationCountRef.current = nextUnreadCount;
                hasLoadedNotificationsRef.current = true;

                setNotifications(nextNotifications);
                setUnreadNotificationCount(nextUnreadCount);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setNotificationsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchOrder();
        fetchNotifications();
    }, [orderNumber, token]);

    const handleAdminRealtimeMessage = (payload) => {
        if (!payload) return;

        const eventType = payload.event_type || payload.event || 'realtime.event';
        const message = payload.message || 'New live update received.';
        const shouldPlaySound = eventType === 'order.created'
            || eventType === 'notification.created'
            || (eventType === 'order.updated' && payload.priority === 'high');

        if (payload.scope === 'admin') {
            if (shouldPlaySound) {
                playNotificationSound(eventType, payload.priority || 'normal');
            }

            if (payload.priority === 'high') {
                toast.success(message);
            } else {
                toast(message);
            }
        }

        if ((eventType === 'order.updated' || eventType === 'order.created') && payload.order_number === orderNumber) {
            fetchOrder();
            fetchNotifications();
        }
    };

    const { connected: adminLiveConnected } = useRealtimeChannel({
        token,
        channel: 'admin.live',
        onMessage: handleAdminRealtimeMessage,
        fallbackPoll: () => {
            fetchOrder();
            fetchNotifications();
        },
        fallbackInterval: 20000,
        enabled: !!token,
    });

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            setSuccessMessage(null);
        }
    }, [successMessage]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            setError(null);
        }
    }, [error]);

    const handleLogout = () => {
        logout('admin');
        navigate('/');
    };

    const handleMarkNotificationRead = async (notificationId) => {
        try {
            const res = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const d = await res.json();
            if (d.success) fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            const res = await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const d = await res.json();
            if (d.success) fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read_at) {
            await handleMarkNotificationRead(notification.id);
        }

        if (notification.data?.category === 'orders') {
            const targetOrderNumber = notification.data?.order_number;
            if (targetOrderNumber) {
                navigate(`/admin/orders/${targetOrderNumber}`);
                return;
            }
            navigate('/admin/orders');
        }

        setNotificationsOpen(false);
    };

    const handleUpdateOrderStatus = async (newStatus) => {
        if (!order) return;
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...(getEchoSocketId() ? { 'X-Socket-ID': getEchoSocketId() } : {}),
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const d = await res.json();
            if (d.success) {
                setOrder(d.data);
                setSuccessMessage(`Order updated to '${newStatus}' successfully.`);
            } else {
                setError(d.message || 'Failed to update order status.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update order status.');
        }
    };

    const handleUpdateOrderPayment = async (newStatus) => {
        if (!order) return;
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...(getEchoSocketId() ? { 'X-Socket-ID': getEchoSocketId() } : {}),
                },
                body: JSON.stringify({ payment_status: newStatus }),
            });
            const d = await res.json();
            if (d.success) {
                setOrder(d.data);
                setSuccessMessage(`Payment status updated to '${newStatus}' successfully.`);
            } else {
                setError(d.message || 'Failed to update payment status.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update payment status.');
        }
    };

    const sidebarSections = [
        {
            label: 'Overview',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: <Compass size={16} /> },
                { id: 'reports', label: 'Reports', icon: <LineChart size={16} /> },
            ],
        },
        {
            label: 'Operations',
            items: [
                { id: 'orders', label: 'Orders', icon: <ReceiptText size={16} /> },
                { id: 'tables', label: 'Tables & QR', icon: <UtensilsCrossed size={16} /> },
                { id: 'printers', label: 'Cloud Printers', icon: <Receipt size={16} /> },
                { id: 'collection-slots', label: 'Collection Slots', icon: <CalendarClock size={16} /> },
            ],
        },
        {
            label: 'Catalogue',
            items: [
                { id: 'categories', label: 'Categories', icon: <Tag size={16} /> },
                { id: 'products', label: 'Products', icon: <Package size={16} /> },
            ],
        },
        {
            label: 'Customers',
            items: [
                { id: 'customers', label: 'Customers', icon: <UserCheck size={16} /> },
            ],
        },
        {
            label: 'System',
            items: [
                { id: 'settings', label: 'Settings', icon: <SlidersHorizontal size={16} /> },
                { id: 'trash', label: 'Trash', icon: <ArchiveRestore size={16} /> },
            ],
        },
    ];

    const adminDisplayName = user?.name || 'Admin Manager';
    const adminRole = 'Store Admin';

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-850 font-sans flex">
            <AdminSidebar
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed(prev => !prev)}
                activeTab="orders"
                onTabChange={(tab) => navigate(tab === 'dashboard' ? '/admin' : `/admin/${tab}`)}
                onLogout={handleLogout}
                sections={sidebarSections}
            />

            <main className="flex-grow max-h-screen overflow-y-auto w-full bg-neutral-50">
                <AdminTopbar
                    sectionLabel="Order Details"
                    adminRole={adminRole}
                    adminDisplayName={adminDisplayName}
                    userEmail={user?.email}
                    unreadNotificationCount={unreadNotificationCount}
                    notifications={notifications}
                    notificationsLoading={notificationsLoading}
                    notificationsOpen={notificationsOpen}
                    setNotificationsOpen={setNotificationsOpen}
                    accountMenuOpen={accountMenuOpen}
                    setAccountMenuOpen={setAccountMenuOpen}
                    onRefresh={fetchOrder}
                    onOpenOrders={() => navigate('/admin/orders')}
                    onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                    onOpenProfile={() => navigate('/admin/profile')}
                    onLogout={handleLogout}
                    onNotificationClick={handleNotificationClick}
                    formatNotificationTime={(value) => {
                        if (!value) return '';
                        const parsed = new Date(String(value).replace(' ', 'T'));
                        if (Number.isNaN(parsed.getTime())) return '';
                        return parsed.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                    }}
                />

                <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-950 mb-3"
                            >
                                <ArrowLeft size={14} />
                                Back
                            </button>
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Sweet Spot · Order Management</p>
                            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">{orderNumber || 'Order Details'}</h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                {order ? formatDateTime(order.created_at) : 'Review order status, payment, and item details.'}
                            </p>
                        </div>

                        {order && (
                            <div className="flex flex-wrap items-center gap-2">
                                {order.has_active_print_job && (
                                    <button
                                        type="button"
                                        onClick={handleCancelOrderPrints}
                                        disabled={cancellingPrint}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                        title="Cancel active print queue job for this order"
                                    >
                                        <XCircle size={14} className="text-rose-600" />
                                        <span>{cancellingPrint ? 'Cancelling...' : 'Cancel Active Print'}</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handlePrintTicket}
                                    disabled={printing}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    <Printer size={14} className="text-amber-400" />
                                    <span>{printing ? 'Enqueuing Print...' : order.print_count > 0 ? `Reprint Receipt (x${order.print_count})` : 'Print Kitchen Receipt'}</span>
                                </button>
                                <div className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full border capitalize ${orderStatusMeta[order.status]?.classes || 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                                    {orderStatusMeta[order.status]?.label || order.status}
                                </div>
                                <div className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full border capitalize ${orderPaymentMeta[order.payment_status]?.classes || 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                                    {orderPaymentMeta[order.payment_status]?.label || order.payment_status}
                                </div>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="animate-spin text-primary" size={40} />
                        </div>
                    ) : !order ? (
                        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm">
                            <p className="text-sm text-neutral-500">Order details are not available.</p>
                            <button
                                type="button"
                                onClick={fetchOrder}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold cursor-pointer"
                            >
                                <Bell size={14} />
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Customer</p>
                                    <p className="text-sm font-bold text-neutral-900 mt-1">
                                        {`${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Guest customer'}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">{order.customer?.phone || order.customer?.email || 'No contact saved'}</p>
                                </div>
                                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Fulfilment</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm font-bold text-neutral-900">
                                            {order.type === 'dine_in' 
                                                ? `Dine-In Table ${order.table_number || 'N/A'}` 
                                                : order.type === 'delivery' 
                                                    ? 'Home Delivery' 
                                                    : 'Store Collection'}
                                        </p>
                                        {order.type === 'dine_in' && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider">
                                                Table #{order.table_number}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {order.type === 'dine_in'
                                            ? 'Customer seated in store'
                                            : order.type === 'delivery'
                                                ? `${order.delivery_address?.postcode || 'No postcode'}${order.delivery_address?.city ? `, ${order.delivery_address.city}` : ''}`
                                                : formatDateTime(order.collection_time)}
                                    </p>
                                </div>
                                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Actions & Status</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                                        <div>
                                            <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Order</label>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                                                className="w-full bg-white border border-neutral-300 px-3 py-2.5 focus:outline-none text-[10px] font-bold uppercase text-neutral-800 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="ready">Ready</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Payment Status</label>
                                            <select
                                                value={order.payment_status}
                                                onChange={(e) => handleUpdateOrderPayment(e.target.value)}
                                                className="w-full bg-white border border-neutral-300 px-3 py-2.5 focus:outline-none text-[10px] font-bold uppercase text-neutral-800 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                            >
                                                <option value="unpaid">Unpaid</option>
                                                <option value="paid">Paid</option>
                                                <option value="failed">Failed</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
                                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="px-5 py-4 border-b border-neutral-100">
                                        <h2 className="text-sm font-bold text-neutral-900">Order Items</h2>
                                    </div>
                                    <div className="divide-y divide-neutral-100">
                                        {(order.items || []).map(item => (
                                            <div key={item.id} className="px-5 py-4 flex items-start justify-between gap-4 text-xs">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-neutral-800">
                                                        {item.quantity}x {item.product_name}
                                                        {item.variation_name ? ` (${item.variation_name})` : ''}
                                                    </p>
                                                    <p className="text-[10px] text-neutral-400 mt-0.5">£{parseFloat(item.price || 0).toFixed(2)} each</p>
                                                </div>
                                                <span className="font-black text-neutral-900 whitespace-nowrap">£{parseFloat(item.total || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                                        <h2 className="text-sm font-bold text-neutral-900 mb-3">Totals</h2>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between text-neutral-500">
                                                <span>Subtotal</span>
                                                <span>£{parseFloat(order.subtotal || 0).toFixed(2)}</span>
                                            </div>
                                            {order.type === 'delivery' && (
                                                <div className="flex justify-between text-neutral-500">
                                                    <span>Delivery Fee</span>
                                                    <span>£{parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2 border-t border-neutral-100 text-sm font-black text-neutral-900">
                                                <span>Total</span>
                                                <span>£{parseFloat(order.total || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {order.type === 'delivery' && (
                                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Truck size={16} className="text-neutral-900" />
                                                    <h2 className="text-sm font-bold text-neutral-900">Courier Delivery Dispatch</h2>
                                                </div>
                                                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[10px] font-black uppercase tracking-wider">
                                                    {order.uber_status || 'Pending Dispatch'}
                                                </span>
                                            </div>

                                            {order.uber_delivery_id ? (
                                                <div className="p-3.5 bg-neutral-50 rounded-xl space-y-2.5 border border-neutral-100 text-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-neutral-400">Provider:</span>
                                                        <span className="font-bold text-neutral-800 uppercase text-[10px] bg-white border border-neutral-200 px-2 py-0.5 rounded">
                                                            {order.delivery_provider?.replace('_', ' ') || 'Uber Direct'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-neutral-400">Tracking Ref:</span>
                                                        <span className="font-mono font-bold text-neutral-800">{order.uber_delivery_id}</span>
                                                    </div>
                                                    {order.uber_courier_name && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-neutral-400">Courier:</span>
                                                            <span className="font-bold text-neutral-800">{order.uber_courier_name} {order.uber_courier_phone ? `(${order.uber_courier_phone})` : ''}</span>
                                                        </div>
                                                    )}
                                                    {order.uber_tracking_url && (
                                                        <div className="pt-1 flex items-center justify-between border-t border-neutral-200/60">
                                                            <a
                                                                href={order.uber_tracking_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
                                                            >
                                                                <span>Live Courier Map</span>
                                                                <ExternalLink size={12} />
                                                            </a>

                                                            {order.uber_status !== 'delivered' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAdvanceCourierStatus}
                                                                    disabled={advancingStatus}
                                                                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                                                                    title="Simulate driver moving to next delivery milestone"
                                                                >
                                                                    {advancingStatus ? 'Advancing...' : '⚡ Advance Status'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                                                            Select Delivery Provider
                                                        </label>
                                                        <select
                                                            value={selectedProvider}
                                                            onChange={(e) => setSelectedProvider(e.target.value)}
                                                            className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-800 rounded-lg focus:outline-none focus:border-neutral-950 transition-colors"
                                                        >
                                                            <option value="uber_direct">Uber Direct (Standard On-Demand)</option>
                                                            <option value="stuart">Stuart Delivery (Express Courier)</option>
                                                            <option value="in_house">In-House Fleet (Sweet Spot Bakery Van)</option>
                                                            <option value="simulated">SwiftCourier Simulator (Test Courier)</option>
                                                        </select>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={handleDispatchCourier}
                                                        disabled={dispatchingCourier}
                                                        className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                                                    >
                                                        <Truck size={14} className="text-amber-400" />
                                                        <span>{dispatchingCourier ? 'Dispatching Courier...' : 'Dispatch Courier'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {order.notes && (
                                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                                            <h2 className="text-sm font-bold text-neutral-900 mb-2">Notes</h2>
                                            <p className="text-xs text-neutral-600 leading-relaxed">{order.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
