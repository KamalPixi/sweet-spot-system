import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import BrandLine from './components/BrandLine';
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';

export default function Shop() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { catalog, cartItemCount, user, logout } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [sortBy, setSortBy] = useState('popular');
    const [maxPrice, setMaxPrice] = useState(25);

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
                        products.push(product);
                    }
                });
            }
        });
        return products;
    }, [catalog]);

    // Calculate dynamic price range
    const maxProductPrice = useMemo(() => {
        if (allProducts.length === 0) return 25;
        return Math.ceil(Math.max(...allProducts.map(p => {
            return p.has_variations && p.variations.length > 0
                ? Math.max(...p.variations.map(v => parseFloat(v.price)))
                : parseFloat(p.base_price);
        })));
    }, [allProducts]);

    // Set default max price once products are loaded
    useEffect(() => {
        setMaxPrice(maxProductPrice);
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
                // Find if product belongs to category
                return catalog.some(cat => 
                    cat.slug === selectedCategory && 
                    cat.products && 
                    cat.products.some(cp => cp.id === p.id)
                );
            });
        }

        // Price Filter
        results = results.filter(p => {
            const price = p.has_variations && p.variations.length > 0
                ? parseFloat(p.variations[0].price)
                : parseFloat(p.base_price);
            return price <= maxPrice;
        });

        // Sorting
        if (sortBy === 'price-asc') {
            results.sort((a, b) => {
                const priceA = a.has_variations && a.variations.length > 0 ? parseFloat(a.variations[0].price) : parseFloat(a.base_price);
                const priceB = b.has_variations && b.variations.length > 0 ? parseFloat(b.variations[0].price) : parseFloat(b.base_price);
                return priceA - priceB;
            });
        } else if (sortBy === 'price-desc') {
            results.sort((a, b) => {
                const priceA = a.has_variations && a.variations.length > 0 ? parseFloat(a.variations[0].price) : parseFloat(a.base_price);
                const priceB = b.has_variations && b.variations.length > 0 ? parseFloat(b.variations[0].price) : parseFloat(b.base_price);
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

    return (
        <div className="min-h-screen bg-[#fdfaf5] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <div>
                <Header 
                    setIsMenuOpen={setIsMenuOpen}
                    setIsSearchOpen={setIsSearchOpen}
                    isSearchOpen={isSearchOpen}
                    navigate={navigate}
                    cartItemCount={cartItemCount}
                    user={user}
                />

                <div className="w-full mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-4 pt-6 pb-10 md:px-12 md:pt-8 md:pb-16" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                    <div className="max-w-7xl mx-auto w-full">
                        {/* Page Header */}
                        <div className="text-left mb-8">
                            <h1 className="text-3xl md:text-4xl font-serif text-[#8F5336] font-semibold tracking-wide">Browse Our Delicacies</h1>
                            <p className="text-neutral-500 text-xs md:text-sm font-light mt-1.5">Freshly baked, hand-crafted treats delivered straight to your door.</p>
                            <BrandLine className="w-40 mt-4" />
                        </div>

                        <div className="grid grid-cols-12 gap-8">
                            {/* Left Sidebar Filters (Desktop) */}
                            <aside className="hidden lg:col-span-3 lg:flex flex-col space-y-6 text-left border-r border-neutral-200/60 pr-8">
                                {/* Search Bar */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Search</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            placeholder="Search cakes, desserts..."
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-[12px] py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-[#8e5233] transition-colors"
                                        />
                                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Categories</label>
                                    <div className="flex flex-col space-y-1">
                                        <button 
                                            onClick={() => handleCategorySelect('all')}
                                            className={`text-left py-1.5 px-2.5 rounded-[8px] text-xs font-semibold transition-all ${selectedCategory === 'all' ? 'bg-[#8e5233]/10 text-[#8e5233]' : 'text-neutral-600 hover:bg-neutral-100'}`}
                                        >
                                            All Products ({allProducts.length})
                                        </button>
                                        {catalog.map(cat => (
                                            <button 
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat.slug)}
                                                className={`text-left py-1.5 px-2.5 rounded-[8px] text-xs font-semibold transition-all ${selectedCategory === cat.slug ? 'bg-[#8e5233]/10 text-[#8e5233]' : 'text-neutral-600 hover:bg-neutral-100'}`}
                                            >
                                                {cat.name} ({cat.products ? cat.products.length : 0})
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Filter */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Max Price</label>
                                        <span className="text-xs font-bold text-[#8e5233]">£{maxPrice.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={maxProductPrice} 
                                        step="0.5"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                                        className="w-full accent-[#8e5233] cursor-pointer"
                                    />
                                </div>

                                {/* Sorting */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Sort By</label>
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-[12px] py-2.5 px-3 text-xs focus:outline-none focus:border-[#8e5233] transition-colors"
                                    >
                                        <option value="popular">Popularity</option>
                                        <option value="price-asc">Price: Low to High</option>
                                        <option value="price-desc">Price: High to Low</option>
                                        <option value="title-asc">Name: A-Z</option>
                                        <option value="title-desc">Name: Z-A</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={resetFilters}
                                    className="w-full border border-[#8e5233] text-[#8e5233] hover:bg-[#8e5233]/5 text-xs font-bold py-2.5 rounded-[12px] transition-colors"
                                >
                                    Reset Filters
                                </button>
                            </aside>

                            {/* Right Grid Area */}
                            <main className="col-span-12 lg:col-span-9 flex flex-col space-y-6">
                                {/* Mobile Controls Row */}
                                <div className="flex lg:hidden justify-between items-center gap-4">
                                    <button 
                                        onClick={() => setShowMobileFilters(true)}
                                        className="flex items-center gap-1.5 border border-neutral-200 bg-white rounded-[12px] py-2 px-4 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                                    >
                                        <SlidersHorizontal size={14} />
                                        <span>Filters</span>
                                    </button>
                                    
                                    <div className="flex items-center gap-1.5 border border-neutral-200 bg-white rounded-[12px] py-2 px-4 text-xs font-bold text-neutral-700">
                                        <ArrowUpDown size={14} />
                                        <select 
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="bg-transparent border-none focus:outline-none text-xs text-neutral-700 font-bold"
                                        >
                                            <option value="popular">Popularity</option>
                                            <option value="price-asc">Price: Low to High</option>
                                            <option value="price-desc">Price: High to Low</option>
                                            <option value="title-asc">Name: A-Z</option>
                                            <option value="title-desc">Name: Z-A</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Active Filter Badges */}
                                {(searchQuery || selectedCategory !== 'all' || maxPrice !== maxProductPrice) && (
                                    <div className="flex flex-wrap items-center gap-2 text-left">
                                        <span className="text-xs text-neutral-400">Active Filters:</span>
                                        {searchQuery && (
                                            <span className="bg-[#8e5233]/10 text-[#8e5233] text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                                                Search: {searchQuery}
                                                <X size={12} className="cursor-pointer" onClick={() => handleSearchChange({ target: { value: '' } })} />
                                            </span>
                                        )}
                                        {selectedCategory !== 'all' && (
                                            <span className="bg-[#8e5233]/10 text-[#8e5233] text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                                                Category: {catalog.find(c => c.slug === selectedCategory)?.name}
                                                <X size={12} className="cursor-pointer" onClick={() => handleCategorySelect('all')} />
                                            </span>
                                        )}
                                        {maxPrice !== maxProductPrice && (
                                            <span className="bg-[#8e5233]/10 text-[#8e5233] text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                                                Max Price: £{maxPrice.toFixed(2)}
                                                <X size={12} className="cursor-pointer" onClick={() => setMaxPrice(maxProductPrice)} />
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Product Grid */}
                                {filteredProducts.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-[24px] border border-neutral-100 shadow-xs flex flex-col items-center justify-center space-y-4">
                                        <p className="text-neutral-400 font-light text-sm">No treats match your active filters.</p>
                                        <button 
                                            onClick={resetFilters}
                                            className="bg-[#8e5233] text-white hover:bg-[#723e25] text-xs font-bold px-5 py-2.5 rounded-[12px] transition-colors"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        {filteredProducts.map(product => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                )}
                            </main>
                        </div>
                    </div>
                </div>
            </div>

            <Footer catalog={catalog} navigate={navigate} />

            {/* Mobile Filters Modal */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 bg-black/50 flex justify-end animate-fadeIn">
                    <div className="bg-white w-full max-w-sm h-full p-6 flex flex-col justify-between text-left animate-slideIn">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                                <h3 className="font-serif text-[#8F5336] text-lg font-bold">Filters</h3>
                                <button onClick={() => setShowMobileFilters(false)} className="text-neutral-400 hover:text-neutral-800">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Search</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        placeholder="Search cakes, desserts..."
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-[12px] py-2.5 pl-9 pr-4 text-xs"
                                    />
                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Categories</label>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => handleCategorySelect('all')}
                                        className={`py-1.5 px-3 rounded-[8px] text-xs font-semibold ${selectedCategory === 'all' ? 'bg-[#8e5233] text-white' : 'bg-neutral-100 text-neutral-600'}`}
                                    >
                                        All ({allProducts.length})
                                    </button>
                                    {catalog.map(cat => (
                                        <button 
                                            key={cat.id}
                                            onClick={() => handleCategorySelect(cat.slug)}
                                            className={`py-1.5 px-3 rounded-[8px] text-xs font-semibold ${selectedCategory === cat.slug ? 'bg-[#8e5233] text-white' : 'bg-neutral-100 text-neutral-600'}`}
                                        >
                                            {cat.name} ({cat.products ? cat.products.length : 0})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Max Price</label>
                                    <span className="text-xs font-bold text-[#8e5233]">£{maxPrice.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={maxProductPrice} 
                                    step="0.5"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                                    className="w-full accent-[#8e5233]"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 border-t border-neutral-100 pt-4 mt-6">
                            <button 
                                onClick={resetFilters}
                                className="flex-1 border border-neutral-200 text-neutral-500 text-xs font-bold py-3 rounded-[12px]"
                            >
                                Reset
                            </button>
                            <button 
                                onClick={() => setShowMobileFilters(false)}
                                className="flex-1 bg-[#8e5233] text-white text-xs font-bold py-3 rounded-[12px]"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
