import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw, XCircle, ShoppingBag, HelpCircle } from 'lucide-react';
import { useApp } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

export default function PaymentFailed() {
    const navigate = useNavigate();
    const { cart, user, logout } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

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
                    
                    {/* Failure Notice Card */}
                    <div className="bg-white rounded-[28px] border border-neutral-200/90 shadow-xl shadow-[#24161b]/5 p-6 sm:p-8 text-center space-y-6 relative overflow-hidden">
                        
                        {/* Animated Alert Icon */}
                        <div className="pt-2">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200/70 shadow-inner">
                                <XCircle size={36} className="animate-pulse" />
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-[10px] font-black uppercase tracking-widest text-rose-700 mb-2.5">
                                <AlertCircle size={11} className="text-rose-500" />
                                Transaction Unsuccessful
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#24161b] tracking-tight">
                                Payment Was Declined
                            </h1>
                            <p className="text-neutral-500 text-xs sm:text-[13px] mt-2 font-light leading-relaxed">
                                We could not process your transaction. No charges have been made to your account.
                            </p>
                        </div>

                        {/* Common Reasons Card */}
                        <div className="bg-[#fdfaf5] border border-neutral-200/80 p-4 sm:p-5 rounded-2xl text-left space-y-3 shadow-xs">
                            <h3 className="text-[10px] font-bold text-[#24161b] uppercase tracking-wider flex items-center gap-1.5">
                                <HelpCircle size={12} className="text-[#24161b]" /> Common Reasons for Payment Failures:
                            </h3>
                            <ul className="text-xs text-neutral-600 space-y-2 list-disc list-inside font-normal leading-relaxed pl-1">
                                <li>Insufficient funds or daily card limit reached.</li>
                                <li>Incorrect card number, CVV code, or expiry date.</li>
                                <li>Bank 3D-Secure verification expired or was cancelled.</li>
                                <li>Online or international transactions blocked by issuer.</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-1">
                            <button 
                                onClick={() => navigate('/checkout')}
                                className="w-full bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 font-bold py-3.5 sm:py-4 rounded-2xl transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#24161b]/15 cursor-pointer active:scale-98"
                            >
                                <RefreshCw size={14} />
                                <span>Try Another Payment Method</span>
                            </button>

                            <button 
                                onClick={() => navigate('/cart')}
                                className="w-full bg-white hover:bg-neutral-50 text-[#24161b] border border-neutral-200 font-bold py-3.5 sm:py-4 rounded-2xl transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                            >
                                <ShoppingBag size={14} className="text-neutral-500" />
                                <span>Review Basket ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                            </button>
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
