import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import { 
    LayoutDashboard, ClipboardList, FolderTree, Mail, Settings, 
    BarChart3, ShoppingBag, Users, Trash2, Loader2, ArrowLeft, 
    Calendar, Phone, MapPin, Eye, DollarSign, ShoppingCart, User,
    QrCode, Printer, Clock,
    Compass, LineChart, ReceiptText, UtensilsCrossed, Receipt, CalendarClock, Tag, Package, UserCheck, Send, SlidersHorizontal, ArchiveRestore
} from 'lucide-react';

const formatCurrency = (value) => `£${parseFloat(value || 0).toFixed(2)}`;

const formatDateTime = (value) => {
    if (!value) return 'Unknown';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export default function AdminCustomerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { adminToken: token, adminUser: user, logout } = useApp();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);

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

    const orderStatusMeta = {
        pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
        preparing: { label: 'Preparing', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
        ready: { label: 'Ready', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        completed: { label: 'Completed', classes: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
        cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-650 border-red-200' },
    };

    const orderPaymentMeta = {
        unpaid: { label: 'Unpaid', classes: 'bg-amber-50 text-amber-700 border-amber-150' },
        paid: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        failed: { label: 'Failed', classes: 'bg-red-50 text-red-600 border-red-150' },
    };

    const fetchCustomerDetails = async () => {
        if (!token || !id) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/customers/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const d = await res.json();
            if (d.success) {
                setCustomer(d.data);
            } else {
                setError(d.message || 'Failed to load customer details.');
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/admin/login');
            return;
        }
        fetchCustomerDetails();
    }, [id, token]);

    const handleLogout = () => {
        logout('admin');
        navigate('/');
    };

    const adminDisplayName = user?.name || 'Admin Manager';
    const adminRole = 'Store Admin';

    const customerName = customer 
        ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Guest Customer'
        : '';
    const averageOrderValue = customer && customer.orders_count > 0 
        ? (parseFloat(customer.orders_sum_total) / customer.orders_count) 
        : 0;

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-850 font-sans flex">
            <AdminSidebar
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed(prev => !prev)}
                activeTab="customers"
                onTabChange={(tab) => navigate(tab === 'dashboard' ? '/admin' : `/admin/${tab}`)}
                onLogout={handleLogout}
                sections={sidebarSections}
            />

            <main className="flex-grow max-h-screen overflow-y-auto w-full bg-neutral-50">
                <AdminTopbar
                    sectionLabel="Customers"
                    adminRole={adminRole}
                    adminDisplayName={adminDisplayName}
                    userEmail={user?.email}
                    unreadNotificationCount={0}
                    notifications={[]}
                    notificationsLoading={false}
                    notificationsOpen={false}
                    setNotificationsOpen={() => {}}
                    accountMenuOpen={accountMenuOpen}
                    setAccountMenuOpen={setAccountMenuOpen}
                    onRefresh={fetchCustomerDetails}
                    onOpenOrders={() => navigate('/admin/orders')}
                    onMarkAllNotificationsRead={() => {}}
                    onOpenProfile={() => navigate('/admin/profile')}
                    onLogout={handleLogout}
                    onNotificationClick={() => {}}
                />

                <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
                    {/* Top title and description */}
                    <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8e5233] block">Customers</span>
                        <h1 className="text-3xl font-black text-neutral-900 tracking-tight mt-1">Manage Customers</h1>
                        <p className="text-xs text-neutral-450 mt-1">Configure and view customer profiles, address books, and order histories.</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="animate-spin text-neutral-950" size={40} />
                        </div>
                    ) : error || !customer ? (
                        <div className="bg-white border border-neutral-200 rounded-[20px] p-8 text-center shadow-sm">
                            <p className="text-sm text-neutral-500">{error || 'Customer not found.'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
                            
                            {/* Left Side: 2 Columns for Profile Info & Order History */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Customer Profile Card */}
                                <div className="bg-white border border-neutral-200 rounded-[20px] p-8 shadow-sm space-y-6">
                                    <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Customer Profile</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">First Name</label>
                                            <div className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800">
                                                {customer.first_name || '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Last Name</label>
                                            <div className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800">
                                                {customer.last_name || '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Email Address</label>
                                            <div className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800">
                                                {customer.email || '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Phone Number</label>
                                            <div className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800">
                                                {customer.phone || '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Customer Status</label>
                                            <div className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 capitalize">
                                                {customer.is_guest ? 'Guest Customer' : 'Registered Member'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Member Since</label>
                                            <div className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800">
                                                {formatDateTime(customer.created_at)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
                                        <button 
                                            onClick={() => navigate('/admin/customers')}
                                            className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-full text-xs transition-colors"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </div>

                                {/* Order History Card */}
                                <div className="bg-white border border-neutral-200 rounded-[20px] p-8 shadow-sm space-y-6">
                                    <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Order History</h2>
                                    
                                    <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-neutral-50 text-neutral-450 uppercase tracking-wider font-bold text-[10px] border-b border-neutral-200">
                                                    <th className="py-3.5 px-5 text-left font-bold">Order Reference</th>
                                                    <th className="py-3.5 px-5 text-left font-bold">Type</th>
                                                    <th className="py-3.5 px-5 text-left font-bold">Items</th>
                                                    <th className="py-3.5 px-5 text-left font-bold">Total</th>
                                                    <th className="py-3.5 px-5 text-left font-bold">Status</th>
                                                    <th className="py-3.5 px-5 text-left font-bold">Payment</th>
                                                    <th className="py-3.5 px-5 text-right font-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 text-neutral-700">
                                                {customer.orders?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="py-12 text-center text-neutral-400">
                                                            No orders placed yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    customer.orders?.map(order => (
                                                        <tr key={order.id} className="hover:bg-neutral-50/40 transition-colors">
                                                            <td className="py-4 px-5">
                                                                <span className="font-mono font-black text-neutral-950 block">{order.order_number}</span>
                                                                <span className="text-[9px] text-neutral-400 mt-0.5 block">{formatDateTime(order.created_at)}</span>
                                                            </td>
                                                            <td className="py-4 px-5">
                                                                <span className="font-semibold block">{order.type === 'delivery' ? 'Delivery' : 'Collection'}</span>
                                                            </td>
                                                            <td className="py-4 px-5 max-w-[200px] truncate">
                                                                <div className="space-y-1">
                                                                    {order.items?.map((item, idx) => (
                                                                        <div key={item.id || idx} className="text-[10px] text-neutral-800 font-medium truncate">
                                                                            <span className="font-bold text-[#8e5233]">{item.quantity}x</span> {item.product_name}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-5 font-bold text-neutral-950">{formatCurrency(order.total)}</td>
                                                            <td className="py-4 px-5">
                                                                <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border capitalize ${
                                                                    orderStatusMeta[order.status]?.classes || 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                                                }`}>
                                                                    {orderStatusMeta[order.status]?.label || order.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-5">
                                                                <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border capitalize ${
                                                                    orderPaymentMeta[order.payment_status]?.classes || 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                                                }`}>
                                                                    {orderPaymentMeta[order.payment_status]?.label || order.payment_status}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-5 text-right">
                                                                <button 
                                                                    onClick={() => navigate(`/admin/orders/${order.order_number}`)}
                                                                    className="p-1.5 text-neutral-450 hover:text-[#8e5233] transition-colors inline-flex items-center justify-center"
                                                                    title="View Order"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: 1 Column for Stats & Addresses */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Customer Quick Preview Card (Aesthetics matching the live card preview) */}
                                <div className="bg-white border border-neutral-200 rounded-[20px] p-6 shadow-sm space-y-4">
                                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Customer Statistics</h3>
                                    
                                    <div className="border border-neutral-200 rounded-[16px] p-5 bg-neutral-50/50 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#8e5233]/10 text-[#8e5233] flex items-center justify-center">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-neutral-900 text-sm">{customerName}</h4>
                                                <p className="text-[10px] text-neutral-400 font-medium">#{customer.id}</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-neutral-200/60 pt-4 space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-neutral-450 font-bold uppercase tracking-wider text-[9px]">Total Orders</span>
                                                <span className="font-black text-neutral-900">{customer.orders_count}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-t border-neutral-100 pt-3">
                                                <span className="text-neutral-450 font-bold uppercase tracking-wider text-[9px]">Total Spent</span>
                                                <span className="font-black text-[#8e5233]">{formatCurrency(customer.orders_sum_total)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-t border-neutral-100 pt-3">
                                                <span className="text-neutral-450 font-bold uppercase tracking-wider text-[9px]">Avg Order Value</span>
                                                <span className="font-black text-neutral-900">{formatCurrency(averageOrderValue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-neutral-400 text-center italic">Metrics are updated in real-time on every order checkout.</p>
                                </div>

                                {/* Saved Addresses */}
                                <div className="bg-white border border-neutral-200 rounded-[20px] p-6 shadow-sm space-y-4">
                                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Address Book</h3>
                                    
                                    {customer.addresses?.length === 0 ? (
                                        <div className="text-center py-6 border border-dashed border-neutral-250 rounded-[16px]">
                                            <MapPin size={24} className="text-neutral-200 mx-auto mb-2" />
                                            <p className="text-[11px] text-neutral-400">No saved addresses.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {customer.addresses?.map((address, idx) => (
                                                <div key={address.id || idx} className="flex gap-3 items-start text-xs text-neutral-700 bg-neutral-50/60 p-4 border border-neutral-200/70 rounded-[16px]">
                                                    <MapPin size={16} className="text-[#8e5233] shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-bold text-neutral-900 text-[11px]">Address #{idx + 1}</p>
                                                        <p className="mt-1 leading-relaxed text-neutral-500 text-[11px]">
                                                            {address.address_line_1}
                                                            {address.address_line_2 && `, ${address.address_line_2}`}
                                                            <br />
                                                            {address.city}, {address.postcode}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
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
