import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle, Star, ShieldCheck, Truck } from 'lucide-react';

export default function Auth({ defaultMode = 'login' }) {
    const navigate = useNavigate();
    const { 
        login, 
        user, 
        token, 
        adminToken, 
        adminUser, 
        userType, 
        logout,
        cartItemCount, 
        isSearchOpen, 
        setIsSearchOpen, 
        catalog,
        configs 
    } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mode, setMode] = useState(defaultMode); // 'login', 'register', 'forgot_password', 'verify_code', 'admin'
    
    // Redirect to /account if already logged in (excluding admin mode)
    useEffect(() => {
        if (mode === 'admin' && adminUser && adminToken) {
            navigate('/admin');
            return;
        }

        if (user && token && mode !== 'admin') {
            if (userType === 'admin') {
                navigate('/admin');
            } else {
                navigate('/account');
            }
        }
    }, [user, token, adminUser, adminToken, userType, mode, navigate]);

    useEffect(() => {
        setMode(defaultMode);
        setError(null);
    }, [defaultMode]);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Feature toggle for Phone vs Email (shared between Sign In and Register)
    const [contactMethod, setContactMethod] = useState('phone');   // 'phone' | 'email'
    const [forgotMethod, setForgotMethod] = useState('phone');     // 'phone' | 'email'

    const [resetCode, setResetCode] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [forgotSent, setForgotSent] = useState(false);
    const [forgotInput, setForgotInput] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        let url = '';
        let payload = {};

        if (mode === 'login') {
            url = '/api/customer/login';
            const inputVal = contactMethod === 'email' ? email : phone;
            payload = {
                email_or_phone: inputVal,
                password
            };
            if (!inputVal) {
                setError(`Please enter your ${contactMethod === 'email' ? 'email address' : 'UK phone number'}.`);
                setLoading(false);
                return;
            }
        } else if (mode === 'register') {
            url = '/api/customer/register';
            payload = {
                first_name: firstName,
                last_name: lastName,
                email: contactMethod === 'email' ? email : (email || null),
                phone: contactMethod === 'phone' ? phone : (phone || null),
                password,
                password_confirmation: password
            };
            if (contactMethod === 'phone' && !payload.phone) {
                setError('Please enter your UK phone number.');
                setLoading(false);
                return;
            }
            if (contactMethod === 'email' && !payload.email) {
                setError('Please enter your email address.');
                setLoading(false);
                return;
            }
        } else if (mode === 'forgot_password') {
            url = '/api/customer/forgot-password';
            const inputVal = forgotMethod === 'email' ? email : phone;
            if (!inputVal) {
                setError(`Please enter your ${forgotMethod === 'email' ? 'email address' : 'phone number'}.`);
                setLoading(false);
                return;
            }
            payload = { email_or_phone: inputVal };
            setForgotInput(inputVal);
        } else if (mode === 'verify_code') {
            url = '/api/customer/reset-password';
            payload = {
                email_or_phone: forgotInput,
                token_or_code: resetCode,
                password: password,
                password_confirmation: confirmPassword
            };
        } else {
            // Admin login
            url = '/api/admin/login';
            payload = { email, password };
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || 'Action failed. Please check your inputs.');
                setLoading(false);
                return;
            }

            if (mode === 'forgot_password') {
                if (data.delivery_method === 'email') {
                    setForgotSent(true);
                } else {
                    setMode('verify_code');
                }
            } else if (mode === 'verify_code') {
                setError(null);
                setMode('login');
                setPassword('');
                setResetCode('');
                setConfirmPassword('');
                alert('Password reset successfully. You can now sign in.');
            } else {
                const token = data.data.token;
                const profile = data.data.user || data.data.customer;
                const type = mode === 'admin' ? 'admin' : 'customer';

                login(token, profile, type);

                if (type === 'admin') {
                    navigate('/admin');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#24161b] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            {/* Global Storefront Header */}
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
            <div className="w-full mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 px-3 sm:px-6 pt-6 sm:pt-8 pb-12 md:px-10 md:pt-10 md:pb-16 flex-grow flex flex-col items-center justify-center bg-white shadow-lg border border-stone-200/50">
                <div className="w-full max-w-6xl mx-auto">
                    {/* Integrated Editorial Split Card with strictly locked dimensions on desktop */}
                    <div className="bg-white rounded-[28px] sm:rounded-[32px] border border-neutral-200/80 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:h-[640px] min-h-[600px]">
                        {/* ════════ LEFT SHOWCASE (Modern Premium Brand Showcase) ════════ */}
                        <aside className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 sm:p-10 overflow-hidden bg-gradient-to-br from-[#1a0f13] via-[#24161b] to-[#331c26] text-white h-full w-full select-none">
                            {/* Ambient Glowing background nodes */}
                            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#e5b582]/15 blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(#e5b582_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

                            {/* Top Header Row */}
                            <div className="relative z-20 flex items-center justify-between">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (window.history.state && window.history.state.idx > 0) {
                                            navigate(-1);
                                        } else {
                                            navigate('/products');
                                        }
                                    }} 
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white backdrop-blur-md border border-white/15 transition-all text-xs font-semibold cursor-pointer shadow-sm group"
                                >
                                    <ArrowLeft size={14} className="text-[#e5b582] group-hover:-translate-x-0.5 transition-transform" />
                                    <span>Back to Treats</span>
                                </button>
                            </div>

                            {/* Center Editorial Hero Content */}
                            <div className="relative z-20 space-y-5 my-auto py-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-[#e5b582] text-[10px] font-black uppercase tracking-widest shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#e5b582] animate-pulse" />
                                    <span>Artisanal Dessert Lounge</span>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black font-serif tracking-tight text-white leading-tight">
                                        Where Dreams <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5b582] via-amber-200 to-[#e5b582]">
                                            Meet Cream
                                        </span>
                                    </h2>
                                    <p className="text-xs text-neutral-300 font-light leading-relaxed max-w-xs">
                                        Freshly baked waffles, cookie dough, crepes, and signature milkshakes crafted to perfection.
                                    </p>
                                </div>

                                {/* Feature Badges */}
                                <div className="space-y-2.5 pt-2">
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                                        <div className="w-8 h-8 rounded-xl bg-[#e5b582]/20 text-[#e5b582] flex items-center justify-center shrink-0 border border-[#e5b582]/30">
                                            <Truck size={15} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Express Delivery & Collection</p>
                                            <p className="text-[10px] text-neutral-400">Order online for prompt dispatch or pickup</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                                            <ShieldCheck size={15} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Freshly Prepared Orders</p>
                                            <p className="text-[10px] text-neutral-400">Handmade with premium dessert ingredients</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Social Proof / Rating Footer */}
                            <div className="relative z-20 pt-4 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} fill="currentColor" />
                                    ))}
                                    <span className="text-xs font-bold text-white ml-1">4.9 / 5</span>
                                </div>
                                <span className="text-[11px] text-neutral-400 font-medium">1,200+ Happy Customers</span>
                            </div>
                        </aside>

                        {/* ════════ RIGHT FORM CONTAINER ════════ */}
                        <main className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto h-full">
                            {/* Mobile Top Header (Clean Brand Bar, Left Image Removed) */}
                            <div className="lg:hidden -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-6 bg-[#24161b] text-white p-5 sm:p-6 rounded-t-[28px] sm:rounded-t-[32px] rounded-b-[24px] shadow-sm">
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="cursor-pointer" onClick={() => navigate('/')}>
                                        {configs?.store_logo_white ? (
                                            <img src={configs.store_logo_white} alt={configs?.store_name || "Sweet Spot"} className="h-7 w-auto object-contain" />
                                        ) : configs?.store_name ? (
                                            <span className="text-white font-black text-lg tracking-tight">
                                                {configs.store_name}
                                            </span>
                                        ) : null}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (window.history.state && window.history.state.idx > 0) {
                                                navigate(-1);
                                            } else {
                                                navigate('/products');
                                            }
                                        }}
                                        className="text-xs text-white/90 hover:text-white inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 cursor-pointer"
                                    >
                                        <ArrowLeft size={12} className="text-[#e5b582]" />
                                        <span>Treats</span>
                                    </button>
                                </div>
                            </div>

                            {/* Form Card Body */}
                            <div className="max-w-sm w-full mx-auto my-auto py-2 sm:py-4">
                                {/* Header Title */}
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#24161b] tracking-tight">
                                        {mode === 'login' && 'Sign In'}
                                        {mode === 'register' && 'Create Account'}
                                        {mode === 'forgot_password' && 'Reset Password'}
                                        {mode === 'verify_code' && 'Enter Code'}
                                        {mode === 'admin' && 'Admin Portal'}
                                    </h1>
                                    <p className="text-xs text-neutral-500 mt-1.5 font-normal">
                                        {mode === 'login' && 'Welcome back to Sweet Spot.'}
                                        {mode === 'register' && 'Create your account to order treats.'}
                                        {mode === 'forgot_password' && 'Enter your contact info to reset password.'}
                                        {mode === 'verify_code' && `Enter the 6-digit code sent to ${forgotInput}.`}
                                        {mode === 'admin' && 'Store admin access only.'}
                                    </p>
                                </div>

                                {/* Clean Segmented Pill Switcher (Customer Auth) */}
                                {mode !== 'admin' && mode !== 'forgot_password' && mode !== 'verify_code' && (
                                    <div className="grid grid-cols-2 p-1 bg-neutral-100/90 rounded-xl mb-6">
                                        <button 
                                            type="button"
                                            onClick={() => { setMode('login'); setError(null); }}
                                            className={`py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer rounded-lg text-center ${
                                                mode === 'login' 
                                                    ? 'bg-white text-[#24161b] shadow-sm font-bold' 
                                                    : 'text-neutral-500 hover:text-neutral-800'
                                            }`}
                                        >
                                            Sign In
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => { setMode('register'); setError(null); }}
                                            className={`py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer rounded-lg text-center ${
                                                mode === 'register' 
                                                    ? 'bg-white text-[#24161b] shadow-sm font-bold' 
                                                    : 'text-neutral-500 hover:text-neutral-800'
                                            }`}
                                        >
                                            Register
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Collapsible Name Fields for Register Only */}
                                    <div className={`auth-expand-grid ${mode === 'register' ? 'expanded' : ''}`}>
                                        <div className="auth-expand-inner">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">First Name</label>
                                                    <input 
                                                        type="text" 
                                                        required={mode === 'register'}
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
                                                        required={mode === 'register'}
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        placeholder="Doe"
                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shared Contact Field (Phone vs Email toggle) for both Sign In and Register */}
                                    {(mode === 'login' || mode === 'register') && (
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
                                                        required={mode === 'login' || mode === 'register'}
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        placeholder="07123 456789"
                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl pl-20 pr-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                    />
                                                </div>
                                            ) : (
                                                <input 
                                                    type="email" 
                                                    required={mode === 'login' || mode === 'register'}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="jane.doe@example.com"
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Admin Staff input */}
                                    {mode === 'admin' && (
                                        <div className="animate-auth-switch">
                                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                                Admin Email
                                            </label>
                                            <input 
                                                type="email" 
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="admin@sweetspot.co.uk"
                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                            />
                                        </div>
                                    )}

                                    {/* Forgot Password Flow */}
                                    {mode === 'forgot_password' && (
                                        <div>
                                            {forgotSent ? (
                                                <div className="text-center py-6 px-4 space-y-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                                                        <CheckCircle size={20} />
                                                    </div>
                                                    <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                                                        A password reset link has been dispatched to your email address. Please follow the instructions to set a new password.
                                                    </p>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setMode('login'); setForgotSent(false); }}
                                                        className="text-xs text-neutral-700 hover:text-black font-semibold cursor-pointer pt-2 inline-block"
                                                    >
                                                        Return to Sign In
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <label className="text-xs font-medium text-neutral-700">
                                                            {forgotMethod === 'phone' ? 'UK Mobile (SMS)' : 'Registered Email'}
                                                        </label>
                                                        <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[11px]">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setForgotMethod('phone'); setEmail(''); }}
                                                                className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                    forgotMethod === 'phone'
                                                                        ? 'bg-white text-[#24161b] shadow-xs'
                                                                        : 'text-neutral-500 hover:text-neutral-900'
                                                                }`}
                                                            >
                                                                Phone (SMS)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setForgotMethod('email'); setPhone(''); }}
                                                                className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                    forgotMethod === 'email'
                                                                        ? 'bg-white text-[#24161b] shadow-xs'
                                                                        : 'text-neutral-500 hover:text-neutral-900'
                                                                }`}
                                                            >
                                                                Email
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {forgotMethod === 'phone' ? (
                                                        <div className="relative flex items-center">
                                                            <div className="absolute left-3.5 flex items-center gap-1.5 text-neutral-500 pr-2.5 border-r border-neutral-200 select-none">
                                                                <span className="text-sm">🇬🇧</span>
                                                                <span className="text-xs font-semibold text-neutral-700">+44</span>
                                                            </div>
                                                            <input 
                                                                type="tel" 
                                                                required
                                                                value={phone}
                                                                onChange={(e) => setPhone(e.target.value)}
                                                                placeholder="07123 456789"
                                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl pl-20 pr-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <input 
                                                            type="email" 
                                                            required
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            placeholder="name@example.com"
                                                            className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Verify Code flow */}
                                    {mode === 'verify_code' && (
                                        <div className="space-y-3.5">
                                            <div>
                                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">6-Digit Reset Code</label>
                                                <input 
                                                    type="text" 
                                                    maxLength={6}
                                                    required
                                                    value={resetCode}
                                                    onChange={(e) => setResetCode(e.target.value)}
                                                    placeholder="123456"
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-base text-neutral-900 text-center tracking-widest font-mono font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">New Password</label>
                                                <input 
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Confirm New Password</label>
                                                <input 
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Password input for Login / Register / Admin */}
                                    {(mode === 'login' || mode === 'register' || mode === 'admin') && (
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-xs font-medium text-neutral-700">Password</label>
                                                {mode === 'login' && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setMode('forgot_password'); setError(null); }}
                                                        className="text-xs text-neutral-500 hover:text-[#24161b] transition-colors cursor-pointer bg-transparent border-none p-0 font-medium"
                                                    >
                                                        Forgot password?
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative flex items-center">
                                                <input 
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200/80 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b]/20 rounded-xl pl-3.5 pr-10 text-xs sm:text-sm text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 text-neutral-400 hover:text-[#24161b] cursor-pointer"
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Alert */}
                                    {error && (
                                        <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
                                            <AlertCircle size={15} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Action CTA Button */}
                                    {!(mode === 'forgot_password' && forgotSent) && (
                                        <div className="pt-2">
                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className="w-full h-12 bg-[#24161b] hover:bg-[#341f27] active:scale-[0.99] disabled:opacity-50 text-[#e5b582] hover:text-white font-bold tracking-widest uppercase rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#24161b]/10 border border-[#e5b582]/20"
                                            >
                                                {loading ? (
                                                    <Loader2 size={15} className="animate-spin text-[#e5b582]" />
                                                ) : (
                                                    <span>
                                                        {mode === 'login' && 'Sign In'}
                                                        {mode === 'register' && 'Create Account'}
                                                        {mode === 'forgot_password' && 'Send Reset Code'}
                                                        {mode === 'verify_code' && 'Confirm Password'}
                                                        {mode === 'admin' && 'Admin Login'}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Return to login link for forgot password */}
                                    {((mode === 'forgot_password' && !forgotSent) || mode === 'verify_code') && (
                                        <div className="text-center pt-2">
                                            <button 
                                                type="button" 
                                                onClick={() => { setMode('login'); setForgotSent(false); setError(null); }}
                                                className="text-xs text-neutral-500 hover:text-[#24161b] cursor-pointer font-medium"
                                            >
                                                Cancel and return to sign in
                                            </button>
                                        </div>
                                    )}
                                </form>

                                {/* Mode switch link */}
                                {mode === 'login' && (
                                    <p className="text-center text-xs text-neutral-500 mt-6 pt-5 border-t border-neutral-200/80">
                                        Don't have an account?{' '}
                                        <button 
                                            type="button" 
                                            onClick={() => { setMode('register'); setError(null); }} 
                                            className="text-[#24161b] font-bold hover:underline cursor-pointer"
                                        >
                                            Create an account
                                        </button>
                                    </p>
                                )}
                                {mode === 'register' && (
                                    <p className="text-center text-xs text-neutral-500 mt-6 pt-5 border-t border-neutral-200/80">
                                        Already have an account?{' '}
                                        <button 
                                            type="button" 
                                            onClick={() => { setMode('login'); setError(null); }} 
                                            className="text-[#24161b] font-bold hover:underline cursor-pointer"
                                        >
                                            Sign In
                                        </button>
                                    </p>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>

            {/* Sidebar Navigation Drawer */}
            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                cartItemCount={cartItemCount} 
                user={user} 
                logout={logout} 
            />

            {/* Global Storefront Footer */}
            <Footer catalog={catalog} navigate={navigate} />
        </div>
    );
}
