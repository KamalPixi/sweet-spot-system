import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { 
        user, 
        logout, 
        cartItemCount, 
        isSearchOpen, 
        setIsSearchOpen, 
        catalog 
    } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const tokenParam = searchParams.get('token') || '';
    const emailParam = searchParams.get('email') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!tokenParam || !emailParam) {
            setError('Invalid or missing password reset link parameters.');
        }
    }, [tokenParam, emailParam]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please re-enter.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/customer/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email_or_phone: emailParam,
                    token_or_code: tokenParam,
                    password: password,
                    password_confirmation: confirmPassword
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || 'Failed to reset password. The link may have expired.');
                setLoading(false);
                return;
            }

            setSuccess(true);
            setPassword('');
            setConfirmPassword('');
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
            <div className="w-full mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 px-3 sm:px-6 pt-4 sm:pt-6 pb-10 md:px-10 md:pt-8 md:pb-16 flex-grow flex flex-col items-center bg-[#fdfaf5] shadow-2xl">
                <div className="w-full max-w-6xl mx-auto">
                    {/* Integrated Editorial Split Card */}
                    <div className="bg-white rounded-[28px] sm:rounded-[32px] border border-neutral-200/80 shadow-2xl shadow-[#24161b]/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
                        {/* ════════ LEFT SHOWCASE (Pure Image with Overlay Back Button) ════════ */}
                        <aside className="lg:col-span-5 relative hidden lg:block overflow-hidden bg-[#24161b]">
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
                                    onClick={() => navigate('/login')} 
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/30 hover:bg-black/50 text-white/90 hover:text-white backdrop-blur-md border border-white/20 transition-all text-xs font-semibold cursor-pointer shadow-sm group"
                                >
                                    <ArrowLeft size={14} className="text-[#e5b582] group-hover:-translate-x-0.5 transition-transform" />
                                    <span>Sign In</span>
                                </button>
                            </div>
                        </aside>

                        {/* ════════ RIGHT FORM CONTAINER ════════ */}
                        <main className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
                            {/* Mobile Top Visual Banner */}
                            <div className="lg:hidden mb-6 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 relative overflow-hidden bg-[#24161b] text-white p-6 sm:p-8 rounded-b-[24px] shadow-sm">
                                <img 
                                    src="/images/auth-bakery.jpg" 
                                    alt="Sweet Spot" 
                                    className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
                                />
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
                                        onClick={() => navigate('/login')}
                                        className="text-xs text-white/90 hover:text-white inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 cursor-pointer"
                                    >
                                        <ArrowLeft size={12} className="text-[#e5b582]" />
                                        <span>Sign In</span>
                                    </button>
                                </div>
                            </div>

                            {/* Form Card Body */}
                            <div className="max-w-sm w-full mx-auto py-2 sm:py-4">
                                {/* Header Title */}
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#24161b] tracking-tight">
                                        Choose New Password
                                    </h1>
                                    <p className="text-xs text-neutral-500 mt-1.5 font-normal">
                                        {success 
                                            ? 'Your password has been reset successfully.' 
                                            : `Enter a new secure password for ${emailParam || 'your account'}.`}
                                    </p>
                                </div>

                                {success ? (
                                    <div className="space-y-4 text-center py-6 px-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <h3 className="text-sm font-bold text-neutral-900">Password Updated</h3>
                                        <p className="text-xs text-neutral-600">
                                            Your account is ready. You can now sign in using your new credentials.
                                        </p>
                                        <button 
                                            type="button" 
                                            onClick={() => navigate('/login')}
                                            className="w-full h-12 bg-[#24161b] hover:bg-[#341f27] text-[#e5b582] font-bold tracking-widest uppercase rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-[#24161b]/10 border border-[#e5b582]/20"
                                        >
                                            Proceed to Sign In
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4 animate-auth-switch">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">New Password</label>
                                            <div className="relative flex items-center">
                                                <input 
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    disabled={loading}
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

                                        <div>
                                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Confirm New Password</label>
                                            <input 
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                disabled={loading}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full h-11 bg-neutral-50/70 border border-neutral-200 focus:bg-white focus:border-[#24161b] focus:ring-1 focus:ring-[#24161b] rounded-xl px-3.5 text-xs sm:text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                                            />
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
                                                <AlertCircle size={15} className="shrink-0" />
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <button 
                                                type="submit" 
                                                disabled={loading || !tokenParam}
                                                className="w-full h-12 bg-[#24161b] hover:bg-[#341f27] active:scale-[0.99] disabled:opacity-50 text-[#e5b582] hover:text-white font-bold tracking-widest uppercase rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#24161b]/10 border border-[#e5b582]/20"
                                            >
                                                {loading ? (
                                                    <Loader2 size={15} className="animate-spin text-[#e5b582]" />
                                                ) : (
                                                    <span>Update Password</span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
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

