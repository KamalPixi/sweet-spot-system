import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from './AppContext';
import AdminSidebar from './admin/components/AdminSidebar';
import AdminTopbar from './admin/components/AdminTopbar';
import AdminTable from './admin/components/AdminTable';
import { AdminStatCard, AdminStatGrid } from './admin/components/AdminStatCard';
import AdminTablesTab from './admin/components/AdminTablesTab';
import AdminPrintersTab from './admin/components/AdminPrintersTab';
import AdminCollectionSlotsTab from './admin/components/AdminCollectionSlotsTab';
import AdminReviewsPage from './admin/components/AdminReviewsPage';
import useRealtimeChannel from './hooks/useRealtimeChannel';
import useNotificationSound from './hooks/useNotificationSound';
import { getEchoSocketId } from './lib/realtime';
import { 
    LayoutDashboard, ClipboardList, FolderTree, Egg, Mail, Settings, 
    ArrowLeft, LogOut, Loader2, AlertCircle, Plus, Edit, Trash, Check, X, ShieldAlert, ChevronLeft, ChevronRight, BarChart3,
    Search, Layers, ShoppingBag, Eye, EyeOff, Trash2, RotateCcw, Users, User, Bell, RefreshCw, ChevronDown, Upload, Clock,
    Store, MapPin, Truck, Trophy, Globe, QrCode, Printer, DollarSign, Flame, CheckCircle2, ArrowUpRight,
    Cake, Coffee, Cookie, Croissant, IceCream, Pizza, Sandwich, Soup, Salad, Apple, Citrus, Grape, CupSoda, GlassWater, Donut, Dessert, Wheat,
    Compass, LineChart, ReceiptText, UtensilsCrossed, Receipt, CalendarClock, Tag, Package, UserCheck, Send, SlidersHorizontal, ArchiveRestore, MessageSquare, Heart,
    FileText, Download, CreditCard, ShieldCheck, KeyRound, Timer, Zap
} from 'lucide-react';
import * as Lucide from 'lucide-react';
import { SOCIAL_PLATFORMS, SocialIcon, getPlatformInfo } from './components/SocialIcons';

const getImageUrl = (item) => {
    if (!item) return '/images/placeholder.svg';
    const resolveUrl = (url) => {
        if (!url) return '/images/placeholder.svg';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
        return `/storage/${cleanUrl}`;
    };
    if (item.images && item.images.length > 0) {
        const primary = item.images.find(img => img.is_primary);
        const url = primary ? primary.url : item.images[0].url;
        return resolveUrl(url);
    }
    if (item.image) {
        return resolveUrl(item.image);
    }
    return '/images/placeholder.svg';
};

const resolveStoredImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
    return `/storage/${cleanUrl}`;
};

const clearStorefrontCatalogCache = () => {
    sessionStorage.removeItem('cached_menu_catalog');
    sessionStorage.removeItem('cached_menu_catalog_v2');
};

const getApiErrorMessage = (data, fallback) => {
    const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null;
    return firstError || data?.message || fallback;
};

const categoryIconOptions = [
    { name: 'Cake', icon: Cake, label: 'Cake' },
    { name: 'Coffee', icon: Coffee, label: 'Hot Drink' },
    { name: 'CupSoda', icon: CupSoda, label: 'Cold Drink' },
    { name: 'GlassWater', icon: GlassWater, label: 'Water' },
    { name: 'Cookie', icon: Cookie, label: 'Cookies' },
    { name: 'Croissant', icon: Croissant, label: 'Pastries' },
    { name: 'Donut', icon: Donut, label: 'Donuts' },
    { name: 'Dessert', icon: Dessert, label: 'Pudding' },
    { name: 'Wheat', icon: Wheat, label: 'Bread / Toast' },
    { name: 'IceCream', icon: IceCream, label: 'Ice Cream' },
    { name: 'Pizza', icon: Pizza, label: 'Pizza / Savory' },
    { name: 'Sandwich', icon: Sandwich, label: 'Sandwiches' },
    { name: 'Soup', icon: Soup, label: 'Soups' },
    { name: 'Salad', icon: Salad, label: 'Salads' },
    { name: 'Egg', icon: Egg, label: 'Eggs' },
    { name: 'Apple', icon: Apple, label: 'Healthy' }
];

