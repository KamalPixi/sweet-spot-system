import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Receipt, Clock, MapPin, Store, Bike } from 'lucide-react';
import { useApp } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

export default function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart, user, logout, clearCart } = useApp();
    const [secondsLeft, setSecondsLeft] = useState(3);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const query = new URLSearchParams(location.search);
    const orderNumber = query.get('order') || query.get('order_number') || '';
    const phone = query.get('phone') || '';
    const email = query.get('email') || '';

    // Retrieve order data from session storage if available
    const [orderData, setOrderData] = useState(() => {
        try {
            const raw = sessionStorage.getItem('pl_last_order');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        if (!orderNumber) {
            navigate('/', { replace: true });
            return;
        }

        // Clear cart immediately upon successful payment
        clearCart();

        // Count down to auto redirect
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
            handleManualRedirect();
        }, 3500);

        return () => {
            clearInterval(countdown);
            clearTimeout(redirectTimer);
        };
    }, [orderNumber]);

    const handleManualRedirect = () => {
        const verificationQuery = phone 
            ? `?phone=${encodeURIComponent(phone)}` 
            : email 
                ? `?email=${encodeURIComponent(email)}` 
                : '';
        navigate(`/track/${orderNumber}${verificationQuery}`, { replace: true });
    };

    const isDelivery = orderData?.order_type === 'delivery';

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
            <main className="w-full mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 px-4 pt-8 pb-16 sm:px-8 md:px-12 md:pt-12 md:pb-24 bg-[#fdfaf5] shadow-2xl flex-grow flex flex-col items-center justify-center">
                <div className="max-w-md w-full mx-auto animate-fadeIn">
                    
                    {/* Status Card */}
                    <div className="bg-white rounded-[28px] border border-neutral-200/90 shadow-xl shadow-[#24161b]/5 p-6 sm:p-8 text-center space-y-6 relative overflow-hidden">
                        
                        {/* Animated Badge & Success Icon */}
                        <div className="pt-2">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200/70 shadow-inner">
                                <CheckCircle2 size={36} className="animate-bounce" />
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2.5">
                                <Sparkles size={11} className="text-emerald-500" />
                                Payment Confirmed
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#24161b] tracking-tight">
                                Order Placed Successfully!
                            </h1>
                            <p className="text-neutral-500 text-xs sm:text-[13px] mt-2 font-light leading-relaxed">
                                Your payment has been received and sent directly to our artisan kitchen queue.
                            </p>
                        </div>

                        {/* Order Summary Receipt Box */}
                        <div className="bg-[#fdfaf5] border border-neutral-200/80 rounded-2xl p-4 sm:p-5 text-left space-y-3 shadow-xs">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <Receipt size={12} className="text-[#24161b]" /> Order Reference
                                </span>
                                <span className="font-mono font-bold text-[#24161b] bg-white px-2.5 py-1 rounded-lg border border-neutral-200/80 text-xs tracking-wider">
                                    {orderNumber}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-xs border-t border-neutral-200/50 pt-2.5">
                                <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <ShieldCheck size={12} className="text-emerald-600" /> Payment Status
                                </span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 border border-emerald-200 rounded-full text-[10px] tracking-wide">
                                    PAID SECURELY
                                </span>
                            </div>

                            {orderData && (
                                <div className="flex justify-between items-center text-xs border-t border-neutral-200/50 pt-2.5">
                                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                        {isDelivery ? <Bike size={12} className="text-[#24161b]" /> : <Store size={12} className="text-[#24161b]" />} 
                                        Fulfillment
                                    </span>
                                    <span className="font-bold text-[#24161b] capitalize text-xs">
                                        {isDelivery ? 'Doorstep Delivery' : 'Store Collection'}
                                    </span>
                                </div>
                            )}

                            {orderData?.total_amount && (
                                <div className="flex justify-between items-baseline border-t border-neutral-200/60 pt-2.5">
                                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                                        Total Paid
                                    </span>
                                    <span className="font-serif font-black text-[#24161b] text-base">
                                        £{Number(orderData.total_amount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action CTA & Auto-Redirect Timer */}
                        <div className="space-y-3 pt-1">
                            <button 
                                onClick={handleManualRedirect}
                                className="w-full bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 font-bold py-3.5 sm:py-4 rounded-2xl transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#24161b]/15 cursor-pointer active:scale-98"
                            >
                                <span>Track Live Kitchen Progress</span>
                                <ArrowRight size={14} />
                            </button>

                            <p className="text-[11px] text-neutral-400 font-medium">
                                Auto-forwarding to tracking in <strong className="text-[#24161b] font-bold">{secondsLeft}s</strong>...
                            </p>
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

            <Footer navigate={navigate} />
        </div>
    );
}
