import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { CheckCircle, Clock, MapPin, Coffee, ArrowRight, ArrowLeft, Loader2, Search, Key, RefreshCw, AlertCircle, Menu, X, LogOut, User, Copy, Check } from 'lucide-react';
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
                setError(data.message || 'Order details not found.');
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
        return statuses.indexOf(status?.toLowerCase()) ?? 0;
    };

    const isDelivery = order?.type === 'delivery';
    const steps = [
        { name: 'Pending', desc: 'Received' },
        { name: 'Preparing', desc: 'In Oven' },
        { 
            name: isDelivery ? 'On Delivery' : 'Ready', 
            desc: isDelivery ? 'Out for Delivery' : 'Ready for Collection' 
        },
        { 
            name: 'Completed', 
            desc: isDelivery ? 'Delivered' : 'Collected' 
        }
    ];

    // Helper to render core tracking body content
    const renderContent = () => {
        if (!orderNumber) {
            return (
                <div className="max-w-md w-full space-y-6 p-8 md:p-10 border border-neutral-200/60 bg-white rounded-[24px] shadow-xl shadow-[#8e5233]/5 text-left animate-fadeIn">
                    <div className="text-center">
                        <div className="p-4 bg-[#8F5336]/10 text-[#8F5336] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={28} />
                        </div>
                        <h2 className="text-2xl font-sans font-black text-neutral-900 tracking-tight">Track Your Order</h2>
                        <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
                            Enter your order number below to watch its live preparation and delivery status.
                        </p>
                    </div>

                    <form onSubmit={handleLookupSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">Order Reference *</label>
                            <input 
                                type="text" 
                                required
                                value={lookupOrderNumber}
                                onChange={(e) => setLookupOrderNumber(e.target.value)}
                                placeholder="e.g. PL-JKTE4RYE"
                                className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-[12px] px-4 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-[#8e5233] hover:bg-[#723e25] text-white font-bold py-3.5 rounded-full transition-all text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#8e5233]/15 cursor-pointer mt-2"
                        >
                            <Search size={14} />
                            <span>Track Order</span>
                        </button>
                    </form>

                    {recentOrderNumber && (
                        <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100/75 rounded-2xl text-xs flex items-center justify-between animate-fadeIn">
                            <div className="text-left">
                                <p className="font-extrabold text-neutral-800 text-[11px]">Recent Order Found</p>
                                <p className="text-neutral-500 text-[10px] mt-0.5 font-mono font-bold tracking-wider">{recentOrderNumber}</p>
                            </div>
                            <button
                                onClick={() => navigate(`/track/${recentOrderNumber}`)}
                                className="px-3.5 py-1.5 bg-[#8e5233] hover:bg-[#723e25] text-white font-bold rounded-full text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-[#8e5233]/10"
                            >
                                Track Now
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        if (loading && !order) {
            return (
                <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
                    <Loader2 className="animate-spin text-[#8F5336] mb-4" size={40} />
                    <p className="text-neutral-500 text-xs font-light font-sans">Loading live order status...</p>
                </div>
            );
        }

        if (error || !order) {
            return (
                <div className="bg-white border border-neutral-200/60 p-8 max-w-sm text-center rounded-[24px] shadow-xl shadow-[#8e5233]/5 animate-fadeIn">
                    <p className="text-red-700 font-medium mb-4 text-xs">{error || 'Order tracking not found.'}</p>
                    <button 
                        onClick={() => navigate('/track')} 
                        className="w-full bg-[#8e5233] hover:bg-[#723e25] text-white font-bold py-3 rounded-full transition-all text-xs flex items-center justify-center shadow-lg shadow-[#8e5233]/15 cursor-pointer"
                    >
                        Return to Tracker Lookup
                    </button>
                </div>
            );
        }

        const currentStep = getStatusStep(order.status);

        return (
            <div className="max-w-3xl mx-auto text-center w-full animate-fadeIn">
                {/* Celebratory Success Banner */}
                {isNewCheckout && (
                    <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-[20px] text-left animate-fadeIn flex items-start gap-4">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                            <CheckCircle size={22} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-emerald-950 text-sm">Payment Processed Successfully!</h3>
                            <p className="text-emerald-750 text-xs mt-1 leading-normal font-light">
                                Thank you for your order, <strong>{order.customer?.first_name || 'Customer'}</strong>! Your payment was processed securely. Live status is shown below, and patisseries are in queue.
                            </p>
                        </div>
                    </div>
                )}

                {/* Status Indicator Circle */}
                <div className="p-4 bg-[#8e5233]/10 text-[#8e5233] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Coffee size={36} />
                </div>

                <h1 className="text-2xl sm:text-3xl font-sans font-black text-neutral-900 tracking-tight mb-2">Track Your Order</h1>
                <div className="bg-[#8e5233]/10 border border-[#8e5233]/20 rounded-full inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-[#8e5233] font-mono tracking-widest uppercase mb-8">
                    <span>Order Ref: {order.order_number}</span>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(order.order_number);
                            setCopied(true);
                            toast.success('Order number copied!');
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className="hover:text-[#723e25] transition-colors p-0.5 rounded focus:outline-none cursor-pointer flex items-center justify-center"
                        title="Copy Order Number"
                    >
                        {copied ? (
                            <Check size={11} className="text-emerald-600 animate-scaleIn" />
                        ) : (
                            <Copy size={11} />
                        )}
                    </button>
                </div>

                {/* Live Status Timeline Tracker Card */}
                <div className="bg-white border border-neutral-200/60 p-8 mb-8 text-left shadow-xl shadow-[#8e5233]/5 rounded-[24px] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 border-b border-[#8e5233]/10 pb-3">
                        <h3 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                            <Clock size={16} className="text-[#8e5233]" />
                            <span>Live Status:</span>
                            <span className="bg-[#8F5336] text-white text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                {order.status}
                            </span>
                        </h3>
                        <button 
                            onClick={() => fetchOrderDetails()} 
                            disabled={loading}
                            className="text-neutral-450 hover:text-neutral-950 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold cursor-pointer"
                        >
                            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 relative mt-8">
                        {/* Connecting Progress Line */}
                        <div className="absolute top-[17px] left-[12%] right-[12%] h-[2px] bg-neutral-200 -z-0">
                            <div 
                                className="h-full bg-[#8F5336] transition-all duration-700" 
                                style={{ width: `${(currentStep / 3) * 100}%` }}
                            ></div>
                        </div>

                        {steps.map((step, idx) => (
                            <div key={step.name} className="flex flex-col items-center text-center relative z-10">
                                <div className={`w-9 h-9 flex items-center justify-center border text-xs font-bold transition-all rounded-full ${
                                    idx <= currentStep 
                                        ? 'bg-[#8e5233] border-[#8e5233] text-white shadow-sm font-black'
                                        : 'bg-white border-neutral-200 text-neutral-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <span className={`text-[11px] font-extrabold mt-3 block ${idx <= currentStep ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                    {step.name}
                                </span>
                                <span className="text-[9px] text-neutral-400 mt-0.5 block max-w-[70px] leading-tight font-light">
                                    {step.desc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                    {/* Basket Items List */}
                    <div className="bg-white border border-neutral-200/60 p-6 rounded-[20px] shadow-lg shadow-[#8e5233]/5">
                        <h4 className="font-bold text-neutral-900 text-sm mb-4 pb-2 border-b border-neutral-200/60">Your Basket</h4>
                        <div className="space-y-3">
                            {order.items?.map(item => (
                                <div key={item.id} className="flex justify-between text-xs text-neutral-600">
                                    <span>{item.quantity}x {item.product_name} {item.variation_name ? `(${item.variation_name})` : ''}</span>
                                    <span className="font-semibold text-neutral-900">£{parseFloat(item.total).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-neutral-150 mt-4 pt-4 space-y-2 text-xs">
                            <div className="flex justify-between text-neutral-500">
                                <span>Subtotal</span>
                                <span>£{parseFloat(order.subtotal).toFixed(2)}</span>
                            </div>
                            {order.type === 'delivery' && (
                                <div className="flex justify-between text-neutral-500">
                                    <span>Delivery Fee</span>
                                    <span>£{parseFloat(order.delivery_fee).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-150">
                                <span>Paid Amount</span>
                                <span className="text-neutral-950 text-base font-black">£{parseFloat(order.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Fulfillment Details */}
                    <div className="bg-white border border-neutral-200/60 p-6 rounded-[20px] shadow-lg shadow-[#8e5233]/5 flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-neutral-900 text-sm mb-4 pb-2 border-b border-neutral-200/60">Fulfillment</h4>
                            {order.type === 'delivery' ? (
                                <div className="space-y-3 text-xs">
                                    <div className="flex items-start space-x-2 text-neutral-600">
                                        <MapPin size={16} className="text-[#8F5336] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-neutral-900">Home Delivery</p>
                                            <p className="text-neutral-500 mt-1">{order.delivery_address?.address_line_1}</p>
                                            <p className="text-neutral-505 uppercase">{order.delivery_address?.postcode}, {order.delivery_address?.city}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 text-xs">
                                    <div className="flex items-start space-x-2 text-neutral-600">
                                        <Clock size={16} className="text-[#8F5336] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-neutral-900">Store Collection</p>
                                            <p className="text-neutral-500 mt-1">Ready for pickup at:</p>
                                            <p className="text-[#8F5336] font-bold mt-1 text-xs bg-white border border-[#8e5233]/20 rounded-lg px-2.5 py-1.5 inline-block">
                                                {(() => {
                                                    if (!order.collection_time) return '';
                                                    try {
                                                        const date = new Date(order.collection_time.replace(' ', 'T'));
                                                        return date.toLocaleDateString('en-GB', {
                                                            weekday: 'long',
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
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {order.notes && (
                            <div className="bg-white border border-neutral-200/60 rounded-xl p-3 text-[11px] text-neutral-600 mt-4 leading-normal flex flex-col">
                                <span className="font-bold text-neutral-400 block uppercase tracking-wider text-[9px] mb-1 shrink-0">Your Note</span>
                                <div className="overflow-y-auto max-h-[70px] min-h-[35px] pr-1 whitespace-pre-wrap italic">
                                    "{order.notes}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    <button 
                        onClick={() => navigate('/categories')}
                        className="bg-[#8e5233] hover:bg-[#723e25] text-white font-bold px-8 py-3.5 rounded-full transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-[#8e5233]/15 cursor-pointer"
                    >
                        <span>Order Something Else</span>
                        <ArrowRight size={14} />
                    </button>
                    
                    <button 
                        onClick={() => navigate('/track')}
                        className="bg-white border border-[#8e5233]/30 text-[#8e5233] font-bold px-8 py-3.5 rounded-full hover:bg-neutral-50 transition-colors text-xs uppercase tracking-wider cursor-pointer"
                    >
                        Search Another Order
                    </button>
                </div>
            </div>
        );
    };

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

            {/* Standardized overlap container holding the dynamically loaded tracking content */}
            <main className="w-full mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-6 pt-8 pb-10 md:px-12 md:pt-10 md:pb-16 flex-grow flex flex-col items-center" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                <div className={`w-full ${orderNumber ? 'max-w-3xl' : 'max-w-md'} mb-4 text-left animate-fadeIn`}>
                    <button 
                        onClick={() => {
                            if (window.history.state && window.history.state.idx > 0) {
                                navigate(-1);
                            } else {
                                navigate('/');
                            }
                        }} 
                        className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-[#8F5336] flex items-center gap-1.5 transition-colors cursor-pointer pl-1 bg-transparent border-none"
                    >
                        <ArrowLeft size={14} />
                        <span>Go Back</span>
                    </button>
                </div>
                {renderContent()}
            </main>

            {/* Sidebar Navigation Drawer */}
            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                cartItemCount={cartItemCount} 
                user={user} 
                logout={logout} 
            />

            <Footer navigate={navigate} />
        </div>
    );
}
