import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle2, Star, ShieldCheck, Truck } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { 
        user, 
        logout, 
        cartItemCount, 
        isSearchOpen, 
        setIsSearchOpen, 
        catalog,
        configs 
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
                                    onClick={() => navigate('/login')} 
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white backdrop-blur-md border border-white/15 transition-all text-xs font-semibold cursor-pointer shadow-sm group"
                                >
                                    <ArrowLeft size={14} className="text-[#e5b582] group-hover:-translate-x-0.5 transition-transform" />
                                    <span>Sign In</span>
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
                        <main className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
                            {/* Mobile Top Visual Banner */}
                            <div className="lg:hidden mb-6 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 relative overflow-hidden bg-[#24161b] text-white p-6 sm:p-8 rounded-b-[24px] shadow-sm">
                                <img 
                                    src={configs?.store_image || configs?.hero_bg_image || "/images/landing-storefront.jpg"} 
                                    alt={configs?.store_name || "Sweet Spot"} 
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

