import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useApp } from './AppContext';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import ProductCard from './components/ProductCard';
import HeaderCartButton from './components/HeaderCartButton';
import HeaderSearchButton from './components/HeaderSearchButton';
import { MenuIcon, SearchIcon, UserIcon, CartBagIcon } from './components/HeaderIcons';
import { SlidersHorizontal, ArrowUpDown, X, UtensilsCrossed, Package, Plus, Minus, Trash2, Check, Sparkles } from 'lucide-react';

const CATALOG_CACHE_KEY = 'cached_menu_catalog_v2';

const resolveItemImageUrl = (product, variation = null) => {
    if (!product && !variation) return '/images/placeholder.svg';
    const resolve = (url) => {
        if (!url) return '/images/placeholder.svg';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const clean = url.replace(/^\/?(storage\/)+/, '');
        return `/storage/${clean}`;
    };
    if (variation?.images && variation.images.length > 0) {
        const primary = variation.images.find(img => img.is_primary);
        return resolve(primary ? primary.url : variation.images[0].url);
    }
    if (variation?.image) {
        return resolve(variation.image);
    }
    if (product?.images && product.images.length > 0) {
        const primary = product.images.find(img => img.is_primary);
        const u = primary ? primary.url : product.images[0].url;
        return resolve(u);
    }
    if (product?.image) {
        return resolve(product.image);
    }
    return '/images/placeholder.svg';
};

const resolveProductImageUrl = (product) => resolveItemImageUrl(product);

