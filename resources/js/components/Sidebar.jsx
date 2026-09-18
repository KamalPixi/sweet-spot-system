import React, { useState, useEffect } from 'react';
import { X, User, LogOut, Check, Send, ArrowRight, ShoppingBag } from 'lucide-react';
import { useApp } from '../AppContext';

export default function Sidebar({ isMenuOpen, setIsMenuOpen, navigate, cartItemCount, user, logout }) {
    const { setIsCartOpen } = useApp();
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [alreadySubscribed, setAlreadySubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    // Determine email to use: logged-in user's email, or what guest typed
    const emailToSubmit = user?.email || email;

    // Silently check if logged-in user is already subscribed
    useEffect(() => {
        if (!user?.email) return;
        setAlreadySubscribed(false);
        fetch(`/api/newsletter/status?email=${encodeURIComponent(user.email)}`)
            .then(r => r.json())
            .then(data => { if (data.subscribed) setAlreadySubscribed(true); })
            .catch(() => {});
    }, [user?.email]);

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        if (!emailToSubmit) return;
        setLoading(true);

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToSubmit })
            });
            const data = await res.json();
            if (data.success) {
                setSubscribed(true);
                setEmail('');
            }
        } catch (err) {
            console.error("Error subscribing to newsletter:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`}>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => setIsMenuOpen(false)}
            />

            {/* Drawer Panel: Sleek Dark Plum background matching Hero & Brand palette */}
            <div 
                className={`fixed inset-y-0 left-0 max-w-sm w-full bg-[#24161b] border-r border-white/10 shadow-2xl p-7 sm:p-8 flex flex-col justify-between transform transition-transform duration-300 ease-out overflow-y-auto ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div>
                    {/* Header: Brand text + Close button */}
                    <div className="flex justify-between items-center mb-10 pb-4 border-b border-white/10">
                        <div 
                            className="cursor-pointer flex items-center select-none" 
                            onClick={() => { navigate('/'); setIsMenuOpen(false); }}
                        >
                            <img 
                                src="/logo-white-sweetspot.png" 
                                alt="Sweet Spot" 
                                className="h-10 w-auto object-contain transition-transform hover:scale-105" 
                            />
                        </div>
                        <button 
                            onClick={() => setIsMenuOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col space-y-2 text-left">
                        <a 
                            href="/" 
                            onClick={(e) => { e.preventDefault(); navigate('/'); setIsMenuOpen(false); }}
                            className="px-4 py-3 rounded-2xl text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all flex items-center justify-between group"
                        >
                            <span>Home</span>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-rose-400" />
                        </a>
                        <a 
                            href="/categories" 
                            onClick={(e) => { e.preventDefault(); navigate('/categories'); setIsMenuOpen(false); }}
                            className="px-4 py-3 rounded-2xl text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all flex items-center justify-between group"
                        >
                            <span>Categories</span>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-rose-400" />
                        </a>
                        <a 
                            href="/products" 
                            onClick={(e) => { e.preventDefault(); navigate('/products'); setIsMenuOpen(false); }}
                            className="px-4 py-3 rounded-2xl text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all flex items-center justify-between group"
                        >
                            <span>Our Menu</span>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-rose-400" />
                        </a>
                        <a 
                            href="/track" 
                            onClick={(e) => { e.preventDefault(); navigate('/track'); setIsMenuOpen(false); }}
                            className="px-4 py-3 rounded-2xl text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all flex items-center justify-between group"
                        >
                            <span>Track Order</span>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-rose-400" />
                        </a>
                        <a 
                            href="/cart" 
                            onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); setIsCartOpen(true); }}
                            className="px-4 py-3 rounded-2xl text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all flex items-center justify-between group"
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingBag size={16} className="text-rose-400" />
                                <span>Your Basket</span>
                            </span>
                            {cartItemCount > 0 ? (
                                <span className="px-2.5 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full shadow-xs">
                                    {cartItemCount}
                                </span>
                            ) : (
                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-rose-400" />
                            )}
                        </a>
                    </nav>
                </div>

                {/* Account & Newsletter inside sidebar */}
                <div className="space-y-6 border-t border-white/10 pt-6 mt-6 text-left text-white">
                    {/* User Profile Info */}
                    {user ? (
                        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                            <div 
                                className="flex items-center space-x-3 cursor-pointer" 
                                onClick={() => { navigate('/account'); setIsMenuOpen(false); }}
                            >
                                <div className="w-10 h-10 bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-full flex items-center justify-center shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] text-white/50 leading-none">Logged in as</p>
                                    <p className="text-sm font-semibold text-white truncate mt-1">
                                        {user.first_name || user.name || 'My Account'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { logout(); setIsMenuOpen(false); }}
                                className="text-xs text-rose-300 hover:text-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer pt-1"
                            >
                                <LogOut size={13} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-center text-xs font-semibold uppercase tracking-wider text-white transition-all rounded-full cursor-pointer"
                        >
                            Sign In / Register
                        </button>
                    )}

                    {/* Mini Newsletter */}
                    <div className="space-y-2.5">
                        <span className="text-[11px] text-rose-400 font-semibold uppercase tracking-wider block">
                            Sweet Spot Treats
                        </span>

                        {alreadySubscribed && !subscribed ? (
                            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-3.5 py-2">
                                <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                                    <Check size={10} className="text-emerald-300" />
                                </div>
                                <span className="text-xs text-white/60">Already subscribed to sweet news</span>
                            </div>
                        ) : subscribed ? (
                            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-left animate-fadeIn">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-6 h-6 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                                        <Check size={12} className="text-emerald-300" />
                                    </div>
                                    <p className="text-xs font-bold text-white">You're subscribed!</p>
                                </div>
                                <p className="text-[11px] text-white/60 leading-relaxed pl-8">
                                    We'll send you news of fresh batches &amp; offers.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                                {user?.email ? (
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-2 text-xs">
                                        <User size={12} className="text-rose-300 shrink-0" />
                                        <span className="text-white/80 truncate flex-1">{user.email}</span>
                                    </div>
                                ) : (
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email for offers" 
                                        required
                                        disabled={loading}
                                        className="bg-white/5 border border-white/10 focus:border-rose-400/60 rounded-full px-4 py-2.5 text-xs focus:outline-none w-full text-white placeholder-white/40 transition-all font-light"
                                    />
                                )}
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-full px-3 py-2.5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-sm"
                                >
                                    {loading ? (
                                        <span className="animate-spin border-2 border-white border-t-transparent h-3.5 w-3.5 rounded-full" />
                                    ) : (
                                        <>
                                            <Send size={12} />
                                            <span>Get Updates</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
