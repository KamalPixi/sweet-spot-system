import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { 
    CheckCircle, Clock, MapPin, ArrowRight, ArrowLeft, 
    Loader2, Search, RefreshCw, AlertCircle, Copy, Check, Truck, 
    ExternalLink, Phone, Store, Bike, UtensilsCrossed,
    Calendar, ShieldCheck, Flame, ChefHat, Navigation, HeartHandshake,
    MessageCircle, ChevronRight, CheckCircle2, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

export default function OrderTracking() {
    const { orderNumber } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { token, user, logout, cartItemCount, isSearchOpen, setIsSearchOpen } = useApp();

    // Read new checkout query parameter
    const query = new URLSearchParams(location.search);
    const isNewCheckout = query.get('success') === 'true' || location.state?.checkoutSuccess;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [recentOrderNumber, setRecentOrderNumber] = useState('');

    // Sidebar menu state
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Direct Lookup form states (when visiting /track)
    const [lookupOrderNumber, setLookupOrderNumber] = useState('');

    // Load recent order from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('last_order_number');
        if (saved) {
            setRecentOrderNumber(saved);
        }
    }, []);

    // Fetch order handler
    const fetchOrderDetails = async (forceOrderNum = null) => {
        const targetOrderNum = forceOrderNum || orderNumber;
        if (!targetOrderNum) return;

        setLoading(true);
        setError(null);

        const url = `/api/orders/track/${targetOrderNum}`;

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(url, { headers });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || 'Order details not found. Please check your reference.');
                setLoading(false);
                return;
            }

            setOrder(data.data);
            if (data.data?.order_number) {
                localStorage.setItem('last_order_number', data.data.order_number);
                setRecentOrderNumber(data.data.order_number);
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    // Load order on mount or parameter changes
    useEffect(() => {
        if (orderNumber) {
            fetchOrderDetails();
        }
    }, [orderNumber, token]);

    // Fast polling for live updates (if order is not completed/cancelled)
    useEffect(() => {
        if (!order || ['completed', 'cancelled'].includes(order.status?.toLowerCase())) return;

        const pollTimer = setInterval(() => {
            fetchOrderDetails();
        }, 4000); // Poll every 4s

        return () => clearInterval(pollTimer);
    }, [order, orderNumber]);

    // Handle lookup form submit (Direct /track page)
    const handleLookupSubmit = (e) => {
        e.preventDefault();
        if (!lookupOrderNumber) return;
        navigate(`/track/${lookupOrderNumber.trim().toUpperCase()}`);
    };

    // Helper for timeline steps
    const getStatusStep = (status) => {
        const statuses = ['pending', 'preparing', 'ready', 'completed'];
        const idx = statuses.indexOf(status?.toLowerCase());
        return idx >= 0 ? idx : 0;
    };

    const isDelivery = order?.type === 'delivery';
    const isDineIn = order?.type === 'dine_in';
    const steps = [
        { 
            name: 'Order Confirmed', 
            short: 'Received',
            desc: 'Ticket sent to kitchen',
            icon: CheckCircle2
        },
        { 
            name: 'Fresh in Oven', 
            short: 'Baking',
            desc: 'Crafting & glazing treats',
            icon: Flame
        },
        { 
            name: isDelivery ? 'Out for Delivery' : isDineIn ? 'Serving to Table' : 'Ready for Counter', 
            short: isDelivery ? 'Dispatched' : isDineIn ? 'Serving' : 'Ready',
            desc: isDelivery 
                ? 'Courier on the road' 
                : isDineIn 
                    ? (order?.table_number ? `Brought to Table #${order.table_number}` : 'Brought to your table')
                    : 'Boxed at store counter',
            icon: isDelivery ? Bike : isDineIn ? UtensilsCrossed : Store
        },
        { 
            name: isDelivery ? 'Delivered Fresh' : isDineIn ? 'Served at Table' : 'Collected', 
            short: 'Complete',
            desc: isDelivery ? 'Enjoy warm & fresh' : isDineIn ? 'Enjoyed at your table' : 'Collected with love',
            icon: HeartHandshake
        }
    ];

    // Status description helper
    const getStatusHeadline = (status, type, currentOrder) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return {
                    title: type === 'dine_in' 
                        ? (currentOrder?.table_number ? `Order Confirmed for Table #${currentOrder.table_number}` : 'Table Order Confirmed')
                        : 'Order Confirmed & In Kitchen Queue',
                    subtitle: type === 'dine_in'
                        ? 'Sit back and relax! Our kitchen has received your ticket and is preparing your order for table service.'
                        : 'Our pastry chefs have received your ticket and are assembling fresh ingredients.',
                    color: 'text-[#e5b582]'
                };
            case 'preparing':
                return {
                    title: 'Baking Fresh In The Oven',
                    subtitle: type === 'dine_in'
                        ? (currentOrder?.table_number 
                            ? `Your sweet treats are currently handcrafted, baked to golden perfection, and plated for Table #${currentOrder.table_number}.`
                            : 'Your sweet treats are currently handcrafted, baked to golden perfection, and plated for table service.')
                        : 'Your sweet treats are currently handcrafted, baked to golden perfection, and delicately decorated.',
                    color: 'text-amber-400'
                };
            case 'ready':
                if (type === 'delivery') {
                    return {
                        title: 'Courier Dispatched & Heading Your Way',
                        subtitle: 'Freshly packed in insulated artisanal boxes and currently on the road to your doorstep.',
                        color: 'text-emerald-400'
                    };
                } else if (type === 'dine_in') {
                    return {
                        title: currentOrder?.table_number ? `Serving Now to Table #${currentOrder.table_number}` : 'Serving Directly to Your Table',
                        subtitle: 'Our floor staff is bringing your freshly prepared treats directly to your table right now!',
                        color: 'text-emerald-400'
                    };
                } else {
                    return {
                        title: 'Ready for Counter Pickup',
                        subtitle: 'Your box is waiting fresh at our Plumstead store counter. Pop in anytime within your slot!',
                        color: 'text-emerald-400'
                    };
                }
            case 'completed':
                return {
                    title: type === 'dine_in' ? 'Served & Enjoyed at Your Table' : 'Order Completed Fresh & Enjoyed',
                    subtitle: type === 'dine_in' 
                        ? 'Thank you for dining with us at Sweet Spot! We hope every single bite brings pure delight.'
                        : 'Thank you for choosing Sweet Spot! We hope every single bite brings pure delight.',
                    color: 'text-emerald-300'
                };
            case 'cancelled':
                return {
                    title: 'Order Has Been Cancelled',
                    subtitle: 'This order was cancelled. Please contact our support team if you have any questions.',
                    color: 'text-rose-400'
                };
            default:
                return {
                    title: 'Order In Progress',
                    subtitle: 'Your treats are being prepared with artisanal care.',
                    color: 'text-[#e5b582]'
                };
        }
    };

    // Helper to render core tracking body content
    const renderContent = () => {
        /* ══════════════════════════════════════════
            CASE 1: No order number (Lookup Screen)
        ══════════════════════════════════════════ */
        if (!orderNumber) {
            return (
                <div className="max-w-2xl w-full mx-auto my-4 sm:my-8 animate-fadeIn text-center">
                    {/* Editorial Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-neutral-200 shadow-xs mb-5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#24161b]">
                            Live Artisanal Kitchen Telemetry
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#24161b] tracking-tight leading-tight mb-3">
                        Track Your Fresh Order
                    </h1>
                    <p className="text-neutral-500 text-xs sm:text-sm max-w-md mx-auto mb-8 font-light leading-relaxed">
                        Watch your sweet treats progress from the oven racks to your hands in real time.
                    </p>

                    {/* Main High-Craft Lookup Box */}
                    <div className="bg-white border border-neutral-200/90 rounded-[28px] p-6 sm:p-8 shadow-xs text-left mb-8">
                        <form onSubmit={handleLookupSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[#24161b] text-xs font-bold uppercase tracking-wider mb-2 pl-1">
                                    Order Reference Code
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-neutral-400">
                                        <Search size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        value={lookupOrderNumber}
                                        onChange={(e) => setLookupOrderNumber(e.target.value.toUpperCase())}
                                        placeholder="e.g. SS-JKTE4RYE"
                                        className="w-full bg-white border border-neutral-200 focus:border-[#24161b] focus:ring-2 focus:ring-[#24161b]/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400 uppercase tracking-wider font-mono shadow-xs"
                                    />
                                </div>
                                <p className="text-[11px] text-neutral-400 mt-1.5 pl-1">
                                    Found on your receipt email or SMS order confirmation.
                                </p>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 font-bold py-4 rounded-2xl transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#24161b]/15 cursor-pointer active:scale-98"
                            >
                                <Search size={15} />
                                <span>Track My Treats</span>
                                <ArrowRight size={15} />
                            </button>
                        </form>

                        {recentOrderNumber && (
                            <div className="mt-5 pt-5 border-t border-neutral-200/70 flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200/70">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Recent Order Found</p>
                                    <p className="text-xs font-mono font-black text-[#24161b]">{recentOrderNumber}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/track/${recentOrderNumber}`)}
                                    className="px-4 py-2 bg-[#24161b] hover:bg-black text-[#e5b582] rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs shrink-0"
                                >
                                    Track Now
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 3 Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                        <div className="p-4 rounded-2xl bg-white border border-neutral-200/70 shadow-2xs">
                            <div className="w-8 h-8 rounded-xl bg-[#24161b] text-[#e5b582] flex items-center justify-center mb-3">
                                <Flame size={16} />
                            </div>
                            <h4 className="text-xs font-black text-[#24161b]">Oven Telemetry</h4>
                            <p className="text-[11px] text-neutral-500 mt-1 leading-snug">Track live kitchen preparation & freshness updates.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-neutral-200/70 shadow-2xs">
                            <div className="w-8 h-8 rounded-xl bg-[#24161b] text-[#e5b582] flex items-center justify-center mb-3">
                                <Bike size={16} />
                            </div>
                            <h4 className="text-xs font-black text-[#24161b]">GPS Live Driver</h4>
                            <p className="text-[11px] text-neutral-500 mt-1 leading-snug">Uber Direct courier tracking on real-time map.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-neutral-200/70 shadow-2xs">
                            <div className="w-8 h-8 rounded-xl bg-[#24161b] text-[#e5b582] flex items-center justify-center mb-3">
                                <UtensilsCrossed size={16} />
                            </div>
                            <h4 className="text-xs font-black text-[#24161b]">Table & Counter</h4>
                            <p className="text-[11px] text-neutral-500 mt-1 leading-snug">Live dine-in table service & counter pickup slots.</p>
                        </div>
                    </div>
                </div>
            );
        }

        /* ══════════════════════════════════════════
            CASE 2: Loading State
        ══════════════════════════════════════════ */
        if (loading && !order) {
            return (
                <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
                    <div className="w-16 h-16 rounded-2xl bg-[#24161b] text-[#e5b582] flex items-center justify-center mb-4 shadow-xl shadow-[#24161b]/10 animate-pulse">
                        <Loader2 className="animate-spin" size={30} />
                    </div>
                    <p className="font-serif font-black text-lg text-[#24161b]">Connecting to Store Telemetry...</p>
                    <p className="text-neutral-500 text-xs mt-1">Retrieving oven and dispatch data for #{orderNumber}</p>
                </div>
            );
        }

        /* ══════════════════════════════════════════
            CASE 3: Error State
        ══════════════════════════════════════════ */
        if (error || !order) {
            return (
                <div className="bg-[#fdfaf5] border border-neutral-200/90 p-8 sm:p-10 max-w-md w-full text-center rounded-[32px] shadow-xl shadow-[#24161b]/5 my-10 animate-fadeIn mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-[#f43f5e] flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={30} />
                    </div>
                    <h3 className="font-serif font-black text-2xl text-[#24161b] mb-2">Order Not Located</h3>
                    <p className="text-neutral-600 font-normal mb-6 text-xs leading-relaxed">
                        {error || 'We could not find an order matching that reference. Please ensure there are no typos.'}
                    </p>
                    <button 
                        onClick={() => navigate('/track')} 
                        className="w-full bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 font-bold py-3.5 rounded-full transition-all text-xs uppercase tracking-wider flex items-center justify-center shadow-md cursor-pointer"
                    >
                        Try Another Reference
                    </button>
                </div>
            );
        }

        const currentStep = getStatusStep(order.status);
        const headline = getStatusHeadline(order.status, order.type, order);

        /* ══════════════════════════════════════════
            CASE 4: Simplified Live Order Dashboard
        ══════════════════════════════════════════ */
        return (
            <div className="max-w-3xl mx-auto w-full animate-fadeIn text-left space-y-5">
                
                {/* ── TOP UTILITY & BREADCRUMB ── */}
                <div className="flex items-center justify-between gap-3">
                    <button 
                        onClick={() => {
                            if (window.history.state && window.history.state.idx > 0) {
                                navigate(-1);
                            } else {
                                navigate('/products');
                            }
                        }} 
                        className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-[#24161b] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(order.order_number);
                                setCopied(true);
                                toast.success('Order reference copied!');
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="px-3 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            <span className="font-mono">{order.order_number}</span>
                        </button>

                        <button 
                            onClick={() => fetchOrderDetails()} 
                            disabled={loading}
                            className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-all cursor-pointer"
                            title="Refresh Status"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin text-[#24161b]' : ''} />
                        </button>
                    </div>
                </div>

                {/* ── CELEBRATORY CHECKOUT SUCCESS (If arriving right from payment) ── */}
                {isNewCheckout && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                        <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                        <p className="text-emerald-900 text-xs font-semibold">
                            Payment confirmed! Thank you, <strong>{order.customer?.first_name || 'Valued Customer'}</strong>. Your order has been sent to the kitchen.
                        </p>
                    </div>
                )}

                {/* ── HERO STATUS BANNER ── */}
                <div className="bg-[#24161b] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-white/10 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#e5b582]">
                                    {order.type === 'delivery' 
                                        ? 'Home Delivery' 
                                        : order.type === 'dine_in' 
                                            ? `Dine-In • Table #${order.table_number || ''}` 
                                            : 'Store Collection'}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight">
                                {headline.title}
                            </h2>
                            <p className="text-white/70 text-xs font-light">
                                {headline.subtitle}
                            </p>
                        </div>

                        {order.type === 'dine_in' && order.table_number && (
                            <div className="shrink-0 bg-white/10 border border-white/15 px-4 py-2.5 rounded-xl text-center">
                                <span className="text-[9px] font-black uppercase tracking-wider text-[#e5b582] block">Seated At</span>
                                <span className="text-lg font-serif font-black text-white">Table #{order.table_number}</span>
                            </div>
                        )}
                        {order.type === 'collection' && order.collection_time && (
                            <div className="shrink-0 bg-white/10 border border-white/15 px-4 py-2.5 rounded-xl text-center">
                                <span className="text-[9px] font-black uppercase tracking-wider text-[#e5b582] block">Collection Slot</span>
                                <span className="text-xs font-bold text-white block mt-0.5">
                                    {(() => {
                                        try {
                                            const d = new Date(order.collection_time.replace(' ', 'T'));
                                            return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
                                        } catch(e) { return order.collection_time; }
                                    })()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── COMPACT LINEAR STEP PROGRESS BAR ── */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="relative flex items-start justify-between">
                        {/* Connecting background track line */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-200 -z-0" />
                        
                        {/* Active filled progress track line */}
                        <div 
                            className="absolute top-4 left-4 h-0.5 bg-[#24161b] transition-all duration-500 -z-0" 
                            style={{ 
                                width: `calc(${(Math.min(currentStep, 3) / 3) * 100}% - ${currentStep === 0 ? 0 : 0}px)`,
                                maxWidth: 'calc(100% - 32px)' 
                            }}
                        />

                        {steps.map((step, idx) => {
                            const isDone = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            const StepIcon = step.icon;
                            const isFirst = idx === 0;
                            const isLast = idx === steps.length - 1;

                            return (
                                <div 
                                    key={step.name} 
                                    className={`flex flex-col relative z-10 ${
                                        isFirst ? 'items-start text-left' : isLast ? 'items-end text-right' : 'items-center text-center'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs ${
                                        isCurrent 
                                            ? 'bg-[#24161b] text-[#e5b582] ring-4 ring-[#24161b]/10' 
                                            : isDone 
                                                ? 'bg-[#24161b] text-[#e5b582]' 
                                                : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                                    }`}>
                                        <StepIcon size={14} />
                                    </div>
                                    <span className={`text-[11px] font-bold mt-2 whitespace-nowrap ${isDone ? 'text-[#24161b]' : 'text-neutral-400'}`}>
                                        {step.short || step.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── CORE DETAILS (FULFILLMENT + ITEMS) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Left: Fulfillment Details */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <span className="font-bold text-[#24161b] uppercase tracking-wider text-[10px]">Fulfilment Info</span>
                            <span className="text-neutral-400 text-[10px]">
                                Placed {order.created_at ? new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Today'}
                            </span>
                        </div>

                        {order.type === 'dine_in' ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#24161b] text-[#e5b582] flex items-center justify-center shrink-0">
                                        <UtensilsCrossed size={14} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#24161b]">Dine-In Table #{order.table_number || 'N/A'}</p>
                                        <p className="text-neutral-500 text-[11px]">Sweet Spot Dessert Lounge • Table Service</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2.5 rounded-xl">
                                    Our floor staff will bring your treats directly to <strong>Table #{order.table_number || ''}</strong>.
                                </p>
                            </div>
                        ) : order.type === 'delivery' ? (
                            <div className="space-y-2.5">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#24161b] text-[#e5b582] flex items-center justify-center shrink-0 mt-0.5">
                                        <MapPin size={14} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#24161b]">{order.delivery_address?.address_line_1}</p>
                                        <p className="text-neutral-500 text-[11px]">
                                            {order.delivery_address?.postcode} {order.delivery_address?.city ? `• ${order.delivery_address.city}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {order.uber_tracking_url && (
                                    <a
                                        href={order.uber_tracking_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-2.5 px-3 bg-[#24161b] hover:bg-black text-[#e5b582] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                    >
                                        <Navigation size={13} />
                                        <span>Open Live Driver GPS Map</span>
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#24161b] text-[#e5b582] flex items-center justify-center shrink-0 mt-0.5">
                                        <Store size={14} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#24161b]">Sweet Spot Counter Pickup</p>
                                        <p className="text-neutral-500 text-[11px]">114 Plumstead High St, London SE18 1SJ</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {order.notes && (
                            <div className="pt-2 border-t border-neutral-100">
                                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Kitchen Note:</span>
                                <p className="text-[11px] text-neutral-600 italic mt-0.5">"{order.notes}"</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Order Items & Price Summary */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <span className="font-bold text-[#24161b] uppercase tracking-wider text-[10px]">Ordered Items</span>
                            <span className="text-neutral-400 text-[10px]">{order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</span>
                        </div>

                        {/* Items List */}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {order.items?.map(item => (
                                <div key={item.id} className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-neutral-800">
                                            {item.quantity}x {item.product_name}
                                            {item.variation_name && !item.is_box ? ` (${item.variation_name})` : ''}
                                        </p>
                                        {item.is_box && Array.isArray(item.box_items) && item.box_items.length > 0 && (
                                            <div className="pl-2 border-l-2 border-[#e5b582]/60 mt-1 space-y-0.5 text-[10px] text-neutral-500">
                                                {item.box_items.map((bi, bIdx) => {
                                                    const bName = bi.product_name || bi.name || '';
                                                    const varStr = bi.variation_name && !bName.includes(`(${bi.variation_name})`) 
                                                        ? ` (${bi.variation_name})` 
                                                        : '';
                                                    return (
                                                        <div key={bIdx}>• {bi.quantity}x {bName}{varStr}</div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-bold text-neutral-900 whitespace-nowrap">
                                        £{parseFloat(item.total || 0).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="pt-2 border-t border-neutral-100 space-y-1 text-neutral-600 text-[11px]">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>£{parseFloat(order.subtotal || 0).toFixed(2)}</span>
                            </div>
                            {order.type === 'delivery' && (
                                <div className="flex justify-between">
                                    <span>Delivery Fee</span>
                                    <span>£{parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-1.5 border-t border-neutral-100 text-sm font-black text-[#24161b]">
                                <span>Total Paid</span>
                                <span>£{parseFloat(order.total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── ACTION BUTTONS ── */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <button 
                        onClick={() => {
                            if (order.type === 'dine_in' && order.table_number) {
                                navigate(`/categories?table=${order.table_number}`);
                            } else {
                                navigate('/categories');
                            }
                        }}
                        className="w-full sm:flex-1 bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white font-bold py-3 px-5 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
                    >
                        <span>{order.type === 'dine_in' ? 'Order More Treats to Table' : 'Order More Delights'}</span>
                        <ArrowRight size={14} />
                    </button>

                    <button 
                        onClick={() => navigate('/track')}
                        className="w-full sm:w-auto bg-white hover:bg-neutral-50 text-neutral-700 font-bold py-3 px-5 rounded-xl transition-colors text-xs uppercase tracking-wider flex items-center justify-center border border-neutral-200 cursor-pointer"
                    >
                        Track Another
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#24161b] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <Header 
                setIsMenuOpen={setIsMenuOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                navigate={navigate}
                cartItemCount={cartItemCount}
                user={user}
            />

            {/* Standard Gap below Header & Logo */}
            <div className="w-full h-2 sm:h-3 bg-transparent" />

            {/* Main Overlapping Storefront Container with curved top and bottom edges */}
            <main className="w-full mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 px-4 pt-6 pb-14 sm:px-8 md:px-12 md:pt-8 md:pb-20 bg-white shadow-lg border border-stone-200/50 flex-grow flex flex-col items-center">
                {renderContent()}
            </main>

            {/* Sidebar Navigation Drawer */}
            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                token={token} 
                user={user} 
                logout={logout} 
            />

            {/* Modern Footer matching entire site */}
            <Footer />
        </div>
    );
}
