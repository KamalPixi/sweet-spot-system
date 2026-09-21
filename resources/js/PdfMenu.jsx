import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { MenuIcon, SearchIcon, UserIcon } from './components/HeaderIcons';
import { useApp } from './AppContext';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import HeaderCartButton from './components/HeaderCartButton';
import HeaderSearchButton from './components/HeaderSearchButton';

export default function PdfMenu() {
    const navigate = useNavigate();
    const { 
        cartItemCount, 
        setIsCartOpen, 
        isSearchOpen, 
        setIsSearchOpen, 
        user, 
        logout 
    } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [touchStartX, setTouchStartX] = useState(null);

    // Menu pages definition
    const menuPages = [
        {
            id: 1,
            title: "Artisanal Cakes & Slices",
            category: "Cakes & Bakes",
            items: [
                { name: "Red Velvet Cake", price: "£4.50", desc: "Velvety sponge layered with rich Madagascar vanilla cream cheese." },
                { name: "Chocolate Fudge Cake", price: "£4.00", desc: "Decadent chocolate sponge layered with smooth chocolate fudge icing." },
                { name: "Strawberry Cheesecake", price: "£5.00", desc: "Creamy baked cheesecake topped with fresh strawberry compote." },
                { name: "Classic Carrot Cake", price: "£4.20", desc: "Spiced carrot sponge with roasted walnuts and cream cheese frosting." }
            ]
        },
        {
            id: 2,
            title: "Hot Puddings & Signature Treats",
            category: "Hot Desserts",
            items: [
                { name: "Sticky Toffee Pudding", price: "£5.50", desc: "Warm date sponge drenched in rich butterscotch toffee sauce." },
                { name: "Belgian Waffle Supreme", price: "£6.50", desc: "Freshly pressed waffle with Belgian milk chocolate and strawberries." },
                { name: "Nutella Crepe Roll", price: "£5.80", desc: "Thin French crepe smothered in Nutella and crushed hazelnuts." },
                { name: "Warm Cookie Dough Skillet", price: "£6.00", desc: "Gooey chocolate chip cookie dough served with artisan vanilla gelato." }
            ]
        },
        {
            id: 3,
            title: "Handcrafted Shakes & Cold Sips",
            category: "Beverages",
            items: [
                { name: "Lotus Biscoff Freakshake", price: "£5.20", desc: "Thick gelato shake with crushed Lotus biscuits and caramel drizzle." },
                { name: "Ferrero Rocher Deluxe", price: "£5.50", desc: "Rich hazelnut chocolate shake topped with whipped cream." },
                { name: "Fresh Strawberry Mojito", price: "£4.80", desc: "Muddled mint, fresh lime, and crushed sweet strawberries." },
                { name: "Iced Spanish Latte", price: "£4.20", desc: "Espresso sweetened with condensed milk over crystal ice." }
            ]
        },
        {
            id: 4,
            title: "Specialty Coffee & Teas",
            category: "Hot Drinks",
            items: [
                { name: "Sweet Spot Signature Mocha", price: "£3.90", desc: "Single origin espresso with Belgian melted chocolate and silky milk." },
                { name: "Flat White Velvet", price: "£3.50", desc: "Double shot ristretto with velvety micro-foam milk." },
                { name: "Spiced Chai Latte", price: "£3.80", desc: "Brewed black tea with aromatic spices and steamed oat milk." },
                { name: "Luxury Hot Chocolate", price: "£4.20", desc: "Rich melted dark chocolate topped with toasted mini marshmallows." }
            ]
        }
    ];

    const totalPages = menuPages.length;

    const handlePrev = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : totalPages));
    };

    const handleNext = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : 1));
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalPages]);

    // Touch swipe handling
    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }
        setTouchStartX(null);
    };

    const activePageData = menuPages[currentPage - 1];

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#24161b] text-neutral-900 font-sans selection:bg-rose-500 selection:text-white relative">
            <div>
                {/* 1. Dark Plum Header */}
                <header className="w-full py-3 sm:py-3.5 px-5 md:px-10 lg:px-16 flex justify-between items-center bg-transparent z-40 relative">
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
                            className="h-8 sm:h-9.5 w-auto object-contain transition-transform hover:scale-105" 
                        />
                    </div>

                    {/* Right: Actions (Search, Cart, User) */}
                    <div className="flex items-center space-x-1.5 sm:space-x-3">
                        <HeaderSearchButton className="p-1.5" />

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

                {/* Top spacer */}
                <div className="w-full h-8 sm:h-12 bg-transparent" />

                {/* 2. Floating Curved White Container Layout */}
                <div className="w-full -mt-4 mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 bg-white shadow-2xl p-6 sm:p-8 md:p-12 lg:p-14">
                    <div className="max-w-6xl mx-auto w-full">
                        
                        {/* Heading Row */}
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-start gap-3 sm:gap-6 mb-8 text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
                                Our Menu
                            </h1>
                            <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed max-w-sm">
                                Browse our full menu below or download a copy to view offline.
                            </p>
                        </div>

                        {/* PDF Menu Viewer Container */}
                        <div 
                            className="relative w-full rounded-[24px] md:rounded-[30px] bg-[#d9d9d9] sm:bg-[#e4e4e4] min-h-[460px] sm:min-h-[540px] md:min-h-[640px] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden border border-neutral-200/60 shadow-inner"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Top-Right Download Floating Button */}
                            <a
                                href="/Sweet-Spot-Menu.pdf"
                                download="Sweet-Spot-Menu.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 w-11 h-11 rounded-full bg-white text-neutral-800 flex items-center justify-center shadow-md hover:bg-neutral-50 hover:shadow-lg transition-all cursor-pointer group active:scale-95"
                                title="Download PDF menu"
                                aria-label="Download PDF menu"
                            >
                                <Download size={18} className="text-neutral-700 group-hover:text-black transition-colors" />
                            </a>

                            {/* Page Content Card (Menu Sheet Preview) */}
                            <div className="w-full max-w-2xl mx-auto my-auto bg-white/95 backdrop-blur-xs rounded-[20px] sm:rounded-[24px] shadow-sm border border-black/5 p-6 sm:p-10 text-left transition-all duration-300">
                                <div className="border-b border-neutral-100 pb-4 mb-6 flex items-baseline justify-between">
                                    <div>
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#e5b582]">
                                            {activePageData.category}
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-black text-[#24161b] tracking-tight mt-0.5">
                                            {activePageData.title}
                                        </h2>
                                    </div>
                                    <span className="text-xs font-bold text-neutral-400">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    {activePageData.items.map((item, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-[#111111]">{item.name}</span>
                                                <span className="text-xs font-bold text-neutral-900 border border-neutral-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                                                    {item.price}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-4 border-t border-neutral-100 text-center">
                                    <p className="text-[11px] text-neutral-400 font-medium">
                                        All items prepared fresh daily. Ask our staff for allergy and dietary information.
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Floating Navigation Slider Pill */}
                            <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20">
                                <div className="rounded-full bg-white shadow-lg border border-neutral-200/80 px-3 py-1.5 flex items-center gap-3">
                                    {/* Prev Button: dark filled circle */}
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="w-7 h-7 rounded-full bg-[#24161b] text-white hover:bg-black flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                        aria-label="Previous page"
                                    >
                                        <ArrowLeft size={13} strokeWidth={2.5} />
                                    </button>

                                    {/* Indicator Bars */}
                                    <div className="flex items-center gap-1.5">
                                        {menuPages.map((_, idx) => {
                                            const pageNum = idx + 1;
                                            const isActive = pageNum === currentPage;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`h-[5px] rounded-full transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'w-12 sm:w-14 bg-neutral-900'
                                                            : 'w-6 sm:w-8 bg-neutral-300 hover:bg-neutral-400'
                                                    }`}
                                                    aria-label={`Go to page ${pageNum}`}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Next Button: light outlined circle */}
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-7 h-7 rounded-full border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 hover:border-neutral-900 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                        aria-label="Next page"
                                    >
                                        <ArrowRight size={13} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
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

            {/* Global Dark Footer */}
            <Footer />
        </div>
    );
}
