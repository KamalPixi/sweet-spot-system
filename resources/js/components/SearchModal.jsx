import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight, ArrowRight } from 'lucide-react';
import { useApp } from '../AppContext';

const formatImageUrl = (item) => {
    if (!item) return '/images/placeholder.svg';
    if (item.images && item.images.length > 0) {
        const primary = item.images.find(img => img.is_primary);
        const url = primary ? primary.url : item.images[0].url;
        return url.startsWith('http') ? url : `/storage/${url.replace(/^\/?(storage\/)+/, '')}`;
    }
    if (item.image) {
        return item.image.startsWith('http') ? item.image : `/storage/${item.image.replace(/^\/?(storage\/)+/, '')}`;
    }
    return '/images/placeholder.svg';
};

const POPULAR_SEARCHES = ['Red Velvet', 'Cheesecake', 'Chocolate Fudge', 'Carrot Cake', 'Cookie Dough'];

export default function SearchModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { catalog, openProductModal } = useApp();

    const [query, setQuery] = useState('');
    const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
    const inputRef = useRef(null);

    const [isMounted, setIsMounted] = useState(false);

    // Focus input on open & manage escape key & smooth entrance
    useEffect(() => {
        if (isOpen) {
            const raf = requestAnimationFrame(() => setIsMounted(true));
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 60);

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';

            return () => {
                cancelAnimationFrame(raf);
                clearTimeout(timer);
                window.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
            };
        } else {
            setIsMounted(false);
        }
    }, [isOpen, onClose]);

    // Flatten all products
    const allProducts = useMemo(() => {
        if (!catalog || !Array.isArray(catalog)) return [];
        const list = [];
        catalog.forEach(category => {
            if (category.products && Array.isArray(category.products)) {
                category.products.forEach(product => {
                    if (!list.some(p => p.id === product.id)) {
                        list.push({
                            ...product,
                            categoryName: category.name,
                            categorySlug: category.slug
                        });
                    }
                });
            }
        });
        return list;
    }, [catalog]);

    // Filter products
    const filteredResults = useMemo(() => {
        let results = allProducts;

        if (selectedCategorySlug !== 'all') {
            results = results.filter(p => p.categorySlug === selectedCategorySlug);
        }

        const q = query.trim().toLowerCase();
        if (q) {
            results = results.filter(p => {
                const inName = p.name?.toLowerCase().includes(q);
                const inDesc = p.description?.toLowerCase().includes(q);
                const inCat = p.categoryName?.toLowerCase().includes(q);
                return inName || inDesc || inCat;
            });
        }

        return results;
    }, [allProducts, query, selectedCategorySlug]);

    const handleSelectProduct = (product) => {
        openProductModal(product);
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const term = query.trim();
        if (term) {
            navigate(`/products?search=${encodeURIComponent(term)}`);
            onClose();
        }
    };

    if (!isOpen) return null;

    const isSearching = Boolean(query.trim() || selectedCategorySlug !== 'all');

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 pt-16 sm:pt-24 overflow-y-auto select-none">
            {/* Ambient Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300 ease-out ${
                    isMounted ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Clean Floating Search Dialog */}
            <div 
                className={`relative z-10 w-full max-w-2xl md:max-w-3xl bg-[#24161b] text-white border border-white/10 rounded-[28px] shadow-2xl shadow-black/70 overflow-hidden flex flex-col max-h-[80vh] transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
                    isMounted 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 -translate-y-2'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Search Input Row ── */}
                <form onSubmit={handleSubmit} className="flex items-center px-5 py-4 border-b border-white/10 gap-3.5">
                    <Search size={18} className="text-[#e5b582] shrink-0" />
                    
                    <input 
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search sweet treats..."
                        className="bg-transparent text-white placeholder-white/35 text-base w-full focus:outline-none font-normal"
                    />

                    {query && (
                        <button 
                            type="button"
                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                            className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={15} />
                        </button>
                    )}

                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-1 text-xs text-white/50 hover:text-white px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors ml-1 cursor-pointer shrink-0"
                        title="Close search"
                    >
                        <X size={14} />
                        <span className="hidden sm:inline">Close</span>
                    </button>
                </form>

                {/* ── Minimalist Category Bar ── */}
                <div className="flex items-center gap-1 px-5 py-2.5 border-b border-white/5 overflow-x-auto scrollbar-none text-xs">
                    <button
                        type="button"
                        onClick={() => setSelectedCategorySlug('all')}
                        className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                            selectedCategorySlug === 'all'
                                ? 'bg-[#e5b582] text-[#24161b] font-bold'
                                : 'text-white/60 hover:text-white'
                        }`}
                    >
                        All
                    </button>

                    {catalog?.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategorySlug(selectedCategorySlug === cat.slug ? 'all' : cat.slug)}
                            className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer whitespace-nowrap ${
                                selectedCategorySlug === cat.slug
                                    ? 'bg-[#e5b582] text-[#24161b] font-bold'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* ── Results or Clean Discovery List ── */}
                <div className="overflow-y-auto flex-1 p-2 sm:p-3 custom-scrollbar divide-y divide-white/5 max-h-[50vh]">
                    {isSearching ? (
                        filteredResults.length > 0 ? (
                            <div className="space-y-1">
                                {filteredResults.map(product => {
                                    const price = parseFloat(product.base_price) === 0 && product.variations?.length
                                        ? parseFloat(product.variations[0].price)
                                        : parseFloat(product.base_price || 0);

                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => handleSelectProduct(product)}
                                            className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <img 
                                                    src={formatImageUrl(product)}
                                                    alt={product.name}
                                                    className="w-12 h-12 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                                                    onError={(e) => { e.target.src = "/images/placeholder.svg"; }}
                                                />
                                                <div className="min-w-0">
                                                    <h4 className="font-serif font-bold text-sm text-white group-hover:text-[#e5b582] transition-colors truncate">
                                                        {product.name}
                                                    </h4>
                                                    <p className="text-xs text-white/40 truncate mt-0.5">
                                                        {product.categoryName || 'Bakery Fresh'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 pl-3">
                                                <span className="font-serif font-bold text-sm text-[#e5b582]">
                                                    £{price.toFixed(2)}
                                                </span>
                                                <ChevronRight size={15} className="text-white/25 group-hover:text-[#e5b582] transition-colors" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-white/40 text-xs">
                                No treats found matching "{query}".
                            </div>
                        )
                    ) : (
                        /* Clean Empty State: Simple subtle suggestions */
                        <div className="p-4 space-y-4">
                            <div>
                                <span className="text-[11px] uppercase tracking-wider text-white/40 font-bold block mb-2.5">
                                    Popular Picks
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {POPULAR_SEARCHES.map(item => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setQuery(item)}
                                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/80 border border-white/10 hover:border-[#e5b582]/40 transition-colors cursor-pointer"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/5">
                                <span className="text-[11px] uppercase tracking-wider text-white/40 font-bold block mb-2.5">
                                    Featured Treats
                                </span>
                                <div className="space-y-1">
                                    {allProducts.slice(0, 3).map(product => {
                                        const price = parseFloat(product.base_price) === 0 && product.variations?.length
                                            ? parseFloat(product.variations[0].price)
                                            : parseFloat(product.base_price || 0);

                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => handleSelectProduct(product)}
                                                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <img 
                                                        src={formatImageUrl(product)}
                                                        alt={product.name}
                                                        className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                                                        onError={(e) => { e.target.src = "/images/placeholder.svg"; }}
                                                    />
                                                    <div className="min-w-0">
                                                        <h5 className="font-bold text-xs text-white group-hover:text-[#e5b582] truncate transition-colors">
                                                            {product.name}
                                                        </h5>
                                                        <p className="text-[11px] text-white/40 truncate">
                                                            {product.categoryName}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className="font-bold text-xs text-[#e5b582] shrink-0 pl-2">
                                                    £{price.toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Minimal Footer ── */}
                {isSearching && filteredResults.length > 0 && (
                    <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between text-xs bg-black/20">
                        <span className="text-white/40 text-[11px]">
                            {filteredResults.length} treats found
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                if (query.trim()) {
                                    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
                                } else {
                                    navigate('/products');
                                }
                                onClose();
                            }}
                            className="text-xs font-bold text-[#e5b582] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <span>View all in menu</span>
                            <ArrowRight size={12} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
