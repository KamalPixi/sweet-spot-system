import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { User, Lock, Mail, Phone, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

export default function Auth({ defaultMode = 'login' }) {
    const navigate = useNavigate();
    const { login, logout, user, token, adminToken, adminUser, userType, cartItemCount, isSearchOpen, setIsSearchOpen, catalog, configs } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [mode, setMode] = useState(defaultMode); // 'login', 'register', 'admin'
    
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
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [registerMethod, setRegisterMethod] = useState('phone'); // 'phone' or 'email'
    const [forgotMethod, setForgotMethod] = useState('phone'); // 'phone' or 'email'
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
                email_or_phone: email || phone, // Use whichever was entered
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
                email: email || null,
                phone,
                password,
                password_confirmation: password
            };
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
                // Set success message/alert
                setPassword('');
                setResetCode('');
                setConfirmPassword('');
                alert('Password reset successfully. You can now log in.');
            } else {
                // Success! Set Auth in context
                const token = data.data.token;
                const profile = data.data.user || data.data.customer;
                const type = mode === 'admin' ? 'admin' : 'customer';

                login(token, profile, type);

                // Redirect admin immediately, customer is handled by useEffect
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
            <div>
                <Header 
                    setIsMenuOpen={setIsMenuOpen}
                    setIsSearchOpen={setIsSearchOpen}
                    isSearchOpen={isSearchOpen}
                    navigate={navigate}
                    cartItemCount={cartItemCount}
                    user={user}
                />

                <div className="w-full mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-6 pt-6 pb-10 md:px-12 md:pt-8 md:pb-16" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                    <div className="max-w-md mx-auto w-full flex flex-col items-start gap-4 animate-fadeIn">
                        {/* Back button */}
                        <button 
                            onClick={() => {
                                if (window.history.state && window.history.state.idx > 0) {
                                    navigate(-1);
                                } else {
                                    navigate('/categories');
                                }
                            }} 
                            className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-[#8F5336] flex items-center gap-1.5 transition-colors cursor-pointer pl-3 bg-transparent border-none"
                        >
                            <ArrowLeft size={14} />
                            <span>Go Back</span>
                        </button>

                        <div className="w-full bg-white border border-neutral-200/60 p-8 md:p-10 rounded-[24px] shadow-xl shadow-[#8e5233]/5 relative overflow-hidden text-left mt-2">
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-3">
                                    <img 
                                        src={configs?.store_logo || "/images/logo-colored.png"} 
                                        alt="Sweet Spot System Logo" 
                            className="h-16 w-auto object-contain cursor-pointer"
                            onClick={() => navigate('/')}
                        />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#8F5336] mt-4">
                        {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : mode === 'forgot_password' ? 'Reset Password' : mode === 'verify_code' ? 'Verify Reset Code' : 'Admin Portal'}
                    </h2>
                    <p className="text-neutral-500 text-xs mt-1">
                        {mode === 'login' ? 'Sign in to track your orders and checkout faster.' : mode === 'register' ? 'Register in seconds to start ordering.' : mode === 'forgot_password' ? 'Enter your registered email or phone number to reset your password.' : mode === 'verify_code' ? `Enter the 6-digit code sent to ${forgotInput} and choose a new password.` : 'Access Admin reports and manage products.'}
                    </p>
                </div>

                {/* Tabs */}
                {mode !== 'admin' && mode !== 'forgot_password' && mode !== 'verify_code' && (
                    <div className="flex bg-white/60 backdrop-blur-xs p-1 rounded-xl border border-neutral-200/80 mb-6">
                        <button 
                            onClick={() => { setMode('login'); setError(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                mode === 'login' 
                                    ? 'bg-[#8e5233] text-white shadow-sm shadow-[#8e5233]/10' 
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => { setMode('register'); setError(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                mode === 'register' 
                                    ? 'bg-[#8e5233] text-white shadow-sm shadow-[#8e5233]/10' 
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full">
                    {/* First and Last name (Register only) */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        mode === 'register' ? 'max-h-[120px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}>
                        <div className="grid grid-cols-2 gap-4 pb-5">
                            <div>
                                <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">First Name</label>
                                <input 
                                    type="text" 
                                    required={mode === 'register'}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">Last Name</label>
                                <input 
                                    type="text" 
                                    required={mode === 'register'}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Method (Register only) */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        mode === 'register' ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}>
                        <div className="pb-5">
                            <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                {registerMethod === 'email' ? 'Email Address' : 'Phone Number'}
                            </label>
                            <div className="relative flex items-center">
                                {registerMethod === 'email' ? (
                                    <>
                                        <Mail className="absolute left-4 text-neutral-455" size={14} />
                                        <input 
                                            type="email" 
                                            required={mode === 'register' && registerMethod === 'email'}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="john.doe@example.com"
                                            className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-20 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute left-4 flex items-center space-x-1 text-neutral-400 pr-2 border-r border-neutral-200 mr-2 shrink-0 select-none">
                                            <span className="text-sm">🇬🇧</span>
                                        </div>
                                        <input 
                                            type="tel" 
                                            required={mode === 'register' && registerMethod === 'phone'}
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="e.g. 07123456789"
                                            className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-16 pr-20 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                        />
                                    </>
                                )}

                                {/* Switch buttons inside input */}
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
                    </div>

                    {/* Email or Phone field (Login/Admin only) */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        (mode !== 'register' && mode !== 'forgot_password' && mode !== 'verify_code') ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}>
                        <div className="pb-5">
                            <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                {mode === 'admin' ? 'Email Address' : 'Email or Phone Number'}
                            </label>
                            <div className="relative">
                                {mode === 'admin' ? (
                                    <Mail className="absolute left-4 top-3.5 text-neutral-400" size={14} />
                                ) : (
                                    <User className="absolute left-4 top-3.5 text-neutral-400" size={14} />
                                )}
                                <input 
                                    type={mode === 'admin' ? 'email' : 'text'} 
                                    required={mode !== 'register' && mode !== 'forgot_password' && mode !== 'verify_code'}
                                    value={mode === 'admin' ? email : (email || phone)}
                                    onChange={(e) => {
                                        if (mode === 'admin') {
                                            setEmail(e.target.value);
                                        } else {
                                            const val = e.target.value;
                                            if (val.includes('@')) {
                                                setEmail(val);
                                                setPhone('');
                                            } else {
                                                setPhone(val);
                                                setEmail('');
                                            }
                                        }
                                    }}
                                    placeholder={mode === 'admin' ? '' : 'Enter email or phone number'}
                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-4 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Forgot Password View */}
                    {mode === 'forgot_password' && (
                        <div className="space-y-4 animate-fadeIn">
                            {forgotSent ? (
                                <div className="text-center py-4 space-y-3">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                        <Mail size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-700">A password reset link has been sent to your email. Please check your inbox.</p>
                                    <button 
                                        type="button" 
                                        onClick={() => { setMode('login'); setForgotSent(false); }}
                                        className="text-xs font-bold text-[#8e5233] hover:underline cursor-pointer pt-2"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            ) : (
                                <div className="pb-4">
                                    <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                        {forgotMethod === 'email' ? 'Email Address' : 'Phone Number'}
                                    </label>
                                    <div className="relative flex items-center">
                                        {forgotMethod === 'email' ? (
                                            <>
                                                <Mail className="absolute left-4 text-neutral-455" size={14} />
                                                <input 
                                                    type="email" 
                                                    required={mode === 'forgot_password' && forgotMethod === 'email'}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="john.doe@example.com"
                                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-20 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="absolute left-4 flex items-center space-x-1 text-neutral-400 pr-2 border-r border-neutral-200 mr-2 shrink-0 select-none">
                                                    <span className="text-sm">🇬🇧</span>
                                                </div>
                                                <input 
                                                    type="tel" 
                                                    required={mode === 'forgot_password' && forgotMethod === 'phone'}
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="e.g. 07123456789"
                                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-16 pr-20 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                                />
                                            </>
                                        )}

                                        {/* Switch buttons inside input */}
                                        <div className="absolute right-2 flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                                            <button type="button" onClick={() => { setForgotMethod('phone'); setEmail(''); }} title="Use Phone Number"
                                                className={`p-1.5 rounded-md transition-all cursor-pointer ${forgotMethod === 'phone' ? 'bg-[#8e5233] text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
                                                <Phone size={11} />
                                            </button>
                                            <button type="button" onClick={() => { setForgotMethod('email'); setPhone(''); }} title="Use Email Address"
                                                className={`p-1.5 rounded-md transition-all cursor-pointer ${forgotMethod === 'email' ? 'bg-[#8e5233] text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
                                                <Mail size={11} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Verify Code View */}
                    {mode === 'verify_code' && (
                        <div className="space-y-4 animate-fadeIn pb-4">
                            <div>
                                <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">6-Digit Reset Code</label>
                                <input 
                                    type="text" 
                                    maxLength={6}
                                    required={mode === 'verify_code'}
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none transition-all text-center tracking-widest font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-neutral-400" size={14} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required={mode === 'verify_code'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-12 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3 text-neutral-400 hover:text-[#8e5233] transition-colors focus:outline-none cursor-pointer p-0.5 flex items-center justify-center"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider mb-1.5">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-neutral-400" size={14} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required={mode === 'verify_code'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-12 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password (All modes except forgot_password / verify_code) */}
                    {(mode === 'login' || mode === 'register' || mode === 'admin') && (
                        <div className="mb-5">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-neutral-550 text-[10px] font-bold uppercase tracking-wider">Password</label>
                                {mode === 'login' && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setMode('forgot_password'); setError(null); }}
                                        className="text-[10px] text-[#8e5233] hover:underline font-bold bg-transparent border-none cursor-pointer"
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-neutral-400" size={14} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-12 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3 text-neutral-400 hover:text-[#8e5233] transition-colors focus:outline-none cursor-pointer p-0.5 flex items-center justify-center"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center space-x-2 text-red-700 bg-red-50 border border-red-200 rounded-[12px] p-3 text-xs">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!(mode === 'forgot_password' && forgotSent) && (
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-[#8e5233] hover:bg-[#723e25] disabled:bg-[#8e5233]/60 text-white font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#8e5233]/15 cursor-pointer mt-2"
                        >
                            {loading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <span>
                                    {mode === 'login' 
                                        ? 'Sign In' 
                                        : mode === 'register' 
                                            ? 'Sign Up' 
                                            : mode === 'forgot_password' 
                                                ? 'Send Reset Instructions' 
                                                : mode === 'verify_code' 
                                                    ? 'Reset Password' 
                                                    : 'Admin Login'}
                                </span>
                            )}
                        </button>
                    )}

                    {((mode === 'forgot_password' && !forgotSent) || mode === 'verify_code') && (
                        <div className="text-center mt-4">
                            <button 
                                type="button" 
                                onClick={() => { setMode('login'); setForgotSent(false); setError(null); }}
                                className="text-xs text-neutral-500 hover:text-neutral-800 font-semibold hover:underline cursor-pointer"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    )}
                </form>

                {/* Staff Link / Toggle */}
                {defaultMode === 'admin' && (
                    <div className="mt-8 text-center pt-4 border-t border-neutral-200">
                        <button 
                            onClick={() => { navigate('/login'); }}
                            className="text-xs text-[#8e5233] hover:underline font-bold transition-colors cursor-pointer"
                        >
                            Return to Customer Sign In
                        </button>
                    </div>
                )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer catalog={catalog} navigate={navigate} />

            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                cartItemCount={cartItemCount} 
                user={user} 
                logout={logout}
            />
        </div>
);
}
