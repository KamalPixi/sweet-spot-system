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
                { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} /> },
            ],
        },
        {
            label: 'Operations',
            items: [
                { id: 'orders', label: 'Orders', icon: <ClipboardList size={16} /> },
            ],
        },
        {
            label: 'Catalogue',
            items: [
                { id: 'categories', label: 'Categories', icon: <FolderTree size={16} /> },
                { id: 'products', label: 'Products', icon: <ShoppingBag size={16} /> },
            ],
        },
        {
            label: 'Customers',
            items: [
                { id: 'customers', label: 'Customers', icon: <Users size={16} /> },
                { id: 'newsletter', label: 'Newsletter', icon: <Mail size={16} /> },
            ],
        },
        {
            label: 'System',
            items: [
                { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
                { id: 'trash', label: 'Trash', icon: <Trash2 size={16} /> },
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
                            <p className="text-xs font-bold text-[#C5A880] uppercase tracking-widest mb-1">Pudding London · Admin Portal</p>
                            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">{orderNumber || 'Order Details'}</h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                {order ? formatDateTime(order.created_at) : 'Review order status, payment, and item details.'}
                            </p>
                        </div>

                        {order && (
                            <div className="flex flex-wrap items-center gap-2">
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
                            <Loader2 className="animate-spin text-neutral-950" size={40} />
                        </div>
                    ) : !order ? (
                        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm">
                            <p className="text-sm text-neutral-500">Order details are not available.</p>
                            <button
                                type="button"
                                onClick={fetchOrder}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-bold"
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
                                    <p className="text-sm font-bold text-neutral-900 mt-1">
                                        {order.type === 'delivery' ? 'Home Delivery' : 'Store Collection'}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {order.type === 'delivery'
                                            ? `${order.delivery_address?.postcode || 'No postcode'}${order.delivery_address?.city ? `, ${order.delivery_address.city}` : ''}`
                                            : formatDateTime(order.collection_time)}
                                    </p>
                                </div>
                                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Actions</p>
                                    <div className="grid grid-cols-1 gap-3 mt-2">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Order Status</label>
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
                                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
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
                                    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
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

                                    {order.notes && (
                                        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
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
