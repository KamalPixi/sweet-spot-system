import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from './AppContext';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import { 
    Search, X, User, LogOut, Menu, Check, Cake, Coffee, Croissant, GlassWater, ArrowLeft,
    Cookie, IceCream, Pizza, Sandwich, Soup, Salad, Egg, Apple, Citrus, Grape
} from 'lucide-react';
import * as Lucide from 'lucide-react';

const getImageUrl = (item) => {
    if (!item) return '/images/placeholder.svg';
    const resolveUrl = (url) => {
        if (!url) return '/images/placeholder.svg';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
        return `/storage/${cleanUrl}`;
    };
    if (item.images && item.images.length > 0) {
        const primary = item.images.find(img => img.is_primary);
        const url = primary ? primary.url : item.images[0].url;
        return resolveUrl(url);
    }
    if (item.image) {
        return resolveUrl(item.image);
    }
    return '/images/placeholder.svg';
};

export default function CategoryDetail() {
    const navigate = useNavigate();
    const { categorySlug } = useParams();
    const { 
        orderType, setOrderType, deliveryInfo, setDeliveryInfo, 
        collectionSlot, setCollectionSlot, cart, addToCart, cartItemCount,
        user, logout,
        isSearchOpen, setIsSearchOpen, searchTerm, setSearchTerm
    } = useApp();

    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [activeCategorySlug, setActiveCategorySlug] = useState(categorySlug || '');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [addedFeedback, setAddedFeedback] = useState({});

    // Sync active category slug with url param when it changes externally
    useEffect(() => {
        if (categorySlug) {
            setActiveCategorySlug(categorySlug);
        }
    }, [categorySlug]);

    // Fetch catalog
    useEffect(() => {
        setLoading(true);
        fetch('/api/menu-catalog')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setCatalog(res.data);
                    if (res.data.length > 0 && !activeCategorySlug) {
                        setActiveCategorySlug(categorySlug || res.data[0].slug);
                    }
                }
            })
            .catch(err => console.error("Error loading menu catalog:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleDirectAdd = (product) => {
        const variation = product.has_variations && product.variations && product.variations.length > 0 
            ? product.variations[0] 
            : null;
        addToCart(product, variation, 1);
        setAddedFeedback(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => {
            setAddedFeedback(prev => ({ ...prev, [product.id]: false }));
        }, 1500);

        const displayName = variation ? `${product.name} (${variation.name})` : product.name;
    };

    const handleSwitchOrderType = () => {
        setOrderType(null);
        setDeliveryInfo(null);
        setCollectionSlot(null);
        navigate('/');
    };

    const handleTabChange = (slug) => {
        setActiveCategorySlug(slug);
        window.history.pushState(null, '', `/categories/${slug}`);
    };

    // Filter products based on search
    const getFilteredProducts = () => {
        if (!searchTerm) return [];
        let allProducts = [];
        catalog.forEach(cat => {
            cat.products.forEach(p => {
                if (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
                    allProducts.push(p);
                }
            });
        });
        return allProducts;
    };

    const searchResults = getFilteredProducts();
    const activeCategory = catalog.find(cat => cat.slug === activeCategorySlug);
    const productsToShow = activeCategory ? activeCategory.products : [];

    // Custom V Monogram SVG Logo
    const Logo = () => (
        <svg className="w-8 h-8 text-white fill-current transition-transform hover:scale-105" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 26.5L6.5 13.5H11.5L16 19.5L20.5 13.5H25.5L16 26.5Z" />
            <path d="M16 11.5L11.5 5.5H20.5L16 11.5Z" />
        </svg>
    );



    const getCategoryIcon = (catOrSlug) => {
        const cat = typeof catOrSlug === 'object' ? catOrSlug : catalog.find(c => c.slug === catOrSlug);
        const iconName = cat?.icon;
        
        if (iconName) {
            const IconComponent = Lucide[iconName];
            if (IconComponent) return <IconComponent size={22} strokeWidth={1.6} />;
        }

        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdfaf5] flex flex-col items-center justify-center text-neutral-500 font-semibold tracking-wider text-xs">
                <div className="animate-spin border-2 border-[#8e5233] border-t-transparent h-6 w-6 rounded-full mb-3"></div>
                <span>Loading Sweets Delight...</span>
            </div>
        );
    }

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

                {/* Main content container with bottom curve only and top not curved */}
                <div className="w-full mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-6 pt-6 pb-10 md:px-12 md:pt-8 md:pb-16" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                    <div className="max-w-7xl mx-auto w-full">
                        {/* Back button */}
                        <div className="mb-6 text-left">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center space-x-1.5 text-neutral-400 hover:text-[#8e5233] transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer focus:outline-none bg-transparent border-none"
                            >
                                <ArrowLeft size={14} />
                                <span>Back</span>
                            </button>
                        </div>
                        
                        {/* Products Grid Section */}
                        <section className="mb-16">
                            {searchTerm ? (
                                /* Search Results Header */
                                <div className="flex justify-between items-baseline mb-6 border-b border-neutral-200/60 pb-3 text-left">
                                    <h2 className="text-xl font-bold text-neutral-800">
                                        Search Results for "<span className="text-[#8e5233]">{searchTerm}</span>"
                                    </h2>
                                    <button onClick={() => setSearchTerm('')} className="text-xs text-neutral-400 hover:text-neutral-600 underline">
                                        Clear search
                                    </button>
                                </div>
                            ) : (
                                /* Tab navigation Header */
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-none text-left">
                                        {catalog.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleTabChange(cat.slug)}
                                                className={`font-bold tracking-wide transition-all cursor-pointer focus:outline-none ${
                                                    activeCategorySlug === cat.slug
                                                        ? 'text-[#8e5233] text-sm md:text-base'
                                                        : 'text-neutral-400 hover:text-neutral-600 text-xs md:text-sm'
                                                }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold hidden sm:inline">
                                        {productsToShow.length} Items Available
                                    </span>
                                </div>
                            )}

                            {/* Product Grid Render */}
                            {searchTerm ? (
                                searchResults.length === 0 ? (
                                    <div className="text-center py-16 text-neutral-400 font-light text-sm">
                                        No desserts match your query.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {searchResults.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                )
                            ) : (
                                productsToShow.length === 0 ? (
                                    <div className="text-center py-16 text-neutral-400 font-light text-sm">
                                        No fresh products found in this category.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {productsToShow.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                )
                            )}
                        </section>

                    </div>
                </div>
            </div>

            <Footer 
                catalog={catalog} 
                onCategoryClick={(cat) => { handleTabChange(cat.slug); window.scrollTo({ top: 200, behavior: 'smooth' }); }} 
            />

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
