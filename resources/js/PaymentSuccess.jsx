import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Wallet, ChevronLeft } from 'lucide-react';
import { useApp } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

export default function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart, user, logout, clearCart } = useApp();
    const [secondsLeft, setSecondsLeft] = useState(2);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const query = new URLSearchParams(location.search);
    const orderNumber = query.get('order') || '';
    const phone = query.get('phone') || '';
    const email = query.get('email') || '';

    useEffect(() => {
        if (!orderNumber) {
            navigate('/', { replace: true });
            return;
        }

        // Clear the cart only after payment success loads
        clearCart();

        const countdown = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const redirectTimer = setTimeout(() => {
            const verificationQuery = phone 
                ? `?phone=${encodeURIComponent(phone)}` 
                : email 
                    ? `?email=${encodeURIComponent(email)}` 
                    : '';
            navigate(`/track/${orderNumber}${verificationQuery}`, { replace: true });
        }, 2000);

        return () => {
            clearInterval(countdown);
            clearTimeout(redirectTimer);
        };
    }, [orderNumber, phone, email, navigate]);

    const handleManualRedirect = () => {
        const verificationQuery = phone 
            ? `?phone=${encodeURIComponent(phone)}` 
            : email 
                ? `?email=${encodeURIComponent(email)}` 
                : '';
        navigate(`/track/${orderNumber}${verificationQuery}`, { replace: true });
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

            {/* Curved overlap container holding success panel */}
            <div className="w-full flex-grow mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 overflow-hidden flex items-center justify-center py-16 px-4" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                <div className="max-w-md w-full text-center space-y-6 p-8 border border-neutral-200/60 bg-[#fdfaf5]/30 backdrop-blur-md rounded-[28px] shadow-xl shadow-[#8e5233]/5 animate-fadeIn">
                    <div>
                        {/* Animated Check Circle Icon */}
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-250/60 animate-bounce">
                            <CheckCircle size={32} />
                        </div>
                        
                        <h1 className="text-3xl font-sans text-[#8e5233] font-bold tracking-wide">Payment Success!</h1>
                        <p className="text-neutral-500 text-xs mt-2">
                            Your transaction was processed successfully.
                        </p>
                    </div>

                    <div className="bg-white/70 border border-neutral-200/80 p-5 rounded-[20px] space-y-3.5 text-left shadow-xs">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-neutral-450 font-bold uppercase tracking-wider text-[10px]">Order Reference</span>
                            <span className="font-mono font-bold text-neutral-900 uppercase">{orderNumber}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-neutral-200/50 pt-3">
                            <span className="text-neutral-450 font-bold uppercase tracking-wider text-[10px]">Payment Status</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 border border-emerald-200/50 rounded-full text-[9px]">PAID</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-neutral-200/50 pt-3">
                            <span className="text-neutral-450 font-bold uppercase tracking-wider text-[10px]">Method</span>
                            <span className="font-bold text-neutral-800 flex items-center gap-1">
                                <Wallet size={12} className="text-[#8e5233]" /> Stripe Sandbox
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={handleManualRedirect}
                            className="w-full bg-[#8e5233] hover:bg-[#723e25] text-white font-bold py-3.5 rounded-full transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#8e5233]/15 uppercase tracking-wider"
                        >
                            <span>Track Your Bakes Live</span>
                            <ArrowRight size={14} />
                        </button>

                        <p className="text-[11px] text-neutral-450 font-medium">
                            Redirecting to tracking page in <strong className="text-[#8e5233] font-bold">{secondsLeft}s</strong>...
                        </p>
                    </div>
                </div>
            </div>

            <Footer navigate={navigate} />

            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                cartItemCount={cart.reduce((sum, i) => sum + i.quantity, 0)} 
                user={user} 
                logout={logout} 
            />
        </div>
    );
}
