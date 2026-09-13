import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { Menu, Search, User, ArrowRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import BrandLine from './components/BrandLine';

export default function Landing() {
    const navigate = useNavigate();
    const { 
        orderType, 
        setOrderType, 
        deliveryInfo, 
        collectionSlot, 
        user, 
        logout, 
        cartItemCount,
        isSearchOpen,
        setIsSearchOpen,
        setIsCartOpen
    } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleSelectType = (type) => {
        setOrderType(type);
        if (type === 'delivery') {
            navigate('/delivery-setup');
        } else {
            navigate('/collection-setup');
        }
    };

    // Custom V Monogram SVG Logo matching the mockup
    const Logo = () => (
        <svg className="w-8 h-8 text-white fill-current transition-transform hover:scale-105" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 26.5L6.5 13.5H11.5L16 19.5L20.5 13.5H25.5L16 26.5Z" />
            <path d="M16 11.5L11.5 5.5H20.5L16 11.5Z" />
        </svg>
    );

    return (
        <div 
            className="min-h-screen flex flex-col justify-between text-white relative overflow-hidden font-sans select-none bg-[#1e1008]"
            style={{
                backgroundImage: "url('/images/hero-dessert.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'right 20% center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Gradient Overlay for rich readability and blending */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent md:from-black/45 md:to-transparent pointer-events-none z-10"></div>

            {/* Header Navigation */}
            <header className="w-full py-6 px-4 md:px-12 flex justify-between items-center z-45 absolute top-0 left-0 bg-transparent">
                {/* Left: Hamburger */}
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="text-white hover:text-white/80 transition-colors p-1.5 pl-0 cursor-pointer focus:outline-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    aria-label="Open navigation menu"
                >
                    <Menu size={24} strokeWidth={1.5} />
                </button>

                {/* Center: Logo */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" onClick={() => navigate('/')}>
                    <Logo />
                </div>

                {/* Right: Icons */}
                <div className="flex items-center space-x-0 md:space-x-4">
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)} 
                        className="text-white hover:text-white/80 transition-colors px-1 py-1.5 md:p-2 cursor-pointer focus:outline-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        aria-label="Search products"
                    >
                        <Search size={22} strokeWidth={1.5} />
                    </button>
                    <button 
                        onClick={() => setIsCartOpen(true)} 
                        className="text-white hover:text-white/80 transition-colors px-1 py-1.5 md:p-2 cursor-pointer relative focus:outline-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        aria-label="Open cart"
                    >
                        <img src="/images/icons/bag.png" alt="Cart" className="w-[22px] h-[22px] object-contain inline-block" style={{ filter: 'brightness(0) invert(1)' }} />
                        {cartItemCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white text-[#8e5233] text-[9px] font-black rounded-full flex items-center justify-center">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => navigate(user ? '/account' : '/login')} 
                        className="text-white hover:text-white/80 transition-colors pl-1 pr-0 py-1.5 md:p-2 cursor-pointer focus:outline-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        aria-label="User account"
                    >
                        <User size={22} strokeWidth={1.5} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center w-full px-6 md:px-16 lg:px-24 pt-24 pb-12 z-20">
                <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Left 6 columns: Typography & Actions */}
                    <div className="col-span-12 md:col-span-7 lg:col-span-6 flex flex-col justify-center text-left">
                        <h1 className="text-white mb-6 flex flex-col">
                            <span className="block text-5xl md:text-7xl font-light tracking-wide text-white leading-none">
                                Taste the
                            </span>
                            <span className="block text-6xl md:text-[100px] lg:text-[110px] font-extrabold tracking-tight mt-0 md:-mt-2 leading-none lowercase">
                                unexpected
                            </span>
                        </h1>
                        
                        <div className="mb-8 w-full max-w-[480px]">
                            <BrandLine variant="white" className="w-full" />
                        </div>

                        <p className="text-white/70 text-base md:text-lg font-light tracking-wide max-w-md mb-10 leading-relaxed">
                            Every dessert tells a story. Every bite is a moment of pure bliss at Sweet Spot System.
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <button
                                onClick={() => handleSelectType('delivery')}
                                className="bg-white text-[#1e1008] font-medium text-sm px-8 py-3.5 rounded-full hover:bg-neutral-100 transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-black/10 hover:shadow-black/20 transform hover:-translate-y-0.5 cursor-pointer active:translate-y-0"
                            >
                                Home Delivery
                                <ArrowRight size={16} strokeWidth={2} />
                            </button>
                            <button
                                onClick={() => handleSelectType('collection')}
                                className="border border-white/45 hover:border-white text-white font-medium text-sm px-8 py-3.5 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Self Collection
                            </button>
                        </div>
                        <div className="mt-6 text-center sm:text-left animate-fadeIn">
                            <button
                                onClick={() => navigate('/categories')}
                                className="text-white/80 hover:text-white text-xs font-semibold uppercase tracking-wider underline underline-offset-4 cursor-pointer transition-colors"
                            >
                                Discover Sweets Delight!
                            </button>
                        </div>
                    </div>

                    {/* Right columns left empty so that the background plate photo shows through clearly */}
                    <div className="hidden md:block md:col-span-5 lg:col-span-6"></div>
                </div>
            </main>

            {/* Elegant Minimal Footer */}
            <footer className="w-full py-8 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center text-xs text-white/40 z-20">
                <p className="mb-2 sm:mb-0">
                    &copy; 2026 Sweet Spot System, by Captoirs Studio
                </p>
                <p>
                    All rights reserved
                </p>
            </footer>

            {/* Sidebar Navigation Drawer */}
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