export const categoryIconMap = {
    Cake, Coffee, Cookie, Croissant, IceCream, Pizza, Sandwich, Soup, Salad, Egg, Apple, Citrus, Grape, CupSoda, GlassWater, Donut, Dessert, Wheat
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const { adminToken: token, adminUser: user, login, logout } = useApp();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });

    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- State collections ---
    const [reports, setReports] = useState(null);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [productMeta, setProductMeta] = useState({ current_page: 1, last_page: 1, per_page: 12, total: 0, from: null, to: null });
    const [productSummary, setProductSummary] = useState({ total: 0, active: 0, inactive: 0, withVariations: 0 });
    const [productRelatedOptions, setProductRelatedOptions] = useState([]);
    const [newsletter, setNewsletter] = useState([]);
    const [settings, setSettings] = useState({});
    const [trash, setTrash] = useState({ categories: [], products: [], customers: [] });
    const [trashSubTab, setTrashSubTab] = useState('categories');
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [updatingOrders, setUpdatingOrders] = useState({}); // { [orderId]: string }
    const [printingOrderId, setPrintingOrderId] = useState(null);
    const [fadingOrders, setFadingOrders] = useState({}); // { [orderId]: boolean }
    const [highlightedOrders, setHighlightedOrders] = useState({}); // { [orderId]: boolean }

    // Store opening hours / collection slots states
    const [openingHours, setOpeningHours] = useState([]);
    const [editingHourId, setEditingHourId] = useState(null);
    const [editOpenTime, setEditOpenTime] = useState('08:00:00');
    const [editCloseTime, setEditCloseTime] = useState('22:00:00');
    const [editSlotInterval, setEditSlotInterval] = useState(15);
    const [editIsClosed, setEditIsClosed] = useState(false);
    const [orderQuery, setOrderQuery] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('active');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
    const [orderGroupMode, setOrderGroupMode] = useState('status');
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
    const [customerSort, setCustomerSort] = useState('recent');
    const [reportRange, setReportRange] = useState('today');
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const notificationsSignatureRef = useRef('');
    const unreadNotificationCountRef = useRef(0);
    const hasLoadedNotificationsRef = useRef(false);

    // --- Form states ---
    // Categories CRUD
    const [catFormOpen, setCatFormOpen] = useState(false);
    const [catEditId, setCatEditId] = useState(null);
    const [catName, setCatName] = useState('');
    const [catIcon, setCatIcon] = useState('');
    const [iconSearchQuery, setIconSearchQuery] = useState('');
    const [catImage, setCatImage] = useState('');
    const [catImageFile, setCatImageFile] = useState(null);
    const [catImagePreview, setCatImagePreview] = useState('');
    const [catStatus, setCatStatus] = useState(true);
    const [catShowInFooter, setCatShowInFooter] = useState(false);
    const [catOrder, setCatOrder] = useState(0);

    // Image Cropper States
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropSourceImage, setCropSourceImage] = useState(null);
    const [cropImageUrl, setCropImageUrl] = useState('');
    const [cropZoom, setCropZoom] = useState(1);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const [isDraggingCrop, setIsDraggingCrop] = useState(false);
    const [dragStartCrop, setDragStartCrop] = useState({ x: 0, y: 0 });
    const [cropImageRenderSize, setCropImageRenderSize] = useState({ width: 0, height: 0 });
    const [cropperTarget, setCropperTarget] = useState('category'); // 'category' or 'product'
    const [catCurrentPage, setCatCurrentPage] = useState(1);
    const [catQuery, setCatQuery] = useState('');
    const [catStatusFilter, setCatStatusFilter] = useState('all');

    // Products CRUD
    const [prodFormOpen, setProdFormOpen] = useState(false);
    const [prodEditId, setProdEditId] = useState(null);
    const [prodName, setProdName] = useState('');
    const [prodCategoryId, setProdCategoryId] = useState('');
    const [prodDescription, setProdDescription] = useState('');
    const [prodIngredients, setProdIngredients] = useState('');
    const [prodImages, setProdImages] = useState(['']);
    const [prodImageFiles, setProdImageFiles] = useState([]);
    const [prodStatus, setProdStatus] = useState(true);
    const [prodIsHomeTreat, setProdIsHomeTreat] = useState(false);
    const [prodHasVariations, setProdHasVariations] = useState(false);
    const [prodBasePrice, setProdBasePrice] = useState(0.00);
    const [prodBaseWeight, setProdBaseWeight] = useState('');
    const [prodRelatedIds, setProdRelatedIds] = useState([]);
    const [prodVariations, setProdVariations] = useState([]); // Array of { id, name, price, weight, sku, image, imageFile, imagePreview, stock }
    const [prodCurrentPage, setProdCurrentPage] = useState(1);
    const [prodQuery, setProdQuery] = useState('');
    const [prodCategoryFilter, setProdCategoryFilter] = useState('all');
    const [prodStatusFilter, setProdStatusFilter] = useState('all');
    const [prodTypeFilter, setProdTypeFilter] = useState('all');
    const [prodCategoryPickerOpen, setProdCategoryPickerOpen] = useState(false);
    const [togglingProductId, setTogglingProductId] = useState(null);

    // Settings config
    const [settingsForm, setSettingsForm] = useState({});
    const [storeLogoFile, setStoreLogoFile] = useState(null);
    const [storeLogoWhiteFile, setStoreLogoWhiteFile] = useState(null);
    const [storeImageFile, setStoreImageFile] = useState(null);
    const [heroBgImageFile, setHeroBgImageFile] = useState(null);
    const [menuPdfFile, setMenuPdfFile] = useState(null);
    const [settingsSubTab, setSettingsSubTab] = useState('configs'); // 'configs' or 'faqs'
    const [faqs, setFaqs] = useState([]);
    const [faqFormOpen, setFaqFormOpen] = useState(false);
    const [faqEditId, setFaqEditId] = useState(null);
    const [faqQuestion, setFaqQuestion] = useState('');
    const [faqAnswer, setFaqAnswer] = useState('');
    const [faqSortOrder, setFaqSortOrder] = useState(0);
    const [faqIsActive, setFaqIsActive] = useState(true);

    const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const { playNotificationSound } = useNotificationSound();

    const adminPathByTab = {
        dashboard: '/admin',
        orders: '/admin/orders',
        tables: '/admin/tables',
        printers: '/admin/printers',
        reports: '/admin/reports',
        categories: '/admin/categories',
        products: '/admin/products',
        customers: '/admin/customers',
        newsletter: '/admin/newsletter',
        reviews: '/admin/reviews',
        profile: '/admin/profile',
        settings: '/admin/settings',
        trash: '/admin/trash',
        collectionSlots: '/admin/collection-slots',
    };

    const tabFromPath = (pathname) => {
        if (!pathname || pathname === '/admin') return 'dashboard';
        const match = pathname.match(/^\/admin\/([^/]+)/);
        if (!match) return 'dashboard';
        const section = match[1];
        if (section === 'dashboard') return 'dashboard';
        if (section === 'orders') return 'orders';
        if (section === 'tables') return 'tables';
        if (section === 'printers') return 'printers';
        if (section === 'reports') return 'reports';
        if (section === 'categories') return 'categories';
        if (section === 'products') return 'products';
        if (section === 'customers') return 'customers';
        if (section === 'newsletter') return 'newsletter';
        if (section === 'reviews') return 'reviews';
        if (section === 'profile') return 'profile';
        if (section === 'settings') return 'settings';
        if (section === 'trash') return 'trash';
        if (section === 'collection-slots') return 'collectionSlots';
        return 'dashboard';
    };

    // Security Gate: check if logged in as Admin
    useEffect(() => {
        if (!token) {
            navigate('/admin/login');
        }
    }, [token]);

    useEffect(() => {
        setActiveTab(tabFromPath(location.pathname));
    }, [location.pathname]);

    // Fetch tab specific data
    useEffect(() => {
        if (!token) return;
        fetchData();
    }, [
        activeTab,
        reportRange,
        reportStartDate,
        reportEndDate,
        customerQuery,
        customerTypeFilter,
        customerSort,
        orderStatusFilter,
        prodCurrentPage,
        prodQuery,
        prodCategoryFilter,
        prodStatusFilter,
        prodTypeFilter,
    ]);

    useEffect(() => {
        if (!token || !notificationsOpen) return;
        fetchNotifications();
    }, [token, notificationsOpen]);

    useEffect(() => {
        setProfileForm({ name: user?.name || '', email: user?.email || '' });
    }, [user]);

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

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };

        try {
            if (activeTab === 'dashboard') {
                const res = await fetch('/api/admin/admin-reports', { headers });
                const d = await res.json();
                if (d.success) setReports(d.data);

                const ordersRes = await fetch('/api/admin/orders', { headers });
                const ordersD = await ordersRes.json();
                if (ordersD.success) setOrders(ordersD.data);
            } else if (activeTab === 'reports') {
                const params = new URLSearchParams({ range: reportRange });
                if (reportRange === 'custom') {
                    if (reportStartDate) params.append('start_date', reportStartDate);
                    if (reportEndDate) params.append('end_date', reportEndDate);
                }

                const res = await fetch(`/api/admin/admin-reports?${params.toString()}`, { headers });
                const d = await res.json();
                if (d.success) setReports(d.data);
            } else if (activeTab === 'orders' || activeTab === 'tables') {
                const params = new URLSearchParams();
                if (orderStatusFilter && orderStatusFilter !== 'active') {
                    params.append('status', orderStatusFilter);
                }
                const res = await fetch(`/api/admin/orders${params.toString() ? `?${params.toString()}` : ''}`, { headers });
                const d = await res.json();
                if (d.success) setOrders(d.data);
            } else if (activeTab === 'categories') {
                const res = await fetch('/api/admin/categories', { headers });
                const d = await res.json();
                if (d.success) setCategories(d.data);
            } else if (activeTab === 'products') {
                const params = new URLSearchParams({
                    page: String(prodCurrentPage),
                    per_page: '12',
                });
                if (prodQuery) params.append('search', prodQuery);
                if (prodCategoryFilter !== 'all') params.append('category_id', prodCategoryFilter);
                if (prodStatusFilter !== 'all') params.append('status', prodStatusFilter);
                if (prodTypeFilter !== 'all') params.append('type', prodTypeFilter);

                const res = await fetch(`/api/admin/products?${params.toString()}`, { headers });
                const d = await res.json();
                if (d.success) {
                    const payload = Array.isArray(d.data) ? { products: d.data } : d.data;
                    setProducts(payload.products || []);
                    setProductMeta(payload.meta || { current_page: 1, last_page: 1, per_page: 12, total: payload.products?.length || 0, from: null, to: null });
                    setProductSummary({
                        total: payload.summary?.total || 0,
                        active: payload.summary?.active || 0,
                        inactive: payload.summary?.inactive || 0,
                        withVariations: payload.summary?.with_variations || 0,
                    });
                    if (payload.categories) setCategories(payload.categories);
                    if (payload.related_options) setProductRelatedOptions(payload.related_options);
                }
            } else if (activeTab === 'newsletter') {
                const res = await fetch('/api/admin/newsletter', { headers });
                const d = await res.json();
                if (d.success) setNewsletter(d.data);
            } else if (activeTab === 'customers') {
                const params = new URLSearchParams();
                if (customerQuery) params.append('search', customerQuery);
                if (customerTypeFilter !== 'all') params.append('type', customerTypeFilter);
                if (customerSort) params.append('sort', customerSort);

                const res = await fetch(`/api/admin/customers${params.toString() ? `?${params.toString()}` : ''}`, { headers });
                const d = await res.json();
                if (d.success) setCustomers(d.data.customers || []);
            } else if (activeTab === 'settings') {
                const res = await fetch('/api/configs', { headers });
                const d = await res.json();
                if (d.success) {
                    setSettings(d.data);
                    setSettingsForm(d.data);
                }
                const faqRes = await fetch('/api/admin/faqs', { headers });
                const faqD = await faqRes.json();
                if (faqD.success) {
                    setFaqs(faqD.data);
                }
            } else if (activeTab === 'collectionSlots') {
                const res = await fetch('/api/admin/opening-hours', { headers });
                const d = await res.json();
                if (d.success) setOpeningHours(d.data);
            } else if (activeTab === 'trash') {
                const res = await fetch('/api/admin/trash', { headers });
                const d = await res.json();
                if (d.success) setTrash(d.data);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch data for this section.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProductFormCategories = async () => {
        if (categories.length > 0) return categories;

        const res = await fetch('/api/admin/categories', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        const d = await res.json();
        if (d.success) {
            setCategories(d.data);
            return d.data;
        }

        setError(getApiErrorMessage(d, 'Failed to fetch product categories.'));
        return [];
    };

    const fetchNotifications = async () => {
        if (!token) return;
        setNotificationsLoading(true);

        try {
            const res = await fetch('/api/notifications', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
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

        if (eventType === 'order.created' || eventType === 'order.updated') {
            fetchNotifications();
            if (['dashboard', 'orders', 'reports', 'tables'].includes(activeTab)) {
                fetchData();
            }
            return;
        }

        if (eventType === 'notification.created') {
            fetchNotifications();
        }
    };

    const { connected: adminLiveConnected } = useRealtimeChannel({
        token,
        channel: 'admin.live',
        onMessage: handleAdminRealtimeMessage,
        fallbackPoll: () => {
            fetchNotifications();
            if (['dashboard', 'orders', 'reports', 'tables'].includes(activeTab)) {
                fetchData();
            }
        },
        fallbackInterval: 20000,
        enabled: !!token,
    });

    const handleMarkNotificationRead = async (notificationId) => {
        try {
            const res = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
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
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.success) fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearAllNotifications = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.success) fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            const res = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.success) fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const startEditingOpeningHour = (hour) => {
        setEditingHourId(hour.id);
        setEditOpenTime(hour.open_time);
        setEditCloseTime(hour.close_time);
        setEditSlotInterval(hour.slot_interval);
        setEditIsClosed(hour.is_closed);
    };

    const handleSaveOpeningHour = async (id) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await fetch(`/api/admin/opening-hours/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    open_time: editOpenTime,
                    close_time: editCloseTime,
                    slot_interval: parseInt(editSlotInterval, 10),
                    is_closed: !!editIsClosed
                })
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage('Store collection hours updated successfully.');
                setEditingHourId(null);
                fetchData();
            } else {
                setError(d.message || 'Failed to update store collection hours.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save collection slot settings.');
        } finally {
            setLoading(false);
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
            } else {
                navigate('/admin/orders');
                setActiveTab('orders');
                setOrderStatusFilter('all');
                setOrderGroupMode('status');
            }
        }

        setNotificationsOpen(false);
    };

    const patchOrderInState = (updatedOrder, shouldHighlight = false) => {
        setOrders(prev => prev.map(order => (
            order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
        )));

        if (shouldHighlight) {
            setHighlightedOrders(prev => ({ ...prev, [updatedOrder.id]: true }));
            setTimeout(() => {
                setHighlightedOrders(prev => ({ ...prev, [updatedOrder.id]: false }));
            }, 2000);
        }
    };

    // --- Actions ---

    // Update order status
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        setError(null);
        setSuccessMessage(null);
        setUpdatingOrders(prev => ({ ...prev, [orderId]: 'status' }));
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...(getEchoSocketId() ? { 'X-Socket-ID': getEchoSocketId() } : {}),
                },
                body: JSON.stringify({ status: newStatus })
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage(`Order updated to '${newStatus}' successfully.`);
                if (d.data) {
                    // Start fading out from current group
                    setFadingOrders(prev => ({ ...prev, [orderId]: true }));
                    setTimeout(() => {
                        patchOrderInState(d.data, true);
                        setFadingOrders(prev => ({ ...prev, [orderId]: false }));
                    }, 500);
                }
            } else {
                setError(getApiErrorMessage(d, 'Failed to save category.'));
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update order status.');
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: null }));
        }
    };

    // Update order payment status
    const handleUpdateOrderPayment = async (orderId, payStatus) => {
        setError(null);
        setSuccessMessage(null);
        setUpdatingOrders(prev => ({ ...prev, [orderId]: 'payment' }));
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...(getEchoSocketId() ? { 'X-Socket-ID': getEchoSocketId() } : {}),
                },
                body: JSON.stringify({ payment_status: payStatus })
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage(`Payment status updated to '${payStatus}' successfully.`);
                if (d.data) {
                    setFadingOrders(prev => ({ ...prev, [orderId]: true }));
                    setTimeout(() => {
                        patchOrderInState(d.data, true);
                        setFadingOrders(prev => ({ ...prev, [orderId]: false }));
                    }, 500);
                }
            } else {
                setError(d.message);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update payment status.');
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: null }));
        }
    };

    // Fast inline print trigger for orders table
    const handlePrintOrderTicket = async (orderId) => {
        setPrintingOrderId(orderId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const d = await res.json();
            if (d.success) {
                toast.success('Print job queued for kitchen printer!');
                // Update print count in local state
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, print_count: (o.print_count || 0) + 1, printed_at: new Date().toISOString() } : o));
            } else {
                toast.error(d.message || 'Failed to trigger print.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Print request failed.');
        } finally {
            setPrintingOrderId(null);
        }
    };

    // Image Cropping Handlers
    const handleCropImageLoad = (e) => {
        const img = e.target;
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const viewportAspect = 270 / 360; // 0.75
        
        if (imgAspect > viewportAspect) {
            setCropImageRenderSize({
                width: 360 * imgAspect,
                height: 360
            });
        } else {
            setCropImageRenderSize({
                width: 270,
                height: 270 / imgAspect
            });
        }
    };

    const handlePerformCrop = () => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 600; // standard category card width
            canvas.height = 800; // standard category card height (3:4)
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const viewportWidth = 270;
            const viewportHeight = 360;

            const zoomedWidth = cropImageRenderSize.width * cropZoom;
            const zoomedHeight = cropImageRenderSize.height * cropZoom;

            const xOffsetInViewport = (viewportWidth - zoomedWidth) / 2 + cropOffset.x;
            const yOffsetInViewport = (viewportHeight - zoomedHeight) / 2 + cropOffset.y;

            const scaleX = img.width / zoomedWidth;
            const scaleY = img.height / zoomedHeight;

            const sx = -xOffsetInViewport * scaleX;
            const sy = -yOffsetInViewport * scaleY;
            const sw = viewportWidth * scaleX;
            const sh = viewportHeight * scaleY;

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const croppedFile = new File([blob], cropSourceImage.name, { type: cropSourceImage.type || 'image/jpeg' });
                    if (cropperTarget === 'category') {
                        setCatImageFile(croppedFile);
                        setCatImagePreview(URL.createObjectURL(croppedFile));
                    } else {
                        setProdImageFiles(prev => [...prev, croppedFile]);
                    }
                }
                setCropperOpen(false);
            }, cropSourceImage.type || 'image/jpeg', 0.95);
        };
        img.src = cropImageUrl;
    };

    // Category CRUD Actions
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!catEditId && !catImageFile) {
            setError('Upload a category image before saving.');
            return;
        }

        const payload = new FormData();
        payload.append('name', catName);
        payload.append('icon', catIcon || '');
        payload.append('status', catStatus ? '1' : '0');
        payload.append('show_in_footer', catShowInFooter ? '1' : '0');
        payload.append('order', parseInt(catOrder || 0));
        if (catImageFile) {
            payload.append('image', catImageFile);
        }
        if (catEditId) {
            payload.append('_method', 'PUT');
        }

        const url = catEditId ? `/api/admin/categories/${catEditId}` : '/api/admin/categories';
        const method = 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: payload
            });
            const d = await res.json();
            if (d.success) {
                clearStorefrontCatalogCache();
                setSuccessMessage(catEditId ? 'Category updated successfully.' : 'Category created successfully.');
                setCatFormOpen(false);
                setCatEditId(null);
                setCatName('');
                setCatIcon('');
                setIconSearchQuery('');
                setCatImage('');
                setCatImageFile(null);
                setCatImagePreview('');
                setCatStatus(true);
                setCatShowInFooter(false);
                setCatOrder(0);
                fetchData();
            } else {
                setError(d.message);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save category.');
        }
    };

    const handleEditCategoryClick = (cat) => {
        setCatEditId(cat.id);
        setCatName(cat.name);
        const imageUrl = getImageUrl(cat);
        setCatImage(cat.images && cat.images.length > 0 ? cat.images[0].url : '');
        setCatImageFile(null);
        setCatImagePreview(imageUrl);
        setCatStatus(cat.status);
        setCatShowInFooter(Boolean(cat.show_in_footer));
        setCatOrder(cat.order);
        setCatIcon(cat.icon || '');
        setCatFormOpen(true);
    };

    const handleDeleteCategory = async (catId) => {
        if (!confirm('Move this category to Trash? You can restore it later from the Trash tab.')) return;
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch(`/api/admin/categories/${catId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.success) {
                clearStorefrontCatalogCache();
                setSuccessMessage('Category moved to Trash.');
                fetchData();
            }
        } catch (err) {
            console.error(err);
            setError('Failed to delete category.');
        }
    };

    // Trash — Restore
    const handleRestore = async (type, id) => {
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await fetch(`/api/admin/trash/restore/${type}/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage(d.message);
                fetchData();
            } else {
                setError(d.message);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to restore item.');
        }
    };

    // Trash — Permanent Delete
    const handleForceDelete = async (type, id, label) => {
        const warningMsg = type === 'category'
            ? `Permanently delete "${label}" and ALL its products, images, and variations? This CANNOT be undone.`
            : `Permanently delete "${label}"? This CANNOT be undone.`;
        if (!confirm(warningMsg)) return;
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await fetch(`/api/admin/trash/force/${type}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage(d.message);
                fetchData();
            } else {
                setError(d.message);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to permanently delete item.');
        }
    };

    // Product CRUD Actions
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const savedImageCount = prodImages.filter(img => img && img.trim() !== '').length;
        if (!prodEditId && savedImageCount + prodImageFiles.length === 0) {
            setError('Upload a product image before saving.');
            return;
        }

        const payload = new FormData();
        payload.append('category_id', prodCategoryId);
        payload.append('name', prodName);
        payload.append('description', prodDescription || '');
        payload.append('ingredients', prodIngredients || '');
        payload.append('status', prodStatus ? '1' : '0');
        payload.append('has_variations', prodHasVariations ? '1' : '0');
        payload.append('is_home_treat', prodIsHomeTreat ? '1' : '0');
        payload.append('base_price', parseFloat(prodBasePrice || 0));
        if (prodBaseWeight) payload.append('base_weight', prodBaseWeight);
        prodImages.filter(img => img && img.trim() !== '').forEach((img, index) => {
            payload.append(`existing_images[${index}]`, img);
        });
        prodImageFiles.forEach((file) => {
            payload.append('images[]', file);
        });
        prodRelatedIds.forEach((id, index) => {
            payload.append(`related_product_ids[${index}]`, id);
        });
        if (prodHasVariations) {
            prodVariations.forEach((variation, index) => {
                if (variation.id) payload.append(`variations[${index}][id]`, variation.id);
                payload.append(`variations[${index}][name]`, variation.name || '');
                payload.append(`variations[${index}][price]`, variation.price || 0);
                if (variation.weight) payload.append(`variations[${index}][weight]`, variation.weight);
                if (variation.sku) payload.append(`variations[${index}][sku]`, variation.sku);
                if (variation.image) payload.append(`variations[${index}][existing_image]`, variation.image);
                if (variation.imageFile) payload.append(`variations[${index}][image_file]`, variation.imageFile);
                if (variation.stock !== '' && variation.stock !== null && variation.stock !== undefined) payload.append(`variations[${index}][stock]`, variation.stock);
            });
        }
        if (prodEditId) {
            payload.append('_method', 'PUT');
        }

        const url = prodEditId ? `/api/admin/products/${prodEditId}` : '/api/admin/products';
        const method = 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: payload
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage(prodEditId ? 'Product updated.' : 'Product created.');
                clearStorefrontCatalogCache();
                setProdFormOpen(false);
                setProdEditId(null);
                setProdName('');
                setProdCategoryId('');
                setProdDescription('');
                setProdIngredients('');
                setProdImages(['']);
                setProdImageFiles([]);
                setProdStatus(true);
                setProdHasVariations(false);
                setProdIsHomeTreat(false);
                setProdBasePrice(0);
                setProdBaseWeight('');
                setProdRelatedIds([]);
                setProdVariations([]);
                fetchData();
            } else {
                setError(getApiErrorMessage(d, 'Failed to save product.'));
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save product details.');
        }
    };

    const handleAddProductClick = async () => {
        const productCategories = await fetchProductFormCategories();
        setProdEditId(null);
        setProdName('');
        setProdCategoryId(productCategories[0]?.id || '');
        setProdDescription('');
        setProdIngredients('');
        setProdImages(['']);
        setProdImageFiles([]);
        setProdStatus(true);
        setProdHasVariations(false);
        setProdIsHomeTreat(false);
        setProdBasePrice(0.00);
        setProdBaseWeight('');
        setProdRelatedIds([]);
        setProdVariations([]);
        setProdCategoryPickerOpen(false);
        setProdFormOpen(true);
    };

    const handleEditProductClick = async (prod) => {
        await fetchProductFormCategories();
        setProdEditId(prod.id);
        setProdCategoryId(prod.category_id);
        setProdName(prod.name);
        setProdDescription(prod.description || '');
        setProdIngredients(prod.ingredients || '');
        
        const loadedImages = prod.images && prod.images.length > 0 ? prod.images.map(img => img.url) : [''];
        setProdImages(loadedImages);
        setProdImageFiles([]);

        setProdStatus(prod.status);
        setProdHasVariations(prod.has_variations);
        setProdIsHomeTreat(!!prod.is_home_treat);
        setProdBasePrice(parseFloat(prod.base_price || 0));
        setProdBaseWeight(prod.base_weight || '');
        setProdRelatedIds(prod.related_products ? prod.related_products.map(rp => rp.id) : []);
        
        const variationsMapped = (prod.variations || []).map(v => ({
            ...v,
            image: v.images && v.images.length > 0 ? v.images[0].url : '',
            imageFile: null,
            imagePreview: v.images && v.images.length > 0 ? resolveStoredImageUrl(v.images[0].url) : ''
        }));
        setProdVariations(variationsMapped);
        setProdCategoryPickerOpen(false);

        setProdFormOpen(true);
    };

    const handleDeleteProduct = async (prodId) => {
        if (!confirm('Move this product to Trash? You can restore it later from the Trash tab.')) return;
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch(`/api/admin/products/${prodId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage('Product moved to Trash.');
                clearStorefrontCatalogCache();
                fetchData();
            } else {
                setError(getApiErrorMessage(d, 'Failed to delete product.'));
            }
        } catch (err) {
            console.error(err);
            setError('Failed to delete product.');
        }
    };

    const handleToggleProductStatus = async (product) => {
        const newStatus = !product.status;
        setTogglingProductId(product.id);

        // Optimistically update product status in table and summary counts
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
        setProductSummary(prev => ({
            ...prev,
            active: newStatus ? (prev.active + 1) : Math.max(0, prev.active - 1),
            inactive: newStatus ? Math.max(0, prev.inactive - 1) : (prev.inactive + 1),
        }));

        try {
            const res = await fetch(`/api/admin/products/${product.id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const d = await res.json();
            if (d.success) {
                toast.success(`"${product.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
                clearStorefrontCatalogCache();
            } else {
                // Rollback on failure
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: product.status } : p));
                toast.error(getApiErrorMessage(d, 'Failed to update product status.'));
                fetchData();
            }
        } catch (err) {
            console.error(err);
            // Rollback on network error
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: product.status } : p));
            toast.error('Network error updating product status.');
            fetchData();
        } finally {
            setTogglingProductId(null);
        }
    };

    const handleAddVariationField = () => {
        setProdVariations([...prodVariations, { name: '', price: 0.00, weight: '', sku: '', stock: '', image: '', imageFile: null, imagePreview: '' }]);
    };

    const handleRemoveVariationField = (idx) => {
        setProdVariations(prev => {
            const next = prev.filter((_, i) => i !== idx);
            const removed = prev[idx];
            if (removed?.imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(removed.imagePreview);
            }
            return next;
        });
    };

    const handleVariationChange = (idx, field, val) => {
        setProdVariations(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
    };

    const handleVariationImageChange = (idx, file) => {
        setProdVariations(prev => prev.map((v, i) => {
            if (i !== idx) return v;
            const nextPreview = file ? URL.createObjectURL(file) : (v.image ? resolveStoredImageUrl(v.image) : '');
            if (v.imagePreview && v.imagePreview.startsWith('blob:') && v.imagePreview !== nextPreview) {
                URL.revokeObjectURL(v.imagePreview);
            }
            return {
                ...v,
                imageFile: file || null,
                imagePreview: nextPreview,
            };
        }));
    };

    const handleClearVariationImage = (idx) => {
        setProdVariations(prev => prev.map((v, i) => {
            if (i !== idx) return v;
            if (v.imagePreview && v.imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(v.imagePreview);
            }
            return {
                ...v,
                image: '',
                imageFile: null,
                imagePreview: '',
            };
        }));
    };

    const handleRelatedProductToggle = (id) => {
        setProdRelatedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const [savingSection, setSavingSection] = useState(null);

    // Save Specific Settings Section
    const handleSaveSection = async (sectionKeys, sectionName) => {
        setSavingSection(sectionName);
        setError(null);
        setSuccessMessage(null);

        const payload = new FormData();
        sectionKeys.forEach((key) => {
            if (key !== 'store_logo' && key !== 'store_logo_white' && key !== 'store_image' && key !== 'hero_bg_image' && key !== 'menu_pdf') {
                payload.append(`configs[${key}]`, settingsForm[key] || '');
            }
        });

        if (sectionKeys.includes('store_logo') && storeLogoFile) {
            payload.append('store_logo', storeLogoFile);
        }
        if (sectionKeys.includes('store_logo_white') && storeLogoWhiteFile) {
            payload.append('store_logo_white', storeLogoWhiteFile);
        }
        if (sectionKeys.includes('store_image') && storeImageFile) {
            payload.append('store_image', storeImageFile);
        }
        if (sectionKeys.includes('hero_bg_image')) {
            if (heroBgImageFile) {
                payload.append('hero_bg_image', heroBgImageFile);
            } else if (settingsForm.hero_bg_image !== undefined) {
                payload.append('configs[hero_bg_image]', settingsForm.hero_bg_image || '');
            }
        }
        if (sectionKeys.includes('menu_pdf')) {
            if (menuPdfFile) {
                payload.append('menu_pdf', menuPdfFile);
            } else if (settingsForm.menu_pdf !== undefined) {
                payload.append('configs[menu_pdf]', settingsForm.menu_pdf || '');
            }
        }

        try {
            const res = await fetch('/api/admin/configs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: payload
            });
            const d = await res.json();
            if (d.success) {
                toast.success(`${sectionName} saved successfully!`);
                setSettings(d.data);
                setSettingsForm(d.data);
                if (sectionKeys.includes('store_logo')) setStoreLogoFile(null);
                if (sectionKeys.includes('store_logo_white')) setStoreLogoWhiteFile(null);
                if (sectionKeys.includes('store_image')) setStoreImageFile(null);
                if (sectionKeys.includes('hero_bg_image')) setHeroBgImageFile(null);
                if (sectionKeys.includes('menu_pdf')) setMenuPdfFile(null);
            } else {
                toast.error(d.message || `Failed to save ${sectionName}`);
            }
        } catch (err) {
            console.error(`Error saving ${sectionName}:`, err);
            toast.error(`Error saving ${sectionName}`);
        } finally {
            setSavingSection(null);
        }
    };

    const [testingPaymentProvider, setTestingPaymentProvider] = useState(null);

    const handleTestPaymentConnection = async (provider) => {
        setTestingPaymentProvider(provider);
        try {
            const body = { provider };
            if (provider === 'globalpay') {
                body.globalpay_app_id = settingsForm.globalpay_app_id;
                body.globalpay_app_key = settingsForm.globalpay_app_key;
            } else if (provider === 'stripe') {
                body.stripe_secret_key = settingsForm.stripe_secret_key;
            }

            const res = await fetch('/api/admin/payment/test-connection', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Successfully connected to ${provider === 'globalpay' ? 'Global Payments' : 'Stripe'}!`);
            } else {
                toast.error(data.message || `Failed to connect to ${provider === 'globalpay' ? 'Global Payments' : 'Stripe'}`);
            }
        } catch (err) {
            console.error('Error testing payment connection:', err);
            toast.error('Connection test failed');
        } finally {
            setTestingPaymentProvider(null);
        }
    };

    // Save Settings Config
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const payload = new FormData();
        Object.entries(settingsForm).forEach(([key, val]) => {
            if (key !== 'store_logo' && key !== 'store_logo_white' && key !== 'store_image' && key !== 'hero_bg_image' && key !== 'menu_pdf') {
                payload.append(`configs[${key}]`, val || '');
            }
        });
        if (storeLogoFile) {
            payload.append('store_logo', storeLogoFile);
        }
        if (storeLogoWhiteFile) {
            payload.append('store_logo_white', storeLogoWhiteFile);
        }
        if (storeImageFile) {
            payload.append('store_image', storeImageFile);
        }
        if (heroBgImageFile) {
            payload.append('hero_bg_image', heroBgImageFile);
        } else if (settingsForm.hero_bg_image !== undefined) {
            payload.append('configs[hero_bg_image]', settingsForm.hero_bg_image || '');
        }
        if (menuPdfFile) {
            payload.append('menu_pdf', menuPdfFile);
        } else if (settingsForm.menu_pdf !== undefined) {
            payload.append('configs[menu_pdf]', settingsForm.menu_pdf || '');
        }

        try {
            const res = await fetch('/api/admin/configs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: payload
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage('Store settings saved successfully.');
                setSettings(d.data);
                setSettingsForm(d.data);
                setStoreLogoFile(null);
                setStoreLogoWhiteFile(null);
                setStoreImageFile(null);
                setHeroBgImageFile(null);
                setMenuPdfFile(null);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save configs settings.');
        }
    };

    // Save FAQ (Create or Update)
    const handleSaveFaq = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const method = faqEditId ? 'PUT' : 'POST';
        const url = faqEditId ? `/api/admin/faqs/${faqEditId}` : '/api/admin/faqs';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: faqQuestion,
                    answer: faqAnswer,
                    sort_order: faqSortOrder,
                    is_active: faqIsActive
                })
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage(faqEditId ? 'FAQ updated successfully.' : 'FAQ created successfully.');
                setFaqFormOpen(false);
                setFaqEditId(null);
                setFaqQuestion('');
                setFaqAnswer('');
                setFaqSortOrder(0);
                setFaqIsActive(true);
                // Refresh FAQs list
                fetchData();
            } else {
                setError(d.message || 'Failed to save FAQ.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save FAQ.');
        }
    };

    // Delete FAQ
    const handleDeleteFaq = async (id) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch(`/api/admin/faqs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const d = await res.json();
            if (d.success) {
                setSuccessMessage('FAQ deleted successfully.');
                fetchData();
            } else {
                setError(d.message || 'Failed to delete FAQ.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to delete FAQ.');
        }
    };

    const handleLogout = () => {
        logout('admin');
        navigate('/');
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            });
            const d = await res.json();
            if (d.success) {
                login(token, d.data, 'admin');
                setSuccessMessage('Profile updated successfully.');
            } else {
                setError(d.message || 'Failed to update profile.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update profile.');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch('/api/admin/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordForm)
            });
            const d = await res.json();
            if (d.success) {
                setPasswordForm({
                    current_password: '',
                    password: '',
                    password_confirmation: '',
                });
                setSuccessMessage('Password changed successfully.');
            } else {
                setError(d.message || 'Failed to change password.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to change password.');
        }
    };

    // Pagination, Search & Filter for Categories
    const filteredCategories = categories.filter(c => {
        const matchesQuery = c.name.toLowerCase().includes(catQuery.toLowerCase());
        const matchesStatus = 
            catStatusFilter === 'all' ? true : 
            catStatusFilter === 'active' ? (c.status === true || c.status === 1) : 
            (c.status === false || c.status === 0);
        return matchesQuery && matchesStatus;
    });
    const catPerPage = 20;
    const totalCatPages = Math.ceil(filteredCategories.length / catPerPage);
    const indexOfLastCat = catCurrentPage * catPerPage;
    const indexOfFirstCat = indexOfLastCat - catPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstCat, indexOfLastCat);

    // Reset pagination to first page when search or status filters change
    useEffect(() => {
        setCatCurrentPage(1);
    }, [catQuery, catStatusFilter]);

    useEffect(() => {
        if (catCurrentPage > totalCatPages && totalCatPages > 0) {
            setCatCurrentPage(totalCatPages);
        }
    }, [filteredCategories.length, totalCatPages]);

    const productCategoryOptions = categories.length > 0
        ? categories
        : Array.from(
            products.reduce((map, product) => {
                if (product.category?.id && product.category?.name) {
                    map.set(product.category.id, product.category);
                }
                return map;
            }, new Map()).values()
        ).sort((a, b) => a.name.localeCompare(b.name));
    const selectedProductCategory = categories.find(category => String(category.id) === String(prodCategoryId));

    useEffect(() => {
        if (prodCurrentPage > productMeta.last_page && productMeta.last_page > 0) {
            setProdCurrentPage(productMeta.last_page);
        }
    }, [prodCurrentPage, productMeta.last_page]);

    const formatCurrency = (value) => `£${parseFloat(value || 0).toFixed(2)}`;
    const exportReportsCsv = async () => {
        if (!reports) return;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        try {
            const res = await fetch('/api/admin/orders', { headers });
            const d = await res.json();
            if (!d.success) {
                toast.error('Failed to fetch sales data for export.');
                return;
            }
            
            const allOrders = d.data || [];
            const startStr = reports.report_range?.start; // YYYY-MM-DD
            const endStr = reports.report_range?.end;     // YYYY-MM-DD

            // Timezone-safe string date comparison
            const salesOrders = allOrders.filter(o => {
                if (!o.created_at) return false;
                const orderDateStr = o.created_at.substring(0, 10);
                return orderDateStr >= startStr && orderDateStr <= endStr;
            });

            const totalAmount = salesOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

            const rows = [
                ['Sales Report', `${startStr} to ${endStr}`],
                [],
                ['Order Number', 'Date & Time', 'Customer', 'Type', 'Items', 'Total'],
            ];

            salesOrders.forEach(o => {
                const itemsSummary = (o.items || [])
                    .map(item => `${item.quantity}x ${item.product_name}${item.variation_name ? ` (${item.variation_name})` : ''}${item.category ? ` [${item.category}]` : ''}`)
                    .join('; ');

                const customerName = o.customer 
                    ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim()
                    : 'Guest';

                rows.push([
                    o.order_number,
                    formatDateTime(o.created_at),
                    customerName,
                    o.type === 'delivery' ? 'Delivery' : 'Collection',
                    itemsSummary,
                    `£${parseFloat(o.total || 0).toFixed(2)}`
                ]);
            });

            // Add totals in the last row
            rows.push([
                'Total',
                '',
                '',
                '',
                '',
                `£${totalAmount.toFixed(2)}`
            ]);

            const csv = rows
                .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
                .join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sales-report-${startStr}-${endStr}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            toast.error('Connection failed. Could not export report.');
        }
    };
    const formatDateTime = (value) => {
        if (!value) return 'Not scheduled';
        const parsed = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const formatNotificationTime = (value) => {
        if (!value) return '';
        const parsed = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(parsed.getTime())) return '';
        return parsed.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const formatTrashDate = (value) => {
        if (!value) return 'Unknown';
        const parsed = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(parsed.getTime())) return 'Unknown';
        return parsed.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
        disputed: { label: 'Disputed / Chargeback', classes: 'bg-rose-100 text-rose-800 border-rose-300 font-bold' },
        refunded: { label: 'Refunded', classes: 'bg-purple-50 text-purple-700 border-purple-100' },
        chargeback: { label: 'Chargeback', classes: 'bg-red-100 text-red-800 border-red-200' },
    };
    const filteredOrders = orders.filter(order => {
        const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim();
        const searchTarget = [
            order.order_number,
            customerName,
            order.customer?.phone,
            order.customer?.email,
            order.delivery_address?.postcode,
        ].filter(Boolean).join(' ').toLowerCase();
        const matchesQuery = searchTarget.includes(orderQuery.toLowerCase());
        const matchesStatus = orderStatusFilter === 'all'
            ? true
            : orderStatusFilter === 'active'
                ? ['pending', 'preparing', 'ready'].includes(order.status)
                : orderStatusFilter === 'incomplete'
                    ? (order.status === 'awaiting_payment' || (order.status === 'cancelled' && ['unpaid', 'failed'].includes(order.payment_status)))
                    : order.status === orderStatusFilter;
        const matchesType = orderTypeFilter === 'all' ? true : order.type === orderTypeFilter;
        const matchesPayment = orderPaymentFilter === 'all' ? true : order.payment_status === orderPaymentFilter;
        return matchesQuery && matchesStatus && matchesType && matchesPayment;
    });
    const orderSummary = {
        active: orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length,
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        unpaid: orders.filter(o => o.payment_status === 'unpaid').length,
        delivery: orders.filter(o => o.type === 'delivery').length,
        collection: orders.filter(o => o.type === 'collection').length,
        dine_in: orders.filter(o => o.type === 'dine_in').length,
    };
    const groupedOrders = filteredOrders.reduce((groups, order) => {
        let key = order.status;
        if (orderGroupMode === 'type') key = order.type;
        if (orderGroupMode === 'payment') key = order.payment_status;
        if (!groups[key]) groups[key] = [];
        groups[key].push(order);
        return groups;
    }, {});
    const orderGroupLabels = {
        pending: 'Pending Orders',
        preparing: 'In Preparation',
        ready: 'Ready Orders',
        completed: 'Completed Orders',
        cancelled: 'Cancelled Orders',
        delivery: 'Home Delivery',
        collection: 'Store Collection',
        dine_in: 'Dine-In Table Orders',
        unpaid: 'Unpaid Orders',
        paid: 'Paid Orders',
        failed: 'Failed Payments',
    };
    const adminDisplayName = user?.name || 'Admin Manager';
    const adminRole = 'Store Admin';
    const activeOrderNotifications = orders.length > 0
        ? orderSummary.active
        : reports
        ? (reports.orders_count.pending || 0) + (reports.orders_count.preparing || 0) + (reports.orders_count.ready || 0)
        : 0;
    const unpaidNotifications = orders.length > 0 ? orderSummary.unpaid : 0;
    const notificationTotal = unreadNotificationCount;
    const currentSectionLabel = {
        dashboard: 'Dashboard',
        orders: 'Orders',
        customers: 'Customers',
        categories: 'Categories',
        products: 'Products',
        reports: 'Reports',
        newsletter: 'Newsletter',
        reviews: 'Local Love Reviews',
        profile: 'Admin Profile',
        settings: 'Store Configs',
        trash: 'Trash Bin',
        collectionSlots: 'Collection Slots',
        tables: 'Tables & QR Ordering',
        printers: 'Cloud Printers & Queue',
    }[activeTab] || 'Dashboard';
    const trashCount = (trash.categories?.length || 0) + (trash.products?.length || 0) + (trash.customers?.length || 0);
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
                { id: 'orders', label: 'Orders', icon: <ReceiptText size={16} />, badge: orderSummary.active || null, badgeTone: 'amber' },
                { id: 'tables', label: 'Tables & QR', icon: <UtensilsCrossed size={16} /> },
                { id: 'printers', label: 'Cloud Printers', icon: <Receipt size={16} /> },
                { id: 'collectionSlots', label: 'Collection Slots', icon: <CalendarClock size={16} /> },
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
                { id: 'customers', label: 'Customers', icon: <UserCheck size={16} />, badge: customers.length || reports?.total_customers || null },
            ],
        },
        {
            label: 'Content',
            items: [
                { id: 'reviews', label: 'Local Love Reviews', icon: <Heart size={16} /> },
            ],
        },
        {
            label: 'System',
            items: [
                { id: 'settings', label: 'Settings', icon: <SlidersHorizontal size={16} /> },
                { id: 'trash', label: 'Trash', icon: <ArchiveRestore size={16} />, badge: trashCount || null, badgeTone: 'red' },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-canvas text-primary font-sans flex">
            <AdminSidebar
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed(prev => !prev)}
                activeTab={activeTab}
                onTabChange={(tab) => {
                    navigate(adminPathByTab[tab] || '/admin');
                    setActiveTab(tab);
                    setCatFormOpen(false);
                    setProdFormOpen(false);
                }}
                onLogout={handleLogout}
                sections={sidebarSections}
                adminDisplayName={adminDisplayName}
                userEmail={user?.email || 'admin@sweetspot.co.uk'}
                adminRole={adminRole}
            />

            <main className="flex-grow max-h-screen overflow-y-auto w-full bg-canvas">
                <AdminTopbar
                    sectionLabel={currentSectionLabel}
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
                    onRefresh={fetchData}
                    onOpenOrders={() => {
                        navigate('/admin/orders');
                        setActiveTab('orders');
                        setOrderStatusFilter('active');
                        setOrderGroupMode('status');
                    }}
                    onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                    onClearAllNotifications={handleClearAllNotifications}
                    onDeleteNotification={handleDeleteNotification}
                    onOpenProfile={() => navigate('/admin/profile')}
                    onLogout={handleLogout}
                    onNotificationClick={handleNotificationClick}
                    formatNotificationTime={formatNotificationTime}
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        navigate(adminPathByTab[tab] || '/admin');
                        setActiveTab(tab);
                        setCatFormOpen(false);
                        setProdFormOpen(false);
                    }}
                    orderSummary={orderSummary}
                    onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
                />

                <div className="pt-2 px-2.5 sm:pl-0 sm:pr-2.5 lg:pr-3 pb-8">
                {loading && !catFormOpen && !prodFormOpen ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : (
                    <>
                        {/* 1. DASHBOARD OVERVIEW TAB */}
                        {activeTab === 'dashboard' && reports && (() => {
                            const hour = new Date().getHours();
                            let greeting = "Good morning";
                            if (hour >= 12 && hour < 17) greeting = "Good afternoon";
                            else if (hour >= 17) greeting = "Good evening";
                            const totalOrders = reports.orders_count.pending + reports.orders_count.preparing + reports.orders_count.ready + reports.orders_count.completed + (reports.orders_count.cancelled || 0);
                            const activeOrdersCount = reports.orders_count.pending + reports.orders_count.preparing + reports.orders_count.ready;
                            const fulfillmentTotal = (reports.fulfillment_split?.delivery || 0) + (reports.fulfillment_split?.collection || 0) + (reports.fulfillment_split?.dine_in || 0);

                            const statusConfigs = {
                                pending:   { label: 'Pending Payment', color: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
                                preparing: { label: 'Baking / Prep',   color: 'bg-orange-400', pill: 'bg-orange-50 text-orange-700 border-orange-200' },
                                ready:     { label: 'Ready for Pickup', color: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                                completed: { label: 'Fulfilled', color: 'bg-stone-300', pill: 'bg-stone-100 text-stone-600 border-stone-200' },
                                cancelled: { label: 'Cancelled', color: 'bg-rose-300',  pill: 'bg-rose-50 text-rose-700 border-rose-200' },
                            };

                            return (
                                <div className="space-y-6 pb-10">
                                    {/* Atelier Hero Command Banner */}
                                    <div className="relative overflow-hidden rounded-xl bg-primary text-white p-6 md:p-8 shadow-sm border border-stone-200/40">
                                        {/* Background subtle art glow */}
                                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
                                        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-accent/15 rounded-full blur-2xl pointer-events-none" />

                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                            <div className="space-y-2 max-w-xl">
                                                <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-black tracking-tight text-white leading-tight">
                                                    {greeting}, {user?.name?.split(' ')[0] || 'Atelier Master'}
                                                </h1>
                                                <p className="text-xs md:text-sm text-stone-300 font-light leading-relaxed">
                                                    Your kitchen is live. Currently tracking{' '}
                                                    <span className="font-semibold text-accent">{reports.today_orders || 0} order{reports.today_orders !== 1 ? 's' : ''}</span>{' '}
                                                    today across UK Deliveries, Store Collections, and Dine-In QR tables.
                                                </p>
                                            </div>

                                            {/* Quick Operational Shortcuts */}
                                            <div className="flex flex-wrap md:flex-col lg:flex-row gap-3 shrink-0">
                                                <button
                                                    onClick={() => setActiveTab('tables')}
                                                    className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover active:scale-98 text-white text-xs font-bold tracking-tight transition-all duration-200 flex items-center gap-2 shadow-xs cursor-pointer hover:-translate-y-0.5"
                                                >
                                                    <QrCode size={14} className="stroke-[2.5]" />
                                                    <span>Table QR Floorplan</span>
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('printers')}
                                                    className="px-4 py-2.5 rounded-xl bg-primary-light hover:bg-primary-hover active:scale-98 text-white border border-white/10 text-xs font-bold tracking-tight transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xs hover:-translate-y-0.5"
                                                >
                                                    <Printer size={14} className="text-accent" />
                                                    <span>Star TSP100 CloudPRNT</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Urgent Orders Alert Banner */}
                                    {activeOrdersCount > 0 && (
                                        <div
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary-light/70 border border-secondary/20 rounded-xl px-5 py-3.5 cursor-pointer hover:border-secondary/40 hover:shadow-xs transition-all duration-200"
                                            onClick={() => setActiveTab('orders')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-primary">
                                                        {activeOrdersCount} order{activeOrdersCount !== 1 ? 's' : ''} requiring live kitchen attention
                                                    </p>
                                                    <p className="text-[11px] text-stone-600 mt-0.5">
                                                        {reports.orders_count.pending > 0 && <span className="font-semibold text-secondary">• {reports.orders_count.pending} pending checkout </span>}
                                                        {reports.orders_count.preparing > 0 && <span className="font-semibold text-amber-700">• {reports.orders_count.preparing} baking in oven </span>}
                                                        {reports.orders_count.ready > 0 && <span className="font-semibold text-emerald-800">• {reports.orders_count.ready} packed & ready</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-secondary self-end sm:self-center shrink-0">
                                                <span>Review Orders Pipeline</span>
                                                <ArrowUpRight size={13} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Executive Atelier Metric Tiles */}
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                                        {[
                                            {
                                                label: "Today's Gross",
                                                value: `£${reports.today_sales.toFixed(2)}`,
                                                sub: `£${reports.this_week_sales?.toFixed(2) || '0.00'} this week`,
                                                icon: DollarSign,
                                                iconBg: 'bg-primary/10 text-primary',
                                            },
                                            {
                                                label: "Orders Today",
                                                value: reports.today_orders ?? 0,
                                                sub: reports.today_orders > 0 ? 'Orders received' : 'No orders yet',
                                                icon: ClipboardList,
                                                iconBg: 'bg-secondary/15 text-secondary',
                                            },
                                            {
                                                label: 'Pending',
                                                value: reports.orders_count.pending,
                                                sub: 'Awaiting queue',
                                                icon: Clock,
                                                iconBg: 'bg-amber-100 text-amber-800',
                                            },
                                            {
                                                label: 'In The Oven',
                                                value: reports.orders_count.preparing,
                                                sub: 'Active preparation',
                                                icon: Flame,
                                                iconBg: 'bg-sky-100 text-sky-800',
                                            },
                                            {
                                                label: 'Ready / Dispatch',
                                                value: reports.orders_count.ready,
                                                sub: 'Ready for handoff',
                                                icon: CheckCircle2,
                                                iconBg: 'bg-emerald-100 text-emerald-800',
                                            },
                                            {
                                                label: 'Fulfilled',
                                                value: reports.orders_count.completed,
                                                sub: 'All-time volume',
                                                icon: Trophy,
                                                iconBg: 'bg-stone-100 text-stone-700',
                                            },
                                        ].map((card, i) => (
                                            <div
                                                key={card.label}
                                                className="bg-surface border border-stone-200/70 rounded-xl p-4 shadow-2xs hover:shadow-xs hover:border-primary/30 transition-all duration-200 flex flex-col justify-between group"
                                            >
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <span className="text-[9.5px] font-bold text-stone-400 uppercase tracking-wider">
                                                        {card.label}
                                                    </span>
                                                    <div className={`w-7 h-7 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                                                        <card.icon size={13} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-xl lg:text-[22px] font-black font-serif text-primary block tracking-tight group-hover:text-secondary transition-colors">
                                                        {card.value}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-stone-400 mt-0.5 block truncate">
                                                        {card.sub}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 3-Way Fulfilment Split Card */}
                                    <div className="bg-white border border-stone-200/70 rounded-xl p-5 md:p-6 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h2 className="text-xs font-black uppercase tracking-wider text-[#261B16]">
                                                        Fulfillment Channels
                                                    </h2>
                                                    <p className="text-[10.5px] text-stone-400 mt-0.5">3-Way split across dining formats</p>
                                                </div>
                                                <span className="text-[9.5px] font-black text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                                                    Triple-Channel
                                                </span>
                                            </div>

                                            {fulfillmentTotal === 0 ? (
                                                <p className="text-xs text-stone-400 text-center py-4">No fulfillment data recorded yet.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {[
                                                        { label: 'Home Delivery (Uber Direct)', key: 'delivery', icon: Truck, color: 'bg-[#261B16]', badgeBg: 'bg-stone-100 text-stone-800' },
                                                        { label: 'Store Collection', key: 'collection', icon: Store, color: 'bg-amber-600', badgeBg: 'bg-amber-50 text-amber-800' },
                                                        { label: 'Dine-In (Table QR)', key: 'dine_in', icon: QrCode, color: 'bg-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-800' },
                                                    ].map(f => {
                                                        const count = reports.fulfillment_split?.[f.key] || 0;
                                                        const pct = fulfillmentTotal > 0 ? Math.round((count / fulfillmentTotal) * 100) : 0;
                                                        return (
                                                            <div key={f.key} className="bg-[#FAF7F2]/60 border border-stone-200/50 rounded-lg p-3">
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                                                                        <f.icon size={13} className="text-amber-700 shrink-0" />
                                                                        {f.label}
                                                                    </span>
                                                                    <span className="text-xs font-black text-[#261B16]">
                                                                        {count}{' '}
                                                                        <span className="text-[10px] font-semibold text-stone-400">({pct}%)</span>
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                                                                    <div className={`${f.color} h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                                            <span>Real-time multichannel split: Home Delivery, Store Pickup & Dine-in QR scan</span>
                                            <span className="font-bold text-amber-700 cursor-pointer hover:underline" onClick={() => setActiveTab('tables')}>Manage Tables →</span>
                                        </div>
                                    </div>

                                    {/* Recent Live Kitchen Orders - Full Width */}
                                    <div className="bg-white border border-stone-200/70 rounded-xl shadow-xs overflow-hidden">
                                        <div className="px-5 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#FAF7F2]/40">
                                            <div>
                                                <h2 className="font-black text-[#261B16] text-xs uppercase tracking-wider">
                                                    Recent Kitchen Orders
                                                </h2>
                                                <p className="text-[10.5px] text-stone-400 mt-0.5">Live feed of orders entering the atelier</p>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('orders')}
                                                className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                                            >
                                                <span>Open Full Order Queue</span>
                                                <ArrowUpRight size={13} />
                                            </button>
                                        </div>

                                        {!reports.recent_orders?.length ? (
                                            <div className="py-14 text-center text-stone-400 text-xs">
                                                <ClipboardList size={28} className="mx-auto text-stone-300 mb-2" />
                                                No orders placed yet today.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead>
                                                        <tr className="bg-[#FAF7F2]/80 text-stone-400 uppercase tracking-widest font-extrabold text-[9px] border-b border-stone-100">
                                                            <th className="py-3 px-5">Order ID</th>
                                                            <th className="py-3 px-5">Customer</th>
                                                            <th className="py-3 px-5">Fulfillment Format</th>
                                                            <th className="py-3 px-5">Total Amount</th>
                                                            <th className="py-3 px-5">Order Status</th>
                                                            <th className="py-3 px-5 text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-stone-100/70">
                                                        {reports.recent_orders.map((o, idx) => {
                                                            const cfg = statusConfigs[o.status] || { pill: 'bg-stone-100 text-stone-600 border-stone-200', label: o.status };
                                                            return (
                                                                <tr
                                                                    key={idx}
                                                                    onClick={() => navigate(`/admin/orders/${o.order_number}`)}
                                                                    className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                                                                >
                                                                    <td className="py-3.5 px-5 font-mono font-bold text-amber-900 text-[11.5px]">
                                                                        #{o.order_number}
                                                                    </td>
                                                                    <td className="py-3.5 px-5 font-semibold text-stone-800">
                                                                        {o.customer_name || 'Guest Diner'}
                                                                    </td>
                                                                    <td className="py-3.5 px-5">
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-stone-200/60 text-[10.5px] font-bold text-stone-700">
                                                                            {o.type === 'delivery' ? (
                                                                                <><Truck size={12} className="text-amber-700" /><span>Home Delivery</span></>
                                                                            ) : o.type === 'dine_in' ? (
                                                                                <><QrCode size={12} className="text-emerald-700" /><span>Table Dine-In</span></>
                                                                            ) : (
                                                                                <><Store size={12} className="text-amber-700" /><span>Store Pickup</span></>
                                                                            )}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3.5 px-5 font-black font-serif text-[#261B16] text-[14px]">
                                                                        £{o.total.toFixed(2)}
                                                                    </td>
                                                                    <td className="py-3.5 px-5">
                                                                        <span className={`px-2.5 py-0.5 text-[9.5px] font-bold rounded-md border capitalize ${cfg.pill}`}>
                                                                            {cfg.label}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3.5 px-5 text-right">
                                                                        <span className="text-[11px] font-bold text-amber-700 hover:text-amber-900">
                                                                            View Details →
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Best Selling Treats - Bottom Shelf */}
                                    {reports.top_products?.length > 0 && (
                                        <div className="bg-white border border-stone-200/70 rounded-xl p-5 shadow-xs">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h2 className="font-black text-[#261B16] text-xs uppercase tracking-wider flex items-center gap-1.5">
                                                        <Trophy size={13} className="text-amber-600" />
                                                        <span>Best-Selling Treats</span>
                                                    </h2>
                                                    <p className="text-[10px] text-stone-400 mt-0.5">Customer favorites & top performers</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                                    Top {reports.top_products.length}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {reports.top_products.map((p, idx) => (
                                                    <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#FAF7F2]/60 border border-stone-200/50 hover:bg-[#FAF7F2] transition-colors">
                                                        <span className="text-[11px] font-serif font-black text-amber-800 bg-amber-100/80 w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                                                            #{idx + 1}
                                                        </span>
                                                        <div className="flex-grow min-w-0">
                                                            <p className="text-xs font-bold text-stone-800 truncate">{p.name}</p>
                                                            <p className="text-[10px] text-stone-400 font-medium">{p.total_qty} sold · £{parseFloat(p.revenue).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}


                        {/* 1B. REPORTS TAB */}
                        {activeTab === 'reports' && reports && (() => {
                            const period = reports.period || {};
                            const trend = reports.sales_trend || [];
                            const maxTrendSales = Math.max(...trend.map(item => parseFloat(item.sales || 0)), 1);
                            const categoryRows = reports.period_sales_by_category || reports.sales_by_category || [];
                            const topProductRows = reports.period_top_products || reports.top_products || [];
                            const salesItemRows = reports.period_sales_items || [];
                            const maxCategorySales = Math.max(...categoryRows.map(item => parseFloat(item.total || 0)), 1);
                            const collectionRows = reports.collection_hours || [];
                            const maxCollectionCount = Math.max(...collectionRows.map(item => parseInt(item.count || 0, 10)), 1);
                            const fulfillmentTotal = (period.fulfillment_split?.delivery || 0) + (period.fulfillment_split?.collection || 0) + (period.fulfillment_split?.dine_in || 0);

                            const rangeOptions = [
                                { id: 'today', label: 'Today' },
                                { id: '7d', label: '7 Days' },
                                { id: '30d', label: '30 Days' },
                                { id: 'month', label: 'This Month' },
                                { id: 'custom', label: 'Custom' },
                            ];

                            return (
                                <div className="space-y-4">
                                    <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-[#C5A880] uppercase tracking-widest mb-0.5">Business Intelligence</p>
                                            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Reports</h1>
                                            <p className="text-[11px] text-neutral-500 mt-0.5">
                                                Real sales, order, payment, and fulfilment analytics for {reports.report_range?.label || 'selected range'}.
                                            </p>
                                        </div>

                                        <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
                                            <div className="flex flex-wrap gap-1 bg-white border border-neutral-200 rounded-xl p-1">
                                                {rangeOptions.map(option => (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        onClick={() => setReportRange(option.id)}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                                                            reportRange === option.id
                                                                ? 'bg-primary text-white'
                                                                : 'text-neutral-500 hover:bg-neutral-50'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={exportReportsCsv}
                                                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                            >
                                                Export CSV
                                            </button>
                                        </div>
                                    </div>

                                    {reportRange === 'custom' && (
                                        <div className="bg-white border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row gap-3 sm:items-center">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={reportStartDate}
                                                    onChange={(e) => setReportStartDate(e.target.value)}
                                                    className="bg-neutral-50 border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    value={reportEndDate}
                                                    onChange={(e) => setReportEndDate(e.target.value)}
                                                    className="bg-neutral-50 border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3">
                                        {[
                                            { label: 'Revenue', value: formatCurrency(period.sales), sub: `${period.paid_orders || 0} paid` },
                                            { label: 'Orders', value: period.orders || 0, sub: `${period.unpaid_orders || 0} unpaid · ${period.failed_orders || 0} failed` },
                                            { label: 'Avg Order Value', value: formatCurrency(period.average_order_value), sub: 'Paid orders only' },
                                            { label: 'Items Sold', value: period.items_sold || 0, sub: `${period.unique_items_sold || 0} unique items` },
                                            { label: 'Fulfilment Rate', value: `${period.fulfillment_rate || 0}%`, sub: `${period.cancel_rate || 0}% cancelled` },
                                        ].map(card => (
                                            <div key={card.label} className="bg-white border border-neutral-200 rounded-xl px-4 py-3 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">{card.label}</span>
                                                    <span className="text-[10px] text-neutral-400 truncate max-w-[90px] text-right">{card.sub}</span>
                                                </div>
                                                <span className="text-2xl font-black text-neutral-900 block mt-1">{card.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                        <div className="xl:col-span-3 bg-white border border-neutral-200 rounded-xl shadow-sm p-4">
                                            <div className="flex items-center justify-between gap-4 mb-5">
                                                <div>
                                                    <h2 className="text-sm font-bold text-neutral-900">Sales Trend</h2>
                                                    <p className="text-[11px] text-neutral-400 mt-0.5">{reports.report_range?.start} to {reports.report_range?.end}</p>
                                                </div>
                                                <span className="text-xs font-black text-neutral-900">{formatCurrency(period.sales)}</span>
                                            </div>
                                            {trend.length === 0 ? (
                                                <div className="h-56 flex items-center justify-center text-xs text-neutral-400">No trend data for this range.</div>
                                            ) : (
                                                <div className="h-56 flex items-end justify-between gap-1.5 pt-4">
                                                    {trend.map((item, idx) => {
                                                        const height = Math.max((parseFloat(item.sales || 0) / maxTrendSales) * 100, item.sales > 0 ? 6 : 2);
                                                        const showLabel = trend.length <= 12 || idx === 0 || idx === trend.length - 1 || idx % Math.ceil(trend.length / 6) === 0;
                                                        return (
                                                            <div key={item.date} className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
                                                                <div
                                                                    className="w-full bg-neutral-900 rounded-t hover:bg-[#C5A880] transition-colors"
                                                                    style={{ height: `${height}%` }}
                                                                    title={`${item.label}: ${formatCurrency(item.sales)} · ${item.orders} orders`}
                                                                />
                                                                <span className="text-[8px] text-neutral-400 font-bold truncate w-full text-center">{showLabel ? item.label : ''}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                         </div>
                                     </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                                        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
                                            <h2 className="text-sm font-bold text-neutral-900 mb-4">Fulfilment Split</h2>
                                            {fulfillmentTotal === 0 ? (
                                                <p className="text-xs text-neutral-400 py-6 text-center">No fulfilment data for this range.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {[
                                                        { label: 'Delivery', count: period.fulfillment_split?.delivery || 0, color: 'bg-neutral-900' },
                                                        { label: 'Collection', count: period.fulfillment_split?.collection || 0, color: 'bg-amber-600' },
                                                        { label: 'Dine-In Table', count: period.fulfillment_split?.dine_in || 0, color: 'bg-emerald-600' },
                                                    ].map(item => {
                                                        const pct = Math.round((item.count / fulfillmentTotal) * 100);
                                                        return (
                                                            <div key={item.label}>
                                                                <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1.5">
                                                                    <span>{item.label}</span>
                                                                    <span>{item.count} <span className="text-neutral-400 font-normal">({pct}%)</span></span>
                                                                </div>
                                                                <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                                                                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
                                            <h2 className="text-sm font-bold text-neutral-900 mb-4">Popular Collection Hours</h2>
                                            {collectionRows.length === 0 ? (
                                                <p className="text-xs text-neutral-400 py-6 text-center">No collection bookings for this range.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {collectionRows.map(item => {
                                                        const pct = Math.round((parseInt(item.count || 0, 10) / maxCollectionCount) * 100);
                                                        return (
                                                            <div key={item.slot}>
                                                                <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1.5">
                                                                    <span>{item.slot}</span>
                                                                    <span>{item.count} bookings</span>
                                                                </div>
                                                                <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                                                                    <div className="bg-neutral-900 h-full rounded-full" style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
                                            <h2 className="text-sm font-bold text-neutral-900 mb-4">Top Products</h2>
                                            {topProductRows.length === 0 ? (
                                                <p className="text-xs text-neutral-400 py-6 text-center">No product sales for this range.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {topProductRows.map((product, idx) => (
                                                        <div key={product.name} className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-neutral-300 w-5">#{idx + 1}</span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-bold text-neutral-800 truncate">{product.name}</p>
                                                                <p className="text-[10px] text-neutral-400">{product.total_qty} sold · {formatCurrency(product.revenue)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <h2 className="text-sm font-bold text-neutral-900">Revenue by Category</h2>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{categoryRows.length} categories</span>
                                        </div>
                                        {categoryRows.length === 0 ? (
                                            <p className="text-xs text-neutral-400 py-6 text-center">No category revenue for this range.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {categoryRows.map(item => {
                                                    const pct = Math.round((parseFloat(item.total || 0) / maxCategorySales) * 100);
                                                    return (
                                                        <div key={item.category}>
                                                            <div className="flex justify-between mb-1.5 text-xs">
                                                                <span className="font-bold text-neutral-700">{item.category}</span>
                                                                <span className="font-black text-neutral-900">{formatCurrency(item.total)}</span>
                                                            </div>
                                                            <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                                                                <div className="bg-neutral-900 h-full rounded-full" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <p className="text-[10px] text-neutral-400 mt-1">{item.order_count} order{item.order_count === 1 ? '' : 's'}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <h2 className="text-sm font-bold text-neutral-900">Sales Report</h2>
                                                <p className="text-[11px] text-neutral-400 mt-0.5">Item-level quantity and revenue for the selected range.</p>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{salesItemRows.length} rows</span>
                                        </div>

                                        {salesItemRows.length === 0 ? (
                                            <p className="text-xs text-neutral-400 py-10 text-center">No paid item sales for this range.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider font-bold text-[10px] border-b border-neutral-100">
                                                            <th className="py-3 px-5 text-left">Item</th>
                                                            <th className="py-3 px-5 text-left">Category</th>
                                                            <th className="py-3 px-5 text-right">Qty Sold</th>
                                                            <th className="py-3 px-5 text-right">Revenue</th>
                                                            <th className="py-3 px-5 text-right">Avg Unit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-100">
                                                        {salesItemRows.map((item, idx) => (
                                                            <tr key={`${item.product_id}-${item.product_variation_id || 'base'}-${idx}`} className="hover:bg-neutral-50/60 transition-colors">
                                                                <td className="py-3.5 px-5 min-w-64">
                                                                    <p className="font-bold text-neutral-800">{item.product_name}</p>
                                                                    {item.variation_name && (
                                                                        <p className="text-[10px] text-neutral-400 mt-0.5">{item.variation_name}</p>
                                                                    )}
                                                                </td>
                                                                <td className="py-3.5 px-5 text-neutral-500">{item.category || 'Uncategorised'}</td>
                                                                <td className="py-3.5 px-5 text-right font-black text-neutral-900">{item.quantity_sold || 0}</td>
                                                                <td className="py-3.5 px-5 text-right font-black text-neutral-900">{formatCurrency(item.revenue)}</td>
                                                                <td className="py-3.5 px-5 text-right text-neutral-600">{formatCurrency(item.average_unit_price)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 2. ORDERS GRID TAB */}
                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-[#C5A880] uppercase tracking-widest mb-0.5">Order Operations</p>
                                        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Admin Order Dashboard</h1>
                                        <p className="text-[11px] text-neutral-500 mt-0.5">Review current workload, group orders, and update fulfilment or payment status.</p>
                                    </div>
                                    <div className="text-xs text-neutral-400">
                                        Showing <span className="font-black text-neutral-900">{filteredOrders.length}</span> of <span className="font-black text-neutral-900">{orders.length}</span> orders
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Active Queue', value: orderSummary.active, sub: 'Pending, preparing, ready' },
                                        { label: 'Needs Prep', value: orderSummary.pending, sub: 'New orders waiting' },
                                        { label: 'Ready', value: orderSummary.ready, sub: 'Awaiting handoff' },
                                        { label: 'Unpaid', value: orderSummary.unpaid, sub: 'Payment needs attention' },
                                    ].map(card => (
                                        <div key={card.label} className="bg-white border border-neutral-200 rounded-xl px-4 py-3 shadow-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">{card.label}</span>
                                                <span className="text-[10px] text-neutral-400 hidden sm:inline">{card.sub}</span>
                                            </div>
                                            <span className="text-2xl font-black text-neutral-900 block mt-1">{card.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-3.5 space-y-3">
                                    <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
                                        <div className="relative flex-grow max-w-xl">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                                            <input
                                                type="text"
                                                value={orderQuery}
                                                onChange={(e) => setOrderQuery(e.target.value)}
                                                placeholder="Search order ref, customer, phone, email, or postcode"
                                                className="w-full bg-white border border-neutral-300 pl-9 pr-9 py-2 text-xs text-neutral-850 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                            />
                                            {orderQuery && (
                                                <button
                                                    onClick={() => setOrderQuery('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-1 rounded-full hover:bg-neutral-50 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 md:flex gap-2">
                                            <select
                                                value={orderStatusFilter}
                                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                                                className="bg-white border border-neutral-300 px-2.5 py-2 focus:outline-none text-[10px] font-bold uppercase text-neutral-700 focus:border-neutral-950 rounded-lg"
                                            >
                                                <option value="active">Active Queue</option>
                                                <option value="all">All Statuses</option>
                                                <option value="pending">Pending</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="ready">Ready</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="incomplete">Incomplete / Abandoned</option>
                                            </select>
                                            <select
                                                value={orderTypeFilter}
                                                onChange={(e) => setOrderTypeFilter(e.target.value)}
                                                className="bg-white border border-neutral-300 px-2.5 py-2 focus:outline-none text-[10px] font-bold uppercase text-neutral-700 focus:border-neutral-950 rounded-lg"
                                            >
                                                <option value="all">All Types</option>
                                                <option value="delivery">Home Delivery</option>
                                                <option value="collection">Collection</option>
                                                <option value="dine_in">Dine-In Table</option>
                                            </select>
                                            <select
                                                value={orderPaymentFilter}
                                                onChange={(e) => setOrderPaymentFilter(e.target.value)}
                                                className="bg-white border border-neutral-300 px-2.5 py-2 focus:outline-none text-[10px] font-bold uppercase text-neutral-700 focus:border-neutral-950 rounded-lg"
                                            >
                                                <option value="all">All Payments</option>
                                                <option value="unpaid">Unpaid</option>
                                                <option value="paid">Paid</option>
                                                <option value="failed">Failed</option>
                                            </select>
                                            <select
                                                value={orderGroupMode}
                                                onChange={(e) => setOrderGroupMode(e.target.value)}
                                                className="bg-primary border border-primary px-2.5 py-2 focus:outline-none text-[10px] font-bold uppercase text-white rounded-lg cursor-pointer"
                                            >
                                                <option value="status">Group by Status</option>
                                                <option value="type">Group by Type</option>
                                                <option value="payment">Group by Payment</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                        <button onClick={() => { setOrderStatusFilter('pending'); setOrderGroupMode('status'); }} className="text-left bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors flex items-center justify-between">
                                            <span className="text-amber-700 font-bold text-[11px]">Pending</span>
                                            <span className="font-black text-amber-800 text-sm">{orderSummary.pending}</span>
                                        </button>
                                        <button onClick={() => { setOrderStatusFilter('preparing'); setOrderGroupMode('status'); }} className="text-left bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors flex items-center justify-between">
                                            <span className="text-blue-700 font-bold text-[11px]">Preparing</span>
                                            <span className="font-black text-blue-800 text-sm">{orderSummary.preparing}</span>
                                        </button>
                                        <button onClick={() => { setOrderTypeFilter('delivery'); setOrderGroupMode('type'); }} className="text-left bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100 transition-colors flex items-center justify-between">
                                            <span className="text-neutral-600 font-bold text-[11px]">Delivery</span>
                                            <span className="font-black text-neutral-900 text-sm">{orderSummary.delivery}</span>
                                        </button>
                                        <button onClick={() => { setOrderTypeFilter('collection'); setOrderGroupMode('type'); }} className="text-left bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100 transition-colors flex items-center justify-between">
                                            <span className="text-neutral-600 font-bold text-[11px]">Collection</span>
                                            <span className="font-black text-neutral-900 text-sm">{orderSummary.collection}</span>
                                        </button>
                                        <button onClick={() => { setOrderTypeFilter('dine_in'); setOrderGroupMode('type'); }} className="text-left bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 hover:bg-emerald-100 transition-colors flex items-center justify-between">
                                            <span className="text-emerald-700 font-bold text-[11px]">Dine-In Table</span>
                                            <span className="font-black text-emerald-800 text-sm">{orderSummary.dine_in}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {orders.length === 0 ? (
                                        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
                                            <p className="text-neutral-400 text-sm">No orders registered yet.</p>
                                        </div>
                                    ) : filteredOrders.length === 0 ? (
                                        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
                                            <p className="text-neutral-400 text-sm">No orders match the current search and filters.</p>
                                        </div>
                                    ) : (
                                        Object.entries(groupedOrders).map(([groupKey, groupOrders]) => (
                                            <div key={groupKey} className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden text-left w-full">
                                                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                                                    <div>
                                                        <h2 className="font-bold text-neutral-800 text-sm">{orderGroupLabels[groupKey] || groupKey}</h2>
                                                        <p className="text-[11px] text-neutral-400 mt-0.5">{groupOrders.length} order{groupOrders.length !== 1 ? 's' : ''} in this group</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{orderGroupMode}</span>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 uppercase tracking-wider font-bold text-[10px]">
                                                                <th className="py-3.5 px-5 text-left font-bold">Order</th>
                                                                <th className="py-3.5 px-5 text-left font-bold">Customer</th>
                                                                <th className="py-3.5 px-5 text-left font-bold">Fulfilment</th>
                                                                <th className="py-3.5 px-5 text-left font-bold">Items</th>
                                                                <th className="py-3.5 px-5 text-left font-bold">Total</th>
                                                                <th className="py-3.5 px-5 text-left font-bold">Status</th>
                                                                <th className="py-3.5 px-5 text-left font-bold">Payment</th>
                                                                <th className="py-3.5 px-5 text-right font-bold">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-200 text-neutral-700">
                                                            {groupOrders.map(order => {
                                                                const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Guest customer';
                                                                const isFading = fadingOrders[order.id];
                                                                const isHighlighted = highlightedOrders[order.id];
                                                                
                                                                let rowClass = "transition-all duration-500 ease-in-out ";
                                                                if (isFading) {
                                                                    rowClass += "opacity-0 scale-95 pointer-events-none bg-red-50/20";
                                                                } else if (isHighlighted) {
                                                                    rowClass += "bg-emerald-50/80 ring-2 ring-emerald-500/20 animate-pulse";
                                                                } else {
                                                                    rowClass += "hover:bg-neutral-50/50";
                                                                }

                                                                return (
                                                                    <tr key={order.id} className={rowClass}>
                                                                        <td className="py-4 px-5">
                                                                            <p className="font-mono font-black text-neutral-950">{order.order_number}</p>
                                                                            <p className="text-[10px] text-neutral-400 mt-0.5">{formatDateTime(order.created_at)}</p>
                                                                             {order.notes && (
                                                                                 <textarea
                                                                                     readOnly
                                                                                     rows={1}
                                                                                     value={order.notes}
                                                                                     className="mt-1.5 p-1.5 bg-amber-50/60 border border-amber-200/85 rounded-md text-[10px] text-neutral-850 font-medium w-full max-w-[180px] resize-y focus:outline-none block leading-normal scrollbar-none"
                                                                                 />
                                                                             )}
                                                                        </td>
                                                                        <td className="py-4 px-5 min-w-44">
                                                                            <p className="font-bold text-neutral-900">{customerName}</p>
                                                                            <p className="text-[10px] text-neutral-400 mt-0.5">{order.customer?.phone || order.customer?.email || 'No contact saved'}</p>
                                                                        </td>
                                                                        <td className="py-4 px-5 min-w-44">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-semibold block">
                                                                                    {order.type === 'dine_in'
                                                                                        ? 'Dine-In Table'
                                                                                        : order.type === 'delivery'
                                                                                            ? 'Home Delivery'
                                                                                            : 'Store Collection'}
                                                                                </span>
                                                                                {order.type === 'dine_in' && (
                                                                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                                                                                        #{order.table_number || '?'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-[10px] text-neutral-400 mt-0.5 block">
                                                                                {order.type === 'dine_in'
                                                                                    ? 'Direct table scan'
                                                                                    : order.type === 'delivery'
                                                                                        ? `${order.delivery_address?.postcode || 'No postcode'}${order.delivery_address?.city ? `, ${order.delivery_address.city}` : ''}`
                                                                                        : formatDateTime(order.collection_time)
                                                                                }
                                                                            </span>
                                                                            {order.type === 'delivery' && order.uber_status && (
                                                                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[9px] font-bold uppercase tracking-wider">
                                                                                    Uber: {order.uber_status}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                         <td className="py-4 px-5 min-w-56">
                                                                             <div className="space-y-1">
                                                                                 {order.items?.map((item, idx) => (
                                                                                     <div key={idx} className="text-[11px] leading-tight text-neutral-800 font-medium">
                                                                                         <span className="font-bold text-[#8e5233] mr-1">{item.quantity}x</span>
                                                                                         <span>{item.product_name}</span>
                                                                                         {item.variation_name && (
                                                                                             <span className="text-[9px] text-neutral-450 ml-1.5 font-bold">({item.variation_name})</span>
                                                                                         )}
                                                                                     </div>
                                                                                 ))}
                                                                             </div>
                                                                         </td>
                                                                        <td className="py-4 px-5 font-bold text-neutral-900">{formatCurrency(order.total)}</td>
                                                                        <td className="py-4 px-5">
                                                                            {updatingOrders[order.id] === 'status' ? (
                                                                                <div className="flex items-center gap-1.5 py-2.5">
                                                                                    <Loader2 className="animate-spin text-[#8e5233]" size={16} />
                                                                                    <span className="text-[10px] text-neutral-400 font-semibold">Updating…</span>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <div className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border capitalize mb-2 ${orderStatusMeta[order.status]?.classes || 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                                                                                        {orderStatusMeta[order.status]?.label || order.status}
                                                                                    </div>
                                                                                    <select
                                                                                        value={order.status}
                                                                                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                                                        className="block bg-white border border-neutral-300 px-2.5 py-1.5 focus:outline-none text-[10px] font-bold uppercase text-neutral-800 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors cursor-pointer"
                                                                                    >
                                                                                        <option value="pending">Pending</option>
                                                                                        <option value="preparing">Preparing</option>
                                                                                        <option value="ready">Ready</option>
                                                                                        <option value="completed">Completed</option>
                                                                                        <option value="cancelled">Cancelled</option>
                                                                                    </select>
                                                                                </>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 px-5">
                                                                            {updatingOrders[order.id] === 'payment' ? (
                                                                                <div className="flex items-center gap-1.5 py-2.5">
                                                                                    <Loader2 className="animate-spin text-[#8e5233]" size={16} />
                                                                                    <span className="text-[10px] text-neutral-400 font-semibold">Updating…</span>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <div className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border capitalize mb-2 ${orderPaymentMeta[order.payment_status]?.classes || 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                                                                                        {orderPaymentMeta[order.payment_status]?.label || order.payment_status}
                                                                                    </div>
                                                                                    <select
                                                                                        value={order.payment_status}
                                                                                        onChange={(e) => handleUpdateOrderPayment(order.id, e.target.value)}
                                                                                        className="block bg-white border border-neutral-300 px-2.5 py-1.5 focus:outline-none text-[10px] font-bold uppercase text-neutral-800 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors cursor-pointer"
                                                                                    >
                                                                                        <option value="unpaid">Unpaid</option>
                                                                                        <option value="paid">Paid</option>
                                                                                        <option value="failed">Failed</option>
                                                                                    </select>
                                                                                </>
                                                                            )}
                                                                        </td>
                                                                         <td className="py-4 px-5">
                                                                             <div className="flex items-center justify-end gap-1.5">
                                                                                 <button
                                                                                     type="button"
                                                                                     onClick={() => handlePrintOrderTicket(order.id)}
                                                                                     disabled={printingOrderId === order.id}
                                                                                     className={`px-2.5 py-1.5 border rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                                                                         order.print_count > 0 
                                                                                             ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300' 
                                                                                             : order.has_active_print_job
                                                                                                 ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                                                                                                 : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-950'
                                                                                     }`}
                                                                                     title={
                                                                                         order.print_count > 0 
                                                                                             ? `Printed ${order.print_count} time${order.print_count > 1 ? 's' : ''}${order.printed_at ? ` · Last: ${formatDateTime(order.printed_at)}` : ''} — Click to reprint`
                                                                                             : order.has_active_print_job
                                                                                                 ? 'Print job in queue'
                                                                                                 : 'Print Ticket on Star TSP100'
                                                                                     }
                                                                                 >
                                                                                     {printingOrderId === order.id ? (
                                                                                         <Loader2 size={13} className="animate-spin text-amber-600" />
                                                                                     ) : (
                                                                                         <Printer size={13} className={order.print_count > 0 ? 'text-emerald-600' : ''} />
                                                                                     )}
                                                                                     {order.print_count > 0 ? (
                                                                                         <span className="font-mono text-[10px] font-bold text-emerald-700">
                                                                                             x{order.print_count}
                                                                                         </span>
                                                                                     ) : order.has_active_print_job ? (
                                                                                         <span className="text-[9.5px] font-bold text-amber-700">
                                                                                             Queue
                                                                                         </span>
                                                                                     ) : (
                                                                                         <span className="text-[10px] font-medium text-neutral-400">
                                                                                             0
                                                                                         </span>
                                                                                     )}
                                                                                 </button>
                                                                                 <button
                                                                                     onClick={() => navigate(`/admin/orders/${order.order_number}`)}
                                                                                     className="p-1.5 bg-neutral-50 border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-950 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                                                                     title="View Order Details"
                                                                                 >
                                                                                     <Eye size={14} />
                                                                                 </button>
                                                                             </div>
                                                                         </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. CATEGORIES CRUD TAB */}
                        {activeTab === 'categories' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl lg:text-3xl font-serif font-black text-primary tracking-tight">Manage Categories</h1>
                                        <p className="text-xs text-stone-500 mt-1">Configure and organize culinary classification collections for your atelier storefront.</p>
                                    </div>
                                    {!catFormOpen && (
                                        <button 
                                            onClick={() => {
                                                setCatFormOpen(true);
                                                setCatEditId(null);
                                                setCatName('');
                                                setCatIcon('');
                                                setIconSearchQuery('');
                                                setCatImage('');
                                                setCatImageFile(null);
                                                setCatImagePreview('');
                                                setCatStatus(true);
                                                setCatShowInFooter(false);
                                                setCatOrder(0);
                                            }}
                                            className="bg-secondary hover:bg-secondary-hover active:scale-98 text-white font-bold px-4 py-2.5 text-xs flex items-center space-x-2 transition-all rounded-xl shadow-xs cursor-pointer hover:-translate-y-0.5 shrink-0 self-start sm:self-auto"
                                        >
                                            <Plus size={15} className="stroke-[3]" />
                                            <span>Add Category</span>
                                        </button>
                                    )}
                                </div>

                                {catFormOpen ? (
                                    /* Category Form with Live Preview Column */
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                                        {/* Form card */}
                                        <div className="lg:col-span-2 bg-white border border-neutral-200 p-8 rounded-xl shadow-sm text-left w-full">
                                            <h2 className="text-xl font-bold text-neutral-900 mb-6">{catEditId ? 'Edit Category' : 'Create Category'}</h2>
                                            <form onSubmit={handleSaveCategory} className="space-y-5">
                                                <div>
                                                    <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Category Name *</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={catName}
                                                        onChange={(e) => setCatName(e.target.value)}
                                                        placeholder="e.g. Pastries & Viennoiserie"
                                                        className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-850 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                    <p className="text-[10px] text-neutral-400 mt-1">This will show as the display name on the storefront menu.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Category Image</label>
                                                    <label className="flex flex-col items-center justify-center gap-3 bg-neutral-50 border border-dashed border-neutral-300 hover:border-neutral-950 rounded-xl px-5 py-8 text-center cursor-pointer transition-colors">
                                                        <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 text-neutral-500 flex items-center justify-center">
                                                            <Upload size={17} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-neutral-900">
                                                                {catImageFile ? catImageFile.name : catImage ? 'Replace current image' : 'Upload category image'}
                                                            </p>
                                                            <p className="text-[10px] text-neutral-400 mt-1">PNG, JPG, GIF, or WEBP up to 4MB.</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0] || null;
                                                                if (file) {
                                                                    setCropperTarget('category');
                                                                    setCropSourceImage(file);
                                                                    setCropImageUrl(URL.createObjectURL(file));
                                                                    setCropZoom(1);
                                                                    setCropOffset({ x: 0, y: 0 });
                                                                    setCropperOpen(true);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    {catImagePreview && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCatImageFile(null);
                                                                setCatImagePreview(resolveStoredImageUrl(catImage));
                                                            }}
                                                            className="text-[10px] text-neutral-400 hover:text-neutral-900 font-bold mt-2"
                                                        >
                                                            Clear selected file
                                                        </button>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Sort Order</label>
                                                    <input 
                                                        type="number" 
                                                        value={catOrder}
                                                        onChange={(e) => setCatOrder(e.target.value)}
                                                        placeholder="0"
                                                        className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-850 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                    <p className="text-[10px] text-neutral-400 mt-1">Determines display sequence order (lower numbers show first).</p>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                                    <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                                                        <label className="block text-neutral-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Visibility Status</label>
                                                        <label className="flex items-center space-x-3 py-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={catStatus}
                                                                onChange={(e) => setCatStatus(e.target.checked)}
                                                                className="bg-white border-neutral-300 text-primary w-4 h-4 focus:ring-primary focus:outline-none rounded cursor-pointer"
                                                            />
                                                            <span className="text-xs font-semibold text-neutral-700">Category is active in menu</span>
                                                        </label>
                                                    </div>
                                                    <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                                                        <label className="block text-neutral-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Footer Navigation</label>
                                                        <label className="flex items-center space-x-3 py-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={catShowInFooter}
                                                                onChange={(e) => setCatShowInFooter(e.target.checked)}
                                                                className="bg-white border-neutral-300 text-primary w-4 h-4 focus:ring-primary focus:outline-none rounded cursor-pointer"
                                                            />
                                                            <span className="text-xs font-semibold text-neutral-700">Show in Footer ("Our Products")</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3 pt-5 border-t border-neutral-200 mt-6">
                                                    <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 text-xs transition-colors rounded-lg shadow-sm cursor-pointer">
                                                        {catEditId ? 'Update Category' : 'Save Category'}
                                                    </button>
                                                    <button type="button" onClick={() => setCatFormOpen(false)} className="bg-neutral-100 text-neutral-600 font-bold px-6 py-2.5 text-xs hover:bg-neutral-200 transition-colors rounded-lg">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Sticky live preview column */}
                                        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-8 text-left">
                                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Live Card Preview</span>
                                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 flex items-center justify-center min-h-[240px]">
                                                <div className="w-full bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[230px]">
                                                    <div>
                                                        <div className="relative h-28 w-full rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50 mb-3">
                                                            <img 
                                                                src={catImagePreview || '/images/placeholder.svg'} 
                                                                alt={catName || 'Preview'}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.src = "/images/placeholder.svg";
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                                            <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                                                                <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-neutral-950/80 backdrop-blur-xs text-white border border-white/10">
                                                                    Order: {catOrder || 0}
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    {catShowInFooter && (
                                                                        <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-amber-500 text-white shadow-xs">
                                                                            In Footer
                                                                        </span>
                                                                    )}
                                                                    {catStatus ? (
                                                                        <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                                                            <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                                                            Active
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                                                                            Disabled
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-left px-1">
                                                            <h3 className="font-extrabold text-neutral-900 text-sm tracking-tight truncate">
                                                                {catName || 'Untitled Category'}
                                                            </h3>
                                                            <span className="text-[9px] text-neutral-400 font-mono mt-0.5 block truncate">
                                                                /categories/{catName ? catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'untitled-category'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-neutral-100 pt-2.5 mt-3 px-1">
                                                        <div className="flex items-center text-neutral-400 space-x-1">
                                                            <Layers size={10} />
                                                            <span className="text-[10px] font-bold text-neutral-500">
                                                                {catEditId ? (products.filter(p => p.category_id === catEditId).length) : 0} products
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                                                            Draft Preview
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-neutral-400 text-center leading-normal">
                                                This preview shows exactly how the category card appears in the list grid view once saved.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Category List View with Stats Bar, Filters and Pagination */
                                    <div className="space-y-6">
                                        {/* Compact Category Stats Cards row */}
                                        <AdminStatGrid columns={3}>
                                            <AdminStatCard
                                                label="Total Categories"
                                                value={categories.length}
                                                sub="Configured in store catalog"
                                                icon={FolderTree}
                                            />
                                            <AdminStatCard
                                                label="Active Categories"
                                                value={categories.filter(c => c.status === true || c.status === 1).length}
                                                sub="Visible on storefront"
                                                badge={
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
                                                }
                                                icon={CheckCircle2}
                                            />
                                            <AdminStatCard
                                                label="Categorized Products"
                                                value={products.filter(p => p.category_id).length}
                                                sub="Linked items in catalog"
                                                icon={Layers}
                                            />
                                        </AdminStatGrid>

                                        {/* Search & Filters Toolbar */}
                                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface border border-stone-200/70 p-3.5 sm:p-4 rounded-xl shadow-2xs">
                                            {/* Left side: Search input */}
                                            <div className="relative flex-grow max-w-md">
                                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                                                <input 
                                                    type="text"
                                                    value={catQuery}
                                                    onChange={(e) => setCatQuery(e.target.value)}
                                                    placeholder="Search categories by name..."
                                                    className="w-full bg-canvas/60 border border-stone-200/80 pl-10 pr-10 py-2 text-xs text-primary focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-xl transition-colors"
                                                />
                                                {catQuery && (
                                                    <button 
                                                        onClick={() => setCatQuery('')} 
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary p-1 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Right side: Status filtering and results count */}
                                            <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0">
                                                <div className="flex bg-canvas p-1 rounded-xl border border-stone-200/60">
                                                    {[
                                                        { label: 'All', value: 'all' },
                                                        { label: 'Active', value: 'active' },
                                                        { label: 'Disabled', value: 'disabled' }
                                                    ].map(tab => (
                                                        <button
                                                            key={tab.value}
                                                            type="button"
                                                            onClick={() => setCatStatusFilter(tab.value)}
                                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider cursor-pointer ${
                                                                catStatusFilter === tab.value
                                                                    ? 'bg-primary text-white shadow-2xs'
                                                                    : 'text-stone-500 hover:text-primary bg-transparent'
                                                            }`}
                                                        >
                                                            {tab.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <span className="text-[11px] font-bold text-stone-400 tracking-tight hidden sm:inline">
                                                    Showing {filteredCategories.length} of {categories.length}
                                                </span>
                                            </div>
                                        </div>

                                        <AdminTable
                                            title="Categories Directory"
                                            countText={`Showing ${filteredCategories.length === 0 ? 0 : (catCurrentPage - 1) * catPerPage + 1}-${Math.min(catCurrentPage * catPerPage, filteredCategories.length)} of ${filteredCategories.length}`}
                                            emptyMessage="No categories found matching your query and filter criteria."
                                            data={currentCategories}
                                            keyField="id"
                                            pagination={totalCatPages > 1 ? {
                                                currentPage: catCurrentPage,
                                                totalPages: totalCatPages,
                                                onPageChange: (page) => setCatCurrentPage(page)
                                            } : undefined}
                                            columns={[
                                                {
                                                    header: "Category",
                                                    render: (cat) => (
                                                        <div className="flex items-center space-x-3.5 min-w-56">
                                                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200/60 bg-stone-50 shrink-0">
                                                                <img 
                                                                    src={getImageUrl(cat)} 
                                                                    alt={cat.name}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                    onError={(e) => {
                                                                        e.target.src = "/images/placeholder.svg";
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-serif font-black text-primary block text-sm leading-snug group-hover:text-secondary transition-colors truncate">
                                                                    {cat.name}
                                                                </span>
                                                                <span className="text-[10px] text-stone-400 font-mono truncate block mt-0.5">
                                                                    /categories/{cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                },
                                                {
                                                    header: "Sequence",
                                                    render: (cat) => (
                                                        <span className="px-2.5 py-0.5 text-[9.5px] font-bold rounded-full bg-stone-100 text-stone-600 border border-stone-200/70 inline-block font-mono">
                                                            Seq #{cat.order}
                                                        </span>
                                                    )
                                                },
                                                {
                                                    header: "Products",
                                                    render: (cat) => {
                                                        const count = products.filter(p => p.category_id === cat.id).length;
                                                        return (
                                                            <div className="flex items-center text-stone-600 space-x-1.5">
                                                                <Layers size={13} className="text-stone-400" />
                                                                <span className="text-[11px] font-bold">
                                                                    {count} {count === 1 ? 'item' : 'items'}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                },
                                                {
                                                    header: "Footer",
                                                    render: (cat) => (
                                                        cat.show_in_footer ? (
                                                            <span className="px-2.5 py-0.5 text-[9.5px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 inline-flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                                                                In Footer
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-stone-400 font-medium">—</span>
                                                        )
                                                    )
                                                },
                                                {
                                                    header: "Status",
                                                    render: (cat) => (
                                                        cat.status ? (
                                                            <span className="px-2.5 py-0.5 text-[9.5px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-0.5 text-[9.5px] font-bold rounded-full bg-stone-100 text-stone-400 border border-stone-200 inline-block">
                                                                Disabled
                                                            </span>
                                                        )
                                                    )
                                                }
                                            ]}
                                            actions={(cat) => (
                                                <div className="flex justify-end space-x-1.5">
                                                    <button 
                                                        onClick={() => handleEditCategoryClick(cat)}
                                                        className="p-2 bg-canvas hover:bg-stone-200/60 text-stone-700 hover:text-primary transition-all rounded-xl cursor-pointer"
                                                        title="Edit Category"
                                                    >
                                                        <Edit size={13} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="p-2 bg-canvas hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all rounded-xl cursor-pointer"
                                                        title="Delete Category"
                                                    >
                                                        <Trash size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. PRODUCTS CRUD TAB */}
                        {activeTab === 'products' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl lg:text-3xl font-serif font-black text-primary tracking-tight">Manage Products</h1>
                                        <p className="text-xs text-stone-500 mt-1">Search, curate, and maintain the handcrafted catalogue for your storefront.</p>
                                    </div>
                                    {!prodFormOpen && (
                                        <button 
                                            onClick={handleAddProductClick}
                                            className="bg-secondary hover:bg-secondary-hover active:scale-98 text-white font-bold px-4 py-2.5 text-xs flex items-center space-x-2 transition-all rounded-xl shadow-xs cursor-pointer hover:-translate-y-0.5 shrink-0 self-start sm:self-auto"
                                        >
                                            <Plus size={15} className="stroke-[3]" />
                                            <span>Add Product</span>
                                        </button>
                                    )}
                                </div>

                                {prodFormOpen ? (
                                    /* Product Form */
                                    <div className="bg-white border border-neutral-200 p-8 rounded-xl shadow-sm text-left w-full">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                                            <div>
                                                <h2 className="text-xl font-black text-neutral-900">{prodEditId ? 'Edit Product' : 'Create Product'}</h2>
                                                <p className="text-xs text-neutral-400 mt-1">Add catalogue details, pricing, images, and related product links.</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${prodStatus ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                                                    {prodStatus ? 'Active' : 'Hidden'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 text-[10px] font-bold">
                                                    {prodHasVariations ? 'Variations' : 'Simple'}
                                                </span>
                                            </div>
                                        </div>
                                        <form onSubmit={handleSaveProduct} className="space-y-6">
                                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-black text-neutral-900">Product Identity</h3>
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Required</span>
                                                </div>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div className="relative">
                                                        <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Category *</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setProdCategoryPickerOpen(prev => !prev)}
                                                            className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors flex items-center justify-between"
                                                        >
                                                            <span className={selectedProductCategory ? 'font-bold text-neutral-900' : 'text-neutral-400'}>
                                                                {selectedProductCategory?.name || 'Choose category'}
                                                            </span>
                                                            <ChevronDown size={14} className={`text-neutral-400 transition-transform ${prodCategoryPickerOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {prodCategoryPickerOpen && (
                                                            <div className="absolute z-40 mt-2 w-full bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
                                                                <div className="max-h-64 overflow-y-auto p-1.5">
                                                                    {categories.length === 0 ? (
                                                                        <div className="px-3 py-6 text-center text-xs text-neutral-400">Create a category first.</div>
                                                                    ) : (
                                                                        categories.map(category => {
                                                                            const active = String(category.id) === String(prodCategoryId);
                                                                            return (
                                                                                <button
                                                                                    key={category.id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setProdCategoryId(category.id);
                                                                                        setProdCategoryPickerOpen(false);
                                                                                    }}
                                                                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                                                                                        active
                                                                                            ? 'bg-neutral-950 text-white'
                                                                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950'
                                                                                    }`}
                                                                                >
                                                                                    <span>{category.name}</span>
                                                                                    {active && <Check size={13} />}
                                                                                </button>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Product Name *</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={prodName}
                                                        onChange={(e) => setProdName(e.target.value)}
                                                        placeholder="e.g. Cinnamon Braid"
                                                        className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                                </div>

                                                <div>
                                                    <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Description</label>
                                                    <textarea 
                                                        rows="3"
                                                        value={prodDescription}
                                                        onChange={(e) => setProdDescription(e.target.value)}
                                                        placeholder="Description of product details..."
                                                        className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors resize-none mb-4"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Ingredients & Allergens</label>
                                                    <textarea 
                                                        rows="3"
                                                        value={prodIngredients}
                                                        onChange={(e) => setProdIngredients(e.target.value)}
                                                        placeholder="e.g. Wheat flour, butter, sugar... ALLERGENS: CONTAINS GLUTEN, DAIRY."
                                                        className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors resize-none"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProdStatus(!prodStatus)}
                                                        className={`text-left border rounded-xl p-4 transition-colors ${
                                                            prodStatus
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
                                                        }`}
                                                    >
                                                        <span className="text-xs font-black block">{prodStatus ? 'Visible on storefront' : 'Hidden from storefront'}</span>
                                                        <span className="text-[10px] opacity-70 mt-1 block">Toggle product availability for customers.</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProdHasVariations(!prodHasVariations)}
                                                        className={`text-left border rounded-xl p-4 transition-colors ${
                                                            prodHasVariations
                                                                ? 'bg-blue-50 border-blue-200 text-blue-800'
                                                                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
                                                        }`}
                                                    >
                                                        <span className="text-xs font-black block">{prodHasVariations ? 'Variation product' : 'Simple product'}</span>
                                                        <span className="text-[10px] opacity-70 mt-1 block">Use variations for size, weight, or option pricing.</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProdIsHomeTreat(!prodIsHomeTreat)}
                                                        className={`text-left border rounded-xl p-4 transition-colors ${
                                                            prodIsHomeTreat
                                                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                                                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
                                                        }`}
                                                    >
                                                        <span className="text-xs font-black block">{prodIsHomeTreat ? 'Featured in Home Treats' : 'Standard catalog'}</span>
                                                        <span className="text-[10px] opacity-70 mt-1 block">Show product card in landing page "Our Fine Home Made Treats" section.</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="bg-neutral-50 p-5 border border-neutral-200 rounded-xl space-y-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Product Images</label>
                                                        <p className="text-[10px] text-neutral-400">Add images one by one. The first saved image is used as the main product image.</p>
                                                    </div>
                                                    {(prodImages.filter(Boolean).length > 0 || prodImageFiles.length > 0) && (
                                                        <span className="text-[10px] font-bold text-neutral-400 whitespace-nowrap">
                                                            {prodImages.filter(Boolean).length + prodImageFiles.length} total
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2.5">
                                                    {prodImages.filter(Boolean).map((imgUrl, index) => (
                                                        <div key={`${imgUrl}-${index}`} className="relative group border border-neutral-200 rounded-xl overflow-hidden bg-white">
                                                            <img
                                                                src={resolveStoredImageUrl(imgUrl)}
                                                                alt={`Saved product image ${index + 1}`}
                                                                className="w-full aspect-square object-cover"
                                                                onError={(e) => {
                                                                    e.target.src = "/images/placeholder.svg";
                                                                }}
                                                            />
                                                            <div className="absolute left-2 top-2 px-1.5 py-0.5 rounded-full bg-white/95 border border-neutral-200 text-[8px] font-black text-neutral-500">
                                                                Saved
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const nextImages = prodImages.filter((_, imageIndex) => imageIndex !== index);
                                                                    setProdImages(nextImages.length > 0 ? nextImages : ['']);
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 bg-white/95 border border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-200 rounded-lg shadow-sm"
                                                                title="Remove saved image"
                                                            >
                                                                <X size={11} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {prodImageFiles.map((file, index) => (
                                                        <div key={`${file.name}-${index}`} className="relative border border-neutral-200 rounded-xl overflow-hidden bg-white">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={file.name}
                                                                className="w-full aspect-square object-cover"
                                                            />
                                                            <div className="absolute left-2 top-2 px-1.5 py-0.5 rounded-full bg-white/95 border border-neutral-200 text-[8px] font-black text-neutral-500">
                                                                New
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setProdImageFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index))}
                                                                className="absolute top-2 right-2 p-1.5 bg-white/95 border border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-200 rounded-lg shadow-sm"
                                                                title="Remove new image"
                                                            >
                                                                <X size={11} />
                                                            </button>
                                                            <div className="px-2 py-1.5 text-[9px] font-bold text-neutral-500 truncate">{file.name}</div>
                                                        </div>
                                                    ))}

                                                    <label className="aspect-square min-h-24 flex flex-col items-center justify-center gap-1.5 bg-white border border-dashed border-neutral-300 hover:border-neutral-950 rounded-xl text-center cursor-pointer transition-colors">
                                                        <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-500 flex items-center justify-center">
                                                            <Upload size={13} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-neutral-900">Add image</p>
                                                            <p className="text-[9px] text-neutral-400 mt-0.5">One file</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0] || null;
                                                                if (file) {
                                                                    setCropperTarget('product');
                                                                    setCropSourceImage(file);
                                                                    setCropImageUrl(URL.createObjectURL(file));
                                                                    setCropZoom(1);
                                                                    setCropOffset({ x: 0, y: 0 });
                                                                    setCropperOpen(true);
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Pricing if simple product */}
                                            {!prodHasVariations ? (
                                                <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 border border-neutral-200 rounded-xl">
                                                    <div>
                                                        <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Base Price *</label>
                                                        <input 
                                                            type="number" 
                                                            step="0.01"
                                                            required={!prodHasVariations}
                                                            value={prodBasePrice}
                                                            onChange={(e) => setProdBasePrice(e.target.value)}
                                                            className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Base Weight (grams)</label>
                                                        <input 
                                                            type="number" 
                                                            value={prodBaseWeight}
                                                            onChange={(e) => setProdBaseWeight(e.target.value)}
                                                            placeholder="e.g. 150"
                                                            className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Variations list edit block */
                                                <div className="bg-neutral-50 p-5 border border-neutral-200 space-y-4 text-left rounded-xl">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">Variations Configuration</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={handleAddVariationField}
                                                            className="text-xs text-[#C5A880] font-semibold flex items-center gap-1"
                                                        >
                                                            <Plus size={12} /> Add Row
                                                        </button>
                                                    </div>

                                                    {prodVariations.length === 0 && (
                                                        <p className="text-neutral-400 text-xs text-center py-4">Click "Add Row" to append a variation option.</p>
                                                    )}

                                                    <div className="space-y-3">
                                                        {prodVariations.map((v, index) => (
                                                            <div key={index} className="bg-white border border-neutral-200 rounded-xl p-4 space-y-4">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Variation {index + 1}</p>
                                                                        <p className="text-[11px] text-neutral-400 mt-0.5">Configure one selectable option for this product.</p>
                                                                    </div>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => handleRemoveVariationField(index)}
                                                                        className="p-1.5 text-neutral-400 hover:text-red-400"
                                                                        title="Remove variation"
                                                                    >
                                                                        <Trash size={12} />
                                                                    </button>
                                                                </div>

                                                                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_180px] gap-4 xl:items-stretch">
                                                                    <div className="space-y-2.5">
                                                                        <input 
                                                                            type="text" 
                                                                            required
                                                                            value={v.name}
                                                                            onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
                                                                            placeholder="e.g. Small or Oat Milk"
                                                                            className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2.5 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                                        />
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                                                            <input 
                                                                                type="number" 
                                                                                step="0.01"
                                                                                required
                                                                                value={v.price}
                                                                                onChange={(e) => handleVariationChange(index, 'price', e.target.value)}
                                                                                placeholder="Price"
                                                                                className="w-full appearance-none bg-neutral-50 border border-neutral-300 px-3 py-2.5 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                                            />
                                                                            <input 
                                                                                type="number" 
                                                                                value={v.weight || ''}
                                                                                onChange={(e) => handleVariationChange(index, 'weight', e.target.value)}
                                                                                placeholder="Weight"
                                                                                className="w-full appearance-none bg-neutral-50 border border-neutral-300 px-3 py-2.5 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                                            />
                                                                            <input 
                                                                                type="text" 
                                                                                value={v.sku || ''}
                                                                                onChange={(e) => handleVariationChange(index, 'sku', e.target.value)}
                                                                                placeholder="SKU"
                                                                                className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2.5 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-col gap-2 self-stretch">
                                                                        <label className="group relative w-full h-full flex flex-col items-center justify-center gap-1.5 border border-dashed border-neutral-300 rounded-xl bg-neutral-50 hover:border-neutral-950 cursor-pointer overflow-hidden transition-colors">
                                                                            {v.imagePreview ? (
                                                                                <img
                                                                                    src={v.imagePreview}
                                                                                    alt={v.name || 'Variation image'}
                                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                                    onError={(e) => {
                                                                                        e.target.src = "/images/placeholder.svg";
                                                                                    }}
                                                                                />
                                                                            ) : null}
                                                                            <div className={`relative z-10 flex flex-col items-center justify-center ${v.imagePreview ? 'bg-white/88 px-2.5 py-2 rounded-lg backdrop-blur-sm border border-white/60' : ''}`}>
                                                                                <Upload size={14} className="text-neutral-400" />
                                                                                <span className="mt-1 text-[8px] font-black uppercase tracking-wider text-neutral-500">Optional image</span>
                                                                                <span className="mt-0.5 text-[9px] text-neutral-400">Click to upload</span>
                                                                            </div>
                                                                            <input
                                                                                id={`variation-image-${index}`}
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="hidden"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0] || null;
                                                                                    if (file) handleVariationImageChange(index, file);
                                                                                    e.target.value = '';
                                                                                }}
                                                                            />
                                                                        </label>
                                                                        {v.imagePreview && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleClearVariationImage(index)}
                                                                                className="self-start text-[9px] font-bold text-red-500 hover:text-red-600"
                                                                            >
                                                                                Remove image
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}



                                            <div className="flex items-center space-x-3 pt-4 border-t border-neutral-200">
                                                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 text-xs transition-colors rounded-lg cursor-pointer shadow-xs">
                                                    Save Product
                                                </button>
                                                <button type="button" onClick={() => setProdFormOpen(false)} className="bg-neutral-100 text-neutral-600 font-bold px-6 py-2.5 text-xs hover:bg-neutral-200 transition-colors rounded-lg">
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    /* Product list rendering */
                                    <div className="space-y-6">
                                        <AdminStatGrid columns={4}>
                                            <AdminStatCard
                                                label="Total Products"
                                                value={productSummary.total}
                                                sub="Configured catalogue items"
                                                icon={ShoppingBag}
                                            />
                                            <AdminStatCard
                                                label="Active"
                                                value={productSummary.active}
                                                sub="Visible on storefront"
                                                badge={
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
                                                }
                                                icon={Eye}
                                            />
                                            <AdminStatCard
                                                label="Inactive"
                                                value={productSummary.inactive}
                                                sub="Hidden from customers"
                                                icon={EyeOff}
                                            />
                                            <AdminStatCard
                                                label="With Variations"
                                                value={productSummary.withVariations}
                                                sub="Multiple sizes/options"
                                                icon={Layers}
                                            />
                                        </AdminStatGrid>

                                        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-surface border border-stone-200/70 p-3.5 sm:p-4 rounded-xl shadow-2xs">
                                            <div className="relative flex-grow max-w-xl">
                                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                                                <input
                                                    type="text"
                                                    value={prodQuery}
                                                    onChange={(e) => {
                                                        setProdCurrentPage(1);
                                                        setProdQuery(e.target.value);
                                                    }}
                                                    placeholder="Search products, categories, descriptions, or variations..."
                                                    className="w-full bg-canvas/60 border border-stone-200/80 pl-10 pr-10 py-2 text-xs text-primary focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-xl transition-colors"
                                                />
                                                {prodQuery && (
                                                    <button
                                                        onClick={() => {
                                                            setProdCurrentPage(1);
                                                            setProdQuery('');
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary p-1 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
                                                <select
                                                    value={prodCategoryFilter}
                                                    onChange={(e) => {
                                                        setProdCurrentPage(1);
                                                        setProdCategoryFilter(e.target.value);
                                                    }}
                                                    className="bg-canvas border border-stone-200/80 px-3 py-2 focus:bg-white focus:outline-none text-[11px] font-bold text-stone-700 focus:border-primary rounded-xl cursor-pointer"
                                                >
                                                    <option value="all">All Categories</option>
                                                    {productCategoryOptions.map(category => (
                                                        <option key={category.id} value={category.id}>{category.name}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={prodStatusFilter}
                                                    onChange={(e) => {
                                                        setProdCurrentPage(1);
                                                        setProdStatusFilter(e.target.value);
                                                    }}
                                                    className="bg-canvas border border-stone-200/80 px-3 py-2 focus:bg-white focus:outline-none text-[11px] font-bold text-stone-700 focus:border-primary rounded-xl cursor-pointer"
                                                >
                                                    <option value="all">All Statuses</option>
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                                <select
                                                    value={prodTypeFilter}
                                                    onChange={(e) => {
                                                        setProdCurrentPage(1);
                                                        setProdTypeFilter(e.target.value);
                                                    }}
                                                    className="bg-canvas border border-stone-200/80 px-3 py-2 focus:bg-white focus:outline-none text-[11px] font-bold text-stone-700 focus:border-primary rounded-xl cursor-pointer"
                                                >
                                                    <option value="all">All Types</option>
                                                    <option value="simple">Simple</option>
                                                    <option value="variations">Variations</option>
                                                </select>
                                            </div>
                                        </div>

                                        <AdminTable
                                            title="Product Catalogue"
                                            countText={`Showing ${productMeta.from || 0}-${productMeta.to || 0} of ${productMeta.total}`}
                                            emptyMessage="No products match the current search and filters."
                                            data={products}
                                            keyField="id"
                                            pagination={productMeta.last_page > 1 ? {
                                                currentPage: productMeta.current_page || prodCurrentPage,
                                                totalPages: productMeta.last_page,
                                                onPageChange: (page) => setProdCurrentPage(page)
                                            } : undefined}
                                            columns={[
                                                {
                                                    header: "Product",
                                                    render: (prod) => (
                                                        <div className="flex items-center space-x-3 min-w-56">
                                                            <img
                                                                src={getImageUrl(prod)}
                                                                alt={prod.name}
                                                                className="w-11 h-11 object-cover border border-stone-200/60 shrink-0 rounded-xl"
                                                                onError={(e) => {
                                                                    e.target.src = "/images/placeholder.svg";
                                                                }}
                                                            />
                                                            <div className="min-w-0">
                                                                <span className="font-serif font-black text-primary block text-sm leading-snug group-hover:text-secondary transition-colors truncate">{prod.name}</span>
                                                                <span className="text-[10px] text-stone-400 font-mono truncate block mt-0.5">/product/{prod.slug}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                },
                                                {
                                                    header: "Category",
                                                    render: (prod) => (
                                                        <span className="font-semibold text-stone-700">
                                                            {prod.category?.name || <span className="text-stone-300 italic">No category</span>}
                                                        </span>
                                                    )
                                                },
                                                {
                                                    header: "Type",
                                                    render: (prod) => (
                                                        prod.has_variations ? (
                                                            <span className="px-2.5 py-0.5 text-[9.5px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">Variations ({prod.variations?.length || 0})</span>
                                                        ) : (
                                                            <span className="px-2.5 py-0.5 text-[9.5px] font-bold rounded-full bg-stone-100 text-stone-500 border border-stone-200">Simple</span>
                                                        )
                                                    )
                                                },
                                                {
                                                    header: "Price",
                                                    render: (prod) => {
                                                        const startingPrice = prod.has_variations && prod.variations?.length > 0
                                                            ? Math.min(...prod.variations.map(v => parseFloat(v.price || 0)))
                                                            : parseFloat(prod.base_price || 0);
                                                        return (
                                                            <span className="font-black text-primary">
                                                                {prod.has_variations ? `from £${startingPrice.toFixed(2)}` : `£${startingPrice.toFixed(2)}`}
                                                            </span>
                                                        );
                                                    }
                                                },
                                                {
                                                    header: "Status",
                                                    render: (prod) => {
                                                        const isToggling = togglingProductId === prod.id;
                                                        return (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleProductStatus(prod);
                                                                }}
                                                                disabled={isToggling}
                                                                title={`Click to switch to ${prod.status ? 'Inactive' : 'Active'}`}
                                                                className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-150 cursor-pointer select-none border active:scale-95 disabled:opacity-60 disabled:cursor-wait hover:shadow-xs ${
                                                                    prod.status
                                                                        ? 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border-emerald-200'
                                                                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                                                                }`}
                                                            >
                                                                {isToggling ? (
                                                                    <Loader2 size={10} className="animate-spin text-stone-500" />
                                                                ) : prod.status ? (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                                ) : (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                                                                )}
                                                                <span>{prod.status ? 'Active' : 'Inactive'}</span>
                                                            </button>
                                                        );
                                                    }
                                                }
                                            ]}
                                            actions={(prod) => (
                                                <div className="flex justify-end space-x-1.5">
                                                    <button
                                                        onClick={() => handleEditProductClick(prod)}
                                                        className="p-2 bg-canvas hover:bg-stone-200/60 text-stone-700 hover:text-primary transition-all rounded-xl cursor-pointer"
                                                        title="Edit Product"
                                                    >
                                                        <Edit size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(prod.id)}
                                                        className="p-2 bg-canvas hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all rounded-xl cursor-pointer"
                                                        title="Delete Product"
                                                    >
                                                        <Trash size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. CUSTOMERS TAB */}
                        {activeTab === 'customers' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl lg:text-3xl font-serif font-black text-primary tracking-tight">Customer Directory</h1>
                                        <p className="text-xs text-stone-500 mt-1">Browse live customer accounts, guest profiles, and order history.</p>
                                    </div>
                                    <div className="text-[11px] font-bold text-stone-400">
                                        Showing <span className="font-black text-primary">{customers.length}</span> customers
                                    </div>
                                </div>

                                <AdminStatGrid columns={4}>
                                    <AdminStatCard
                                        label="Total Customers"
                                        value={reports?.total_customers || customers.length}
                                        sub="Live customer records"
                                        icon={Users}
                                    />
                                    <AdminStatCard
                                        label="Registered"
                                        value={customers.filter(c => !c.is_guest).length}
                                        sub="Have login access"
                                        icon={User}
                                    />
                                    <AdminStatCard
                                        label="Guests"
                                        value={customers.filter(c => c.is_guest).length}
                                        sub="Checkout-only profiles"
                                        icon={ShoppingBag}
                                    />
                                    <AdminStatCard
                                        label="With Orders"
                                        value={customers.filter(c => c.orders_count > 0).length}
                                        sub="Placed at least one order"
                                        icon={ClipboardList}
                                    />
                                </AdminStatGrid>

                                <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-surface border border-stone-200/70 p-3.5 sm:p-4 rounded-xl shadow-2xs">
                                    <div className="relative flex-grow max-w-xl">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                                        <input
                                            type="text"
                                            value={customerQuery}
                                            onChange={(e) => setCustomerQuery(e.target.value)}
                                            placeholder="Search customer name, email, or phone..."
                                            className="w-full bg-canvas/60 border border-stone-200/80 pl-10 pr-10 py-2 text-xs text-primary focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-xl transition-colors"
                                        />
                                        {customerQuery && (
                                            <button
                                                onClick={() => setCustomerQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary p-1 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:flex gap-2 shrink-0">
                                        <select
                                            value={customerTypeFilter}
                                            onChange={(e) => setCustomerTypeFilter(e.target.value)}
                                            className="bg-canvas border border-stone-200/80 px-3 py-2 focus:bg-white focus:outline-none text-[11px] font-bold text-stone-700 focus:border-primary rounded-xl cursor-pointer"
                                        >
                                            <option value="all">All Customers</option>
                                            <option value="registered">Registered</option>
                                            <option value="guest">Guest</option>
                                        </select>
                                        <select
                                            value={customerSort}
                                            onChange={(e) => setCustomerSort(e.target.value)}
                                            className="bg-primary text-white border border-primary px-3 py-2 focus:outline-none text-[11px] font-bold rounded-xl cursor-pointer"
                                        >
                                            <option value="recent">Newest First</option>
                                            <option value="name">Name</option>
                                            <option value="orders">Most Orders</option>
                                            <option value="spend">Highest Spend</option>
                                        </select>
                                    </div>
                                </div>

                                <AdminTable
                                    title="Customer Accounts"
                                    countText={`${customers.length} records found`}
                                    emptyMessage="No customers found matching your search criteria."
                                    data={customers}
                                    keyField="id"
                                    columns={[
                                        {
                                            header: "Customer",
                                            render: (customer) => (
                                                <div>
                                                    <p 
                                                        className="font-serif font-black text-primary hover:text-secondary transition-colors cursor-pointer text-sm leading-snug"
                                                        onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                                    >
                                                        {customer.full_name}
                                                    </p>
                                                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">#{customer.id}</span>
                                                </div>
                                            )
                                        },
                                        {
                                            header: "Contact",
                                            render: (customer) => (
                                                <div>
                                                    <p className="font-semibold text-stone-700">{customer.email || <span className="text-stone-300 italic">No email</span>}</p>
                                                    {customer.phone && <p className="text-[10px] text-stone-400 font-mono mt-0.5">{customer.phone}</p>}
                                                </div>
                                            )
                                        },
                                        {
                                            header: "Type",
                                            render: (customer) => (
                                                customer.is_guest ? (
                                                    <span className="px-2.5 py-0.5 text-[9.5px] font-bold rounded-full bg-stone-100 text-stone-500 border border-stone-200">Guest</span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 text-[9.5px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">Registered</span>
                                                )
                                            )
                                        },
                                        {
                                            header: "Orders",
                                            render: (customer) => (
                                                <span className="font-serif font-black text-primary text-sm">{customer.orders_count || 0}</span>
                                            )
                                        },
                                        {
                                            header: "Spent",
                                            render: (customer) => (
                                                <span className="font-black text-primary">{formatCurrency(customer.total_spent)}</span>
                                            )
                                        },
                                        {
                                            header: "Last Order",
                                            render: (customer) => (
                                                <span className="text-stone-500 text-[11px]">{customer.last_order_at ? formatDateTime(customer.last_order_at) : 'No orders yet'}</span>
                                            )
                                        },
                                        {
                                            header: "Joined",
                                            render: (customer) => (
                                                <span className="text-stone-400 text-[11px]">{formatDateTime(customer.joined_at)}</span>
                                            )
                                        }
                                    ]}
                                    actions={(customer) => (
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                                className="p-2 bg-canvas hover:bg-stone-200/60 text-stone-700 hover:text-primary transition-all rounded-xl cursor-pointer"
                                                title="View Customer Details"
                                            >
                                                <Eye size={13} />
                                            </button>
                                        </div>
                                    )}
                                />
                            </div>
                        )}

                        {/* 5. NEWSLETTER SUBSCRIBERS TAB */}
                        {activeTab === 'newsletter' && (
                            <div className="space-y-8">
                                <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Newsletter Subscribers</h1>
                                <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm overflow-x-auto text-left w-full">
                                    {newsletter.length === 0 ? (
                                        <p className="text-neutral-400 text-sm py-12 text-center">No active subscribers found.</p>
                                    ) : (
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 uppercase tracking-wider font-bold text-[10px]">
                                                    <th className="py-3.5 px-6 text-left font-bold">Email Address</th>
                                                    <th className="py-3.5 px-6 text-left font-bold">Subscribed Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 text-neutral-700">
                                                {newsletter.map(sub => (
                                                    <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                                                        <td className="py-3 px-4 font-semibold text-neutral-900">{sub.email}</td>
                                                        <td className="py-3 px-4 text-neutral-400">
                                                            {new Date(sub.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ADMIN PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                <div>
                                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Admin Profile</h1>
                                    <p className="text-xs text-neutral-500 mt-1">Manage your admin identity and account password.</p>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                                    <div className="xl:col-span-1 bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-primary text-accent flex items-center justify-center text-xl font-black shrink-0 shadow-sm">
                                                {adminDisplayName[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-lg font-black text-neutral-900 truncate">{adminDisplayName}</p>
                                                <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                                                <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">{adminRole}</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-5 border-t border-neutral-100 space-y-3 text-xs">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-neutral-400 font-bold">Account Type</span>
                                                <span className="text-neutral-800 font-black">{adminRole}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="xl:col-span-2 space-y-6 text-left">
                                        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
                                            <h2 className="text-sm font-black text-neutral-900 mb-1">Profile Details</h2>
                                            <p className="text-xs text-neutral-400 mb-5">Update your display name and administrative contact email.</p>
                                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Display Name</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={profileForm.name}
                                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
                                                        <input
                                                            type="email"
                                                            required
                                                            value={profileForm.email}
                                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <button type="submit" className="bg-primary text-white font-bold px-5 py-2.5 hover:bg-primary-hover transition-colors text-xs rounded-lg cursor-pointer shadow-xs">
                                                        Save Profile
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
                                            <h2 className="text-sm font-black text-neutral-900 mb-1">Change Password</h2>
                                            <p className="text-xs text-neutral-400 mb-5">Use a strong password with at least 8 characters.</p>
                                            <form onSubmit={handleChangePassword} className="space-y-4">
                                                <div>
                                                    <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Current Password</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={passwordForm.current_password}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">New Password</label>
                                                        <input
                                                            type="password"
                                                            required
                                                            minLength={8}
                                                            value={passwordForm.password}
                                                            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Confirm Password</label>
                                                        <input
                                                            type="password"
                                                            required
                                                            minLength={8}
                                                            value={passwordForm.password_confirmation}
                                                            onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <button type="submit" className="bg-primary text-white font-bold px-5 py-2.5 hover:bg-primary-hover transition-colors text-xs rounded-lg cursor-pointer shadow-xs">
                                                        Change Password
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. SETTINGS TAB */}
                        {activeTab === 'settings' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
                                    <div>
                                        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Settings</h1>
                                        <p className="text-xs text-neutral-500 mt-1">Configure store parameters and manage customer FAQs.</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white border border-neutral-200 p-1 rounded-xl shadow-sm w-fit shrink-0">
                                        <button
                                            onClick={() => {
                                                setSettingsSubTab('configs');
                                                setFaqFormOpen(false);
                                            }}
                                            className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                                settingsSubTab === 'configs'
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'text-neutral-600 hover:text-neutral-900'
                                            }`}
                                        >
                                            Configurations
                                        </button>
                                        <button
                                            onClick={() => setSettingsSubTab('faqs')}
                                            className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                                settingsSubTab === 'faqs'
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'text-neutral-600 hover:text-neutral-900'
                                            }`}
                                        >
                                            FAQ Management
                                        </button>
                                    </div>
                                </div>

                                {settingsSubTab === 'configs' ? (
                                    <div className="space-y-6 w-full text-left">
                                        
                                         {/* Card 1: Store Information & Logos */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3">
                                                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                    <Store size={18} className="text-neutral-500" /> Store Profile & Logos
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4 border-b border-neutral-100">
                                                {/* Branded Store Logo (Light Backgrounds) */}
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center relative shrink-0">
                                                        {storeLogoFile ? (
                                                            <img src={URL.createObjectURL(storeLogoFile)} alt="Preview" className="w-full h-full object-contain p-2" />
                                                        ) : settingsForm.store_logo ? (
                                                            <img src={settingsForm.store_logo} alt="Store Logo" className="w-full h-full object-contain p-2" />
                                                        ) : (
                                                            <span className="text-[10px] text-neutral-400 font-bold uppercase">No Logo</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Branded Store Logo (Light Bg)</label>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setStoreLogoFile(e.target.files[0]);
                                                                }
                                                            }}
                                                            className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#8e5233]/10 file:text-[#8e5233] hover:file:bg-[#8e5233]/20 cursor-pointer"
                                                        />
                                                        <p className="text-[9px] text-neutral-400">Used for top of emails, login page, and light headers.</p>
                                                    </div>
                                                </div>

                                                {/* White Store Logo (Dark Backgrounds) */}
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden flex items-center justify-center relative shrink-0">
                                                        {storeLogoWhiteFile ? (
                                                            <img src={URL.createObjectURL(storeLogoWhiteFile)} alt="Preview" className="w-full h-full object-contain p-2" />
                                                        ) : settingsForm.store_logo_white ? (
                                                            <img src={settingsForm.store_logo_white} alt="Store Logo White" className="w-full h-full object-contain p-2" />
                                                        ) : (
                                                            <span className="text-[10px] text-neutral-400 font-bold uppercase">No Logo</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider">White Store Logo (Dark Bg)</label>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setStoreLogoWhiteFile(e.target.files[0]);
                                                                }
                                                            }}
                                                            className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#8e5233]/10 file:text-[#8e5233] hover:file:bg-[#8e5233]/20 cursor-pointer"
                                                        />
                                                        <p className="text-[9px] text-neutral-400">Used for store footer and dark headers.</p>
                                                    </div>
                                                </div>

                                                {/* Storefront Section Photo */}
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center relative shrink-0">
                                                        {storeImageFile ? (
                                                            <img src={URL.createObjectURL(storeImageFile)} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : settingsForm.store_image ? (
                                                            <img src={settingsForm.store_image} alt="Store Image" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] text-neutral-400 font-bold uppercase">No Photo</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Storefront Photo</label>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setStoreImageFile(e.target.files[0]);
                                                                }
                                                            }}
                                                            className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#8e5233]/10 file:text-[#8e5233] hover:file:bg-[#8e5233]/20 cursor-pointer"
                                                        />
                                                        <p className="text-[9px] text-neutral-400">Used on landing page "Where dreams Meet Cream" section.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Store Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.store_name || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Store Email Address</label>
                                                    <input 
                                                        type="email" 
                                                        value={settingsForm.store_email || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, store_email: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Store Phone Number</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.store_phone || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, store_phone: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection(['store_logo', 'store_logo_white', 'store_image', 'store_name', 'store_email', 'store_phone'], 'Store Information')}
                                                    disabled={savingSection === 'Store Information'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Store Information' ? 'Saving...' : 'Save Store Info'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card 2: Landing Page Hero Banner & Photo */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-base font-bold text-neutral-900">
                                                        Landing Page Hero Banner & Photo
                                                    </h2>
                                                    <p className="text-xs text-neutral-500 mt-0.5">
                                                        Customize the hero background photo and headlines displayed at the top of your storefront.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Hero Photo Preview & Uploader */}
                                            <div className="space-y-3">
                                                <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                                                    Hero Banner Photo
                                                </label>

                                                <div className="relative w-full h-48 sm:h-64 rounded-2xl border border-neutral-200 overflow-hidden bg-[#24161b] shadow-inner group">
                                                    {heroBgImageFile ? (
                                                        <img 
                                                            src={URL.createObjectURL(heroBgImageFile)} 
                                                            alt="Hero Preview" 
                                                            className="w-full h-full object-cover object-center"
                                                        />
                                                    ) : settingsForm.hero_bg_image ? (
                                                        <img 
                                                            src={settingsForm.hero_bg_image} 
                                                            alt="Hero Banner" 
                                                            className="w-full h-full object-cover object-center"
                                                            onError={(e) => { e.target.src = '/images/hero-bg.png'; }}
                                                        />
                                                    ) : (
                                                        <img 
                                                            src="/images/hero-bg.png" 
                                                            alt="Default Hero Banner" 
                                                            className="w-full h-full object-cover object-center"
                                                        />
                                                    )}
                                                    {/* Live Preview Text Overlay matching landing page */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-[#24161b]/85 via-[#24161b]/45 to-transparent pointer-events-none flex items-end p-4 sm:p-6">
                                                        <div className="text-white text-left">
                                                            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs border border-white/20">
                                                                Live Preview Overlay
                                                            </span>
                                                            <h3 className="font-extrabold text-sm sm:text-base mt-2">
                                                                {settingsForm.hero_title_line_1 || 'HOT OR COLD, WE'} {settingsForm.hero_title_line_2_prefix || 'SERVE'} <span className="font-serif italic text-amber-300">{settingsForm.hero_title_highlight || 'Sweetness'}</span>
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                                                    <div className="space-y-1">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setHeroBgImageFile(e.target.files[0]);
                                                                }
                                                            }}
                                                            className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#8e5233]/10 file:text-[#8e5233] hover:file:bg-[#8e5233]/20 cursor-pointer"
                                                        />
                                                        <p className="text-[10px] text-neutral-400">
                                                            Recommended: 1920×800px or high-resolution landscape photo (JPG, PNG, WEBP).
                                                        </p>
                                                    </div>

                                                    {(heroBgImageFile || (settingsForm.hero_bg_image && settingsForm.hero_bg_image !== '/images/hero-bg.png')) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setHeroBgImageFile(null);
                                                                setSettingsForm({ ...settingsForm, hero_bg_image: '/images/hero-bg.png' });
                                                            }}
                                                            className="text-[11px] font-bold text-neutral-600 hover:text-rose-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-rose-200 bg-neutral-50 transition-colors cursor-pointer"
                                                        >
                                                            <RotateCcw size={12} />
                                                            <span>Reset to Default Photo</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hero Typography & Headlines */}
                                            <div className="space-y-4 pt-3 border-t border-neutral-100">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                                                    Hero Typography & Text
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Title Line 1</label>
                                                        <input 
                                                            type="text" 
                                                            value={settingsForm.hero_title_line_1 || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, hero_title_line_1: e.target.value })}
                                                            placeholder="HOT OR COLD, WE"
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Title Line 2 Prefix</label>
                                                        <input 
                                                            type="text" 
                                                            value={settingsForm.hero_title_line_2_prefix || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, hero_title_line_2_prefix: e.target.value })}
                                                            placeholder="SERVE"
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Highlight Word (Script Accent)</label>
                                                        <input 
                                                            type="text" 
                                                            value={settingsForm.hero_title_highlight || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, hero_title_highlight: e.target.value })}
                                                            placeholder="Sweetness"
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Hero Subtitle / Description</label>
                                                    <textarea 
                                                        rows={2}
                                                        value={settingsForm.hero_subtitle || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })}
                                                        placeholder="We are the best dessert spot for your cravings. Handcrafted waffles, sundaes, and shakes served fresh daily."
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection(['hero_bg_image', 'hero_title_line_1', 'hero_title_line_2_prefix', 'hero_title_highlight', 'hero_subtitle'], 'Hero Banner')}
                                                    disabled={savingSection === 'Hero Banner'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Hero Banner' ? 'Saving...' : 'Save Hero Banner'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card 3: Location & Coordinates */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3">
                                                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                    <MapPin size={18} className="text-neutral-500" /> Location & Coordinates
                                                </h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Store Street Address</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.store_address || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, store_address: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Store Postcode</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.store_postcode || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, store_postcode: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Latitude (Coordinates)</label>
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        value={settingsForm.store_latitude || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, store_latitude: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Longitude (Coordinates)</label>
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        value={settingsForm.store_longitude || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, store_longitude: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection(['store_address', 'store_postcode', 'store_latitude', 'store_longitude'], 'Location Settings')}
                                                    disabled={savingSection === 'Location Settings'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Location Settings' ? 'Saving...' : 'Save Location'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card 3: Delivery Parameters */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                        <Truck size={18} className="text-neutral-500" /> Home Delivery & Uber Direct Parameters
                                                    </h2>
                                                    <p className="text-xs text-neutral-500 mt-0.5">
                                                        Control home delivery availability and distance settings. (All Uber Direct dispatch code remains fully preserved).
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                        (settingsForm.home_delivery_enabled ?? '0') === '1'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {(settingsForm.home_delivery_enabled ?? '0') === '1' ? '🚚 Delivery Active' : '⏸️ Delivery Disabled (Collection & Dine-In Mode)'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Home Delivery Enable Toggle */}
                                            <div className="p-4 bg-neutral-50/70 border border-neutral-200/80 rounded-xl space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className="block text-neutral-800 text-xs font-bold">
                                                            Enable Home Delivery on Storefront
                                                        </label>
                                                        <p className="text-[11px] text-neutral-500 mt-0.5">
                                                            When turned off, customers will order via Self-Collection or In-Store Table Dine-In.
                                                        </p>
                                                    </div>
                                                    <select
                                                        value={settingsForm.home_delivery_enabled ?? '0'}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, home_delivery_enabled: e.target.value })}
                                                        className="bg-white border border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-800 rounded-lg cursor-pointer focus:outline-none focus:border-neutral-950"
                                                    >
                                                        <option value="0">Disabled (Collection & Dine-In Only)</option>
                                                        <option value="1">Enabled (Active on Storefront)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Max Delivery Radius (Miles)</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.1"
                                                        value={settingsForm.store_delivery_max_radius_miles || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, store_delivery_max_radius_miles: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Flat Delivery Fee (£)</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        value={settingsForm.delivery_fee || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        placeholder="e.g. 3.00"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Free Delivery Threshold (£)</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        value={settingsForm.free_delivery_threshold || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, free_delivery_threshold: e.target.value })}
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        placeholder="e.g. 15.00"
                                                    />
                                                    <p className="text-[10px] text-neutral-400 mt-1">Orders at or above this amount get free delivery.</p>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection(['home_delivery_enabled', 'store_delivery_max_radius_miles', 'delivery_fee', 'free_delivery_threshold'], 'Delivery Parameters')}
                                                    disabled={savingSection === 'Delivery Parameters'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Delivery Parameters' ? 'Saving...' : 'Save Delivery Settings'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card: Payment Gateways & Providers (Stripe & Global Payments) */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                        <CreditCard size={18} className="text-rose-500" /> Payment Gateways & Providers
                                                    </h2>
                                                    <p className="text-xs text-neutral-500 mt-1">
                                                        Select your active payment gateway and configure API credentials for Stripe and Global Payments.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Active Gateway Selector */}
                                            <div className="space-y-3">
                                                <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                                                    Active Payment Gateway for Storefront *
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {[
                                                        { id: 'stripe', title: 'Stripe', sub: 'Standard card checkout', badge: 'Popular' },
                                                        { id: 'globalpay', title: 'Global Payments', sub: 'developer.globalpay.com', badge: 'GP-API' },
                                                        { id: 'both', title: 'Both Providers', sub: 'Customer chooses at checkout', badge: 'Multi' }
                                                    ].map((gw) => {
                                                        const isSelected = (settingsForm.payment_gateway || 'stripe') === gw.id;
                                                        return (
                                                            <div
                                                                key={gw.id}
                                                                onClick={() => setSettingsForm({ ...settingsForm, payment_gateway: gw.id })}
                                                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                                                    isSelected
                                                                        ? 'border-primary bg-stone-50/60 shadow-2xs'
                                                                        : 'border-neutral-200/90 hover:border-neutral-300 bg-white'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs font-bold text-neutral-900">{gw.title}</span>
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                                        isSelected ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600'
                                                                    }`}>
                                                                        {gw.badge}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[11px] text-neutral-500">{gw.sub}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Global Payments Configuration */}
                                            <div className="p-5 rounded-xl border border-neutral-200/90 bg-neutral-50/50 space-y-4">
                                                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck size={16} className="text-emerald-600" />
                                                        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                                                            Global Payments Settings (GP-API)
                                                        </h3>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTestPaymentConnection('globalpay')}
                                                        disabled={testingPaymentProvider === 'globalpay'}
                                                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <RefreshCw size={12} className={testingPaymentProvider === 'globalpay' ? 'animate-spin' : ''} />
                                                        <span>{testingPaymentProvider === 'globalpay' ? 'Testing...' : 'Test Connection'}</span>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                            App ID *
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={settingsForm.globalpay_app_id || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, globalpay_app_id: e.target.value })}
                                                            placeholder="e.g. app_..."
                                                            className="w-full bg-white border border-neutral-200 px-4 py-2.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-lg transition-colors font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                            App Key / Secret *
                                                        </label>
                                                        <input 
                                                            type="password" 
                                                            value={settingsForm.globalpay_app_key || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, globalpay_app_key: e.target.value })}
                                                            placeholder={settingsForm.globalpay_app_key ? '••••••••••••••••' : 'Enter Global Payments App Key'}
                                                            className="w-full bg-white border border-neutral-200 px-4 py-2.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-lg transition-colors font-mono"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                            Account ID / Merchant ID (Optional)
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={settingsForm.globalpay_account_id || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, globalpay_account_id: e.target.value })}
                                                            placeholder="e.g. acct_..."
                                                            className="w-full bg-white border border-neutral-200 px-4 py-2.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-lg transition-colors font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                            Environment
                                                        </label>
                                                        <select
                                                            value={settingsForm.globalpay_environment || 'sandbox'}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, globalpay_environment: e.target.value })}
                                                            className="w-full bg-white border border-neutral-200 px-4 py-2.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <option value="sandbox">Sandbox (Test Mode - apis.sandbox.globalpay.com)</option>
                                                            <option value="production">Production (Live - apis.globalpay.com)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="pt-1">
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                        Checkout Experience Flow
                                                    </label>
                                                    <select
                                                        value={settingsForm.globalpay_checkout_mode || 'hosted'}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, globalpay_checkout_mode: e.target.value })}
                                                        className="w-full bg-white border border-neutral-200 px-4 py-2.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-lg transition-colors cursor-pointer font-medium"
                                                    >
                                                        <option value="embedded">Official Provider Drop-In UI (In-Page Global Payments Component)</option>
                                                        <option value="hosted">Official Bank Portal (Pay by Link Redirection)</option>
                                                    </select>
                                                    <p className="text-[11px] text-neutral-400 mt-1.5">
                                                        {settingsForm.globalpay_checkout_mode === 'embedded'
                                                            ? '✨ Official Drop-In UI: Renders Global Payments official secure iframe fields directly on the checkout page with full bank badges & 3D Secure.'
                                                            : '🔗 Bank Portal Mode: Customers are redirected to the official Global Payments hosted platform (pay.globalpay.com) to complete payment.'}
                                                    </p>
                                                </div>

                                                {/* Global Payments Webhook & Dispute Monitoring */}
                                                <div className="pt-2 border-t border-neutral-200/60 space-y-3">
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                            Webhook Secret Key (Optional - for signature verification)
                                                        </label>
                                                        <input 
                                                            type="password" 
                                                            value={settingsForm.globalpay_webhook_secret || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, globalpay_webhook_secret: e.target.value })}
                                                            placeholder={settingsForm.globalpay_webhook_secret ? '••••••••••••••••' : 'Enter Webhook Secret from Global Payments Portal'}
                                                            className="w-full bg-white border border-neutral-200 px-4 py-2.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-lg transition-colors font-mono"
                                                        />
                                                    </div>

                                                    <div className="p-3 bg-white border border-neutral-200/80 rounded-xl space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-neutral-700">Global Payments Webhook Endpoint URL</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const url = `${window.location.origin}/api/webhooks/globalpay`;
                                                                    navigator.clipboard.writeText(url);
                                                                    toast.success('Webhook URL copied to clipboard!');
                                                                }}
                                                                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                                            >
                                                                Copy URL
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] font-mono text-neutral-600 select-all break-all bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                                                            {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/globalpay` : '/api/webhooks/globalpay'}
                                                        </p>
                                                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                                                            Paste this Webhook URL in your Global Payments Merchant Portal. Handles disputes, chargebacks, fraud flags, reversals, and real-time payment confirmations.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stripe Configuration */}
                                            <div className="p-5 rounded-xl border border-neutral-200/90 bg-neutral-50/50 space-y-4">
                                                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard size={16} className="text-indigo-600" />
                                                        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                                                            Stripe Gateway Settings
                                                        </h3>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTestPaymentConnection('stripe')}
                                                        disabled={testingPaymentProvider === 'stripe'}
                                                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <RefreshCw size={12} className={testingPaymentProvider === 'stripe' ? 'animate-spin' : ''} />
                                                        <span>{testingPaymentProvider === 'stripe' ? 'Testing...' : 'Test Connection'}</span>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                            Stripe Publishable Key
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={settingsForm.stripe_publishable_key || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, stripe_publishable_key: e.target.value })}
                                                            placeholder="pk_live_... or pk_test_..."
                                                            className="w-full bg-white border border-neutral-200 px-4 py-2.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-lg transition-colors font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                            Stripe Secret Key
                                                        </label>
                                                        <input 
                                                            type="password" 
                                                            value={settingsForm.stripe_secret_key || ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, stripe_secret_key: e.target.value })}
                                                            placeholder={settingsForm.stripe_secret_key ? '••••••••••••••••' : 'sk_live_... or sk_test_...'}
                                                            className="w-full bg-white border border-neutral-200 px-4 py-2.5 text-xs text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-lg transition-colors font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection([
                                                        'payment_gateway',
                                                        'globalpay_app_id',
                                                        'globalpay_app_key',
                                                        'globalpay_account_id',
                                                        'globalpay_environment',
                                                        'globalpay_checkout_mode',
                                                        'globalpay_webhook_secret',
                                                        'stripe_publishable_key',
                                                        'stripe_secret_key',
                                                        'stripe_webhook_secret'
                                                    ], 'Payment Gateway Settings')}
                                                    disabled={savingSection === 'Payment Gateway Settings'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Payment Gateway Settings' ? 'Saving...' : 'Save Payment Gateways'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card: Automated Order Status Progression & Timers */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                        <Timer size={18} className="text-amber-500" /> Automated Order Status Progression & Timers
                                                    </h2>
                                                    <p className="text-xs text-neutral-500 mt-1">
                                                        Hands-free automatic workflow. Orders advance based on payment status, receipt printing, and customizable time limits.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                        (settingsForm.auto_status_transition_enabled ?? '1') === '1'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                                    }`}>
                                                        {(settingsForm.auto_status_transition_enabled ?? '1') === '1' ? '⚡ Automation Active' : '⏸️ Automation Paused'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Visual Flow Pipeline */}
                                            <div className="p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/70">
                                                <label className="block text-neutral-400 text-[9px] font-bold uppercase tracking-wider mb-2.5">
                                                    Automated Lifecycle Pipeline
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                                                    <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
                                                        <div className="flex items-center justify-between font-bold text-neutral-800 mb-1">
                                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 1. Pending</span>
                                                        </div>
                                                        <p className="text-[11px] text-neutral-500">Placed by customer, awaiting payment clearance</p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
                                                        <div className="flex items-center justify-between font-bold text-neutral-800 mb-1">
                                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 2. Preparing</span>
                                                        </div>
                                                        <p className="text-[11px] text-neutral-500">Payment clears & receipt prints automatically</p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
                                                        <div className="flex items-center justify-between font-bold text-neutral-800 mb-1">
                                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> 3. Ready</span>
                                                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">+{settingsForm.auto_status_preparing_minutes ?? 15}m</span>
                                                        </div>
                                                        <p className="text-[11px] text-neutral-500">Auto-ready for collection / courier dispatch</p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
                                                        <div className="flex items-center justify-between font-bold text-neutral-800 mb-1">
                                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 4. Completed</span>
                                                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">+{settingsForm.auto_status_ready_minutes ?? 5}m</span>
                                                        </div>
                                                        <p className="text-[11px] text-neutral-500">Order fulfilled & closed. (*Declines &rarr; Cancelled)</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Controls */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div className="space-y-2">
                                                    <label className="block text-neutral-600 text-[11px] font-bold uppercase tracking-wider">
                                                        Enable Auto-Progression
                                                    </label>
                                                    <select
                                                        value={settingsForm.auto_status_transition_enabled ?? '1'}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, auto_status_transition_enabled: e.target.value })}
                                                        className="w-full bg-white border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-xl cursor-pointer"
                                                    >
                                                        <option value="1">Enabled (Hands-free Automatic Progression)</option>
                                                        <option value="0">Disabled (Manual Staff Status Control Only)</option>
                                                    </select>
                                                    <p className="text-[11px] text-neutral-400">
                                                        When enabled, the system automatically advances orders through the timeline.
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-neutral-600 text-[11px] font-bold uppercase tracking-wider">
                                                        Preparing &rarr; Ready Time (Minutes) *
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="180"
                                                            value={settingsForm.auto_status_preparing_minutes ?? 15}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, auto_status_preparing_minutes: e.target.value })}
                                                            className="w-full bg-white border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-xl font-mono"
                                                            placeholder="15"
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-medium pointer-events-none">mins</span>
                                                    </div>
                                                    <p className="text-[11px] text-neutral-400">
                                                        Duration in Preparing before moving to Ready (Default: 15 mins).
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-neutral-600 text-[11px] font-bold uppercase tracking-wider">
                                                        Ready &rarr; Completed Time (Minutes) *
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="120"
                                                            value={settingsForm.auto_status_ready_minutes ?? 5}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, auto_status_ready_minutes: e.target.value })}
                                                            className="w-full bg-white border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold text-neutral-800 focus:border-neutral-950 focus:outline-none rounded-xl font-mono"
                                                            placeholder="5"
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-medium pointer-events-none">mins</span>
                                                    </div>
                                                    <p className="text-[11px] text-neutral-400">
                                                        Duration in Ready before moving to Completed (Default: 5 mins).
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Save Button */}
                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection([
                                                        'auto_status_transition_enabled',
                                                        'auto_status_preparing_minutes',
                                                        'auto_status_ready_minutes'
                                                    ], 'Order Automation Settings')}
                                                    disabled={savingSection === 'Order Automation Settings'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Order Automation Settings' ? 'Saving...' : 'Save Order Automation Timers'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card 4: Social Links (Dynamic Multiple Platforms & Accounts) */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                        <Users size={18} className="text-neutral-500" /> Social Links & Channels
                                                    </h2>
                                                    <p className="text-xs text-neutral-500 mt-0.5">
                                                        Add multiple social accounts across any platform. These will automatically appear with their official logos in the website footer.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        let list = [];
                                                        if (settingsForm.social_links) {
                                                            try {
                                                                const p = typeof settingsForm.social_links === 'string' ? JSON.parse(settingsForm.social_links) : settingsForm.social_links;
                                                                if (Array.isArray(p)) list = p;
                                                            } catch (e) {}
                                                        }
                                                        if (list.length === 0) {
                                                            if (settingsForm.social_instagram) list.push({ platform: 'instagram', url: settingsForm.social_instagram, label: 'Instagram' });
                                                            if (settingsForm.social_tiktok) list.push({ platform: 'tiktok', url: settingsForm.social_tiktok, label: 'TikTok' });
                                                            if (settingsForm.social_facebook) list.push({ platform: 'facebook', url: settingsForm.social_facebook, label: 'Facebook' });
                                                            if (settingsForm.social_twitter) list.push({ platform: 'twitter', url: settingsForm.social_twitter, label: 'Twitter / X' });
                                                        }
                                                        const updated = [...list, { platform: 'instagram', url: '', label: '' }];
                                                        setSettingsForm({ ...settingsForm, social_links: JSON.stringify(updated) });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer shrink-0"
                                                >
                                                    <Plus size={14} />
                                                    <span>Add Social Link</span>
                                                </button>
                                            </div>

                                            {/* Social Links Rows */}
                                            {(() => {
                                                let list = [];
                                                if (settingsForm.social_links) {
                                                    try {
                                                        const p = typeof settingsForm.social_links === 'string' ? JSON.parse(settingsForm.social_links) : settingsForm.social_links;
                                                        if (Array.isArray(p)) list = p;
                                                    } catch (e) {}
                                                }
                                                if (list.length === 0) {
                                                    if (settingsForm.social_instagram) list.push({ platform: 'instagram', url: settingsForm.social_instagram, label: 'Instagram' });
                                                    if (settingsForm.social_tiktok) list.push({ platform: 'tiktok', url: settingsForm.social_tiktok, label: 'TikTok' });
                                                    if (settingsForm.social_facebook) list.push({ platform: 'facebook', url: settingsForm.social_facebook, label: 'Facebook' });
                                                    if (settingsForm.social_twitter) list.push({ platform: 'twitter', url: settingsForm.social_twitter, label: 'Twitter / X' });
                                                }
                                                if (list.length === 0) {
                                                    list = [
                                                        { platform: 'instagram', url: '', label: '' },
                                                        { platform: 'tiktok', url: '', label: '' },
                                                    ];
                                                }

                                                return (
                                                    <div className="space-y-3">
                                                        {list.map((item, idx) => {
                                                            const platformInfo = getPlatformInfo(item.platform);

                                                            return (
                                                                <div key={idx} className="bg-neutral-50/70 border border-neutral-200/80 p-3.5 sm:p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-all hover:border-neutral-300">
                                                                    {/* Platform Icon Badge & Select */}
                                                                    <div className="flex items-center gap-2.5 min-w-[200px] shrink-0">
                                                                        <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-800 shadow-2xs shrink-0">
                                                                            <SocialIcon platform={item.platform} className="w-4 h-4" size={16} />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="block text-neutral-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Platform</label>
                                                                            <select
                                                                                value={item.platform || 'instagram'}
                                                                                onChange={(e) => {
                                                                                    const updated = [...list];
                                                                                    updated[idx] = { ...updated[idx], platform: e.target.value };
                                                                                    setSettingsForm({ ...settingsForm, social_links: JSON.stringify(updated) });
                                                                                }}
                                                                                className="w-full bg-white border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-800 font-medium focus:bg-white focus:border-neutral-950 focus:outline-none rounded-lg cursor-pointer"
                                                                            >
                                                                                {SOCIAL_PLATFORMS.map(p => (
                                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    {/* Custom Label / Handle */}
                                                                    <div className="w-full md:w-56 shrink-0">
                                                                        <label className="block text-neutral-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                                                                            Label / Handle (Optional)
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.label || ''}
                                                                            onChange={(e) => {
                                                                                const updated = [...list];
                                                                                updated[idx] = { ...updated[idx], label: e.target.value };
                                                                                setSettingsForm({ ...settingsForm, social_links: JSON.stringify(updated) });
                                                                            }}
                                                                            placeholder={platformInfo.defaultLabel}
                                                                            className="w-full bg-white border border-neutral-200 px-3 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none rounded-lg"
                                                                        />
                                                                    </div>

                                                                    {/* URL Link */}
                                                                    <div className="flex-1">
                                                                        <label className="block text-neutral-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                                                                            Profile / Channel URL
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.url || ''}
                                                                            onChange={(e) => {
                                                                                const updated = [...list];
                                                                                updated[idx] = { ...updated[idx], url: e.target.value };
                                                                                setSettingsForm({ ...settingsForm, social_links: JSON.stringify(updated) });
                                                                            }}
                                                                            placeholder={platformInfo.defaultPlaceholder}
                                                                            className="w-full bg-white border border-neutral-200 px-3 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none rounded-lg font-mono text-[11px]"
                                                                        />
                                                                    </div>

                                                                    {/* Actions (Delete button) */}
                                                                    <div className="flex items-end justify-end md:self-end pt-1 md:pt-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const updated = list.filter((_, i) => i !== idx);
                                                                                setSettingsForm({ ...settingsForm, social_links: JSON.stringify(updated) });
                                                                            }}
                                                                            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                                                            title="Delete social link"
                                                                        >
                                                                            <Trash2 size={15} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}

                                            {/* Bottom Actions */}
                                            <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        let list = [];
                                                        if (settingsForm.social_links) {
                                                            try {
                                                                const p = typeof settingsForm.social_links === 'string' ? JSON.parse(settingsForm.social_links) : settingsForm.social_links;
                                                                if (Array.isArray(p)) list = p;
                                                            } catch (e) {}
                                                        }
                                                        if (list.length === 0) {
                                                            if (settingsForm.social_instagram) list.push({ platform: 'instagram', url: settingsForm.social_instagram, label: 'Instagram' });
                                                            if (settingsForm.social_tiktok) list.push({ platform: 'tiktok', url: settingsForm.social_tiktok, label: 'TikTok' });
                                                            if (settingsForm.social_facebook) list.push({ platform: 'facebook', url: settingsForm.social_facebook, label: 'Facebook' });
                                                            if (settingsForm.social_twitter) list.push({ platform: 'twitter', url: settingsForm.social_twitter, label: 'Twitter / X' });
                                                        }
                                                        const updated = [...list, { platform: 'instagram', url: '', label: '' }];
                                                        setSettingsForm({ ...settingsForm, social_links: JSON.stringify(updated) });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                                                >
                                                    <Plus size={14} />
                                                    <span>Add Another Social Account</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        let list = [];
                                                        if (settingsForm.social_links) {
                                                            try {
                                                                const p = typeof settingsForm.social_links === 'string' ? JSON.parse(settingsForm.social_links) : settingsForm.social_links;
                                                                if (Array.isArray(p)) list = p;
                                                            } catch (e) {}
                                                        }
                                                        if (list.length === 0) {
                                                            if (settingsForm.social_instagram) list.push({ platform: 'instagram', url: settingsForm.social_instagram, label: 'Instagram' });
                                                            if (settingsForm.social_tiktok) list.push({ platform: 'tiktok', url: settingsForm.social_tiktok, label: 'TikTok' });
                                                            if (settingsForm.social_facebook) list.push({ platform: 'facebook', url: settingsForm.social_facebook, label: 'Facebook' });
                                                            if (settingsForm.social_twitter) list.push({ platform: 'twitter', url: settingsForm.social_twitter, label: 'Twitter / X' });
                                                        }

                                                        const ig = list.find(l => l.platform === 'instagram')?.url || '';
                                                        const tt = list.find(l => l.platform === 'tiktok')?.url || '';
                                                        const fb = list.find(l => l.platform === 'facebook')?.url || '';
                                                        const tw = list.find(l => l.platform === 'twitter')?.url || '';

                                                        const jsonStr = JSON.stringify(list);
                                                        const updated = {
                                                            ...settingsForm,
                                                            social_links: jsonStr,
                                                            social_instagram: ig,
                                                            social_tiktok: tt,
                                                            social_facebook: fb,
                                                            social_twitter: tw,
                                                        };
                                                        setSettingsForm(updated);

                                                        handleSaveSection(['social_links', 'social_instagram', 'social_tiktok', 'social_facebook', 'social_twitter'], 'Social Links');
                                                    }}
                                                    disabled={savingSection === 'Social Links'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Social Links' ? 'Saving...' : 'Save Social Links'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card: Footer & Copyright Information */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3">
                                                <h2 className="text-base font-bold text-neutral-900">
                                                    Footer & Copyright Information
                                                </h2>
                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                    Customize the copyright notice and credits displayed at the bottom of every page.
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Copyright Line</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.footer_copyright ?? ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, footer_copyright: e.target.value })}
                                                        placeholder="© 2026 SweetSpot Bake, by Captoirs Studio"
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                    <p className="text-[10px] text-neutral-400 mt-1">Default: &copy; 2026 SweetSpot Bake, by Captoirs Studio</p>
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Subtext / Rights Note</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.footer_subtext ?? ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, footer_subtext: e.target.value })}
                                                        placeholder="All rights reserved"
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                    <p className="text-[10px] text-neutral-400 mt-1">Default: All rights reserved</p>
                                                </div>

                                                {/* Live Footer Preview */}
                                                <div className="pt-2">
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Live Footer Preview</label>
                                                    <div className="bg-[#1a120f] p-5 rounded-xl border border-neutral-800 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[12px] text-white/50 font-light">
                                                                {settingsForm.footer_copyright || '© 2026 SweetSpot Bake, by Captoirs Studio'}
                                                            </p>
                                                            <p className="text-[12px] text-white/50 font-light mt-0.5">
                                                                {settingsForm.footer_subtext || 'All rights reserved'}
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] uppercase font-bold text-white/30 border border-white/10 px-2.5 py-1 rounded-md">
                                                            Storefront Footer
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection(['footer_copyright', 'footer_subtext'], 'Footer Information')}
                                                    disabled={savingSection === 'Footer Information'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Footer Information' ? 'Saving...' : 'Save Footer Details'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card: Downloadable Menu & PDF */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3">
                                                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                    <FileText size={18} className="text-neutral-500" /> Downloadable Menu & PDF
                                                </h2>
                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                    Manage the PDF document and texts displayed on the customer menu page (<code className="text-primary font-mono text-[11px]">/menu</code>).
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Page Main Title</label>
                                                        <input 
                                                            type="text" 
                                                            value={settingsForm.menu_title ?? ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, menu_title: e.target.value })}
                                                            placeholder="Our Menu"
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                        <p className="text-[10px] text-neutral-400 mt-1">Default: Our Menu</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Page Subtitle</label>
                                                        <input 
                                                            type="text" 
                                                            value={settingsForm.menu_subtitle ?? ''}
                                                            onChange={(e) => setSettingsForm({ ...settingsForm, menu_subtitle: e.target.value })}
                                                            placeholder="Browse our full menu below or download a copy to view offline."
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                        />
                                                        <p className="text-[10px] text-neutral-400 mt-1">Default: Browse our full menu below or download a copy to view offline.</p>
                                                    </div>
                                                </div>

                                                {/* PDF File Upload & Status */}
                                                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-neutral-900">
                                                                    {menuPdfFile 
                                                                        ? menuPdfFile.name 
                                                                        : (settingsForm.menu_pdf ? 'Custom PDF Menu Uploaded' : 'No PDF Menu Uploaded')
                                                                    }
                                                                </p>
                                                                <p className="text-[10px] text-neutral-400">
                                                                    {settingsForm.menu_pdf 
                                                                        ? `Active file: ${settingsForm.menu_pdf}` 
                                                                        : 'Upload a PDF menu to make it viewable on /menu.'
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {(menuPdfFile || settingsForm.menu_pdf) && (
                                                                <a
                                                                    href={menuPdfFile ? URL.createObjectURL(menuPdfFile) : settingsForm.menu_pdf}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                                                >
                                                                    <Download size={13} />
                                                                    <span>Preview PDF</span>
                                                                </a>
                                                            )}
                                                            {settingsForm.menu_pdf && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSettingsForm({ ...settingsForm, menu_pdf: '' });
                                                                        setMenuPdfFile(null);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                                                    title="Remove uploaded PDF menu"
                                                                >
                                                                    Remove PDF
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                                                                Upload New Menu PDF
                                                            </label>
                                                            <input 
                                                                type="file" 
                                                                accept="application/pdf"
                                                                onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        setMenuPdfFile(e.target.files[0]);
                                                                    }
                                                                }}
                                                                className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#8e5233]/10 file:text-[#8e5233] hover:file:bg-[#8e5233]/20 cursor-pointer"
                                                            />
                                                        </div>
                                                        {menuPdfFile && (
                                                            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                                Ready to save
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection(['menu_title', 'menu_subtitle', 'menu_pdf'], 'PDF Menu Settings')}
                                                    disabled={savingSection === 'PDF Menu Settings'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'PDF Menu Settings' ? 'Saving...' : 'Save Menu PDF'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card 5: SEO & Metadata Settings */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3">
                                                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                    <Globe size={18} className="text-neutral-500" /> SEO & Metadata Settings
                                                </h2>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Default Browser Title</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.seo_title || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, seo_title: e.target.value })}
                                                        placeholder="e.g. Handcrafted Cakes & Specialty Coffee | Sweet Spot System"
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                    />
                                                    <p className="text-[10px] text-neutral-400 mt-1">Shown in browser tab and search engine results. Keeps it under 60 characters.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Meta Description</label>
                                                    <textarea 
                                                        rows={3}
                                                        value={settingsForm.seo_description || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, seo_description: e.target.value })}
                                                        placeholder="Enter a brief summary of your shop for search engines..."
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                                                    />
                                                    <p className="text-[10px] text-neutral-400 mt-1">Brief summary shown in search results. Highly recommended to keep between 120 and 160 characters.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Meta Keywords</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.seo_keywords || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, seo_keywords: e.target.value })}
                                                        placeholder="e.g. cakes, coffee, london, store, artisanal, pastries"
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                                                    />
                                                    <p className="text-[10px] text-neutral-400 mt-1">Comma-separated list of search terms representing your business.</p>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection(['seo_title', 'seo_description', 'seo_keywords'], 'SEO Settings')}
                                                    disabled={savingSection === 'SEO Settings'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'SEO Settings' ? 'Saving...' : 'Save SEO Settings'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card 6: Why Choose Us / The Sweet Spot Difference */}
                                        <div className="bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
                                            <div className="border-b border-neutral-100 pb-3">
                                                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                                    "Why Choose Us" / Difference Section
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Section Badge Tag</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.diff_badge || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, diff_badge: e.target.value })}
                                                        placeholder="Why Choose Us"
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Title Heading Line 1</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.diff_title_1 || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, diff_title_1: e.target.value })}
                                                        placeholder="The Sweet Spot"
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Title Heading Line 2 (Highlighted)</label>
                                                    <input 
                                                        type="text" 
                                                        value={settingsForm.diff_title_2 || ''}
                                                        onChange={(e) => setSettingsForm({ ...settingsForm, diff_title_2: e.target.value })}
                                                        placeholder="Difference"
                                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Section Subtitle Paragraph</label>
                                                <textarea 
                                                    rows={2}
                                                    value={settingsForm.diff_description || ''}
                                                    onChange={(e) => setSettingsForm({ ...settingsForm, diff_description: e.target.value })}
                                                    placeholder="What makes us special? It's the little things — made with intention, served with love."
                                                    className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                                                />
                                            </div>

                                            <div className="space-y-4 pt-2">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 border-b border-neutral-100 pb-1">
                                                    Accordion Feature Cards (3 Highlights)
                                                </p>
                                                
                                                {/* Card 1 */}
                                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-3">
                                                    <span className="text-[10px] font-extrabold uppercase text-rose-600 tracking-wider">Highlight Card 1</span>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div className="md:col-span-1">
                                                            <label className="block text-neutral-500 text-[9px] font-bold uppercase tracking-wider mb-1">Title</label>
                                                            <input 
                                                                type="text"
                                                                value={settingsForm.diff_item_1_title || ''}
                                                                onChange={(e) => setSettingsForm({ ...settingsForm, diff_item_1_title: e.target.value })}
                                                                placeholder="Made with love"
                                                                className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs text-neutral-800 focus:outline-none rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-neutral-500 text-[9px] font-bold uppercase tracking-wider mb-1">Content Text</label>
                                                            <textarea 
                                                                rows={2}
                                                                value={settingsForm.diff_item_1_content || ''}
                                                                onChange={(e) => setSettingsForm({ ...settingsForm, diff_item_1_content: e.target.value })}
                                                                placeholder="Every dessert is crafted by hand using traditional recipes..."
                                                                className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs text-neutral-800 focus:outline-none rounded-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card 2 */}
                                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-3">
                                                    <span className="text-[10px] font-extrabold uppercase text-rose-600 tracking-wider">Highlight Card 2</span>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div className="md:col-span-1">
                                                            <label className="block text-neutral-500 text-[9px] font-bold uppercase tracking-wider mb-1">Title</label>
                                                            <input 
                                                                type="text"
                                                                value={settingsForm.diff_item_2_title || ''}
                                                                onChange={(e) => setSettingsForm({ ...settingsForm, diff_item_2_title: e.target.value })}
                                                                placeholder="Premium Ingredients"
                                                                className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs text-neutral-800 focus:outline-none rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-neutral-500 text-[9px] font-bold uppercase tracking-wider mb-1">Content Text</label>
                                                            <textarea 
                                                                rows={2}
                                                                value={settingsForm.diff_item_2_content || ''}
                                                                onChange={(e) => setSettingsForm({ ...settingsForm, diff_item_2_content: e.target.value })}
                                                                placeholder="We source real Madagascan vanilla pods..."
                                                                className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs text-neutral-800 focus:outline-none rounded-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card 3 */}
                                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-3">
                                                    <span className="text-[10px] font-extrabold uppercase text-rose-600 tracking-wider">Highlight Card 3</span>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div className="md:col-span-1">
                                                            <label className="block text-neutral-500 text-[9px] font-bold uppercase tracking-wider mb-1">Title</label>
                                                            <input 
                                                                type="text"
                                                                value={settingsForm.diff_item_3_title || ''}
                                                                onChange={(e) => setSettingsForm({ ...settingsForm, diff_item_3_title: e.target.value })}
                                                                placeholder="Hygienic Promise"
                                                                className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs text-neutral-800 focus:outline-none rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-neutral-500 text-[9px] font-bold uppercase tracking-wider mb-1">Content Text</label>
                                                            <textarea 
                                                                rows={2}
                                                                value={settingsForm.diff_item_3_content || ''}
                                                                onChange={(e) => setSettingsForm({ ...settingsForm, diff_item_3_content: e.target.value })}
                                                                placeholder="Our kitchen strictly adheres to five-star food hygiene..."
                                                                className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs text-neutral-800 focus:outline-none rounded-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection(['diff_badge', 'diff_title_1', 'diff_title_2', 'diff_description', 'diff_item_1_title', 'diff_item_1_content', 'diff_item_2_title', 'diff_item_2_content', 'diff_item_3_title', 'diff_item_3_content'], 'Difference Highlights')}
                                                    disabled={savingSection === 'Difference Highlights'}
                                                    className="bg-primary hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingSection === 'Difference Highlights' ? 'Saving...' : 'Save Difference Section'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* FAQ Management Panel */
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Customer FAQs</h2>
                                            {!faqFormOpen && (
                                                <button
                                                    onClick={() => {
                                                        setFaqEditId(null);
                                                        setFaqQuestion('');
                                                        setFaqAnswer('');
                                                        setFaqSortOrder(0);
                                                        setFaqIsActive(true);
                                                        setFaqFormOpen(true);
                                                    }}
                                                    className="bg-primary text-white font-bold px-4 py-2.5 text-xs flex items-center space-x-2 transition-colors hover:bg-primary-hover rounded-lg shadow-xs"
                                                >
                                                    <Plus size={14} />
                                                    <span>Add FAQ</span>
                                                </button>
                                            )}
                                        </div>

                                        {faqFormOpen ? (
                                            /* FAQ Add/Edit Form */
                                            <div className="bg-white border border-neutral-200 p-8 rounded-xl shadow-sm text-left w-full">
                                                <h3 className="text-lg font-bold text-neutral-900 mb-6">{faqEditId ? 'Edit FAQ' : 'Create FAQ'}</h3>
                                                <form onSubmit={handleSaveFaq} className="space-y-5">
                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Question</label>
                                                        <input 
                                                            type="text"
                                                            required
                                                            value={faqQuestion}
                                                            onChange={(e) => setFaqQuestion(e.target.value)}
                                                            placeholder="e.g., What are your opening hours?"
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Answer</label>
                                                        <textarea 
                                                            required
                                                            rows={4}
                                                            value={faqAnswer}
                                                            onChange={(e) => setFaqAnswer(e.target.value)}
                                                            placeholder="Enter the detailed answer here..."
                                                            className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Sort Order</label>
                                                            <input 
                                                                type="number"
                                                                value={faqSortOrder}
                                                                onChange={(e) => setFaqSortOrder(parseInt(e.target.value) || 0)}
                                                                className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-800 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 rounded-lg transition-colors"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between border border-neutral-200 rounded-lg px-4 py-3 bg-neutral-50 self-end h-[46px]">
                                                            <span className="text-xs font-bold text-neutral-600">Active / Visible</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFaqIsActive(prev => !prev)}
                                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                    faqIsActive ? 'bg-primary' : 'bg-neutral-200'
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                                        faqIsActive ? 'translate-x-4' : 'translate-x-0'
                                                                    }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-3 pt-4 border-t border-neutral-100">
                                                        <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 text-xs transition-colors rounded-lg cursor-pointer shadow-xs">
                                                            Save FAQ
                                                        </button>
                                                        <button type="button" onClick={() => setFaqFormOpen(false)} className="bg-neutral-100 text-neutral-600 font-bold px-6 py-2.5 text-xs hover:bg-neutral-200 transition-colors rounded-lg">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        ) : (
                                            /* FAQ List Table */
                                            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden text-left w-full">
                                                {faqs.length === 0 ? (
                                                    <p className="text-neutral-450 text-xs py-12 text-center">No FAQs configured yet. Click "Add FAQ" to get started.</p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 uppercase tracking-wider font-bold text-[10px]">
                                                                    <th className="py-3.5 px-6 text-left font-bold w-1/2">Question</th>
                                                                    <th className="py-3.5 px-6 text-center font-bold">Sort Order</th>
                                                                    <th className="py-3.5 px-6 text-center font-bold">Status</th>
                                                                    <th className="py-3.5 px-6 text-right font-bold">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-neutral-200 text-neutral-700">
                                                                {faqs.map(faq => (
                                                                    <tr key={faq.id} className="hover:bg-neutral-50/50 transition-colors">
                                                                        <td className="py-4 px-6 font-semibold text-neutral-900 text-sm">{faq.question}</td>
                                                                        <td className="py-4 px-6 text-center font-mono font-bold text-neutral-600">{faq.sort_order}</td>
                                                                        <td className="py-4 px-6 text-center">
                                                                            {faq.is_active ? (
                                                                                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                                                                            ) : (
                                                                                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-neutral-100 text-neutral-550 border border-neutral-250">Hidden</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 px-6">
                                                                            <div className="flex justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setFaqEditId(faq.id);
                                                                                        setFaqQuestion(faq.question);
                                                                                        setFaqAnswer(faq.answer);
                                                                                        setFaqSortOrder(faq.sort_order);
                                                                                        setFaqIsActive(faq.is_active);
                                                                                        setFaqFormOpen(true);
                                                                                    }}
                                                                                    className="p-2 bg-neutral-50 border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 rounded-lg transition-all"
                                                                                    title="Edit FAQ"
                                                                                >
                                                                                    <Edit size={12} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteFaq(faq.id)}
                                                                                    className="p-2 bg-neutral-50 border border-neutral-200 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all"
                                                                                    title="Delete FAQ"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TRASH BIN TAB */}
                        {activeTab === 'trash' && (
                            <div className="space-y-8">
                                <div>
                                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Trash Bin</h1>
                                    <p className="text-xs text-neutral-500 mt-1">Items moved to trash are hidden from the storefront. Restore them or permanently delete them here.</p>
                                </div>

                                {/* Sub-tab selector */}
                                <div className="flex items-center gap-1 bg-white border border-neutral-200 p-1 rounded-xl shadow-sm w-fit">
                                    {[
                                        { key: 'categories', label: 'Categories', icon: <FolderTree size={13} />, count: trash.categories?.length || 0 },
                                        { key: 'products',   label: 'Products',   icon: <ShoppingBag size={13} />, count: trash.products?.length || 0 },
                                        { key: 'customers',  label: 'Customers',  icon: <Users size={13} />,     count: trash.customers?.length || 0 },
                                    ].map(t => (
                                        <button
                                            key={t.key}
                                            onClick={() => setTrashSubTab(t.key)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                trashSubTab === t.key
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                                            }`}
                                        >
                                            {t.icon}
                                            {t.label}
                                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                                                trashSubTab === t.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                                            }`}>
                                                {t.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Trash legend banner */}
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-amber-800">Items in Trash are not visible on the storefront.</p>
                                        <p className="text-[11px] text-amber-700 mt-0.5">Restoring a category does <strong>not</strong> automatically restore its trashed products — restore products individually if needed. Permanent deletion cannot be undone.</p>
                                    </div>
                                </div>

                                {/* ─── CATEGORIES TRASH ─── */}
                                {trashSubTab === 'categories' && (
                                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                                            <h2 className="font-bold text-neutral-800 text-sm">Deleted Categories</h2>
                                            <span className="text-[11px] text-neutral-400 font-semibold">{trash.categories?.length || 0} in trash</span>
                                        </div>
                                        {!trash.categories?.length ? (
                                            <div className="py-16 text-center">
                                                <Trash2 size={32} className="text-neutral-200 mx-auto mb-3" />
                                                <p className="text-neutral-400 text-sm font-medium">No categories in trash</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider font-bold text-[10px] border-b border-neutral-100">
                                                        <th className="py-3 px-6 text-left">Category</th>
                                                        <th className="py-3 px-6 text-left">Slug</th>
                                                        <th className="py-3 px-6 text-left">Deleted</th>
                                                        <th className="py-3 px-6 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100">
                                                    {trash.categories.map(cat => (
                                                        <tr key={cat.id} className="hover:bg-neutral-50/60 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <span className="font-bold text-neutral-700">{cat.name}</span>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className="font-mono text-neutral-400 text-[10px]">/categories/{cat.slug}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-neutral-400">
                                                                {formatTrashDate(cat.deleted_at)}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleRestore('category', cat.id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-lg transition-colors"
                                                                    >
                                                                        <RotateCcw size={11} /> Restore
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleForceDelete('category', cat.id, cat.name)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-[11px] font-bold rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 size={11} /> Delete Forever
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {/* ─── PRODUCTS TRASH ─── */}
                                {trashSubTab === 'products' && (
                                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                                            <h2 className="font-bold text-neutral-800 text-sm">Deleted Products</h2>
                                            <span className="text-[11px] text-neutral-400 font-semibold">{trash.products?.length || 0} in trash</span>
                                        </div>
                                        {!trash.products?.length ? (
                                            <div className="py-16 text-center">
                                                <Trash2 size={32} className="text-neutral-200 mx-auto mb-3" />
                                                <p className="text-neutral-400 text-sm font-medium">No products in trash</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider font-bold text-[10px] border-b border-neutral-100">
                                                        <th className="py-3 px-6 text-left">Product</th>
                                                        <th className="py-3 px-6 text-left">Category</th>
                                                        <th className="py-3 px-6 text-left">Status</th>
                                                        <th className="py-3 px-6 text-left">Deleted</th>
                                                        <th className="py-3 px-6 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100">
                                                    {trash.products.map(prod => (
                                                        <tr key={prod.id} className="hover:bg-neutral-50/60 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <span className="font-bold text-neutral-700 block">{prod.name}</span>
                                                                <span className="font-mono text-neutral-400 text-[10px]">/product/{prod.slug}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-neutral-500">
                                                                {prod.category ? prod.category.name : <span className="italic text-neutral-300">No category</span>}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                {prod.status ? (
                                                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">Disabled</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-6 text-neutral-400">
                                                                {formatTrashDate(prod.deleted_at)}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleRestore('product', prod.id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-lg transition-colors"
                                                                    >
                                                                        <RotateCcw size={11} /> Restore
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleForceDelete('product', prod.id, prod.name)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-[11px] font-bold rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 size={11} /> Delete Forever
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {/* ─── CUSTOMERS TRASH ─── */}
                                {trashSubTab === 'customers' && (
                                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                                            <h2 className="font-bold text-neutral-800 text-sm">Deleted Customers</h2>
                                            <span className="text-[11px] text-neutral-400 font-semibold">{trash.customers?.length || 0} in trash</span>
                                        </div>
                                        {!trash.customers?.length ? (
                                            <div className="py-16 text-center">
                                                <Trash2 size={32} className="text-neutral-200 mx-auto mb-3" />
                                                <p className="text-neutral-400 text-sm font-medium">No customers in trash</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider font-bold text-[10px] border-b border-neutral-100">
                                                        <th className="py-3 px-6 text-left">Customer</th>
                                                        <th className="py-3 px-6 text-left">Email</th>
                                                        <th className="py-3 px-6 text-left">Phone</th>
                                                        <th className="py-3 px-6 text-left">Type</th>
                                                        <th className="py-3 px-6 text-left">Deleted</th>
                                                        <th className="py-3 px-6 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100">
                                                    {trash.customers.map(cust => (
                                                        <tr key={cust.id} className="hover:bg-neutral-50/60 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <span className="font-bold text-neutral-700">{cust.first_name} {cust.last_name}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-neutral-500">{cust.email || <span className="italic text-neutral-300">—</span>}</td>
                                                            <td className="py-4 px-6 text-neutral-500">{cust.phone}</td>
                                                            <td className="py-4 px-6">
                                                                {cust.is_guest ? (
                                                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">Guest</span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">Registered</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-6 text-neutral-400">
                                                                {formatTrashDate(cust.deleted_at)}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleRestore('customer', cust.id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-lg transition-colors"
                                                                    >
                                                                        <RotateCcw size={11} /> Restore
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleForceDelete('customer', cust.id, `${cust.first_name} ${cust.last_name}`)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-[11px] font-bold rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 size={11} /> Delete Forever
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {/* COLLECTION SLOTS TAB */}
                        {activeTab === 'collectionSlots' && (
                            <AdminCollectionSlotsTab 
                                token={token}
                                openingHours={openingHours}
                                onUpdated={fetchData}
                            />
                        )}

                        {/* 11. TABLES & QR CODE ORDERING TAB */}
                        {activeTab === 'tables' && (
                            <AdminTablesTab orders={orders} configs={settings} />
                        )}

                        {/* 12. STAR CLOUDPRNT PRINTERS & QUEUE TAB */}
                        {activeTab === 'printers' && (
                            <AdminPrintersTab token={token} />
                        )}

                        {/* 13. LOCAL LOVE REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <AdminReviewsPage token={token} />
                        )}
                    </>
                )}
                </div>
            </main>

            {/* Image Cropper Modal */}
            {cropperOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-neutral-800">Crop Category Image (3:4)</h3>
                            <button
                                type="button"
                                onClick={() => setCropperOpen(false)}
                                className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-6 flex flex-col items-center gap-6 bg-neutral-50">
                            {/* Viewport Container */}
                            <div 
                                className="w-[270px] h-[360px] rounded-xl overflow-hidden relative border border-neutral-200 shadow-inner bg-neutral-200 select-none cursor-move"
                                onMouseDown={(e) => {
                                    setIsDraggingCrop(true);
                                    setDragStartCrop({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
                                }}
                                onMouseMove={(e) => {
                                    if (!isDraggingCrop) return;
                                    setCropOffset({
                                        x: e.clientX - dragStartCrop.x,
                                        y: e.clientY - dragStartCrop.y
                                    });
                                }}
                                onMouseUp={() => setIsDraggingCrop(false)}
                                onMouseLeave={() => setIsDraggingCrop(false)}
                                onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    setIsDraggingCrop(true);
                                    setDragStartCrop({ x: touch.clientX - cropOffset.x, y: touch.clientY - cropOffset.y });
                                }}
                                onTouchMove={(e) => {
                                    if (!isDraggingCrop) return;
                                    const touch = e.touches[0];
                                    setCropOffset({
                                        x: touch.clientX - dragStartCrop.x,
                                        y: touch.clientY - dragStartCrop.y
                                    });
                                }}
                                onTouchEnd={() => setIsDraggingCrop(false)}
                            >
                                <img
                                    src={cropImageUrl}
                                    alt="To Crop"
                                    onLoad={handleCropImageLoad}
                                    className="absolute pointer-events-none max-w-none origin-center"
                                    style={{
                                        transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                                        top: '50%',
                                        left: '50%',
                                        width: cropImageRenderSize.width ? `${cropImageRenderSize.width}px` : 'auto',
                                        height: cropImageRenderSize.height ? `${cropImageRenderSize.height}px` : 'auto',
                                    }}
                                />
                                {/* Overlay Grid lines for guide */}
                                <div className="absolute inset-0 border border-white/20 pointer-events-none" />
                                <div className="absolute inset-x-0 top-1/3 border-b border-white/20 pointer-events-none" />
                                <div className="absolute inset-x-0 top-2/3 border-b border-white/20 pointer-events-none" />
                                <div className="absolute inset-y-0 left-1/3 border-r border-white/20 pointer-events-none" />
                                <div className="absolute inset-y-0 left-2/3 border-r border-white/20 pointer-events-none" />
                            </div>

                            {/* Zoom Slider */}
                            <div className="w-full flex items-center gap-3 px-2">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase">Zoom</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.01"
                                    value={cropZoom}
                                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                                    className="flex-1 accent-[#8e5233] cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-neutral-600 w-8">{Math.round(cropZoom * 100)}%</span>
                            </div>
                        </div>

                        <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setCropperOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-50 rounded-xl cursor-pointer transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePerformCrop}
                                className="px-5 py-2.5 text-xs font-bold bg-[#8e5233] hover:bg-[#723e25] text-white rounded-xl cursor-pointer transition-all shadow-md shadow-[#8e5233]/25"
                            >
                                Crop & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
