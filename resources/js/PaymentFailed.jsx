import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
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
        <div className="min-h-screen bg-[#fdfaf5] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <Header 
                setIsMenuOpen={setIsMenuOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                navigate={navigate}
                cartItemCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
                user={user}
            />

            {/* Curved overlap container holding failure panel */}
            <div className="w-full flex-grow mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 overflow-hidden flex items-center justify-center py-16 px-4" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                <div className="max-w-md w-full text-center space-y-6 p-8 border border-neutral-200/60 bg-[#fdfaf5]/30 backdrop-blur-md rounded-[28px] shadow-xl shadow-[#8e5233]/5 animate-fadeIn">
                    <div>
                        {/* Animated Alert Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-50 text-red-650 flex items-center justify-center mx-auto mb-5 border border-red-250/60 animate-pulse">
                            <XCircle size={32} />
                        </div>
                        
                        <h1 className="text-3xl font-sans text-red-700 font-bold tracking-wide">Payment Declined</h1>
                        <p className="text-neutral-500 text-xs mt-2">
                            We could not process your transaction. No charges were made to your account.
                        </p>
                    </div>

                    <div className="bg-white/70 border border-neutral-200/80 p-5 rounded-[20px] text-left space-y-3.5 shadow-xs">
                        <h3 className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider">Common reasons for failure:</h3>
                        <ul className="text-xs text-neutral-500 space-y-2 list-disc list-inside font-light leading-relaxed">
                            <li>Insufficient funds in your account.</li>
                            <li>Incorrect card details, expiry date, or CVV.</li>
                            <li>Your bank flagged the transaction as suspicious.</li>
                            <li>International or online payments are disabled on your card.</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={() => navigate('/checkout')}
                            className="w-full bg-[#8e5233] hover:bg-[#723e25] text-white font-bold py-3.5 rounded-full transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#8e5233]/15 uppercase tracking-wider"
                        >
                            <RefreshCw size={12} />
                            <span>Return to Checkout & Try Again</span>
                        </button>

                        <button 
                            onClick={() => navigate('/cart')}
                            className="w-full bg-transparent hover:bg-[#8e5233]/5 text-[#8e5233] border border-[#8e5233] font-bold py-3.5 rounded-full transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
                        >
                            <ArrowLeft size={12} />
                            <span>Back to Your Basket</span>
                        </button>
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
