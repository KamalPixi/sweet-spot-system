import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './AppContext';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import HeaderCartButton from './components/HeaderCartButton';
import { MenuIcon, SearchIcon, UserIcon } from './components/HeaderIcons';
import { SlidersHorizontal, ArrowUpDown, X, Sparkles } from 'lucide-react';

export default function Shop() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { catalog, cartItemCount, user, logout, isSearchOpen, setIsSearchOpen } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPriceFilter, setShowPriceFilter] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [sortBy, setSortBy] = useState('popular');
    const [maxPrice, setMaxPrice] = useState(50);

    // Synchronize URL search param with state
    useEffect(() => {
        const query = searchParams.get('search') || '';
        setSearchQuery(query);
    }, [searchParams]);

    // Flatten catalog to get all unique products
    const allProducts = useMemo(() => {
        const products = [];
        const seenIds = new Set();
        catalog.forEach(category => {
            if (category.products) {
                category.products.forEach(product => {
                    if (!seenIds.has(product.id)) {
                        seenIds.add(product.id);
                        products.push({
                            ...product,
                            category_name: category.name,
                            category_slug: category.slug
                        });
                    }
                });
            }
        });
        return products;
    }, [catalog]);

    // Calculate maximum product price from catalog
    const maxProductPrice = useMemo(() => {
        if (allProducts.length === 0) return 50;
        const prices = allProducts.map(p => {
            return p.has_variations && p.variations && p.variations.length > 0
                ? Math.max(...p.variations.map(v => parseFloat(v.price || 0)))
                : parseFloat(p.base_price || 0);
        });
        return Math.ceil(Math.max(...prices, 20));
    }, [allProducts]);

    // Initialize max price when catalog is loaded
    useEffect(() => {
        if (maxProductPrice > 0) {
            setMaxPrice(maxProductPrice);
        }
    }, [maxProductPrice]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let results = [...allProducts];

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(p => 
                p.name.toLowerCase().includes(query) || 
                (p.description && p.description.toLowerCase().includes(query))
            );
        }

        // Category Filter
        if (selectedCategory !== 'all') {
            results = results.filter(p => {
                return p.category_slug === selectedCategory || 
                    catalog.some(cat => 
                        cat.slug === selectedCategory && 
                        cat.products && 
                        cat.products.some(cp => cp.id === p.id)
                    );
            });
        }

        // Price Filter
        results = results.filter(p => {
            const price = p.has_variations && p.variations && p.variations.length > 0
                ? parseFloat(p.variations[0].price || 0)
                : parseFloat(p.base_price || 0);
            return price <= maxPrice;
        });

        // Sorting
        if (sortBy === 'price-asc') {
            results.sort((a, b) => {
                const priceA = a.has_variations && a.variations && a.variations.length > 0 
                    ? parseFloat(a.variations[0].price) 
                    : parseFloat(a.base_price || 0);
                const priceB = b.has_variations && b.variations && b.variations.length > 0 
                    ? parseFloat(b.variations[0].price) 
                    : parseFloat(b.base_price || 0);
                return priceA - priceB;
            });
        } else if (sortBy === 'price-desc') {
            results.sort((a, b) => {
                const priceA = a.has_variations && a.variations && a.variations.length > 0 
                    ? parseFloat(a.variations[0].price) 
                    : parseFloat(a.base_price || 0);
                const priceB = b.has_variations && b.variations && b.variations.length > 0 
                    ? parseFloat(b.variations[0].price) 
                    : parseFloat(b.base_price || 0);
                return priceB - priceA;
            });
        } else if (sortBy === 'title-asc') {
            results.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'title-desc') {
            results.sort((a, b) => b.name.localeCompare(a.name));
        }

        return results;
    }, [allProducts, searchQuery, selectedCategory, maxPrice, sortBy, catalog]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setSearchParams(prev => {
            if (val) prev.set('search', val);
            else prev.delete('search');
            return prev;
        });
    };

    const handleCategorySelect = (slug) => {
        setSelectedCategory(slug);
        setSearchParams(prev => {
            if (slug !== 'all') prev.set('category', slug);
            else prev.delete('category');
            return prev;
        });
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setMaxPrice(maxProductPrice);
        setSortBy('popular');
        setSearchParams({});
    };

    const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || maxPrice < maxProductPrice || sortBy !== 'popular';

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#24161b] text-neutral-900 font-sans selection:bg-rose-500 selection:text-white relative">
            <div>
                {/* 1. Header with bespoke icons */}
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

                {/* Top spacer */}
                <div className="w-full h-8 sm:h-12 bg-transparent" />

                {/* 2. Floating Curved White Container Layout */}
                <div className="w-full -mt-4 mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 bg-white shadow-2xl p-6 sm:p-8 md:p-12 lg:p-14">
                    <div className="max-w-7xl mx-auto w-full">
                        
                        {/* Page Header & Live Search Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 text-left">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Sparkles size={16} className="text-[#e5b582]" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#24161b]/60">
                                        Artisanal Bakery & Desserts
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
                                    All Treats & Delicacies
                                </h1>
                                <p className="text-xs sm:text-sm text-neutral-500 font-light mt-1.5 leading-relaxed max-w-xl">
                                    Freshly baked daily with premium ingredients. Order your favorites for direct delivery or store collection.
                                </p>
                            </div>

                            {/* Inline Live Search Box */}
                            <div className="w-full lg:w-80 relative">
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Search cakes, puddings, shakes..."
                                    className="w-full bg-[#faf7f2] border border-neutral-200/80 rounded-full py-2.5 pl-10 pr-9 text-xs sm:text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#24161b] focus:bg-white transition-all shadow-2xs"
                                />
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                    <SearchIcon className="w-4 h-4" strokeWidth={2} />
                                </div>
                                {searchQuery && (
                                    <button 
                                        type="button"
                                        onClick={() => { setSearchQuery(''); setSearchParams(prev => { prev.delete('search'); return prev; }); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 transition-colors p-0.5 cursor-pointer"
                                        aria-label="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category Selector Horizontal Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 mb-6 text-left select-none">
                            <button
                                type="button"
                                onClick={() => handleCategorySelect('all')}
                                className={`px-4.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center ${
                                    selectedCategory === 'all'
                                        ? 'bg-[#24161b] text-[#e5b582] shadow-xs border border-[#24161b]'
                                        : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400'
                                }`}
                            >
                                All Treats ({allProducts.length})
                            </button>
                            {catalog.map((cat) => {
                                const count = cat.products ? cat.products.length : 0;
                                const isSelected = selectedCategory === cat.slug;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleCategorySelect(cat.slug)}
                                        className={`px-4.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center ${
                                            isSelected
                                                ? 'bg-[#24161b] text-[#e5b582] shadow-xs border border-[#24161b]'
                                                : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400'
                                        }`}
                                    >
                                        {cat.name} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* Filter Toolbar: Results Counter + Price Filter + Sort Dropdown */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-8 border-b border-neutral-100 text-left">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-neutral-900">
                                    Showing <span className="text-[#24161b]">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'treat' : 'treats'}
                                </span>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <X size={12} />
                                        <span>Clear filters</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5 sm:gap-3">
                                {/* Price Filter Pill Toggle */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowPriceFilter(!showPriceFilter)}
                                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                            maxPrice < maxProductPrice || showPriceFilter
                                                ? 'bg-[#24161b] text-[#e5b582] border-[#24161b]'
                                                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                                        }`}
                                    >
                                        <SlidersHorizontal size={12} />
                                        <span>Max: £{maxPrice.toFixed(2)}</span>
                                    </button>

                                    {/* Price Popover Panel */}
                                    {showPriceFilter && (
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-neutral-200/80 p-4 z-40 text-left space-y-2 animate-fadeIn">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-xs font-bold text-neutral-800">Filter by Price</span>
                                                <span className="text-xs font-bold text-neutral-900">£{maxPrice.toFixed(2)}</span>
                                            </div>
                                            <input 
                                                type="range"
                                                min="0"
                                                max={maxProductPrice}
                                                step="0.5"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                                                className="w-full accent-[#24161b] cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[10px] text-neutral-400">
                                                <span>£0.00</span>
                                                <span>£{maxProductPrice.toFixed(2)}</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPriceFilter(false)}
                                                className="w-full mt-2 bg-[#24161b] text-[#e5b582] hover:bg-black rounded-full py-1 text-xs font-bold cursor-pointer transition-colors"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Sort Dropdown Pill */}
                                <div className="flex items-center gap-1.5 border border-neutral-200 rounded-full px-3 py-1 bg-white hover:border-neutral-400 transition-colors">
                                    <ArrowUpDown size={12} className="text-neutral-500 shrink-0" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer pr-1"
                                        aria-label="Sort products"
                                    >
                                        <option value="popular">Popular Treats</option>
                                        <option value="price-asc">Price: Low to High</option>
                                        <option value="price-desc">Price: High to Low</option>
                                        <option value="title-asc">Name: A to Z</option>
                                        <option value="title-desc">Name: Z to A</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Product Grid Showcase */}
                        {filteredProducts.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3.5 max-w-md mx-auto">
                                <div className="w-16 h-16 rounded-full bg-[#faf7f2] border border-neutral-200/80 flex items-center justify-center text-neutral-400">
                                    <SearchIcon className="w-7 h-7" strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-neutral-900 text-lg">No treats found</h3>
                                    <p className="text-xs text-neutral-400 font-light leading-relaxed">
                                        We couldn't find any items matching your selected criteria. Try adjusting your search query, price limit, or category filter.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 rounded-full py-2.5 px-6 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Drawer */}
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
