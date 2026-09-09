import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import Footer from './components/Footer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { ShoppingBag, Search, ChevronRight, X, User, LogOut, ArrowLeft, Loader2, AlertCircle, CheckCircle, ChevronLeft, Plus, Minus, ArrowRight, Menu, Lock, Trash2, Eye, EyeOff, Phone, Mail, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const getImageUrl = (url) => {
    if (!url) return '/images/placeholder.svg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
    return `/storage/${cleanUrl}`;
};

// Initialize Stripe JS SDK client instance
const stripePublishableKey = import.meta.env.VITE_STRIPE_KEY || 'pk_test_pudding_london_placeholder';
const stripePromise = loadStripe(stripePublishableKey);

const isRealStripeConfigured = stripePublishableKey && !stripePublishableKey.startsWith('pk_test_pudding_london_placeholder');
const UK_TIME_ZONE = 'Europe/London';

const parseCollectionDateTime = (slot) => {
    if (!slot) return null;

    const source = slot.datetime || `${slot.date || ''} ${slot.time || '00:00:00'}`;
    const match = String(source).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
    if (!match) return null;

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
    };
};

const getUKTodayParts = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: UK_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());

    return {
        year: Number(parts.find(part => part.type === 'year')?.value),
        month: Number(parts.find(part => part.type === 'month')?.value),
        day: Number(parts.find(part => part.type === 'day')?.value),
    };
};

const dateKey = ({ year, month, day }) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const addDaysToDateParts = (parts, days) => {
    const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
    };
};

// Stripe Elements custom appearance options matching the brand
const stripeAppearance = {
    theme: 'flat',
    variables: {
        fontFamily: 'Inter, sans-serif',
        fontLineHeight: '1.5',
        borderRadius: '14px',
        colorBackground: '#fdfaf5',
        colorPrimary: '#8e5233',
        colorText: '#262626',
        colorDanger: '#df1b41',
        spacingUnit: '4px',
    },
    rules: {
        '.Input': {
            border: '1px solid #e5e5e5',
            boxShadow: 'none',
            padding: '12px 16px',
            fontSize: '12px',
        },
        '.Input:focus': {
            border: '1px solid #8e5233',
            boxShadow: 'none',
        },
        '.Label': {
            fontSize: '11px',
            fontWeight: '600',
            color: '#a3a3a3',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '6px',
        }
    }
};

