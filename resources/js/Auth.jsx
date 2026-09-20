import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

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
        catalog 
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

    // Feature toggles for Phone vs Email
    const [registerMethod, setRegisterMethod] = useState('phone'); // 'phone' | 'email'
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
            payload = {
                email_or_phone: email || phone,
                password
            };
            if (!payload.email_or_phone) {
                setError('Please enter your email or phone number.');
                setLoading(false);
                return;
            }
        } else if (mode === 'register') {
            url = '/api/customer/register';
            payload = {
                first_name: firstName,
                last_name: lastName,
                email: registerMethod === 'email' ? email : (email || null),
                phone: registerMethod === 'phone' ? phone : (phone || null),
                password,
                password_confirmation: password
            };
            if (registerMethod === 'phone' && !payload.phone) {
                setError('Please enter your UK phone number.');
                setLoading(false);
                return;
            }
            if (registerMethod === 'email' && !payload.email) {
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
        <div className="min-h-screen bg-[#fdfaf5] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            {/* Global Storefront Header */}
            <Header 
                setIsMenuOpen={setIsMenuOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                navigate={navigate}
                cartItemCount={cartItemCount}
                user={user}
            />

            {/* Main Overlapping Storefront Container */}
            <div className="w-full mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-3 sm:px-6 pt-4 sm:pt-6 pb-10 md:px-10 md:pt-8 md:pb-16 flex-grow flex flex-col items-center bg-[#fdfaf5] shadow-lg shadow-[#24161b]/5">
                <div className="w-full max-w-6xl mx-auto">
                    {/* Integrated Editorial Split Card with strictly locked dimensions on desktop */}
                    <div className="bg-white rounded-[28px] sm:rounded-[32px] border border-neutral-200/80 shadow-2xl shadow-[#24161b]/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:h-[640px] min-h-[600px]">
                        {/* ════════ LEFT SHOWCASE (Pure Image with Overlay Back Button) ════════ */}
                        <aside className="lg:col-span-5 relative hidden lg:block overflow-hidden bg-[#24161b] h-full w-full">
                            <img 
                                src="/images/auth-bakery.jpg" 
                                alt="Sweet Spot Artisanal Treats" 
                                className="absolute inset-0 w-full h-full object-cover object-center"
                                onError={(e) => {
                                    e.currentTarget.src = "/images/landing-storefront.jpg";
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

                            {/* Back Button Floating on top of Image */}
                            <div className="absolute top-6 left-6 z-20">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (window.history.state && window.history.state.idx > 0) {
                                            navigate(-1);
                                        } else {
                                            navigate('/products');
                                        }
                                    }} 
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/30 hover:bg-black/50 text-white/90 hover:text-white backdrop-blur-md border border-white/20 transition-all text-xs font-semibold cursor-pointer shadow-sm group"
                                >
                                    <ArrowLeft size={14} className="text-[#e5b582] group-hover:-translate-x-0.5 transition-transform" />
                                    <span>Back to Treats</span>
                                </button>
                            </div>
                        </aside>

                        {/* ════════ RIGHT FORM CONTAINER ════════ */}
                        <main className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto h-full">
                            {/* Mobile Top Visual Banner */}
                            <div className="lg:hidden mb-6 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 relative overflow-hidden bg-[#24161b] text-white p-6 sm:p-8 rounded-b-[24px] shadow-sm">
                                <img 
                                    src="/images/auth-bakery.jpg" 
                                    alt="Sweet Spot" 
                                    className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
                                />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="cursor-pointer" onClick={() => navigate('/')}>
                                        <img src="/logo-white-sweetspot.png" alt="Sweet Spot" className="h-7 w-auto object-contain" />
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
                            <div className="max-w-sm w-full mx-auto py-2 sm:py-4">
                                {/* Header Title */}
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#24161b] tracking-tight">
                                        {mode === 'login' && 'Sign In'}
                                        {mode === 'register' && 'Create Account'}
                                        {mode === 'forgot_password' && 'Reset Password'}
                                        {mode === 'verify_code' && 'Enter Code'}
                                        {mode === 'admin' && 'Staff Portal'}
                                    </h1>
                                    <p className="text-xs text-neutral-500 mt-1.5 font-normal">
                                        {mode === 'login' && 'Welcome back to Sweet Spot.'}
                                        {mode === 'register' && 'Create your account to order treats.'}
                                        {mode === 'forgot_password' && 'Enter your contact info to reset password.'}
                                        {mode === 'verify_code' && `Enter the 6-digit code sent to ${forgotInput}.`}
                                        {mode === 'admin' && 'Bakery staff access only.'}
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
                                    {/* Collapsible Registration Fields (First Name, Last Name, Register Contact Toggle) */}
                                    <div className={`auth-expand-grid ${mode === 'register' ? 'expanded' : ''}`}>
                                        <div className="auth-expand-inner space-y-4 pb-1">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">First Name</label>
                                                    <input 
                                                        type="text" 
                                                        required={mode === 'register'}
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        placeholder="Jane"
                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
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
                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                                    />
                                                </div>
                                            </div>

                                            {/* Register Contact Toggle (Phone vs Email) */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-xs font-medium text-neutral-700">
                                                        {registerMethod === 'phone' ? 'UK Mobile Number' : 'Email Address'}
                                                    </label>
                                                    <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[11px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setRegisterMethod('phone'); setEmail(''); }}
                                                            className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                registerMethod === 'phone'
                                                                    ? 'bg-white text-[#24161b] shadow-xs'
                                                                    : 'text-neutral-500 hover:text-neutral-900'
                                                            }`}
                                                        >
                                                            Phone
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setRegisterMethod('email'); setPhone(''); }}
                                                            className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                                                registerMethod === 'email'
                                                                    ? 'bg-white text-[#24161b] shadow-xs'
                                                                    : 'text-neutral-500 hover:text-neutral-900'
                                                            }`}
                                                        >
                                                            Email
                                                        </button>
                                                    </div>
                                                </div>

                                                {registerMethod === 'phone' ? (
                                                    <div className="relative flex items-center">
                                                        <div className="absolute left-3.5 flex items-center gap-1.5 text-neutral-500 pr-2.5 border-r border-neutral-200 select-none">
                                                            <span className="text-sm">🇬🇧</span>
                                                            <span className="text-xs font-semibold text-neutral-700">+44</span>
                                                        </div>
                                                        <input 
                                                            type="tel" 
                                                            required={mode === 'register'}
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            placeholder="07123 456789"
                                                            className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl pl-20 pr-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                                        />
                                                    </div>
                                                ) : (
                                                    <input 
                                                        type="email" 
                                                        required={mode === 'register'}
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="jane.doe@example.com"
                                                        className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Login / Admin input */}
                                    {(mode === 'login' || mode === 'admin') && (
                                        <div className="animate-auth-switch">
                                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                                {mode === 'admin' ? 'Staff Email' : 'Email or Mobile'}
                                            </label>
                                            <input 
                                                type={mode === 'admin' ? 'email' : 'text'} 
                                                required
                                                value={mode === 'admin' ? email : (email || phone)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (mode === 'admin') {
                                                        setEmail(val);
                                                    } else {
                                                        if (val.includes('@')) {
                                                            setEmail(val);
                                                            setPhone('');
                                                        } else {
                                                            setPhone(val);
                                                            setEmail('');
                                                        }
                                                    }
                                                }}
                                                placeholder={mode === 'admin' ? 'admin@sweetspot.co.uk' : 'Email or mobile number'}
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
                                                    className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl pl-3.5 pr-10 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
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
                                                        {mode === 'admin' && 'Staff Login'}
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

                                {/* Staff Mode Return */}
                                {defaultMode === 'admin' && (
                                    <div className="mt-4 text-center">
                                        <button 
                                            type="button"
                                            onClick={() => navigate('/login')}
                                            className="text-xs text-neutral-500 hover:text-[#24161b] cursor-pointer font-medium"
                                        >
                                            ← Customer sign in
                                        </button>
                                    </div>
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
