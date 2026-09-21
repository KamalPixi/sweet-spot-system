import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { 
    CheckCircle, Clock, MapPin, Sparkles, ArrowRight, ArrowLeft, 
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
            name: isDelivery ? 'Out for Delivery' : 'Ready for Counter', 
            short: isDelivery ? 'Dispatched' : 'Ready',
            desc: isDelivery ? 'Courier on the road' : 'Boxed at bakery counter',
            icon: isDelivery ? Bike : Store
        },
        { 
            name: isDelivery ? 'Delivered Fresh' : 'Collected', 
            short: 'Complete',
            desc: isDelivery ? 'Enjoy warm & fresh' : 'Collected with love',
            icon: HeartHandshake
        }
    ];

    // Status description helper
    const getStatusHeadline = (status, type) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return {
                    title: 'Order Confirmed & In Kitchen Queue',
                    subtitle: 'Our pastry chefs have received your ticket and are assembling fresh ingredients.',
                    color: 'text-[#e5b582]'
                };
            case 'preparing':
                return {
                    title: 'Baking Fresh In The Oven',
                    subtitle: 'Your sweet treats are currently handcrafted, baked to golden perfection, and delicately decorated.',
                    color: 'text-amber-400'
                };
            case 'ready':
                return type === 'delivery' 
                    ? {
                        title: 'Courier Dispatched & Heading Your Way',
                        subtitle: 'Freshly packed in insulated artisanal boxes and currently on the road to your doorstep.',
                        color: 'text-emerald-400'
                    }
                    : {
                        title: 'Ready for Counter Pickup',
                        subtitle: 'Your box is waiting fresh at our Plumstead bakery counter. Pop in anytime within your slot!',
                        color: 'text-emerald-400'
                    };
            case 'completed':
                return {
                    title: 'Order Completed Fresh & Enjoyed',
                    subtitle: 'Thank you for choosing Sweet Spot! We hope every single bite brings pure delight.',
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
                                        placeholder="e.g. PL-JKTE4RYE"
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
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#FCF3F5] text-[#f43f5e] flex items-center justify-center shrink-0">
                                        <Sparkles size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Recent Order Found</p>
                                        <p className="text-xs font-mono font-black text-[#24161b]">{recentOrderNumber}</p>
                                    </div>
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
                                <Store size={16} />
                            </div>
                            <h4 className="text-xs font-black text-[#24161b]">Store Collection</h4>
                            <p className="text-[11px] text-neutral-500 mt-1 leading-snug">Counter pickup slots and rapid collection passes.</p>
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
                    <p className="font-serif font-black text-lg text-[#24161b]">Connecting to Bakery Telemetry...</p>
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
        const headline = getStatusHeadline(order.status, order.type);

        /* ══════════════════════════════════════════
            CASE 4: Live Order Dashboard
        ══════════════════════════════════════════ */
        return (
            <div className="max-w-5xl mx-auto w-full animate-fadeIn text-left space-y-6">
                
                {/* ── TOP UTILITY & BREADCRUMB BAR ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button 
                            onClick={() => {
                                if (window.history.state && window.history.state.idx > 0) {
                                    navigate(-1);
                                } else {
                                    navigate('/products');
                                }
                            }} 
                            className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-[#24161b] flex items-center gap-1.5 transition-colors cursor-pointer pr-3 border-r border-neutral-200"
                        >
                            <ArrowLeft size={14} />
                            <span>Go Back</span>
                        </button>

                        <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/')}>Home</span>
                            <span>/</span>
                            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/track')}>Tracker</span>
                            <span>/</span>
                            <span className="font-mono font-bold text-[#24161b]">#{order.order_number}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(order.order_number);
                                setCopied(true);
                                toast.success('Order reference copied!');
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-[#fdfaf5] hover:bg-neutral-100 text-neutral-700 text-xs font-bold border border-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span className="font-mono">{copied ? 'Copied' : order.order_number}</span>
                        </button>

                        <button 
                            onClick={() => fetchOrderDetails()} 
                            disabled={loading}
                            className="p-2 rounded-full bg-[#fdfaf5] hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition-all cursor-pointer shadow-2xs"
                            title="Refresh Status"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin text-[#24161b]' : ''} />
                        </button>
                    </div>
                </div>

                {/* ── CELEBRATORY CHECKOUT SUCCESS (If arriving right from payment) ── */}
                {isNewCheckout && (
                    <div className="p-4 sm:p-5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start gap-3.5 shadow-xs">
                        <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5">
                            <CheckCircle size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-black text-emerald-950 text-sm">Payment Processed Successfully!</h3>
                            <p className="text-emerald-800 text-xs mt-0.5 leading-relaxed">
                                Thank you, <strong>{order.customer?.first_name || 'Valued Customer'}</strong>! Your payment is confirmed and our kitchen has started prepping your order.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── NEW HERO ORDER STATUS BANNER ── */}
                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#24161b] via-[#2d1b22] to-[#3a2029] text-white p-6 sm:p-9 shadow-xl shadow-[#24161b]/15 border border-white/10">
                    <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#e5b582]/15 blur-3xl pointer-events-none" />
                    <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-[#f43f5e]/15 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-xl">
                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/15 text-white border border-white/20 backdrop-blur-md">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Live Bakery Sync</span>
                                </span>

                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#e5b582]/20 text-[#e5b582] border border-[#e5b582]/30">
                                    {order.type === 'delivery' ? <Bike size={13} /> : <Store size={13} />}
                                    <span>{order.type === 'delivery' ? 'Home Delivery' : 'Store Collection'}</span>
                                </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight leading-tight">
                                {headline.title}
                            </h2>
                            <p className="text-white/80 text-xs sm:text-sm font-light leading-relaxed">
                                {headline.subtitle}
                            </p>
                        </div>

                        {/* Estimated Time Slot Badge / Action */}
                        <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/15 p-4 sm:p-5 rounded-2xl w-full md:w-auto text-left md:text-right">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-[#e5b582]">
                                {order.type === 'delivery' ? 'Fulfillment Target' : 'Collection Slot'}
                            </p>
                            <p className="text-lg sm:text-xl font-serif font-bold text-white mt-0.5">
                                {order.type === 'delivery' 
                                    ? (order.delivery_time || '35 - 50 mins')
                                    : (() => {
                                        if (!order.collection_time) return 'Confirmed Window';
                                        try {
                                            const date = new Date(order.collection_time.replace(' ', 'T'));
                                            return date.toLocaleDateString('en-GB', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            });
                                        } catch (e) {
                                            return order.collection_time;
                                        }
                                    })()
                                }
                            </p>
                            <p className="text-[10px] text-white/60 mt-1">
                                Placed on {order.created_at ? new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Today'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── NEW ARTISANAL TIMELINE PROGRESS CARD ── */}
                <div className="bg-white border border-neutral-200/90 rounded-[28px] p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center justify-between mb-8 pb-3 border-b border-neutral-200/70">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-[#f43f5e]" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-[#24161b]">
                                Bakery Progress Tracker
                            </h3>
                        </div>
                        <span className="text-[11px] font-bold text-[#24161b] bg-white border border-neutral-200 px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                            Step {currentStep + 1} of 4
                        </span>
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 relative">
                        {steps.map((step, idx) => {
                            const isDone = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            const StepIcon = step.icon;

                            return (
                                <div 
                                    key={step.name} 
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        isCurrent 
                                            ? 'bg-white border-[#24161b] shadow-md shadow-[#24161b]/5 ring-2 ring-[#24161b]/10' 
                                            : isDone 
                                                ? 'bg-white/80 border-emerald-200/80 shadow-2xs' 
                                                : 'bg-neutral-50/50 border-neutral-200/60 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                            isDone 
                                                ? 'bg-[#24161b] text-[#e5b582]' 
                                                : 'bg-neutral-200 text-neutral-400'
                                        }`}>
                                            <StepIcon size={18} />
                                        </div>
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                            isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-400'
                                        }`}>
                                            {isDone && idx < currentStep ? 'DONE' : isCurrent ? 'ACTIVE' : `0${idx + 1}`}
                                        </span>
                                    </div>

                                    <h4 className={`text-xs font-black tracking-tight ${isDone ? 'text-[#24161b]' : 'text-neutral-400'}`}>
                                        {step.name}
                                    </h4>
                                    <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                                        {step.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── TWO-COLUMN DETAILS GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ════════ LEFT COLUMN: Fulfillment & Delivery Telemetry (7 cols) ════════ */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Fulfillment Card */}
                        <div className="bg-white border border-neutral-200/90 rounded-[28px] p-6 sm:p-7 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/70">
                                <div className="flex items-center gap-2">
                                    {order.type === 'delivery' ? (
                                        <Truck size={17} className="text-[#f43f5e]" />
                                    ) : (
                                        <Store size={17} className="text-[#f43f5e]" />
                                    )}
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#24161b]">
                                        {order.type === 'delivery' ? 'Delivery Destination & Courier' : 'Counter Collection Pass'}
                                    </h3>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#24161b] bg-white border border-neutral-200 px-3 py-0.5 rounded-full">
                                    {order.type === 'delivery' ? 'Home Courier' : 'In-Store'}
                                </span>
                            </div>

                            {order.type === 'delivery' ? (
                                <div className="space-y-4 text-xs">
                                    {/* Destination Address Widget */}
                                    <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-neutral-200/80">
                                        <div className="w-8 h-8 rounded-xl bg-[#24161b] text-[#e5b582] flex items-center justify-center shrink-0 mt-0.5">
                                            <MapPin size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Recipient Address</p>
                                            <p className="font-black text-[#24161b] text-sm">{order.delivery_address?.address_line_1 || 'Address on file'}</p>
                                            {order.delivery_address?.address_line_2 && (
                                                <p className="text-neutral-600">{order.delivery_address.address_line_2}</p>
                                            )}
                                            <p className="text-neutral-500 uppercase font-mono text-xs">
                                                {order.delivery_address?.postcode} {order.delivery_address?.city ? `• ${order.delivery_address.city}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Live Uber / Courier Integration Widget */}
                                    <div className="p-4 sm:p-5 bg-white border border-neutral-200/80 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                                <span className="font-black text-[#24161b] text-xs uppercase tracking-wider">
                                                    {order.delivery_provider ? order.delivery_provider.replace('_', ' ') : 'Live Courier Network'}
                                                </span>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-[#24161b] text-[#e5b582] text-[10px] font-black uppercase tracking-wider">
                                                {order.uber_status || order.courier_status || (currentStep >= 2 ? 'Dispatched' : 'Preparing Courier')}
                                            </span>
                                        </div>

                                        {(order.uber_courier_name || order.courier_name) && (
                                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                                                <span className="text-neutral-500">Assigned Driver:</span>
                                                <span className="font-bold text-[#24161b]">{order.uber_courier_name || order.courier_name}</span>
                                            </div>
                                        )}

                                        {(order.uber_courier_phone || order.courier_phone) && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-neutral-500">Driver Contact:</span>
                                                <a
                                                    href={`tel:${order.uber_courier_phone || order.courier_phone}`}
                                                    className="font-bold text-[#24161b] hover:text-[#f43f5e] transition-colors inline-flex items-center gap-1"
                                                >
                                                    <Phone size={12} />
                                                    <span>{order.uber_courier_phone || order.courier_phone}</span>
                                                </a>
                                            </div>
                                        )}

                                        {/* Direct Live Map Action */}
                                        {order.uber_tracking_url || order.courier_tracking_url ? (
                                            <div className="pt-2">
                                                <a
                                                    href={order.uber_tracking_url || order.courier_tracking_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-3 px-4 bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <Navigation size={14} />
                                                    <span>Open Live GPS Courier Map</span>
                                                    <ExternalLink size={13} />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="pt-2">
                                                <p className="text-[11px] text-neutral-400 italic">
                                                    Live courier GPS link will appear here once driver picks up from our bakery.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Store Collection Content */
                                <div className="space-y-4 text-xs">
                                    <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-[#24161b] text-[#e5b582] flex items-center justify-center shrink-0 mt-0.5">
                                                <Store size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bakery Location</p>
                                                <p className="font-black text-[#24161b] text-sm">Sweet Spot Bakery Counter</p>
                                                <p className="text-neutral-600 mt-0.5">114 Plumstead High St, London SE18 1SJ</p>
                                                <p className="text-neutral-400 text-[11px] mt-0.5">Open Daily: 12:00 PM – 11:00 PM</p>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                                            <span className="text-neutral-500">Pickup Slot:</span>
                                            <span className="font-bold text-[#24161b] bg-[#FCF3F5] px-3 py-1 rounded-full border border-rose-200">
                                                {(() => {
                                                    if (!order.collection_time) return 'Confirmed Slot';
                                                    try {
                                                        const date = new Date(order.collection_time.replace(' ', 'T'));
                                                        return date.toLocaleDateString('en-GB', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        });
                                                    } catch (e) {
                                                        return order.collection_time;
                                                    }
                                                })()}
                                            </span>
                                        </div>

                                        <a
                                            href="https://maps.google.com/?q=Sweet+Spot+114+Plumstead+High+St+London+SE18+1SJ"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 text-[#24161b] border border-neutral-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                                        >
                                            <Navigation size={13} />
                                            <span>Get Directions on Google Maps</span>
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Customer Notes / Allergy Instructions (if present) */}
                            {order.notes && (
                                <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 text-xs">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                        Special Requests & Kitchen Notes
                                    </p>
                                    <p className="text-neutral-700 italic">"{order.notes}"</p>
                                </div>
                            )}
                        </div>

                        {/* Customer Support & Help Widget */}
                        <div className="p-5 bg-white border border-neutral-200/80 rounded-[24px] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#24161b] text-[#e5b582] flex items-center justify-center shrink-0">
                                    <MessageCircle size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-[#24161b]">Need to update your order?</h4>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">Reach our Plumstead bakery staff directly.</p>
                                </div>
                            </div>
                            <a
                                href="tel:02081234567"
                                className="px-4 py-2 rounded-full bg-[#fdfaf5] hover:bg-neutral-100 text-[#24161b] text-xs font-bold border border-neutral-200 transition-all shrink-0 cursor-pointer"
                            >
                                Call Bakery
                            </a>
                        </div>
                    </div>

                    {/* ════════ RIGHT COLUMN: Artisanal Receipt & Summary (5 cols) ════════ */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white border border-neutral-200/90 rounded-[28px] p-6 sm:p-7 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/70">
                                <div className="flex items-center gap-2">
                                    <UtensilsCrossed size={17} className="text-[#f43f5e]" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#24161b]">
                                        Treats in Box
                                    </h3>
                                </div>
                                <span className="text-[11px] font-bold text-neutral-400">
                                    {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            {/* Item Rows */}
                            <div className="space-y-3 divide-y divide-neutral-100">
                                {order.items?.map(item => (
                                    <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3 text-xs">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-md bg-[#24161b] text-[#e5b582] text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {item.quantity}x
                                                </span>
                                                <span className="font-bold text-[#24161b] text-xs">{item.product_name}</span>
                                            </div>
                                            {item.variation_name && (
                                                <span className="inline-block text-[10px] font-semibold text-neutral-500 bg-white border border-neutral-200/70 px-2 py-0.5 rounded-md ml-7">
                                                    {item.variation_name}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-bold text-[#24161b] text-xs shrink-0">
                                            £{parseFloat(item.total).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="border-t border-neutral-200/80 pt-4 space-y-2 text-xs">
                                <div className="flex justify-between text-neutral-600">
                                    <span>Subtotal</span>
                                    <span>£{parseFloat(order.subtotal || 0).toFixed(2)}</span>
                                </div>

                                {order.type === 'delivery' && (
                                    <div className="flex justify-between text-neutral-600">
                                        <span>Delivery Fee</span>
                                        <span>£{parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm font-black text-[#24161b] pt-3 border-t border-neutral-200/80">
                                    <span>Total Paid</span>
                                    <span className="text-lg font-serif font-black text-[#24161b]">
                                        £{parseFloat(order.total || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Security Badge */}
                            <div className="pt-2 flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-200/70 p-3 rounded-xl">
                                <div className="flex items-center gap-1.5 font-bold">
                                    <ShieldCheck size={15} />
                                    <span>Payment Authenticated</span>
                                </div>
                                <span className="font-mono text-[10px] uppercase font-bold text-emerald-800">
                                    Stripe SSL
                                </span>
                            </div>
                        </div>

                        {/* Order Again Action */}
                        <div className="space-y-3">
                            <button 
                                onClick={() => navigate('/categories')}
                                className="w-full bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 font-bold py-3.5 rounded-full transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer active:scale-98"
                            >
                                <span>Order More Delights</span>
                                <ArrowRight size={14} />
                            </button>

                            <button 
                                onClick={() => navigate('/track')}
                                className="w-full bg-white hover:bg-neutral-50 text-neutral-800 font-bold py-3 rounded-full transition-colors text-xs uppercase tracking-wider flex items-center justify-center border border-neutral-200 shadow-2xs cursor-pointer"
                            >
                                Look Up Another Order
                            </button>
                        </div>
                    </div>
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
