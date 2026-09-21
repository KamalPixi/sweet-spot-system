import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import Footer from './components/Footer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
    AlertCircle, Loader2, Lock, ChevronLeft, ChevronRight, 
    Minus, Plus, Trash2, CheckCircle, Eye, EyeOff, 
    LogOut, MapPin, Clock, ArrowRight, ShoppingBag 
} from 'lucide-react';
import OrderPopover from './landing/OrderPopover';

const getImageUrl = (url) => {
    if (!url) return '/images/placeholder.svg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
    return `/storage/${cleanUrl}`;
};

// Initialize Stripe JS SDK client instance
const stripePublishableKey = import.meta.env.VITE_STRIPE_KEY || 'pk_test_sweet_spot_placeholder';
const stripePromise = loadStripe(stripePublishableKey);

const isRealStripeConfigured = stripePublishableKey && !stripePublishableKey.startsWith('pk_test_sweet_spot_placeholder');
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
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontLineHeight: '1.5',
        borderRadius: '16px',
        colorBackground: '#ffffff',
        colorPrimary: '#24161b',
        colorText: '#24161b',
        colorDanger: '#df1b41',
        spacingUnit: '4px',
    },
    rules: {
        '.Input': {
            border: '1px solid #e5e5e5',
            boxShadow: 'none',
            padding: '13px 16px',
            fontSize: '13px',
        },
        '.Input:focus': {
            border: '1px solid #24161b',
            boxShadow: '0 0 0 2px rgba(229, 181, 130, 0.3)',
        },
        '.Label': {
            fontSize: '11px',
            fontWeight: '700',
            color: '#737373',
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
                <div className="flex flex-col items-center justify-center py-10 space-y-3 bg-[#fdfaf5] rounded-[24px] border border-neutral-200/80">
                    <Loader2 className="animate-spin text-[#24161b]" size={28} />
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
    const [contactMethod, setContactMethod] = useState('phone'); // 'phone' | 'email' - exactly matches Auth.jsx
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

        const selectedContact = contactMethod === 'email' ? email : phone;
        if (!firstName || !lastName || !selectedContact || !authPassword) {
            setAuthError(`Please enter your first name, last name, ${contactMethod === 'email' ? 'email address' : 'phone number'}, and password.`);
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

    // Stepper flow: 'details' (Fulfillment & Contact) -> 'payment' (Payment Gateway & Review)
    const [checkoutStep, setCheckoutStep] = useState('details');

    // In-page Fulfillment Popup Modal (replacing old standalone setup pages)
    const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);
    const fulfillmentAnchorRef = React.useRef(null);

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

    const validateStep1 = () => {
        if (cart.length === 0) {
            failCheckoutValidation('Your cart is empty.');
            return false;
        }

        if (!orderType) {
            failCheckoutValidation('Choose delivery or collection before proceeding.');
            return false;
        }

        if (orderType === 'delivery' && !hasDeliveryDetails) {
            failCheckoutValidation('Add your delivery address before proceeding.');
            return false;
        }

        if (orderType === 'collection' && !hasCollectionDetails) {
            failCheckoutValidation('Select a collection slot before proceeding.');
            return false;
        }

        if (isGuestCheckout) {
            if (guestContactMethod === 'email' && !email.trim()) {
                failCheckoutValidation('Enter your email address to continue as a guest.');
                return false;
            }
            if (guestContactMethod === 'phone' && !phone.trim()) {
                failCheckoutValidation('Enter your phone number to continue as a guest.');
                return false;
            }
        } else if (!user && authTab === 'auth') {
            failCheckoutValidation('Please sign in or create an account to proceed, or choose Guest Checkout.');
            return false;
        } else if (user) {
            if (!firstName || !lastName || (!phone && !email)) {
                failCheckoutValidation('Please ensure your name and contact details are filled in.');
                return false;
            }
        }

        return true;
    };

    const handleProceedToPayment = async (e) => {
        if (e) e.preventDefault();
        setError(null);

        if (!validateStep1()) return;

        // If real Stripe is configured, automatically initialize payment intent by placing draft/pending order
        if (isRealStripeConfigured) {
            await handlePlaceOrder(e);
        } else {
            setCheckoutStep('payment');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
        setIsFulfillmentModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#24161b] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <Header 
                setIsMenuOpen={setIsMenuOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                navigate={navigate}
                cartItemCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
                user={user}
            />

            {/* Standard Gap below Header & Logo */}
            <div className="w-full h-2 sm:h-3 bg-transparent" />

            {/* Main Overlapping Storefront Container with signature top & bottom curves */}
            <main className="w-full mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 px-3 sm:px-6 pt-5 pb-16 md:px-10 md:pt-8 md:pb-24 bg-[#fdfaf5] shadow-2xl flex-grow flex flex-col items-center">
                <div className="w-full max-w-6xl">

                    {/* Stepper Navigation Header & Back Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <button 
                            type="button"
                            onClick={() => {
                                if (stripeClientSecret) {
                                    setStripeClientSecret(null);
                                    setActiveOrderNumber('');
                                    setCheckoutStep('details');
                                } else if (checkoutStep === 'payment') {
                                    setCheckoutStep('details');
                                } else if (window.history.state && window.history.state.idx > 0) {
                                    navigate(-1);
                                } else {
                                    navigate('/');
                                }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200 shadow-xs text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-[#24161b] hover:border-neutral-300 transition-all cursor-pointer w-fit"
                        >
                            <ChevronLeft size={14} /> <span>{checkoutStep === 'payment' || stripeClientSecret ? 'Back to Details' : 'Back'}</span>
                        </button>

                        {/* Top Stepper Breadcrumb */}
                        <div className="flex items-center bg-white border border-neutral-200/80 px-3.5 py-1.5 rounded-full shadow-xs text-xs">
                            <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                    (checkoutStep === 'payment' || stripeClientSecret)
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-[#24161b] text-[#e5b582]'
                                }`}>
                                    {(checkoutStep === 'payment' || stripeClientSecret) ? '✓' : '1'}
                                </span>
                                <span className={`font-semibold ${checkoutStep === 'details' && !stripeClientSecret ? 'text-[#24161b]' : 'text-neutral-500'}`}>
                                    Details & Fulfillment
                                </span>
                            </div>

                            <span className="mx-3 text-neutral-300">──</span>

                            <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                    (checkoutStep === 'payment' || stripeClientSecret)
                                        ? 'bg-[#24161b] text-[#e5b582]'
                                        : 'bg-neutral-100 text-neutral-400'
                                }`}>
                                    2
                                </span>
                                <span className={`font-semibold ${(checkoutStep === 'payment' || stripeClientSecret) ? 'text-[#24161b]' : 'text-neutral-400'}`}>
                                    Payment
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Two-column responsive layout */}
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

                        {/* ══════════════════════════════════════════
                            LEFT — Form column
                        ══════════════════════════════════════════ */}
                        <div className="w-full lg:flex-1 space-y-4 pb-4 lg:pb-10">

                            {/* ═══════════════════════════════════════
                                STEP 2: PAYMENT (Stripe Gateway or Simulated)
                            ═══════════════════════════════════════ */}
                            {(stripeClientSecret || checkoutStep === 'payment') ? (
                                <div className="bg-white rounded-[24px] border border-neutral-200/80 shadow-xl shadow-[#24161b]/5 p-5 sm:p-7 space-y-6 animate-fadeIn">
                                    <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100">
                                                <Lock size={18} strokeWidth={2.2} />
                                            </div>
                                            <div>
                                                <h2 className="text-[#24161b] font-serif text-xl font-bold">Secure Payment</h2>
                                                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    Bank-Grade 256-Bit SSL Encrypted
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStripeClientSecret(null);
                                                setActiveOrderNumber('');
                                                setCheckoutStep('details');
                                            }}
                                            className="text-xs font-semibold text-neutral-500 hover:text-[#24161b] underline cursor-pointer"
                                        >
                                            Edit Details
                                        </button>
                                    </div>

                                    {/* Order Reference & Total Header */}
                                    <div className="bg-[#fdfaf5] rounded-2xl p-4 text-xs space-y-2.5 border border-neutral-200/80">
                                        {activeOrderNumber && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-500">Order Reference</span>
                                                <span className="font-mono font-bold text-[#24161b] bg-white px-2.5 py-1 rounded-lg border border-neutral-200 text-xs">
                                                    {activeOrderNumber}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-neutral-600">
                                            <span>Fulfillment</span>
                                            <span className="font-bold text-[#24161b] capitalize">
                                                {orderType === 'delivery' ? 'Delivery' : 'Counter Collection'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200/60">
                                            <span className="text-neutral-600 font-medium">Total Payable</span>
                                            <span className="font-serif font-black text-[#24161b] text-lg">£{cartTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Stripe Elements Gateway */}
                                    {stripeClientSecret ? (
                                        <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: stripeAppearance }}>
                                            <StripePaymentForm
                                                orderNumber={activeOrderNumber}
                                                phone={phone}
                                                email={email}
                                                onClose={() => { setStripeClientSecret(null); setActiveOrderNumber(''); setCheckoutStep('details'); }}
                                            />
                                        </Elements>
                                    ) : (
                                        /* Simulated Card Fallback for Local/Test environment */
                                        <form onSubmit={handlePlaceOrder} className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-[#24161b]">Card Details</span>
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                                                    Simulated Test Mode
                                                </span>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={cardNumber} 
                                                onChange={e => setCardNumber(e.target.value)} 
                                                placeholder="Card number"
                                                className="w-full bg-[#fdfaf5] border border-neutral-200 focus:border-[#24161b] focus:bg-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#e5b582]/30 transition-all font-mono" 
                                            />
                                            <div className="grid grid-cols-3 gap-3">
                                                <input 
                                                    type="text" 
                                                    value={expDate} 
                                                    onChange={e => setExpDate(e.target.value)} 
                                                    placeholder="MM / YY"
                                                    className="bg-[#fdfaf5] border border-neutral-200 focus:border-[#24161b] focus:bg-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#e5b582]/30 transition-all font-mono" 
                                                />
                                                <input 
                                                    type="text" 
                                                    value={cvc} 
                                                    onChange={e => setCvc(e.target.value)} 
                                                    placeholder="CVC"
                                                    className="bg-[#fdfaf5] border border-neutral-200 focus:border-[#24161b] focus:bg-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#e5b582]/30 transition-all font-mono" 
                                                />
                                                <input 
                                                    type="text" 
                                                    value={cardName} 
                                                    onChange={e => setCardName(e.target.value)} 
                                                    placeholder="Name on card"
                                                    className="bg-[#fdfaf5] border border-neutral-200 focus:border-[#24161b] focus:bg-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#e5b582]/30 transition-all font-medium" 
                                                />
                                            </div>

                                            {error && (
                                                <div className="flex items-center gap-2.5 text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs animate-fadeIn">
                                                    <AlertCircle size={16} className="shrink-0" />
                                                    <span>{error}</span>
                                                </div>
                                            )}

                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className="w-full bg-[#24161b] hover:bg-black disabled:bg-[#24161b]/60 text-[#e5b582] hover:text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-xl shadow-[#24161b]/15 transition-all cursor-pointer text-sm tracking-wide active:scale-98"
                                            >
                                                {loading ? (
                                                    <><Loader2 size={16} className="animate-spin" /><span>Confirming Order…</span></>
                                                ) : (
                                                    <><Lock size={15} className="shrink-0" strokeWidth={2.2} /><span>Pay £{cartTotal.toFixed(2)} & Confirm</span></>
                                                )}
                                            </button>
                                        </form>
                                    )}

                                    <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                                        <span className="flex items-center gap-1"><Lock size={11} /> 256-bit SSL</span>
                                        <span className="uppercase tracking-wider">Powered by <span className="font-bold text-neutral-700">stripe</span></span>
                                    </div>
                                </div>
                            ) : (
                                /* ═══════════════════════════════════════
                                    STEP 1: DETAILS & FULFILLMENT
                                ═══════════════════════════════════════ */
                                <>
                                    {/* Mobile-only collapsible basket */}
                                    {cart.length > 0 && (
                                        <div className="lg:hidden rounded-2xl border border-neutral-200/80 overflow-hidden bg-white shadow-xs">
                                            <button
                                                type="button"
                                                onClick={() => setMobileBasketOpen(o => !o)}
                                                className="w-full flex items-center justify-between px-4 py-3.5 bg-neutral-50 hover:bg-neutral-100/70 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-xs font-bold text-[#24161b]">Your Order</span>
                                                    <span className="text-[10px] font-bold text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded-full">
                                                        {cart.reduce((s, i) => s + i.quantity, 0)} items
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-serif font-bold text-[#24161b] text-sm">£{cartTotal.toFixed(2)}</span>
                                                    <ChevronRight size={14} className={`text-neutral-400 transition-transform duration-200 ${mobileBasketOpen ? 'rotate-90' : ''}`} />
                                                </div>
                                            </button>
                                            {mobileBasketOpen && (
                                                <div className="px-4 pb-4 pt-2 space-y-3 animate-fadeIn border-t border-neutral-100">
                                                    <div className="divide-y divide-neutral-100">
                                                        {cart.map(item => (
                                                            <div key={item.key} className="py-2.5 flex items-center gap-3 text-xs">
                                                                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-[#24161b]/5 border border-neutral-200/80">
                                                                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.src = '/images/placeholder.svg'; }} />
                                                                </div>
                                                                <div className="flex-grow min-w-0">
                                                                    <p className="font-bold text-[#24161b] truncate">{item.name}</p>
                                                                    {item.variation_name && <p className="text-[10px] text-neutral-400">{item.variation_name}</p>}
                                                                    <div className="flex items-center border border-neutral-200 bg-white rounded-full w-fit px-1 mt-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); updateCartQty(item.key, item.quantity - 1); }}
                                                                            className="w-5 h-5 rounded-full text-neutral-600 hover:text-[#24161b] hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                                                        >
                                                                            <Minus size={9} />
                                                                        </button>
                                                                        <span className="px-2 text-[10px] font-bold text-[#24161b]">{item.quantity}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); updateCartQty(item.key, item.quantity + 1); }}
                                                                            className="w-5 h-5 rounded-full text-neutral-600 hover:text-[#24161b] hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                                                        >
                                                                            <Plus size={9} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="shrink-0 flex flex-col items-end gap-2">
                                                                    <button type="button" onClick={() => removeFromCart(item.key)} className="text-neutral-300 hover:text-rose-500 transition-colors cursor-pointer"><Trash2 size={13} /></button>
                                                                    <span className="font-serif font-bold text-[#24161b]">£{(item.price * item.quantity).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="border-t border-neutral-100 pt-3 space-y-1.5">
                                                        <div className="flex justify-between text-xs text-neutral-500">
                                                            <span>Subtotal</span>
                                                            <span className="font-semibold text-neutral-900">£{cartSubtotal.toFixed(2)}</span>
                                                        </div>
                                                        {orderType === 'delivery' && (
                                                            <div className="flex justify-between text-xs text-neutral-500">
                                                                <span>Delivery charge {freeDeliveryThreshold !== null && `(Free over £${freeDeliveryThreshold})`}</span>
                                                                {isFreeDelivery
                                                                    ? <span className="font-bold text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>FREE</span>
                                                                    : <span className="font-semibold text-neutral-900">£{cartDeliveryFee.toFixed(2)}</span>}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-baseline pt-2 border-t border-neutral-100 mt-1">
                                                            <span className="text-sm font-serif font-bold text-[#24161b]">Total</span>
                                                            <span className="text-base font-serif font-black text-[#24161b]">£{cartTotal.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── CARD 1 · Customer & Contact ── */}
                                    <div className="bg-white rounded-[24px] border border-neutral-200/80 shadow-sm overflow-hidden transition-all">
                                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/40">
                                            <span className="w-6 h-6 rounded-full bg-[#24161b] text-[#e5b582] text-xs font-bold flex items-center justify-center shrink-0">
                                                1
                                            </span>
                                            <h2 className="text-sm font-bold text-[#24161b] tracking-wide">Customer & Contact</h2>
                                            {user && (
                                                <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                    <CheckCircle size={10} /> Signed in
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-5 sm:p-6">
                                            {!user ? (
                                                <div className="space-y-4">
                                                    {/* Clean Modern Switcher */}
                                                    <div className="flex bg-neutral-100/80 p-1 rounded-2xl w-full border border-neutral-200/60">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => { setAuthTab('guest'); setAuthError(null); }}
                                                            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                                                authTab === 'guest' 
                                                                    ? 'bg-white text-[#24161b] shadow-xs' 
                                                                    : 'text-neutral-500 hover:text-neutral-900'
                                                            }`}
                                                        >
                                                            Guest Checkout
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => { setAuthTab('auth'); setAuthSubMode('login'); setAuthError(null); }}
                                                            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                                                authTab === 'auth' 
                                                                    ? 'bg-white text-[#24161b] shadow-xs' 
                                                                    : 'text-neutral-500 hover:text-neutral-900'
                                                            }`}
                                                        >
                                                            Sign In / Sign Up
                                                        </button>
                                                    </div>

                                                    {/* Guest Contact Details */}
                                                    {authTab === 'guest' && (
                                                        <div className="space-y-3.5 pt-1 animate-fadeIn">
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <label className="text-xs font-medium text-neutral-700">
                                                                        {guestContactMethod === 'phone' ? 'UK Mobile Number' : 'Email Address'}
                                                                    </label>
                                                                    <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[11px]">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { setGuestContactMethod('phone'); setEmail(''); }}
                                                                            className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                                guestContactMethod === 'phone'
                                                                                    ? 'bg-white text-[#24161b] shadow-xs'
                                                                                    : 'text-neutral-500 hover:text-neutral-900'
                                                                            }`}
                                                                        >
                                                                            Phone
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { setGuestContactMethod('email'); setPhone(''); }}
                                                                            className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                                guestContactMethod === 'email'
                                                                                    ? 'bg-white text-[#24161b] shadow-xs'
                                                                                    : 'text-neutral-500 hover:text-neutral-900'
                                                                            }`}
                                                                        >
                                                                            Email
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {guestContactMethod === 'phone' ? (
                                                                    <div className="relative flex items-center">
                                                                        <div className="absolute left-3.5 flex items-center gap-1.5 text-neutral-500 pr-2.5 border-r border-neutral-200 select-none">
                                                                            <span className="text-sm">🇬🇧</span>
                                                                            <span className="text-xs font-semibold text-neutral-700">+44</span>
                                                                        </div>
                                                                        <input 
                                                                            type="tel" 
                                                                            required 
                                                                            value={phone} 
                                                                            onChange={e => setPhone(e.target.value)} 
                                                                            placeholder="07123 456789"
                                                                            className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl pl-20 pr-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <input 
                                                                        type="email" 
                                                                        required 
                                                                        value={email} 
                                                                        onChange={e => setEmail(e.target.value)} 
                                                                        placeholder="jane.doe@example.com"
                                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Inline Auth Form */}
                                                    {authTab === 'auth' && (
                                                        <div className="space-y-4 pt-1 animate-fadeIn">
                                                            {authSubMode === 'login' ? (
                                                                <div className="space-y-3.5">
                                                                    {/* Contact field with Phone vs Email toggle header */}
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                            <label className="text-xs font-medium text-neutral-700">
                                                                                {contactMethod === 'phone' ? 'UK Mobile Number' : 'Email Address'}
                                                                            </label>
                                                                            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[11px]">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => { setContactMethod('phone'); setEmail(''); }}
                                                                                    className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                                        contactMethod === 'phone'
                                                                                            ? 'bg-white text-[#24161b] shadow-xs'
                                                                                            : 'text-neutral-500 hover:text-neutral-900'
                                                                                    }`}
                                                                                >
                                                                                    Phone
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => { setContactMethod('email'); setPhone(''); }}
                                                                                    className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                                        contactMethod === 'email'
                                                                                            ? 'bg-white text-[#24161b] shadow-xs'
                                                                                            : 'text-neutral-500 hover:text-neutral-900'
                                                                                    }`}
                                                                                >
                                                                                    Email
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {contactMethod === 'phone' ? (
                                                                            <div className="relative flex items-center">
                                                                                <div className="absolute left-3.5 flex items-center gap-1.5 text-neutral-500 pr-2.5 border-r border-neutral-200 select-none">
                                                                                    <span className="text-sm">🇬🇧</span>
                                                                                    <span className="text-xs font-semibold text-neutral-700">+44</span>
                                                                                </div>
                                                                                <input 
                                                                                    type="tel" 
                                                                                    value={phone} 
                                                                                    onChange={(e) => setPhone(e.target.value)} 
                                                                                    placeholder="07123 456789"
                                                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl pl-20 pr-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <input 
                                                                                type="email" 
                                                                                value={email} 
                                                                                onChange={(e) => setEmail(e.target.value)} 
                                                                                placeholder="jane.doe@example.com"
                                                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    {/* Password */}
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">Password</label>
                                                                        <div className="relative flex items-center">
                                                                            <input 
                                                                                type={showPassword ? 'text' : 'password'}
                                                                                value={authPassword}
                                                                                onChange={(e) => setAuthPassword(e.target.value)}
                                                                                placeholder="••••••••"
                                                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl pl-3.5 pr-10 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowPassword(!showPassword)}
                                                                                className="absolute right-3 text-neutral-400 hover:text-[#24161b] cursor-pointer"
                                                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                                            >
                                                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {authError && (
                                                                        <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
                                                                            <AlertCircle size={14} className="shrink-0" />
                                                                            <span>{authError}</span>
                                                                        </div>
                                                                    )}

                                                                    <button 
                                                                        type="button" 
                                                                        onClick={handleInlineLogin} 
                                                                        disabled={authLoading}
                                                                        className="w-full h-11 bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white font-bold rounded-xl text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#24161b]/10 active:scale-98"
                                                                    >
                                                                        {authLoading ? <Loader2 className="animate-spin" size={15} /> : 'SIGN IN'}
                                                                    </button>

                                                                    <p className="text-center text-xs text-neutral-500">
                                                                        Don't have an account? <button type="button" onClick={() => { setAuthSubMode('register'); setAuthError(null); }} className="text-[#24161b] font-bold hover:underline cursor-pointer">Create an account</button>
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3.5">
                                                                    {/* First Name & Last Name */}
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">First Name</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={firstName} 
                                                                                onChange={(e) => setFirstName(e.target.value)} 
                                                                                placeholder="Jane"
                                                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Last Name</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={lastName} 
                                                                                onChange={(e) => setLastName(e.target.value)} 
                                                                                placeholder="Doe"
                                                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Contact with Phone / Email Switcher */}
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                            <label className="text-xs font-medium text-neutral-700">
                                                                                {contactMethod === 'phone' ? 'UK Mobile Number' : 'Email Address'}
                                                                            </label>
                                                                            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[11px]">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => { setContactMethod('phone'); setEmail(''); }}
                                                                                    className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                                        contactMethod === 'phone'
                                                                                            ? 'bg-white text-[#24161b] shadow-xs'
                                                                                            : 'text-neutral-500 hover:text-neutral-900'
                                                                                    }`}
                                                                                >
                                                                                    Phone
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => { setContactMethod('email'); setPhone(''); }}
                                                                                    className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                                        contactMethod === 'email'
                                                                                            ? 'bg-white text-[#24161b] shadow-xs'
                                                                                            : 'text-neutral-500 hover:text-neutral-900'
                                                                                    }`}
                                                                                >
                                                                                    Email
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {contactMethod === 'phone' ? (
                                                                            <div className="relative flex items-center">
                                                                                <div className="absolute left-3.5 flex items-center gap-1.5 text-neutral-500 pr-2.5 border-r border-neutral-200 select-none">
                                                                                    <span className="text-sm">🇬🇧</span>
                                                                                    <span className="text-xs font-semibold text-neutral-700">+44</span>
                                                                                </div>
                                                                                <input 
                                                                                    type="tel" 
                                                                                    value={phone} 
                                                                                    onChange={(e) => setPhone(e.target.value)} 
                                                                                    placeholder="07123 456789"
                                                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl pl-20 pr-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <input 
                                                                                type="email" 
                                                                                value={email} 
                                                                                onChange={(e) => setEmail(e.target.value)} 
                                                                                placeholder="jane.doe@example.com"
                                                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    {/* Password */}
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">Password</label>
                                                                        <div className="relative flex items-center">
                                                                            <input 
                                                                                type={showPassword ? 'text' : 'password'}
                                                                                value={authPassword}
                                                                                onChange={(e) => setAuthPassword(e.target.value)}
                                                                                placeholder="••••••••"
                                                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl pl-3.5 pr-10 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowPassword(!showPassword)}
                                                                                className="absolute right-3 text-neutral-400 hover:text-[#24161b] cursor-pointer"
                                                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                                            >
                                                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {authError && (
                                                                        <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
                                                                            <AlertCircle size={14} className="shrink-0" />
                                                                            <span>{authError}</span>
                                                                        </div>
                                                                    )}

                                                                    <button 
                                                                        type="button" 
                                                                        onClick={handleInlineRegister} 
                                                                        disabled={authLoading}
                                                                        className="w-full h-11 bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white font-bold rounded-xl text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#24161b]/10 active:scale-98"
                                                                    >
                                                                        {authLoading ? <Loader2 className="animate-spin" size={15} /> : 'CREATE ACCOUNT'}
                                                                    </button>

                                                                    <p className="text-center text-xs text-neutral-500">
                                                                        Already have an account? <button type="button" onClick={() => { setAuthSubMode('login'); setAuthError(null); }} className="text-[#24161b] font-bold hover:underline cursor-pointer">Sign In</button>
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Signed-in user card */
                                                <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200 bg-[#fdfaf5] p-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#24161b] text-[#e5b582] flex items-center justify-center shrink-0 font-serif font-bold text-sm">
                                                        {(firstName || user.first_name || user.name || 'C').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-[#24161b] truncate">
                                                            {(firstName || user.first_name || user.name || 'Customer')} {(lastName || user.last_name || '')}
                                                        </p>
                                                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                                            {email || user.email || phone || user.phone || 'Verified Account'}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { logout(); }} 
                                                        className="shrink-0 text-[10px] font-bold text-neutral-500 hover:text-rose-600 bg-white border border-neutral-200 px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                                                    >
                                                        <LogOut size={11} /> Sign out
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── CARD 2 · Fulfillment & Details ── */}
                                    <div className="bg-white rounded-[24px] border border-neutral-200/80 shadow-sm overflow-hidden transition-all">
                                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/40">
                                            <span className="w-6 h-6 rounded-full bg-[#24161b] text-[#e5b582] text-xs font-bold flex items-center justify-center shrink-0">
                                                2
                                            </span>
                                            <h2 className="text-sm font-bold text-[#24161b] tracking-wide">
                                                {!orderType ? 'Fulfillment Method' : orderType === 'delivery' ? 'Delivery Address' : 'Collection Slot'}
                                            </h2>
                                            {orderType && (
                                                <button 
                                                    type="button" 
                                                    onClick={handleSwitchOrderBanner}
                                                    className="ml-auto text-[10px] font-bold text-[#24161b] bg-neutral-100 hover:bg-neutral-200 px-3 py-1 rounded-full transition-all cursor-pointer uppercase tracking-wider border border-neutral-200"
                                                >
                                                    Change
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-5 sm:p-6 text-xs space-y-4">
                                            {!orderType ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                                                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                                                        <div>
                                                            <p className="font-bold">Choose delivery or collection first.</p>
                                                            <p className="text-[11px] text-amber-700 mt-1">We need this before calculating the final order details.</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid sm:grid-cols-2 gap-3">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsFulfillmentModalOpen(true)}
                                                            className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 px-4 py-3.5 text-[#24161b] font-bold transition-all cursor-pointer shadow-xs"
                                                        >
                                                            <MapPin size={15} className="text-[#e5b582]" />
                                                            <span>Set Delivery Address</span>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsFulfillmentModalOpen(true)}
                                                            className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 px-4 py-3.5 text-[#24161b] font-bold transition-all cursor-pointer shadow-xs"
                                                        >
                                                            <Clock size={15} className="text-[#e5b582]" />
                                                            <span>Set Collection Slot</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 rounded-2xl bg-[#24161b]/5 text-[#24161b] border border-[#24161b]/10 flex items-center justify-center shrink-0">
                                                        {orderType === 'delivery' ? <MapPin size={17} className="text-[#e5b582]" /> : <Clock size={17} className="text-[#e5b582]" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {selectedMethodIsComplete ? (
                                                            <div>
                                                                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block mb-0.5">
                                                                    {orderType === 'delivery' ? 'Delivering To' : 'Confirmed Slot'}
                                                                </span>
                                                                <p className="text-neutral-900 font-bold text-xs sm:text-sm">
                                                                    {orderType === 'delivery'
                                                                        ? renderDeliveryAddress()
                                                                        : <>{formatCollectionSlot(collectionSlot)}</>}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                                                                <div className="flex items-start gap-2 flex-1">
                                                                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                                                                    <div>
                                                                        <p className="font-bold">
                                                                            {orderType === 'delivery' ? 'Delivery address is missing.' : 'Collection slot is missing.'}
                                                                        </p>
                                                                        <p className="text-[11px] text-amber-700 mt-0.5">
                                                                            {orderType === 'delivery'
                                                                                ? 'Add your address so we can dispatch your sweets promptly.'
                                                                                : 'Pick a date and time so our bakery counter prepares your items fresh.'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={handleSwitchOrderBanner}
                                                                    className="shrink-0 rounded-full bg-white border border-amber-300 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                                                                >
                                                                    {orderType === 'delivery' ? 'Add Address' : 'Pick Slot'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Optional Delivery instructions / Notes */}
                                            <div className="pt-3 border-t border-neutral-100">
                                                <label className="block text-[11px] font-bold text-neutral-700 mb-1.5">
                                                    Order Notes & Requests <span className="text-neutral-400 font-normal">(optional)</span>
                                                </label>
                                                <textarea 
                                                    rows="2" 
                                                    value={notes} 
                                                    onChange={e => setNotes(e.target.value)} 
                                                    placeholder="Delivery instructions, allergies, dietary requests, gift messages…"
                                                    className="w-full bg-[#fdfaf5] border border-neutral-200 focus:border-[#24161b] focus:bg-white rounded-2xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#e5b582]/30 transition-all resize-none font-medium" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error Banner */}
                                    {error && (
                                        <div className="flex items-center gap-2.5 text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs animate-fadeIn">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Primary Continue Button (Desktop) */}
                                    <button 
                                        type="button" 
                                        disabled={loading}
                                        onClick={handleProceedToPayment}
                                        className="hidden lg:flex w-full bg-[#24161b] hover:bg-black disabled:bg-[#24161b]/60 text-[#e5b582] hover:text-white font-bold rounded-2xl py-4 items-center justify-center gap-2 shadow-xl shadow-[#24161b]/15 transition-all cursor-pointer text-sm tracking-wide active:scale-98"
                                    >
                                        {loading ? (
                                            <><Loader2 size={16} className="animate-spin" /><span>Preparing Payment Gateway…</span></>
                                        ) : (
                                            <><span>Continue to Payment</span><ArrowRight size={16} className="text-[#e5b582]" /></>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* ══════════════════════════════════════════
                            RIGHT — Order Summary Card (Desktop)
                        ══════════════════════════════════════════ */}
                        <div className="hidden lg:block w-full lg:w-[380px] shrink-0">
                            <div className="sticky top-6 bg-white rounded-[24px] border border-neutral-200/80 shadow-xl shadow-[#24161b]/5 overflow-hidden">
                                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/40">
                                    <div>
                                        <h3 className="font-serif font-bold text-base text-[#24161b]">Your Order</h3>
                                        <p className="text-[11px] text-neutral-400 mt-0.5">
                                            {cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''} in basket
                                        </p>
                                    </div>
                                    <ShoppingBag size={18} className="text-[#e5b582]" />
                                </div>

                                {cart.length === 0 ? (
                                    <div className="py-14 text-center text-neutral-400 text-xs px-6">
                                        Your sweet basket is empty.
                                    </div>
                                ) : (
                                    <>
                                        {/* Cart Items List */}
                                        <div className="px-6 py-4 divide-y divide-neutral-100 max-h-[340px] overflow-y-auto custom-scrollbar">
                                            {cart.map(item => (
                                                <div key={item.key} className="py-3.5 flex items-center gap-3.5 text-xs">
                                                    <div className="w-12 h-12 bg-[#24161b]/5 rounded-2xl overflow-hidden shrink-0 border border-neutral-200/80">
                                                        <img 
                                                            src={getImageUrl(item.image)} 
                                                            alt={item.name} 
                                                            className="w-full h-full object-cover"
                                                            onError={e => { e.target.src = '/images/placeholder.svg'; }} 
                                                        />
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <p className="font-bold text-[#24161b] leading-tight truncate">{item.name}</p>
                                                        {item.variation_name && (
                                                            <p className="text-[11px] text-neutral-400 mt-0.5">{item.variation_name}</p>
                                                        )}
                                                        <div className="flex items-center mt-2 gap-1 border border-neutral-200 bg-[#fdfaf5] rounded-full w-fit px-1.5 py-0.5">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => updateCartQty(item.key, item.quantity - 1)} 
                                                                className="w-4 h-4 flex items-center justify-center text-neutral-600 hover:text-[#24161b] cursor-pointer active:scale-90"
                                                            >
                                                                <Minus size={8} />
                                                            </button>
                                                            <span className="text-[10px] font-bold px-1 text-[#24161b]">{item.quantity}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => updateCartQty(item.key, item.quantity + 1)} 
                                                                className="w-4 h-4 flex items-center justify-center text-neutral-600 hover:text-[#24161b] cursor-pointer active:scale-90"
                                                            >
                                                                <Plus size={8} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeFromCart(item.key)} 
                                                            className="text-neutral-300 hover:text-rose-500 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                        <span className="font-serif font-bold text-[#24161b]">
                                                            £{(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Financial Breakdown */}
                                        <div className="px-6 py-5 border-t border-neutral-100 bg-[#fdfaf5]/70 space-y-3">
                                            <div className="flex justify-between text-xs text-neutral-600">
                                                <span>Subtotal</span>
                                                <span className="font-semibold text-neutral-900">£{cartSubtotal.toFixed(2)}</span>
                                            </div>
                                            {orderType === 'delivery' && (
                                                <div className="flex justify-between text-xs text-neutral-600">
                                                    <span>Delivery Fee {freeDeliveryThreshold !== null && `(Free over £${freeDeliveryThreshold})`}</span>
                                                    {isFreeDelivery ? (
                                                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>FREE
                                                        </span>
                                                    ) : (
                                                        <span className="font-semibold text-neutral-900">£{cartDeliveryFee.toFixed(2)}</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Free delivery threshold progress */}
                                            {orderType === 'delivery' && freeDeliveryThreshold !== null && (
                                                isFreeDelivery ? (
                                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800">
                                                        <CheckCircle size={14} className="shrink-0 text-emerald-600" />
                                                        <span className="font-bold text-[11px]">Free delivery unlocked! 🎉 (Saved £{flatDeliveryFee.toFixed(2)})</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5 pt-1">
                                                        <div className="flex justify-between text-[11px] text-neutral-600">
                                                            <span>Add <strong className="text-[#24161b]">£{(freeDeliveryThreshold - cartSubtotal).toFixed(2)}</strong> for free delivery</span>
                                                            <span className="font-semibold text-neutral-500">Save £{flatDeliveryFee.toFixed(2)}</span>
                                                        </div>
                                                        <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                                                            <div 
                                                                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#e5b582] to-[#24161b]" 
                                                                style={{ width: `${Math.min((cartSubtotal / freeDeliveryThreshold) * 100, 100)}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            )}

                                            <div className="flex justify-between items-baseline pt-3 border-t border-neutral-200/80">
                                                <span className="font-serif text-base text-[#24161b] font-bold">Total</span>
                                                <span className="font-serif text-2xl text-[#24161b] font-black">£{cartTotal.toFixed(2)}</span>
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
            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate}
                cartItemCount={cart.reduce((sum, i) => sum + i.quantity, 0)} 
                user={user} 
                logout={logout} 
            />

            {/* Mobile Sticky Bottom CTA Bar */}
            {!stripeClientSecret && cart.length > 0 && (
                <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-3 flex flex-col gap-2 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold leading-none mb-0.5">Total</p>
                            <p className="font-serif font-black text-[#24161b] text-xl leading-none">£{cartTotal.toFixed(2)}</p>
                        </div>
                        <button 
                            type="button" 
                            disabled={loading}
                            onClick={(e) => {
                                if (checkoutStep === 'details' && !stripeClientSecret) {
                                    handleProceedToPayment(e);
                                } else {
                                    document.getElementById('checkout-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                }
                            }}
                            className="flex-shrink-0 bg-[#24161b] hover:bg-black disabled:bg-[#24161b]/60 text-[#e5b582] font-bold rounded-2xl px-6 py-3.5 flex items-center gap-2 shadow-lg shadow-[#24161b]/15 transition-all cursor-pointer text-xs uppercase tracking-wider active:scale-98"
                        >
                            {loading ? (
                                <><Loader2 size={14} className="animate-spin" /><span>Processing…</span></>
                            ) : checkoutStep === 'details' && !stripeClientSecret ? (
                                <><span>Continue to Payment</span><ArrowRight size={13} className="text-[#e5b582]" /></>
                            ) : (
                                <><Lock size={13} strokeWidth={2.2} /><span>{isRealStripeConfigured ? 'Pay Now' : 'Confirm Order'}</span></>
                            )}
                        </button>
                    </div>
                    {isRealStripeConfigured && (
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 border-t border-neutral-100 pt-1.5 w-full text-center">
                            <Lock size={10} className="text-emerald-600 shrink-0" />
                            <span>Secure checkout powered by <strong>Stripe</strong></span>
                        </div>
                    )}
                </div>
            )}

            {/* Fulfillment Selection Popover / Modal */}
            <OrderPopover 
                isOpen={isFulfillmentModalOpen}
                onClose={() => setIsFulfillmentModalOpen(false)}
                onComplete={() => setIsFulfillmentModalOpen(false)}
            />

            <Footer navigate={navigate} />
        </div>
    );
}