export default function Categories() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { categorySlug } = useParams();

    const { 
        cartItemCount,
        addBoxToCart,
        user,
        logout,
        isSearchOpen,
        setIsSearchOpen,
        searchTerm,
        setSearchTerm,
        tableNumber,
        orderType,
        clearDiningTable,
        configs
    } = useApp();

    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPriceFilter, setShowPriceFilter] = useState(false);

    const isProductsRoute = location.pathname.startsWith('/products');

    // Category determination
    const initialCategory = categorySlug || searchParams.get('category') || 'all';
    const [activeCategorySlug, setActiveCategorySlug] = useState(initialCategory);

    // Box of (X) Mix & Match state
    const [selectedBoxOption, setSelectedBoxOption] = useState(null);
    const [boxTrayItems, setBoxTrayItems] = useState({}); // { [itemKey]: { key, product, variation, count } }
    const [boxVariationProduct, setBoxVariationProduct] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || searchTerm || '');
    const [sortBy, setSortBy] = useState('popular');
    const [maxPrice, setMaxPrice] = useState(50);

    // Sync active category slug when URL changes & reset box tray
    useEffect(() => {
        const catFromUrl = categorySlug || searchParams.get('category') || 'all';
        setActiveCategorySlug(catFromUrl);
        setSelectedBoxOption(null);
        setBoxTrayItems({});
        setBoxVariationProduct(null);
    }, [categorySlug, searchParams]);

    // Sync global search term if updated from overlay
    useEffect(() => {
        if (searchTerm) {
            setSearchQuery(searchTerm);
        }
    }, [searchTerm]);

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

    // Calculate maximum price across all products
    const maxProductPrice = useMemo(() => {
        if (catalog.length === 0) return 50;
        let max = 20;
        catalog.forEach(cat => {
            if (cat.products) {
                cat.products.forEach(p => {
                    const price = p.has_variations && p.variations && p.variations.length > 0
                        ? Math.max(...p.variations.map(v => parseFloat(v.price || 0)))
                        : parseFloat(p.base_price || 0);
                    if (price > max) max = price;
                });
            }
        });
        return Math.ceil(max);
    }, [catalog]);

    useEffect(() => {
        if (maxProductPrice > 0) {
            setMaxPrice(maxProductPrice);
        }
    }, [maxProductPrice]);

    const handleCategorySelect = (slug) => {
        setActiveCategorySlug(slug);
        if (isProductsRoute) {
            setSearchParams(prev => {
                if (slug !== 'all') prev.set('category', slug);
                else prev.delete('category');
                return prev;
            });
        } else {
            if (slug === 'all') {
                navigate('/categories');
            } else {
                navigate(`/categories/${slug}`);
            }
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (isProductsRoute) {
            setSearchParams(prev => {
                if (val) prev.set('search', val);
                else prev.delete('search');
                return prev;
            });
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSearchTerm('');
        setMaxPrice(maxProductPrice);
        setSortBy('popular');
        if (isProductsRoute) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams();
                if (activeCategorySlug !== 'all') newParams.set('category', activeCategorySlug);
                return newParams;
            });
        }
    };

    // Calculate filtered and sorted products
    const productsToDisplay = useMemo(() => {
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

        // Search Filter
        if (searchQuery && searchQuery.trim()) {
            const term = searchQuery.toLowerCase();
            list = list.filter(p => 
                p.name.toLowerCase().includes(term) || 
                (p.description && p.description.toLowerCase().includes(term))
            );
        }

        // Price Filter
        list = list.filter(p => {
            const price = p.has_variations && p.variations && p.variations.length > 0
                ? parseFloat(p.variations[0].price || 0)
                : parseFloat(p.base_price || 0);
            return price <= maxPrice;
        });

        // Sorting
        if (sortBy === 'price-asc') {
            list.sort((a, b) => {
                const priceA = a.has_variations && a.variations && a.variations.length > 0 ? parseFloat(a.variations[0].price) : parseFloat(a.base_price || 0);
                const priceB = b.has_variations && b.variations && b.variations.length > 0 ? parseFloat(b.variations[0].price) : parseFloat(b.base_price || 0);
                return priceA - priceB;
            });
        } else if (sortBy === 'price-desc') {
            list.sort((a, b) => {
                const priceA = a.has_variations && a.variations && a.variations.length > 0 ? parseFloat(a.variations[0].price) : parseFloat(a.base_price || 0);
                const priceB = b.has_variations && b.variations && b.variations.length > 0 ? parseFloat(b.variations[0].price) : parseFloat(b.base_price || 0);
                return priceB - priceA;
            });
        } else if (sortBy === 'title-asc') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'title-desc') {
            list.sort((a, b) => b.name.localeCompare(a.name));
        }

        return list;
    }, [catalog, activeCategorySlug, searchQuery, maxPrice, sortBy]);

    const activeCategory = catalog.find(c => c.slug === activeCategorySlug);
    const activeCategoryTitle = activeCategorySlug === 'all' 
        ? 'All Items' 
        : (activeCategory ? activeCategory.name : 'Category');

    const hasActiveFilters = searchQuery !== '' || maxPrice < maxProductPrice || sortBy !== 'popular';

    // Box Selection & Tray helpers
    const currentBoxCount = useMemo(() => {
        return Object.values(boxTrayItems).reduce((sum, item) => sum + item.count, 0);
    }, [boxTrayItems]);

    const isBoxFull = selectedBoxOption ? currentBoxCount >= selectedBoxOption.size : false;

    const flatBoxItems = useMemo(() => {
        const list = [];
        Object.values(boxTrayItems).forEach(item => {
            for (let i = 0; i < item.count; i++) {
                list.push(item);
            }
        });
        return list;
    }, [boxTrayItems]);

    const getProductBoxCount = (productId) => {
        return Object.values(boxTrayItems)
            .filter(item => item.product.id === productId)
            .reduce((sum, item) => sum + item.count, 0);
    };

    const handleSelectBoxMode = (option) => {
        setSelectedBoxOption(option);
        setBoxTrayItems({});
        setBoxVariationProduct(null);
    };

    const handleAddBoxItem = (product, variation = null) => {
        if (!selectedBoxOption) return;
        if (currentBoxCount >= selectedBoxOption.size) return;

        // If product has multiple variations and none was explicitly passed, open picker modal
        if (!variation && product.has_variations && product.variations && product.variations.length > 1) {
            setBoxVariationProduct(product);
            return;
        }

        const chosenVariation = variation || (product.has_variations && product.variations && product.variations.length > 0 ? product.variations[0] : null);
        const itemKey = chosenVariation ? `${product.id}-${chosenVariation.id}` : `${product.id}`;

        setBoxTrayItems(prev => {
            const current = prev[itemKey]?.count || 0;
            return {
                ...prev,
                [itemKey]: {
                    key: itemKey,
                    product,
                    variation: chosenVariation,
                    count: current + 1
                }
            };
        });
    };

    const handleRemoveBoxItem = (itemKeyOrProductId, variationId = null) => {
        setBoxTrayItems(prev => {
            let targetKey = itemKeyOrProductId;
            if (variationId) {
                targetKey = `${itemKeyOrProductId}-${variationId}`;
            }

            if (!prev[targetKey]) {
                const matchingKeys = Object.keys(prev).filter(k => prev[k].product.id === itemKeyOrProductId);
                if (matchingKeys.length === 0) return prev;
                targetKey = matchingKeys[matchingKeys.length - 1];
            }

            const current = prev[targetKey]?.count || 0;
            if (current <= 1) {
                const next = { ...prev };
                delete next[targetKey];
                return next;
            }
            return {
                ...prev,
                [targetKey]: {
                    ...prev[targetKey],
                    count: current - 1
                }
            };
        });
    };

    const handleAddCurrentBoxToCart = () => {
        if (!selectedBoxOption || !activeCategory) return;
        if (currentBoxCount !== selectedBoxOption.size) return;

        const boxItems = Object.values(boxTrayItems).map(item => {
            const p = item.product;
            const v = item.variation;
            const img = resolveItemImageUrl(p, v);
            return {
                product_id: p.id,
                product_variation_id: v ? v.id : null,
                variation_name: v ? v.name : null,
                product_name: p.name,
                quantity: item.count,
                image: img
            };
        });

        addBoxToCart({
            category: activeCategory,
            boxOption: selectedBoxOption,
            boxItems: boxItems,
            quantity: 1
        });

        setBoxTrayItems({});
        setBoxVariationProduct(null);
    };

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
                {/* 1. Dark Plum Header */}
                <header className="w-full py-3 sm:py-3.5 px-5 md:px-10 lg:px-16 grid grid-cols-3 items-center bg-transparent z-40 relative">
                    {/* Left: Hamburger menu */}
                    <div className="flex items-center justify-start">
                        <button 
                            onClick={() => setIsMenuOpen(true)} 
                            className="text-white/90 hover:text-white transition-colors p-1.5 -ml-1.5 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="Open navigation menu"
                        >
                            <MenuIcon className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Center: Brand Logo (Middle 1/3) */}
                    <div className="flex items-center justify-center">
                        <div 
                            onClick={() => navigate('/')} 
                            className="cursor-pointer flex items-center justify-center select-none"
                        >
                            {configs?.store_logo_white ? (
                                <img 
                                    src={configs.store_logo_white} 
                                    alt={configs?.store_name || "Sweet Spot"} 
                                    className="h-7 sm:h-8 w-auto object-contain transition-transform hover:scale-105" 
                                />
                            ) : configs?.store_name ? (
                                <span className="text-white font-black text-lg tracking-tight hover:opacity-90 transition-opacity">
                                    {configs.store_name}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {/* Right: Actions (Search, Cart, User) */}
                    <div className="flex items-center justify-end space-x-1 sm:space-x-2 md:space-x-3">
                        <HeaderSearchButton className="p-1.5" />

                        <HeaderCartButton />

                        <button 
                            onClick={() => navigate(user ? '/account' : '/login')} 
                            className="text-white/90 hover:text-white transition-colors p-1.5 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="User account"
                        >
                            <UserIcon className="w-[19px] h-[19px]" strokeWidth={1.75} />
                        </button>
                    </div>
                </header>

                {/* Top spacer */}
                <div className="w-full h-8 sm:h-12 bg-transparent" />

                {/* 2. Floating Curved White Container Layout */}
                <div className={`w-full -mt-4 mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 bg-white shadow-2xl p-5 sm:p-7 md:p-10 lg:p-12 min-h-[calc(100vh-200px)] flex flex-col justify-between ${
                    selectedBoxOption ? 'pb-36 sm:pb-40' : ''
                }`}>
                    <div className="max-w-7xl mx-auto w-full">

                        {/* Dine-In Active Table Banner */}
                        {orderType === 'dine_in' && tableNumber && (
                            <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                                        <UtensilsCrossed size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-black text-amber-950">
                                            Ordering for Table #{tableNumber}
                                        </p>
                                        <p className="text-[11px] text-amber-800/80">
                                            Your order will be prepared and brought directly to your table.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearDiningTable();
                                        navigate('/checkout');
                                    }}
                                    className="text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-100/60 px-3.5 py-1.5 rounded-full border border-amber-300/80 shadow-2xs transition-colors cursor-pointer shrink-0"
                                >
                                    Not at Table #{tableNumber}? Switch
                                </button>
                            </div>
                        )}

                        {/* 2-Column Responsive Layout matching Client Design */}
                        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                            
                            {/* Left Column: Categories Sidebar */}
                            <aside className="w-full md:w-52 lg:w-56 shrink-0 text-left">
                                <h2 className="text-xl sm:text-[22px] font-black text-neutral-900 tracking-tight">
                                    Category
                                </h2>
                                <div className="w-full h-[1px] bg-neutral-200 mt-2.5 mb-4" />

                                {/* Category Pills (Horizontal on mobile, vertical stack on desktop) */}
                                <div className="flex md:flex-col gap-2 overflow-x-auto scrollbar-none pb-2 md:pb-0 select-none">
                                    <button
                                        type="button"
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
                                        const hasBoxOptions = cat.box_options && Array.isArray(cat.box_options) && cat.box_options.length > 0;

                                        return (
                                            <div key={cat.id} className="flex flex-col gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCategorySelect(cat.slug)}
                                                    className={`px-4.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center select-none ${
                                                        isActive
                                                            ? 'bg-[#1c1410] text-[#e5b582] shadow-xs border border-[#1c1410]'
                                                            : 'bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-900 hover:text-neutral-950'
                                                    }`}
                                                >
                                                    {cat.name}
                                                </button>

                                                {/* Sub-item Box Tiers in Sidebar */}
                                                {isActive && hasBoxOptions && (
                                                    <div className="hidden md:flex flex-col ml-3 pl-3 border-l-2 border-[#e5b582]/50 py-1 space-y-1 animate-fadeIn">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectBoxMode(null)}
                                                            className={`text-left px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                                                selectedBoxOption === null
                                                                    ? 'bg-[#24161b] text-[#e5b582] shadow-xs'
                                                                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                                                            }`}
                                                        >
                                                            <span>Single Items</span>
                                                        </button>

                                                        {cat.box_options.map((opt, optIdx) => {
                                                            const isBoxSelected = selectedBoxOption?.size === opt.size;
                                                            return (
                                                                <button
                                                                    key={optIdx}
                                                                    type="button"
                                                                    onClick={() => handleSelectBoxMode(opt)}
                                                                    className={`text-left px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                                                        isBoxSelected
                                                                            ? 'bg-[#e5b582] text-[#24161b] shadow-xs font-black'
                                                                            : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                                                                    }`}
                                                                >
                                                                    <span>{opt.name}</span>
                                                                    <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                                                                        isBoxSelected ? 'bg-black/15 text-[#24161b]' : 'bg-neutral-100 text-neutral-600'
                                                                    }`}>
                                                                        £{parseFloat(opt.price || 0).toFixed(2)}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </aside>

                            {/* Right Column: Title, Enhanced Filter Toolbar & Products Grid */}
                            <main className="flex-1 min-w-0 w-full text-left">
                                {/* Header Row */}
                                <div className="mb-5">
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
                                {/* Mobile Category Box Sub-pills (Only on small screens) */}
                                {activeCategory?.box_options && Array.isArray(activeCategory.box_options) && activeCategory.box_options.length > 0 && (
                                    <div className="flex md:hidden items-center gap-1.5 overflow-x-auto scrollbar-none mb-3 pb-0.5">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectBoxMode(null)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                                                selectedBoxOption === null
                                                    ? 'bg-[#24161b] text-[#e5b582]'
                                                    : 'bg-neutral-100 text-neutral-600'
                                            }`}
                                        >
                                            Single
                                        </button>
                                        {activeCategory.box_options.map((opt, optIdx) => {
                                            const isBoxSelected = selectedBoxOption?.size === opt.size;
                                            return (
                                                <button
                                                    key={optIdx}
                                                    type="button"
                                                    onClick={() => handleSelectBoxMode(opt)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        isBoxSelected
                                                            ? 'bg-[#e5b582] text-[#24161b]'
                                                            : 'bg-neutral-100 text-neutral-600'
                                                    }`}
                                                >
                                                    <span>{opt.name}</span>
                                                    <span className="text-[10px] font-mono font-black">£{parseFloat(opt.price || 0).toFixed(2)}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Full-Width Search Bar */}
                                <div className="relative w-full mb-3.5">
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        placeholder={`Search in ${activeCategoryTitle.toLowerCase()}...`}
                                        className="w-full bg-[#faf7f2] border border-neutral-200/80 rounded-full py-2.5 pl-10 pr-9 text-xs sm:text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#24161b] focus:bg-white transition-all shadow-2xs"
                                    />
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                        <SearchIcon className="w-4 h-4" strokeWidth={2} />
                                    </div>
                                    {searchQuery && (
                                        <button 
                                            type="button"
                                            onClick={() => { setSearchQuery(''); setSearchTerm(''); }}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 p-0.5 cursor-pointer"
                                            aria-label="Clear search"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Filter Toolbar Row: Counter & Clear + Price Popover & Sort */}
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xs font-semibold text-neutral-500">
                                            {productsToDisplay.length} {productsToDisplay.length === 1 ? 'treat' : 'treats'} found
                                        </span>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
                                            >
                                                <X size={11} />
                                                <span>Clear filters</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Right filter tools: Price popover + Sort pill */}
                                    <div className="flex items-center gap-2.5 ml-auto">
                                        {/* Price Filter Pill */}
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

                                        {/* Sort Pill */}
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

                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer whitespace-nowrap pl-1"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Products Grid */}
                                {productsToDisplay.length === 0 ? (
                                    <div className="text-center py-20 px-4 text-neutral-400 font-light text-xs sm:text-sm bg-[#faf7f2] rounded-3xl border border-neutral-200/80 space-y-3">
                                        <p>No sweet items found matching your selection.</p>
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="bg-[#24161b] text-[#e5b582] hover:bg-black text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                                        {productsToDisplay.map(product => (
                                            <ProductCard 
                                                key={product.id} 
                                                product={product} 
                                                boxMode={Boolean(selectedBoxOption)}
                                                boxCount={getProductBoxCount(product.id)}
                                                onAddBoxItem={() => handleAddBoxItem(product)}
                                                onRemoveBoxItem={() => handleRemoveBoxItem(product.id)}
                                                isBoxFull={isBoxFull}
                                            />
                                        ))}
                                    </div>
                                )}
                            </main>

                        </div>

                    </div>
                </div>
            </div>

            {/* Floating Sticky Box Tray Bar (Active during Box Mode) */}
            {selectedBoxOption && (
                <div className="fixed bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-auth-switch select-none">
                    <div className="bg-[#1c1410]/95 text-white border-2 border-[#e5b582] rounded-3xl p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl ring-1 ring-white/20">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#e5b582] inline-block animate-pulse"></span>
                                <span className="font-black text-sm sm:text-base text-white">
                                    {selectedBoxOption.name}
                                </span>
                                <span className="text-xs text-[#e5b582] font-extrabold bg-white/10 px-2.5 py-0.5 rounded-full">
                                    {currentBoxCount} / {selectedBoxOption.size} items
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="text-right">
                                    <span className="text-xs text-neutral-400 block -mb-0.5">Fixed Price</span>
                                    <span className="text-sm sm:text-base font-black text-[#e5b582]">
                                        £{parseFloat(selectedBoxOption.price || 0).toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectBoxMode(null)}
                                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer border border-white/10 hover:border-rose-400/40"
                                    title="Cancel Box Selection & Return to Single Items"
                                    aria-label="Cancel Box Mode"
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Visual Tray Slots */}
                        <div className="flex items-center gap-1.5 mb-3.5 overflow-x-auto pb-1 scrollbar-none">
                            {Array.from({ length: selectedBoxOption.size }).map((_, slotIdx) => {
                                const filledItem = flatBoxItems[slotIdx];
                                return (
                                    <div 
                                        key={slotIdx}
                                        onClick={() => {
                                            if (filledItem) {
                                                handleRemoveBoxItem(filledItem.key || filledItem.product.id);
                                            }
                                        }}
                                        className={`group relative w-10 h-10 rounded-xl border-2 flex items-center justify-center overflow-hidden shrink-0 transition-all ${
                                            filledItem 
                                                ? 'bg-white border-[#e5b582] shadow-xs cursor-pointer hover:border-rose-400' 
                                                : 'bg-white/5 border-dashed border-white/20 text-white/40 text-[11px] font-mono font-bold select-none'
                                        }`}
                                        title={filledItem ? `Remove ${filledItem.product.name}${filledItem.variation ? ` (${filledItem.variation.name})` : ''} from box` : `Empty Slot ${slotIdx + 1}`}
                                    >
                                        {filledItem ? (
                                            <>
                                                <img 
                                                    src={resolveItemImageUrl(filledItem.product, filledItem.variation)} 
                                                    alt={filledItem.product.name} 
                                                    className="w-full h-full object-cover transition-opacity group-hover:opacity-40" 
                                                />
                                                <div className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X size={14} strokeWidth={3} />
                                                </div>
                                            </>
                                        ) : (
                                            slotIdx + 1
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2.5">
                            {currentBoxCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setBoxTrayItems({})}
                                    className="px-3.5 py-2.5 text-xs font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={currentBoxCount !== selectedBoxOption.size}
                                onClick={handleAddCurrentBoxToCart}
                                className={`flex-1 py-3 px-5 rounded-full text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                                    currentBoxCount === selectedBoxOption.size
                                        ? 'bg-[#e5b582] text-[#24161b] hover:bg-white hover:scale-[1.01] active:scale-98'
                                        : 'bg-white/15 text-white/40 cursor-not-allowed'
                                }`}
                            >
                                <CartBagIcon className="w-4 h-4" strokeWidth={2} />
                                {currentBoxCount === selectedBoxOption.size 
                                    ? `Add ${selectedBoxOption.name} to Basket • £${parseFloat(selectedBoxOption.price || 0).toFixed(2)}`
                                    : `Pick ${selectedBoxOption.size - currentBoxCount} more ${selectedBoxOption.size - currentBoxCount === 1 ? 'flavor' : 'flavors'} to complete box`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Box Variation Picker Modal */}
            {boxVariationProduct && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
                    onClick={() => setBoxVariationProduct(null)}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100 animate-scaleUp text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-[#faf7f2]">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-neutral-200/80 shrink-0">
                                    <img 
                                        src={resolveItemImageUrl(boxVariationProduct)} 
                                        alt={boxVariationProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-neutral-900 text-sm sm:text-base leading-tight">
                                            {boxVariationProduct.name}
                                        </h3>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                                        Select flavors for your box ({currentBoxCount}/{selectedBoxOption?.size})
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setBoxVariationProduct(null)}
                                className="w-7 h-7 rounded-full bg-white hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center border border-neutral-200/80 transition-colors cursor-pointer"
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Variations List */}
                        <div className="p-4 sm:p-5 max-h-[55vh] overflow-y-auto space-y-2.5 custom-scrollbar">
                            {boxVariationProduct.variations && boxVariationProduct.variations.map((v) => {
                                const itemKey = `${boxVariationProduct.id}-${v.id}`;
                                const varCount = boxTrayItems[itemKey]?.count || 0;
                                return (
                                    <div 
                                        key={v.id}
                                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                            varCount > 0 
                                                ? 'bg-[#faf7f2] border-[#e5b582] shadow-xs' 
                                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shrink-0">
                                                <img 
                                                    src={resolveItemImageUrl(boxVariationProduct, v)} 
                                                    alt={v.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-neutral-900 text-xs sm:text-[13px] truncate">
                                                    {v.name}
                                                </h4>
                                                {v.description && (
                                                    <p className="text-[10.5px] text-neutral-400 font-light truncate">
                                                        {v.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stepper or Add Button */}
                                        <div className="shrink-0">
                                            {varCount === 0 ? (
                                                <button
                                                    type="button"
                                                    disabled={isBoxFull}
                                                    onClick={() => handleAddBoxItem(boxVariationProduct, v)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                                        isBoxFull
                                                            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                                            : 'bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 active:scale-95'
                                                    }`}
                                                >
                                                    <Plus size={12} strokeWidth={2.5} />
                                                    <span>Add</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-1 border-2 border-[#e5b582] rounded-full px-1.5 py-0.5 bg-white shadow-2xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBoxItem(itemKey)}
                                                        className="w-5 h-5 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 active:scale-90 transition-all cursor-pointer"
                                                    >
                                                        <Minus size={10} strokeWidth={2.5} />
                                                    </button>
                                                    <span className="font-black text-xs text-[#24161b] min-w-[18px] text-center select-none">
                                                        {varCount}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={isBoxFull}
                                                        onClick={() => handleAddBoxItem(boxVariationProduct, v)}
                                                        className={`w-5 h-5 rounded-full flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
                                                            isBoxFull
                                                                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                                                : 'bg-[#24161b] text-[#e5b582] hover:bg-black'
                                                        }`}
                                                    >
                                                        <Plus size={10} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3.5 sm:p-4 border-t border-neutral-100 bg-[#faf7f2] flex items-center justify-between">
                            <div className="text-xs font-bold text-neutral-600">
                                Box: <span className="text-[#24161b] font-black">{currentBoxCount}</span> / <span className="text-[#24161b] font-black">{selectedBoxOption?.size}</span> filled
                            </div>
                            <button
                                type="button"
                                onClick={() => setBoxVariationProduct(null)}
                                className="bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* 3. Global Dark Footer */}
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
