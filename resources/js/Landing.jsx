import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { MenuIcon, SearchIcon, UserIcon } from './components/HeaderIcons';

import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import HeaderCartButton from './components/HeaderCartButton';

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
        <div className="min-h-screen flex flex-col bg-[#24161b] text-neutral-900 font-sans selection:bg-rose-500 selection:text-white">
            {/* Dark Plum Fixed / Absolute Header over Hero */}
            <header className="w-full absolute top-0 left-0 z-40 py-2 sm:py-2.5 md:py-3 px-5 md:px-10 lg:px-16 flex justify-between items-center bg-transparent">
                {/* Left: Hamburger menu */}
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="text-white/90 hover:text-white transition-colors p-1.5 -ml-1.5 cursor-pointer focus:outline-none"
                    aria-label="Open navigation menu"
                >
                    <MenuIcon className="w-5 h-5" strokeWidth={2} />
                </button>

                {/* Center: Brand Logo */}
                <div 
                    onClick={() => navigate('/')} 
                    className="cursor-pointer flex items-center justify-center select-none"
                >
                    <img 
                        src="/logo-white-sweetspot.png" 
                        alt="Sweet Spot" 
                        className="h-7 sm:h-8 w-auto object-contain transition-transform hover:scale-105" 
                    />
                </div>

                {/* Right: Actions (Search, Cart, User) */}
                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)} 
                        className="text-white/90 hover:text-white transition-colors p-1.5 cursor-pointer focus:outline-none"
                        aria-label="Search products"
                    >
                        <SearchIcon className="w-[19px] h-[19px]" strokeWidth={1.75} />
                    </button>

                    <HeaderCartButton />

                    <button 
                        onClick={() => navigate(user ? '/account' : '/login')} 
                        className="text-white/90 hover:text-white transition-colors p-1.5 cursor-pointer focus:outline-none"
                        aria-label="User account"
                    >
                        <UserIcon className="w-[19px] h-[19px]" strokeWidth={1.75} />
                    </button>
                </div>
            </header>

            {/* Main Landing Sections */}
            <main className="flex-1 w-full bg-[#24161b]">
                {/* 1. Hero Section */}
                <HeroSection onOrderClick={handleOrderNow} configs={configs} />

                {/* 2. Floating White Section Container (overlaps Hero above & Footer below) */}
                <div className="w-full -mt-6 md:-mt-8 mb-[-32px] md:mb-[-48px] rounded-2xl md:rounded-3xl relative z-30 bg-white shadow-2xl overflow-hidden">
                    {/* Category Carousel Section */}
                    <CategorySection categories={catalog} />

                    {/* Fine Home Made Treats Section */}
                    <HomeMadeTreatsSection />

                    {/* The Sweet Spot Difference Accordion */}
                    <DifferenceSection />

                    {/* Local Love Testimonials */}
                    <LocalLoveSection />

                    {/* Where Dreams Meet Cream Storefront Location */}
                    <StoreLocationSection configs={configs} />
                </div>
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
