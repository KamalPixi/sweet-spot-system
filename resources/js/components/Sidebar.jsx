import React, { useState, useEffect } from 'react';
import { X, User, LogOut, Check, Send } from 'lucide-react';
import { useApp } from '../AppContext';

const Logo = () => (
    <svg className="w-8 h-8 text-white fill-current transition-transform hover:scale-105" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 26.5L6.5 13.5H11.5L16 19.5L20.5 13.5H25.5L16 26.5Z" />
        <path d="M16 11.5L11.5 5.5H20.5L16 11.5Z" />
    </svg>
);

export default function Sidebar({ isMenuOpen, setIsMenuOpen, navigate, cartItemCount, user, logout }) {
    const { setIsCartOpen } = useApp();
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);       // fresh sign-up this session
    const [alreadySubscribed, setAlreadySubscribed] = useState(false); // was already on the list
    const [loading, setLoading] = useState(false);

    // Determine email to use: logged-in user's email, or what guest typed
    const emailToSubmit = user?.email || email;

    // Silently check if logged-in user is already subscribed — show quiet badge, not celebration
    useEffect(() => {
        if (!user?.email) return;
        setAlreadySubscribed(false); // reset on user change
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
                className={`fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => setIsMenuOpen(false)}
            ></div>

            {/* Drawer Panel */}
            <div 
                className={`fixed inset-y-0 left-0 max-w-xs w-full bg-[#8F5336] border-r border-white/10 shadow-2xl p-8 flex flex-col justify-between transform transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div>
                    {/* Close Button & Logo */}
                    <div className="flex justify-between items-center mb-12">
                        <div className="cursor-pointer" onClick={() => { navigate('/'); setIsMenuOpen(false); }}>
                            <Logo />
                        </div>
                        <button 
                            onClick={() => setIsMenuOpen(false)}
                            className="text-white/60 hover:text-white transition-colors p-2 cursor-pointer focus:outline-none"
                            aria-label="Close menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Menu Navigation Links */}
                    <nav className="flex flex-col space-y-6 text-lg font-light tracking-wide text-left">
                        <a 
                            href="/" 
                            onClick={(e) => { e.preventDefault(); navigate('/'); setIsMenuOpen(false); }}
                            className="hover:text-white text-white/80 transition-colors py-1 block"
                        >
                            Home
                        </a>
                        <a 
                            href="/categories" 
                            onClick={(e) => { e.preventDefault(); navigate('/categories'); setIsMenuOpen(false); }}
                            className="hover:text-white text-white/80 transition-colors py-1 block"
                        >
                            Browse Sweets
                        </a>
                        <a 
                            href="/track" 
                            onClick={(e) => { e.preventDefault(); navigate('/track'); setIsMenuOpen(false); }}
                            className="hover:text-white text-white/80 transition-colors py-1 block"
                        >
                            Track Order
                        </a>
                        <a 
                            href="/cart" 
                            onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); setIsCartOpen(true); }}
                            className="hover:text-white text-white/80 transition-colors py-1 block flex items-center justify-between"
                        >
                            <span>Your Basket</span>
                            {cartItemCount > 0 && (
                                <span className="px-2 py-0.5 bg-white text-[#1e1008] text-xs font-bold rounded-full">
                                    {cartItemCount}
                                </span>
                            )}
                        </a>
                    </nav>
                </div>

                {/* Account & Newsletter footer inside menu */}
                <div className="space-y-8 border-t border-white/5 pt-8 text-left text-white">
                    {/* User Profile Info */}
                    {user ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { navigate('/account'); setIsMenuOpen(false); }}>
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 text-left">Logged in as</p>
                                    <p className="text-sm font-medium text-white max-w-[150px] truncate text-left">
                                        {user.first_name || user.name || 'Account'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { logout(); setIsMenuOpen(false); }}
                                className="text-xs text-red-300 hover:text-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                            className="w-full py-3 border border-white/20 hover:border-white text-center text-sm font-medium text-white transition-all rounded-full cursor-pointer bg-transparent"
                        >
                            Sign In
                        </button>
                    )}

                    {/* Mini Newsletter inside drawer */}
                    <div className="space-y-3">
                        <p className="text-xs text-white/40 font-light uppercase tracking-wider">Sweet Newsletter</p>

                        {/* Already subscribed before opening sidebar — quiet badge only */}
                        {alreadySubscribed && !subscribed ? (
                            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-3 py-2">
                                <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                                    <Check size={10} className="text-emerald-300" />
                                </div>
                                <span className="text-xs text-white/50">Already subscribed</span>
                            </div>

                        /* Just subscribed this session — full celebration panel */
                        ) : subscribed ? (
                            <div className="bg-white/10 border border-white/15 rounded-[16px] p-4 text-left animate-fadeIn">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                                        <Check size={15} className="text-emerald-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-white leading-tight">You're subscribed!</p>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed pl-11">
                                    We'll send you the sweetest news, new flavours &amp; exclusive offers. Check your inbox 🍮
                                </p>
                            </div>

                        /* Not subscribed — show form */
                        ) : (
                            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                                {user?.email ? (
                                    /* Logged-in: show email as read-only pill, one-click subscribe */
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs">
                                        <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                                            <User size={10} className="text-white/70" />
                                        </div>
                                        <span className="text-white/70 truncate flex-1">{user.email}</span>
                                    </div>
                                ) : (
                                    /* Guest: free-form email input */
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Your email address" 
                                        required
                                        disabled={loading}
                                        className="bg-white/5 border border-white/10 focus:border-white/30 rounded-full px-4 py-2.5 text-xs focus:outline-none w-full text-white placeholder-white/30 transition-all"
                                    />
                                )}
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-white text-[#8e5233] font-bold rounded-full px-3 py-2.5 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin border-2 border-[#8e5233] border-t-transparent h-3 w-3 rounded-full"></span>
                                            <span>Subscribing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={12} />
                                            <span>Subscribe</span>
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