// Stripe payment checkout form child component
function StripePaymentForm({ orderNumber, phone, email, onClose }) {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [stripeReady, setStripeReady] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setPaymentLoading(true);
        setPaymentError(null);

        const verificationQuery = phone 
            ? `&phone=${encodeURIComponent(phone)}` 
            : email 
                ? `&email=${encodeURIComponent(email)}` 
                : '';

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment/success?order=${orderNumber}${verificationQuery}`,
            },
        });

        if (error) {
            setPaymentError(error.message || 'Payment confirmation failed.');
            setPaymentLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {!stripeReady && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 bg-neutral-55/40 rounded-[20px] border border-neutral-100">
                    <Loader2 className="animate-spin text-[#8e5233]" size={28} />
                    <span className="text-xs font-semibold text-neutral-500">Loading secure checkout...</span>
                </div>
            )}

            <div style={{ display: stripeReady ? 'block' : 'none' }}>
                <PaymentElement onReady={() => setStripeReady(true)} />
            </div>
            
            {paymentError && (
                <div className="flex items-center space-x-2 text-red-700 bg-red-50 border border-red-200 rounded-[12px] p-3 text-xs text-left animate-fadeIn">
                    <AlertCircle size={16} />
                    <span>{paymentError}</span>
                </div>
            )}

            {stripeReady && (
                <div className="flex flex-col-reverse sm:flex-row gap-3 animate-fadeIn">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={paymentLoading}
                        className="w-full sm:flex-1 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-semibold rounded-full py-3.5 px-5 text-xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={paymentLoading || !stripe}
                        className="w-full sm:flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/60 text-white font-bold rounded-full py-3.5 px-5 text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 transition-all cursor-pointer whitespace-nowrap"
                    >
                        {paymentLoading ? (
                            <>
                                <Loader2 size={14} className="animate-spin shrink-0" />
                                <span>Confirming...</span>
                            </>
                        ) : (
                            <>
                                <Lock size={13} className="text-emerald-100 shrink-0" strokeWidth={2.5} />
                                <span>Complete Payment Securely</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </form>
    );
}

export default function Checkout() {
    const navigate = useNavigate();
    const { 
        cart, cartSubtotal, cartDeliveryFee, flatDeliveryFee, cartTotal, orderType, 
        isFreeDelivery, freeDeliveryThreshold,
        deliveryInfo, collectionSlot, clearCart, user, token,
        login, logout, updateCartQty, removeFromCart, setOrderType,
        setDeliveryInfo, setCollectionSlot, isSearchOpen, setIsSearchOpen
    } = useApp();

    const formatCollectionSlot = (slot) => {
        if (!slot) return '';
        try {
            const slotParts = parseCollectionDateTime(slot);
            if (!slotParts) return slot.label || `${slot.date} at ${slot.time}`;

            const todayUK = getUKTodayParts();
            const tomorrowUK = addDaysToDateParts(todayUK, 1);
            const slotDateKey = dateKey(slotParts);
            const isToday = slotDateKey === dateKey(todayUK);
            const isTomorrow = slotDateKey === dateKey(tomorrowUK);

            let dateLabel = '';
            if (isToday) {
                dateLabel = 'Today';
            } else if (isTomorrow) {
                dateLabel = 'Tomorrow';
            } else {
                dateLabel = new Intl.DateTimeFormat('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                }).format(new Date(Date.UTC(slotParts.year, slotParts.month - 1, slotParts.day)));
            }

            let hours = slotParts.hour;
            const minutes = String(slotParts.minute).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const timeLabel = `${hours}:${minutes} ${ampm}`;

            return `${dateLabel} at ${timeLabel}`;
        } catch (e) {
            return slot.label || `${slot.date} at ${slot.time}`;
        }
    };

    const renderDeliveryAddress = () => {
        if (!deliveryInfo) return null;
        const distance = deliveryInfo.distance_miles || deliveryInfo.distance_from_store;
        return (
            <span className="flex flex-wrap items-center gap-2">
                <span>
                    {deliveryInfo.address_line_1}
                    {deliveryInfo.city && `, ${deliveryInfo.city}`}
                    {deliveryInfo.postcode && ` · ${deliveryInfo.postcode}`}
                </span>
                {distance && (
                    <span className="bg-[#8e5233]/8 text-[#8e5233] text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">
                        {Number(distance).toFixed(1)} miles from store
                    </span>
                )}
            </span>
        );
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authTab, setAuthTab] = useState('guest'); // 'guest', 'auth'
    const [authSubMode, setAuthSubMode] = useState('login'); // 'login', 'register'
    const [authPassword, setAuthPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [registerMethod, setRegisterMethod] = useState('phone'); // 'phone' | 'email'
    const [mobileBasketOpen, setMobileBasketOpen] = useState(false);

    const fillCheckoutContactFromUser = (profile) => {
        if (!profile) return;
        setFirstName(profile.first_name || profile.name?.split(' ')[0] || '');
        setLastName(profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '');
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
        setCreateAccount(false);
    };

    const continueToCheckoutForm = () => {
        setAuthTab('auth');
        setAuthSubMode('login');
        setAuthError(null);
        setTimeout(() => {
            document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    };

    const handleInlineLogin = async () => {
        setAuthError(null);
        setAuthLoading(true);

        const email_or_phone = email || phone;
        if (!email_or_phone || !authPassword) {
            setAuthError('Please enter your email/phone and password.');
            setAuthLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/customer/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_or_phone, password: authPassword })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setAuthError(data.message || 'Incorrect credentials.');
                setAuthLoading(false);
                return;
            }

            const profile = data.data.user || data.data.customer;
            login(data.data.token, profile, 'customer');
            fillCheckoutContactFromUser(profile);
            continueToCheckoutForm();
            toast.success(`Welcome back, ${profile?.first_name || 'Customer'}!`);
        } catch (err) {
            setAuthError('Connection failed.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleInlineRegister = async () => {
        setAuthError(null);
        setAuthLoading(true);

        const selectedContact = registerMethod === 'email' ? email : phone;
        if (!firstName || !lastName || !selectedContact || !authPassword) {
            setAuthError(`Please enter your first name, last name, ${registerMethod === 'email' ? 'email address' : 'phone number'}, and password.`);
            setAuthLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/customer/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                    email: email || null,
                    password: authPassword,
                    password_confirmation: authPassword
                })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setAuthError(data.message || 'Registration failed.');
                setAuthLoading(false);
                return;
            }

            const profile = data.data.user || data.data.customer;
            login(data.data.token, profile, 'customer');
            fillCheckoutContactFromUser(profile);
            continueToCheckoutForm();
            toast.success(`Account created successfully! Welcome.`);
        } catch (err) {
            setAuthError('Connection failed.');
        } finally {
            setAuthLoading(false);
        }
    };

    // Form inputs
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('London');
    const [country, setCountry] = useState('United Kingdom');
    const [postcode, setPostcode] = useState('');

    // Toggle guest checkout vs account creation
    const [createAccount, setCreateAccount] = useState(false);
    const [registerPassword, setRegisterPassword] = useState('');

    // Static Mock Credit Card fields (only shown in simulated payment mode)
    const [cardNumber, setCardNumber] = useState('');
    const [expDate, setExpDate] = useState('');
    const [cvc, setCvc] = useState('');
    const [cardName, setCardName] = useState('');

    // Stripe checkout overlays
    const [stripeClientSecret, setStripeClientSecret] = useState(null);
    const [activeOrderNumber, setActiveOrderNumber] = useState('');

    // Guest contact method choice ('email' or 'phone')
    const [guestContactMethod, setGuestContactMethod] = useState('phone');

    // Status states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const hasDeliveryDetails = !!(
        deliveryInfo?.address_line_1
        && deliveryInfo?.postcode
    );
    const hasCollectionDetails = !!collectionSlot?.datetime;
    const isGuestCheckout = !user && authTab === 'guest';
    const hasGuestContact = !isGuestCheckout
        || (guestContactMethod === 'email' ? !!email.trim() : !!phone.trim());
    const selectedMethodIsComplete = orderType === 'delivery'
        ? hasDeliveryDetails
        : orderType === 'collection'
            ? hasCollectionDetails
            : false;

    // Autofill if logged in
    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || user.name?.split(' ')[0] || '');
            setLastName(user.last_name || user.name?.split(' ')[1] || '');
            setPhone(user.phone || '');
            setEmail(user.email || '');
            setCreateAccount(false);
        }
    }, [user]);

    // Load postcode & address default info
    useEffect(() => {
        if (deliveryInfo) {
            if (deliveryInfo.address_line_1) setStreetAddress(deliveryInfo.address_line_1);
            if (deliveryInfo.city) setCity(deliveryInfo.city);
            if (deliveryInfo.postcode) setPostcode(deliveryInfo.postcode);
        }
    }, [deliveryInfo]);

    const handleSwitchAuthMode = (mode) => {
        if (mode === 'guest') {
            setCreateAccount(false);
        } else {
            if (user) return; // already logged in
            setCreateAccount(true);
        }
    };

    const failCheckoutValidation = (message) => {
        setError(null);
        toast.error(message);
        setLoading(false);
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (cart.length === 0) {
            failCheckoutValidation('Your cart is empty.');
            return;
        }

        if (!orderType) {
            failCheckoutValidation('Choose delivery or collection before placing your order.');
            return;
        }

        if (orderType === 'delivery' && !hasDeliveryDetails) {
            failCheckoutValidation('Add your delivery address before placing your order.');
            return;
        }

        if (orderType === 'collection' && !hasCollectionDetails) {
            failCheckoutValidation('Select a collection slot before placing your order.');
            return;
        }

        if (isGuestCheckout) {
            if (guestContactMethod === 'email' && !email.trim()) {
                failCheckoutValidation('Enter your email address, or switch to phone and enter a phone number, to continue as a guest.');
                return;
            }
            if (guestContactMethod === 'phone' && !phone.trim()) {
                failCheckoutValidation('Enter your phone number, or switch to email and enter an email address, to continue as a guest.');
                return;
            }
        } else if (!user && authTab === 'auth') {
            failCheckoutValidation('Please complete Sign In or Sign Up to proceed.');
            return;
        } else {
            if (!firstName || !lastName || (!phone && !email)) {
                failCheckoutValidation('First Name, Last Name, and at least one contact method (Email or Phone) are required.');
                return;
            }
        }

        // Validate credit card inputs only if Stripe is NOT configured
        if (!isRealStripeConfigured) {
            if (!cardNumber || !expDate || !cvc || !cardName) {
                failCheckoutValidation('Please complete all payment card details.');
                return;
            }
        }

        // If registering account
        if (createAccount && !user) {
            if (!email) {
                failCheckoutValidation('Email is required to create an account.');
                return;
            }
            if (!registerPassword || registerPassword.length < 6) {
                failCheckoutValidation('Password must be at least 6 characters.');
                return;
            }

            try {
                const regRes = await fetch('/api/customer/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        phone: phone,
                        password: registerPassword,
                        password_confirmation: registerPassword
                    })
                });

                const regData = await regRes.json();
                if (!regRes.ok || !regData.success) {
                    setError(regData.message || 'Registration failed.');
                    setLoading(false);
                    return;
                }

                // Auto login
                const token = regData.data.token;
                const profile = regData.data.user || regData.data.customer;
                login(token, profile, 'customer');
            } catch (err) {
                console.error(err);
                setError('Failed to create account.');
                setLoading(false);
                return;
            }
        }

        const payload = {
            type: orderType,
            notes: notes || null,
            payment_method: isRealStripeConfigured ? 'stripe' : 'mock_stripe',
            items: cart.map(item => ({
                product_id: item.product_id,
                product_variation_id: item.product_variation_id,
                quantity: item.quantity
            }))
        };

        // Customer details (always sent as route is open/not guarded by sanctum auth for guest checkouts)
        payload.customer = {
            first_name: (!user && authTab === 'guest') ? null : (firstName || null),
            last_name: (!user && authTab === 'guest') ? null : (lastName || null),
            phone: (!user && authTab === 'guest' && guestContactMethod === 'email') ? null : phone,
            email: (!user && authTab === 'guest' && guestContactMethod === 'phone') ? null : (email || null)
        };

        // Delivery Address or Collection time
        if (orderType === 'delivery') {
            payload.address = {
                address_line_1: deliveryInfo.address_line_1,
                city: deliveryInfo.city || 'London',
                postcode: deliveryInfo.postcode,
                type: deliveryInfo?.type || 'home',
                is_default: false
            };
        } else {
            payload.collection_time = collectionSlot?.datetime;
        }

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || 'Failed to place the order.');
                setLoading(false);
                return;
            }

            const createdOrder = data.data;

            if (createdOrder.client_secret && !createdOrder.client_secret.startsWith('mock_secret_')) {
                // Real Stripe Payment Intent generated. Show Payment Element modal
                setActiveOrderNumber(createdOrder.order_number);
                setStripeClientSecret(createdOrder.client_secret);
                setLoading(false);
            } else {
                // Mock transaction completed. Proceed directly to Success.
                sessionStorage.removeItem('pl_checkout_details');
                sessionStorage.setItem('pl_last_order', JSON.stringify(createdOrder));
                clearCart();
                
                const verificationQuery = phone 
                    ? `&phone=${encodeURIComponent(phone)}` 
                    : email 
                        ? `&email=${encodeURIComponent(email)}` 
                        : '';
                navigate(`/payment/success?order=${createdOrder.order_number}${verificationQuery}`, { replace: true });
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please check your network.');
            setLoading(false);
        }
    };

    const handleSwitchOrderBanner = () => {
        const currentPath = encodeURIComponent(window.location.pathname);
        if (orderType === 'delivery') {
            navigate(`/delivery-setup?redirect=${currentPath}`);
        } else if (orderType === 'collection') {
            navigate(`/collection-setup?redirect=${currentPath}`);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfaf5] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <Header 
                setIsMenuOpen={setIsMenuOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                navigate={navigate}
                cartItemCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
                user={user}
            />

            {/* Curved overlap container matching /track page style */}
            <main className="w-full mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-4 pt-6 pb-2 md:px-8 md:py-10 flex-grow flex flex-col items-center" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                <div className="w-full max-w-6xl">

                {/* Back Button */}
                {!stripeClientSecret && (
                    <div className="mb-3">
                        <button 
                            type="button"
                            onClick={() => {
                                if (window.history.state && window.history.state.idx > 0) {
                                    navigate(-1);
                                } else {
                                    navigate('/');
                                }
                            }}
                            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-450 hover:text-neutral-800 transition-colors cursor-pointer"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                    </div>
                )}

                {/* Two-column grid */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

                    {/* ══════════════════════════════════════════
                        LEFT — Form column
                    ══════════════════════════════════════════ */}
                    <div className="w-full lg:flex-1 space-y-4 pb-4 lg:pb-10">

                        {/* ── Stripe Payment Step ── */}
                        {stripeClientSecret ? (
                            <div className="bg-white rounded-[20px] border border-neutral-200/60 shadow-lg shadow-[#8e5233]/5 p-4 sm:p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                        <Lock size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-[#8F5336] font-serif text-lg font-bold">Secure Payment</h2>
                                        <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            SSL Encrypted
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-neutral-50 rounded-xl p-4 text-xs space-y-2 border border-neutral-100">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Order Reference</span>
                                        <span className="font-bold text-neutral-800">{activeOrderNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-neutral-500">Total Payable</span>
                                        <span className="font-extrabold text-[#8e5233] text-sm">£{cartTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: stripeAppearance }}>
                                    <StripePaymentForm
                                        orderNumber={activeOrderNumber}
                                        phone={phone}
                                        email={email}
                                        onClose={() => { setStripeClientSecret(null); setActiveOrderNumber(''); }}
                                    />
                                </Elements>

                                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[9px] text-neutral-400 font-medium">
                                    <span>🔒 256-bit SSL</span>
                                    <span className="uppercase tracking-wide">Powered by <span className="font-extrabold text-neutral-500">stripe</span></span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Mobile-only collapsible basket */}
                                {cart.length > 0 && (
                                    <div className="lg:hidden rounded-2xl border border-[#8e5233]/15 overflow-hidden bg-white shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setMobileBasketOpen(o => !o)}
                                            className="w-full flex items-center justify-between px-4 py-3.5 bg-[#8e5233]/5"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xs font-semibold text-neutral-800">Your Order</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-serif font-bold text-[#8e5233] text-sm">£{cartTotal.toFixed(2)}</span>
                                                <ChevronRight size={14} className={`text-neutral-400 transition-transform duration-200 ${mobileBasketOpen ? 'rotate-90' : ''}`} />
                                            </div>
                                        </button>
                                        {mobileBasketOpen && (
                                            <div className="px-4 pb-4 pt-2 space-y-3 animate-fadeIn">
                                                <div className="divide-y divide-neutral-100">
                                                    {cart.map(item => (
                                                        <div key={item.key} className="py-2.5 flex items-center gap-3 text-xs">
                                                            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#eae2d5]">
                                                                <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.src = '/images/placeholder.svg'; }} />
                                                            </div>
                                                            <div className="flex-grow min-w-0">
                                                                <p className="font-semibold text-neutral-900 truncate">{item.name}</p>
                                                                {item.variation_name && <p className="text-[10px] text-neutral-400">{item.variation_name}</p>}
                                                                {/* Quantity controls */}
                                                                <div className="flex items-center border border-[#8e5233] bg-white rounded-full w-fit px-1 mt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); updateCartQty(item.key, item.quantity - 1); }}
                                                                        className="w-5 h-5 rounded-full text-[#8e5233] hover:bg-[#8e5233] hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                                                    >
                                                                        <Minus size={9} />
                                                                    </button>
                                                                    <span className="px-1.5 text-[10px] font-bold text-neutral-800">{item.quantity}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); updateCartQty(item.key, item.quantity + 1); }}
                                                                        className="w-5 h-5 rounded-full text-[#8e5233] hover:bg-[#8e5233] hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                                                    >
                                                                        <Plus size={9} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 flex flex-col items-end gap-2">
                                                                <button type="button" onClick={() => removeFromCart(item.key)} className="text-neutral-300 hover:text-red-400 transition-colors cursor-pointer"><Trash2 size={13} /></button>
                                                                <span className="font-serif font-semibold text-neutral-800">£{(item.price * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t border-neutral-100 pt-3 space-y-1.5">
                                                    <div className="flex justify-between text-xs text-neutral-500">
                                                        <span>Subtotal</span>
                                                        <span className="font-medium text-neutral-800">£{cartSubtotal.toFixed(2)}</span>
                                                    </div>
                                                    {orderType === 'delivery' && (
                                                        <div className="flex justify-between text-xs text-neutral-500">
                                                            <span>Delivery charge {freeDeliveryThreshold !== null && `(Free over £${freeDeliveryThreshold})`}</span>
                                                            {isFreeDelivery
                                                                ? <span className="font-semibold text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>FREE</span>
                                                                : <span className="font-medium text-neutral-800">£{cartDeliveryFee.toFixed(2)}</span>}
                                                        </div>
                                                    )}
                                                    {orderType === 'delivery' && freeDeliveryThreshold !== null && !isFreeDelivery && (
                                                        <div className="space-y-1 pt-1">
                                                            <p className="text-[10px] text-neutral-500">Add <span className="font-bold text-[#8F5336]">£{(freeDeliveryThreshold - cartSubtotal).toFixed(2)}</span> more to get <span className="font-bold text-green-600">FREE Delivery</span> (Save £{cartDeliveryFee.toFixed(2)})</p>
                                                            <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden">
                                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((cartSubtotal / freeDeliveryThreshold) * 100, 100)}%`, background: 'linear-gradient(90deg,#d4a574,#8F5336)' }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {orderType === 'delivery' && isFreeDelivery && <p className="text-[10px] text-green-600 font-bold">🎉 Free delivery unlocked! (Saved £{flatDeliveryFee.toFixed(2)})</p>}
                                                    <div className="flex justify-between items-baseline pt-2 border-t border-neutral-100 mt-1">
                                                        <span className="text-sm font-serif text-[#8F5336] font-bold">Total</span>
                                                        <span className="text-base font-serif text-[#8F5336] font-semibold">£{cartTotal.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── STEP 1 · Who are you? ── */}
                                <div className="bg-white rounded-[20px] border border-neutral-200/60 shadow-lg shadow-[#8e5233]/5 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full bg-neutral-800 text-white text-[8px] font-bold flex items-center justify-center shrink-0">1</span>
                                        <h2 className="text-sm font-bold text-neutral-800 tracking-wide">Account</h2>
                                        {user && <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Signed in</span>}
                                    </div>
                                    <div className="p-5">
                                        {!user ? (
                                            <div className="space-y-4">
                                                {/* Tab switcher */}
                                                <div className="flex bg-neutral-50 border border-neutral-200 p-1 rounded-xl w-full">
                                                    <button type="button" onClick={() => { setAuthTab('guest'); setAuthError(null); }}
                                                        className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${authTab === 'guest' ? 'bg-white text-[#8e5233] shadow-sm border border-neutral-200' : 'text-neutral-500 hover:text-neutral-800'}`}>
                                                        Guest Checkout
                                                    </button>
                                                    <button type="button" onClick={() => { setAuthTab('auth'); setAuthSubMode('login'); setAuthError(null); }}
                                                        className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${authTab === 'auth' ? 'bg-white text-[#8e5233] shadow-sm border border-neutral-200' : 'text-neutral-500 hover:text-neutral-800'}`}>
                                                        Sign In / Sign Up
                                                    </button>
                                                </div>

                                                {/* Auth forms */}
                                                {authTab === 'auth' && (
                                                    <div className="space-y-4 animate-fadeIn">
                                                        {authSubMode === 'login' ? (
                                                            <div className="space-y-3">
                                                                <div className="relative">
                                                                    <User className="absolute left-3.5 top-3.5 text-neutral-350" size={14} />
                                                                    <input type="text" value={email || phone}
                                                                        onChange={e => { const v = e.target.value; if (v.includes('@')) { setEmail(v); setPhone(''); } else { setPhone(v); setEmail(''); } }}
                                                                        placeholder="Email or phone number"
                                                                        className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl pl-10 pr-4 py-3 text-xs text-neutral-900 focus:outline-none transition-all" />
                                                                </div>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-3.5 top-3.5 text-neutral-350" size={14} />
                                                                    <input type={showPassword ? 'text' : 'password'} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••"
                                                                        className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl pl-10 pr-10 py-3 text-xs text-neutral-900 focus:outline-none transition-all" />
                                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-neutral-400 hover:text-[#8e5233] cursor-pointer focus:outline-none">
                                                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                                                    </button>
                                                                </div>
                                                                {authError && <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 text-xs"><AlertCircle size={14} /><span>{authError}</span></div>}
                                                                <button type="button" onClick={handleInlineLogin} disabled={authLoading}
                                                                    className="w-full bg-[#8e5233] hover:bg-[#723e25] text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                                                    {authLoading ? <Loader2 className="animate-spin" size={14} /> : 'Sign In & Continue'}
                                                                </button>
                                                                <p className="text-center text-xs text-neutral-500">Don't have an account? <button type="button" onClick={() => { setAuthSubMode('register'); setAuthError(null); }} className="text-[#8e5233] font-semibold hover:underline cursor-pointer">Sign Up</button></p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name"
                                                                        className="bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none transition-all" />
                                                                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name"
                                                                        className="bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none transition-all" />
                                                                </div>
                                                                {/* Contact field with phone/email toggle — matches Auth.jsx */}
                                                                <div>
                                                                    <div className="relative flex items-center">
                                                                        {registerMethod === 'email' ? (
                                                                            <>
                                                                                <Mail className="absolute left-4 text-neutral-400" size={14} />
                                                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john.doe@example.com"
                                                                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-20 py-3 text-xs text-neutral-900 focus:outline-none transition-all" />
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <div className="absolute left-4 flex items-center space-x-1 text-neutral-400 pr-2 border-r border-neutral-200 shrink-0 select-none">
                                                                                    <span className="text-sm">🇬🇧</span>
                                                                                </div>
                                                                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 07123456789"
                                                                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-16 pr-20 py-3 text-xs text-neutral-900 focus:outline-none transition-all" />
                                                                            </>
                                                                        )}
                                                                        {/* Toggle phone / email */}
                                                                        <div className="absolute right-2 flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                                                                            <button type="button" onClick={() => { setRegisterMethod('phone'); setEmail(''); }} title="Use Phone Number"
                                                                                className={`p-1.5 rounded-md transition-all cursor-pointer ${registerMethod === 'phone' ? 'bg-[#8e5233] text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
                                                                                <Phone size={11} />
                                                                            </button>
                                                                            <button type="button" onClick={() => { setRegisterMethod('email'); setPhone(''); }} title="Use Email Address"
                                                                                className={`p-1.5 rounded-md transition-all cursor-pointer ${registerMethod === 'email' ? 'bg-[#8e5233] text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
                                                                                <Mail size={11} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-3.5 top-3.5 text-neutral-350" size={14} />
                                                                    <input type={showPassword ? 'text' : 'password'} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password"
                                                                        className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-10 pr-10 py-3 text-xs text-neutral-900 focus:outline-none transition-all" />
                                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-neutral-400 hover:text-[#8e5233] cursor-pointer focus:outline-none">
                                                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                                                    </button>
                                                                </div>
                                                                {authError && <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 text-xs"><AlertCircle size={14} /><span>{authError}</span></div>}
                                                                <button type="button" onClick={handleInlineRegister} disabled={authLoading}
                                                                    className="w-full bg-[#8e5233] hover:bg-[#723e25] text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                                                    {authLoading ? <Loader2 className="animate-spin" size={14} /> : 'Create Account & Continue'}
                                                                </button>
                                                                <p className="text-center text-xs text-neutral-500">Already have an account? <button type="button" onClick={() => { setAuthSubMode('login'); setAuthError(null); }} className="text-[#8e5233] font-semibold hover:underline cursor-pointer">Sign In</button></p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Logged-in card */
                                            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                                                <div className="w-9 h-9 rounded-full bg-[#8e5233]/10 text-[#8e5233] flex items-center justify-center shrink-0">
                                                    <CheckCircle size={17} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-neutral-800 truncate">
                                                        {(firstName || user.first_name || user.name || 'Customer')} {(lastName || user.last_name || '')}
                                                    </p>
                                                    <p className="text-[11px] text-neutral-500 truncate">{email || user.email || phone || user.phone || 'Signed in account'}</p>
                                                </div>
                                                <button type="button" onClick={() => { logout(); }} className="shrink-0 text-[10px] font-bold text-neutral-500 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1 uppercase tracking-wider">
                                                    <LogOut size={11} /> Sign out
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── STEP 2 · Contact / Delivery details ── */}
                                {(!!user || authTab === 'guest') && (
                                    <form onSubmit={handlePlaceOrder} id="checkout-form">

                                        {/* Order method card */}
                                        <div className="bg-white rounded-[20px] border border-neutral-200/60 shadow-lg shadow-[#8e5233]/5 overflow-hidden mb-4">
                                            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
                                                <span className="w-4 h-4 rounded-full bg-neutral-800 text-white text-[8px] font-bold flex items-center justify-center shrink-0">2</span>
                                                <h2 className="text-sm font-bold text-neutral-800 tracking-wide">
                                                    {!orderType ? 'Order Method' : orderType === 'delivery' ? 'Delivery Address' : 'Collection Slot'}
                                                </h2>
                                                {orderType && (
                                                    <button type="button" onClick={handleSwitchOrderBanner}
                                                        className="ml-auto text-[10px] font-bold text-[#8e5233] bg-[#8e5233]/8 hover:bg-[#8e5233]/15 px-3 py-1.5 rounded-full transition-all cursor-pointer uppercase tracking-wider">
                                                        Change
                                                    </button>
                                                )}
                                            </div>
                                            <div className="px-5 py-4 text-xs">
                                                {!orderType ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="font-bold">Choose delivery or collection first.</p>
                                                                <p className="text-[11px] text-amber-700 mt-1">We need this before we can calculate the final order details.</p>
                                                            </div>
                                                        </div>
                                                        <div className="grid sm:grid-cols-2 gap-3">
                                                            <button type="button" onClick={() => navigate('/delivery-setup?redirect=/cart')}
                                                                className="flex items-center justify-center gap-2 rounded-xl border border-[#8e5233]/20 bg-[#8e5233]/8 px-4 py-3 text-[#8e5233] font-bold hover:bg-[#8e5233]/15 transition-colors cursor-pointer">
                                                                <MapPin size={14} />
                                                                <span>Set Delivery</span>
                                                            </button>
                                                            <button type="button" onClick={() => navigate('/collection-setup?redirect=/cart')}
                                                                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-700 font-bold hover:bg-neutral-100 transition-colors cursor-pointer">
                                                                <Clock size={14} />
                                                                <span>Set Collection</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#8e5233]/10 text-[#8e5233] flex items-center justify-center shrink-0">
                                                            {orderType === 'delivery' ? <MapPin size={14} /> : <Clock size={14} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0 self-center">
                                                            {selectedMethodIsComplete ? (
                                                                <p className="text-neutral-700 font-medium">
                                                                    {orderType === 'delivery'
                                                                        ? renderDeliveryAddress()
                                                                        : <>{formatCollectionSlot(collectionSlot)}</>}
                                                                </p>
                                                            ) : (
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                                                                    <div className="flex items-start gap-2 flex-1">
                                                                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                                                        <div>
                                                                            <p className="font-bold">
                                                                                {orderType === 'delivery' ? 'Delivery address is missing.' : 'Collection slot is missing.'}
                                                                            </p>
                                                                            <p className="text-[11px] text-amber-700 mt-1">
                                                                                {orderType === 'delivery'
                                                                                    ? 'Add your address so we can deliver the order correctly.'
                                                                                    : 'Pick a date and time so the shop knows when to prepare your order.'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <button type="button" onClick={handleSwitchOrderBanner}
                                                                        className="shrink-0 rounded-full bg-white border border-amber-300 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer">
                                                                        {orderType === 'delivery' ? 'Add Address' : 'Pick Slot'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Contact card */}
                                        <div className="bg-white rounded-[20px] border border-neutral-200/60 shadow-lg shadow-[#8e5233]/5 overflow-hidden mb-4">
                                            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
                                                <span className="w-4 h-4 rounded-full bg-neutral-800 text-white text-[8px] font-bold flex items-center justify-center shrink-0">3</span>
                                                <h2 className="text-sm font-bold text-neutral-800 tracking-wide">Contact Details</h2>
                                            </div>
                                            <div className="p-5 space-y-3">
                                                {user ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name"
                                                                className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all w-full" />
                                                            <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name"
                                                                className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all w-full" />
                                                        </div>
                                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                                                            className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all" />
                                                        <div className="flex bg-neutral-50 border border-neutral-200 focus-within:border-[#8e5233] focus-within:bg-white rounded-xl px-4 py-1 transition-all items-center gap-2">
                                                            <span className="text-sm leading-none shrink-0">🇬🇧</span>
                                                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number"
                                                                className="flex-1 bg-transparent border-0 py-2.5 text-xs focus:outline-none" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Guest contact */
                                                    <div className="space-y-3 animate-fadeIn">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                                            {guestContactMethod === 'email' ? 'Email Address' : 'Phone Number'}
                                                        </label>
                                                        <div className="relative flex items-center">
                                                            {guestContactMethod === 'email' ? (
                                                                <><Mail className="absolute left-3.5 text-neutral-350" size={14} />
                                                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                                                                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl pl-10 pr-24 py-3 text-xs focus:outline-none transition-all" /></>
                                                            ) : (
                                                                <><div className="absolute left-3.5 flex items-center gap-1 text-neutral-400 border-r border-neutral-200 pr-2 shrink-0">
                                                                    <span className="text-sm">🇬🇧</span>
                                                                </div>
                                                                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number"
                                                                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl pl-16 pr-24 py-3 text-xs focus:outline-none transition-all" /></>
                                                            )}
                                                            {/* Switch buttons */}
                                                            <div className="absolute right-2 flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                                                                <button type="button" onClick={() => setGuestContactMethod('phone')} title="Phone"
                                                                    className={`p-1.5 rounded-md transition-all cursor-pointer ${guestContactMethod === 'phone' ? 'bg-[#8e5233] text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
                                                                    <Phone size={11} />
                                                                </button>
                                                                <button type="button" onClick={() => setGuestContactMethod('email')} title="Email"
                                                                    className={`p-1.5 rounded-md transition-all cursor-pointer ${guestContactMethod === 'email' ? 'bg-[#8e5233] text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
                                                                    <Mail size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {!hasGuestContact && (
                                                            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
                                                                <AlertCircle size={13} className="shrink-0" />
                                                                <span>{guestContactMethod === 'email' ? 'Email is selected. You can enter an email address or switch to phone.' : 'Phone is selected. You can enter a phone number or switch to email.'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {(!!user || createAccount || (!createAccount && guestContactMethod === 'email')) && (
                                                    <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none">
                                                        <input type="checkbox" className="w-4 h-4 accent-[#8e5233] mt-0.5 shrink-0" defaultChecked />
                                                        <span className="text-[11px] text-neutral-500 font-medium">Subscribe to updates & promotions</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notes + extras card */}
                                        <div className="bg-white rounded-[20px] border border-neutral-200/60 shadow-lg shadow-[#8e5233]/5 overflow-hidden mb-4">
                                            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
                                                <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-500 text-[8px] font-bold flex items-center justify-center shrink-0">4</span>
                                                <h2 className="text-sm font-bold text-neutral-800 tracking-wide">Notes <span className="text-neutral-400 font-normal text-[11px]">(optional)</span></h2>
                                            </div>
                                            <div className="p-5 space-y-4">
                                                <textarea rows="2" value={notes} onChange={e => setNotes(e.target.value)}
                                                    placeholder="Delivery instructions, allergies, special requests…"
                                                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all resize-none" />
                                            </div>
                                        </div>

                                        {/* Payment section (mock only) */}
                                        {!isRealStripeConfigured && (
                                            <div className="bg-white rounded-[20px] border border-neutral-200/60 shadow-lg shadow-[#8e5233]/5 overflow-hidden mb-4">
                                                <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
                                                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-500 text-[8px] font-bold flex items-center justify-center shrink-0">5</span>
                                                    <h2 className="text-sm font-bold text-neutral-800 tracking-wide">Payment <span className="text-[10px] font-normal text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-1">Simulated</span></h2>
                                                </div>
                                                <div className="p-5 space-y-3">
                                                    <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="Card number"
                                                        className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all" />
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <input type="text" value={expDate} onChange={e => setExpDate(e.target.value)} placeholder="MM / YY"
                                                            className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all" />
                                                        <input type="text" value={cvc} onChange={e => setCvc(e.target.value)} placeholder="CVC"
                                                            className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all" />
                                                        <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Name on card"
                                                            className="bg-neutral-50 border border-neutral-200 focus:border-[#8e5233] focus:bg-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {isRealStripeConfigured && (
                                            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl px-5 py-4 mb-4 hidden lg:flex items-center gap-3 text-xs text-emerald-700">
                                                <Lock size={14} className="shrink-0" strokeWidth={2.5} />
                                                <span>Your payment details are entered securely in the next step — powered by <strong>Stripe</strong>.</span>
                                            </div>
                                        )}

                                        {/* Error */}
                                        {error && (
                                            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-4 text-xs mb-4 animate-fadeIn">
                                                <AlertCircle size={15} className="shrink-0" />
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        {/* Desktop CTA */}
                                        <button type="submit" disabled={loading}
                                            className="hidden lg:flex w-full bg-[#8e5233] hover:bg-[#723e25] disabled:bg-[#8e5233]/60 text-white font-semibold rounded-2xl py-4 items-center justify-center gap-2 shadow-lg shadow-[#8e5233]/15 transition-all cursor-pointer font-serif text-sm tracking-wide">
                                            {loading
                                                ? <><Loader2 size={16} className="animate-spin" /><span>Placing Order…</span></>
                                                : <><Lock size={14} className="shrink-0" strokeWidth={2.5} /><span>{isRealStripeConfigured ? 'Continue to Payment' : 'Place Order'}</span></>}
                                        </button>

                                    </form>
                                )}
                            </>
                        )}
                    </div>

                    {/* ══════════════════════════════════════════
                        RIGHT — Order summary (desktop only)
                    ══════════════════════════════════════════ */}
                    <div className="hidden lg:block w-full lg:w-[360px] shrink-0">
                        <div className="sticky top-6 bg-white rounded-[20px] border border-neutral-200/60 shadow-lg shadow-[#8e5233]/5 overflow-hidden">
                            <div className="px-5 py-4 border-b border-neutral-100">
                                <h3 className="text-sm font-bold text-neutral-800">Your Order</h3>
                                <p className="text-[10px] text-neutral-400 mt-0.5">{cart.reduce((s,i)=>s+i.quantity,0)} item{cart.reduce((s,i)=>s+i.quantity,0)!==1?'s':''}</p>
                            </div>

                            {cart.length === 0 ? (
                                <div className="py-12 text-center text-neutral-400 text-xs px-5">Your basket is empty.</div>
                            ) : (
                                <>
                                    {/* Items */}
                                    <div className="px-5 py-4 divide-y divide-neutral-100 max-h-[320px] overflow-y-auto custom-scrollbar">
                                        {cart.map(item => (
                                            <div key={item.key} className="py-3 flex items-center gap-3 text-xs">
                                                <div className="w-11 h-11 bg-[#eae2d5] rounded-xl overflow-hidden shrink-0 border border-neutral-100">
                                                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover"
                                                        onError={e => { e.target.src = '/images/placeholder.svg'; }} />
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-semibold text-neutral-900 leading-tight">{item.name}</p>
                                                    {item.variation_name && <p className="text-[10px] text-neutral-400 mt-0.5">{item.variation_name}</p>}
                                                    <div className="flex items-center mt-1.5 gap-1 border border-[#8e5233]/30 rounded-full w-fit px-1.5 py-0.5">
                                                        <button type="button" onClick={() => updateCartQty(item.key, item.quantity-1)} className="w-3.5 h-3.5 flex items-center justify-center text-[#8e5233] cursor-pointer"><Minus size={7} /></button>
                                                        <span className="text-[10px] font-bold px-1">{item.quantity}</span>
                                                        <button type="button" onClick={() => updateCartQty(item.key, item.quantity+1)} className="w-3.5 h-3.5 flex items-center justify-center text-[#8e5233] cursor-pointer"><Plus size={7} /></button>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex flex-col items-end gap-2">
                                                    <button type="button" onClick={() => removeFromCart(item.key)} className="text-neutral-300 hover:text-red-400 transition-colors cursor-pointer"><Trash2 size={13} /></button>
                                                    <span className="font-serif font-semibold text-neutral-800">£{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div className="px-5 py-4 border-t border-neutral-100 bg-neutral-50/60 space-y-2.5">
                                        <div className="flex justify-between text-xs text-neutral-500">
                                            <span>Subtotal</span>
                                            <span className="font-medium text-neutral-800">£{cartSubtotal.toFixed(2)}</span>
                                        </div>
                                        {orderType === 'delivery' && (
                                            <div className="flex justify-between text-xs text-neutral-500">
                                                <span>Delivery charge {freeDeliveryThreshold !== null && `(Free over £${freeDeliveryThreshold})`}</span>
                                                {isFreeDelivery
                                                    ? <span className="font-semibold text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>FREE</span>
                                                    : <span className="font-medium text-neutral-800">£{cartDeliveryFee.toFixed(2)}</span>}
                                            </div>
                                        )}

                                        {/* Free delivery nudge */}
                                        {orderType === 'delivery' && freeDeliveryThreshold !== null && (
                                            isFreeDelivery ? (
                                                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">
                                                    <CheckCircle size={13} className="shrink-0 text-green-500" />
                                                    <span className="font-semibold">Free delivery unlocked! 🎉 (Saved £{flatDeliveryFee.toFixed(2)})</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[10px] text-neutral-500">
                                                        <span>Add <span className="font-bold text-[#8F5336]">£{(freeDeliveryThreshold - cartSubtotal).toFixed(2)}</span> more to get <span className="font-bold text-green-600">FREE Delivery</span></span>
                                                        <span className="font-semibold text-[#8F5336]">Save £{flatDeliveryFee.toFixed(2)}</span>
                                                    </div>
                                                    <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((cartSubtotal/freeDeliveryThreshold)*100,100)}%`, background: 'linear-gradient(90deg,#d4a574,#8F5336)' }} />
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200/60 mt-1">
                                            <span className="font-serif text-base text-[#8F5336] font-bold">Total</span>
                                            <span className="font-serif text-xl text-[#8F5336] font-semibold">£{cartTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>

            {/* Sidebar Navigation Drawer */}
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} navigate={navigate}
                cartItemCount={cart.reduce((sum, i) => sum + i.quantity, 0)} user={user} logout={logout} />

            {/* Mobile sticky bottom bar */}
            {!stripeClientSecret && cart.length > 0 && (
                <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-4 py-3 flex flex-col gap-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
                    <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold leading-none mb-0.5">Total</p>
                            <p className="font-serif font-bold text-[#8e5233] text-lg leading-none">£{cartTotal.toFixed(2)}</p>
                        </div>
                        <button type="button" disabled={loading}
                            onClick={() => document.getElementById('checkout-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                            className="flex-shrink-0 bg-[#8e5233] hover:bg-[#723e25] disabled:bg-[#8e5233]/60 text-white font-semibold rounded-xl px-6 py-3 flex items-center gap-2 shadow-lg shadow-[#8e5233]/20 transition-all cursor-pointer text-sm font-serif">
                            {loading
                                ? <><Loader2 size={14} className="animate-spin" /><span>Placing…</span></>
                                : <><Lock size={13} strokeWidth={2.5} /><span>{isRealStripeConfigured ? 'Continue to Payment' : 'Place Order'}</span></>}
                        </button>
                    </div>
                    {isRealStripeConfigured && (
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 border-t border-neutral-100 pt-2 w-full text-center">
                            <Lock size={10} className="text-emerald-600 shrink-0" />
                            <span>Secure payment powered by <strong>Stripe</strong></span>
                        </div>
                    )}
                </div>
            )}

            <Footer navigate={navigate} />
        </div>

    );
}
