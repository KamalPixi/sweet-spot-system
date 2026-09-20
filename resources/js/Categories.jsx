import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from './AppContext';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import ProductCard from './components/ProductCard';
import HeaderCartButton from './components/HeaderCartButton';
import { MenuIcon, SearchIcon, UserIcon } from './components/HeaderIcons';
import { ArrowLeft } from 'lucide-react';

const CATALOG_CACHE_KEY = 'cached_menu_catalog_v2';

export default function Categories() {
    const navigate = useNavigate();
    const { categorySlug } = useParams();
    const { 
        cartItemCount,
        user,
        logout,
        isSearchOpen,
        setIsSearchOpen,
        setIsCartOpen,
        searchTerm,
        setSearchTerm
    } = useApp();

    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategorySlug, setActiveCategorySlug] = useState(categorySlug || 'all');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Sync active category slug with URL parameter
    useEffect(() => {
        if (categorySlug) {
            setActiveCategorySlug(categorySlug);
        } else {
            setActiveCategorySlug('all');
        }
    }, [categorySlug]);

    // Fetch the menu catalog with session caching
    useEffect(() => {
        const cachedCatalog = sessionStorage.getItem(CATALOG_CACHE_KEY);
        if (cachedCatalog) {
            try {
                const parsed = JSON.parse(cachedCatalog);
                setCatalog(parsed);
                setLoading(false);
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }

        fetch('/api/menu-catalog')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    setCatalog(res.data);
                    sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(res.data));
                }
            })
            .catch(err => console.error("Error loading menu catalog:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleCategorySelect = (slug) => {
        setActiveCategorySlug(slug);
        if (slug === 'all') {
            window.history.pushState(null, '', '/categories');
        } else {
            window.history.pushState(null, '', `/categories/${slug}`);
        }
    };

    // Calculate products to display
    const getProductsToDisplay = () => {
        let list = [];
        if (activeCategorySlug === 'all') {
            catalog.forEach(cat => {
                if (cat.products) {
                    cat.products.forEach(p => {
                        if (!list.some(existing => existing.id === p.id)) {
                            list.push(p);
                        }
                    });
                }
            });
        } else {
            const activeCat = catalog.find(c => c.slug === activeCategorySlug);
            list = activeCat?.products ? [...activeCat.products] : [];
        }

        // Apply global search filter if user searched
        if (searchTerm && searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(p => 
                p.name.toLowerCase().includes(term) || 
                (p.description && p.description.toLowerCase().includes(term))
            );
        }

        return list;
    };

    const productsToDisplay = getProductsToDisplay();
    const activeCategory = catalog.find(c => c.slug === activeCategorySlug);
    const activeCategoryTitle = activeCategorySlug === 'all' 
        ? 'All Items' 
        : (activeCategory ? activeCategory.name : 'Category');

    if (loading && catalog.length === 0) {
        return (
            <div className="min-h-screen bg-[#24161b] flex flex-col items-center justify-center text-white/80 font-semibold tracking-wider text-xs">
                <div className="animate-spin border-2 border-[#e5b582] border-t-transparent h-7 w-7 rounded-full mb-3"></div>
                <span>Loading Sweet Spot Delights...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#24161b] text-neutral-900 font-sans selection:bg-rose-500 selection:text-white relative">
            <div>
                {/* 1. Dark Plum Fixed / Absolute Brand Header */}
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

                {/* Top spacer / header glow */}
                <div className="w-full h-8 sm:h-12 bg-transparent" />

                {/* 2. Floating Curved White Container Layout */}
                <div className="w-full -mt-4 mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 bg-white shadow-2xl p-5 sm:p-7 md:p-10 lg:p-12">
                    <div className="max-w-7xl mx-auto w-full">

                        {/* Search Filter Header (if searching) */}
                        {searchTerm && (
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-neutral-200 text-left">
                                <p className="text-sm font-semibold text-neutral-800">
                                    Search results for "<span className="text-rose-600">{searchTerm}</span>"
                                </p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-xs text-neutral-400 hover:text-neutral-700 underline cursor-pointer"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}

                        {/* 2-Column Responsive Layout matching User Mockup */}
                        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                            
                            {/* Left Column: Categories Sidebar */}
                            <aside className="w-full md:w-52 lg:w-56 shrink-0 text-left">
                                <h2 className="text-xl sm:text-[22px] font-black text-neutral-900 tracking-tight">
                                    Category
                                </h2>
                                <div className="w-full h-[1px] bg-neutral-200 mt-2.5 mb-4" />

                                {/* Category Pills (Horizontal on mobile, vertical stack on desktop) */}
                                <div className="flex md:flex-col gap-2 overflow-x-auto scrollbar-none pb-2 md:pb-0">
                                    <button
                                        onClick={() => handleCategorySelect('all')}
                                        className={`px-4.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center select-none ${
                                            activeCategorySlug === 'all'
                                                ? 'bg-[#1c1410] text-[#e5b582] shadow-xs border border-[#1c1410]'
                                                : 'bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-900 hover:text-neutral-950'
                                        }`}
                                    >
                                        All Items
                                    </button>

                                    {catalog.map(cat => {
                                        const isActive = activeCategorySlug === cat.slug;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat.slug)}
                                                className={`px-4.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center select-none ${
                                                    isActive
                                                        ? 'bg-[#1c1410] text-[#e5b582] shadow-xs border border-[#1c1410]'
                                                        : 'bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-900 hover:text-neutral-950'
                                                }`}
                                            >
                                                {cat.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            {/* Right Column: Category Title & 3-Column Products Grid */}
                            <main className="flex-1 min-w-0 w-full text-left">
                                {/* Header Row */}
                                <div className="mb-6">
                                    <div className="flex items-baseline justify-between mb-2.5">
                                        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                                            {activeCategoryTitle}
                                        </h1>
                                        <span className="text-xs text-neutral-400 font-medium">
                                            {productsToDisplay.length} {productsToDisplay.length === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>
                                    <div className="w-full h-[1px] bg-neutral-200" />
                                </div>

                                {/* Products Grid */}
                                {productsToDisplay.length === 0 ? (
                                    <div className="text-center py-20 text-neutral-400 font-light text-sm bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                                        No sweet items found in this category.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                                        {productsToDisplay.map(product => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                )}
                            </main>

                        </div>

                    </div>
                </div>
            </div>

            {/* 3. Global Dark Footer (overlapped seamlessly by white container) */}
            <Footer />

            {/* Navigation Drawer */}
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
