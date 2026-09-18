import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { Menu, Search, User } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Landing Page Modular Sections
import HeroSection from './landing/HeroSection';
import CategorySection from './landing/CategorySection';
import HomeMadeTreatsSection from './landing/HomeMadeTreatsSection';
import DifferenceSection from './landing/DifferenceSection';
import LocalLoveSection from './landing/LocalLoveSection';
import StoreLocationSection from './landing/StoreLocationSection';
import OrderModal from './landing/OrderModal';

export default function Landing() {
    const navigate = useNavigate();
    const { 
        orderType, 
        user, 
        logout, 
        cartItemCount,
        isSearchOpen,
        setIsSearchOpen,
        setIsCartOpen,
        catalog,
        configs
    } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    const handleOrderNow = () => {
        if (orderType) {
            navigate('/categories');
        } else {
            setIsOrderModalOpen(true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans selection:bg-rose-500 selection:text-white">
            {/* Dark Plum Fixed / Absolute Header over Hero */}
            <header className="w-full absolute top-0 left-0 z-40 py-5 px-6 md:px-12 lg:px-20 flex justify-between items-center bg-transparent">
                {/* Left: Hamburger menu */}
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="text-white/90 hover:text-white transition-colors p-2 -ml-2 cursor-pointer focus:outline-none"
                    aria-label="Open navigation menu"
                >
                    <Menu size={24} strokeWidth={1.75} />
                </button>

                {/* Center: Brand Logo */}
                <div 
                    onClick={() => navigate('/')} 
                    className="cursor-pointer flex items-center justify-center select-none"
                >
                    <img 
                        src="/logo-white-sweetspot.png" 
                        alt="Sweet Spot" 
                        className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105" 
                    />
                </div>

                {/* Right: Actions (Search, Cart, User) */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)} 
                        className="text-white/90 hover:text-white transition-colors p-2 cursor-pointer focus:outline-none"
                        aria-label="Search products"
                    >
                        <Search size={20} strokeWidth={1.75} />
                    </button>

                    <button 
                        onClick={() => setIsCartOpen(true)} 
                        className="text-white/90 hover:text-white transition-colors p-2 cursor-pointer relative focus:outline-none"
                        aria-label="Open cart"
                    >
                        <img 
                            src="/images/icons/bag.png" 
                            alt="Cart" 
                            className="w-[20px] h-[20px] object-contain inline-block" 
                            style={{ filter: 'brightness(0) invert(1)' }} 
                        />
                        {cartItemCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                                {cartItemCount}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => navigate(user ? '/account' : '/login')} 
                        className="text-white/90 hover:text-white transition-colors p-2 cursor-pointer focus:outline-none"
                        aria-label="User account"
                    >
                        <User size={20} strokeWidth={1.75} />
                    </button>
                </div>
            </header>

            {/* Main Landing Sections */}
            <main className="flex-1 w-full">
                {/* 1. Hero Section */}
                <HeroSection onOrderClick={handleOrderNow} />

                {/* 2. Category Carousel Section */}
                <CategorySection categories={catalog} />

                {/* 3. Our Fine Home Made Treats Section */}
                <HomeMadeTreatsSection />

                {/* 4. The Sweet Spot Difference Accordion */}
                <DifferenceSection />

                {/* 5. Local Love Testimonials */}
                <LocalLoveSection />

                {/* 6. Where dreams Meet Cream Storefront Location */}
                <StoreLocationSection configs={configs} />
            </main>

            {/* Global Footer */}
            <Footer />

            {/* Sidebar Navigation Drawer */}
            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                cartItemCount={cartItemCount} 
                user={user} 
                logout={logout} 
            />

            {/* Order Fulfillment Selection Modal */}
            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
            />
        </div>
    );
}
