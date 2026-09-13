import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from './AppContext';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import BrandPartnerSection from './components/BrandPartnerSection';
import BrandLine from './components/BrandLine';
import ProductCard from './components/ProductCard';
import { 
    Search, X, User, LogOut, ArrowLeftRight, Clock, MapPin, 
    Check, Menu, ArrowRight, Send, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Cake, Coffee, Croissant, GlassWater, ArrowDownRight, ArrowUpLeft,
    Cookie, IceCream, Pizza, Sandwich, Soup, Salad, Egg, Apple, Citrus, Grape
} from 'lucide-react';
import * as Lucide from 'lucide-react';

const CATALOG_CACHE_KEY = 'cached_menu_catalog_v2';

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

export default function Categories() {
    const navigate = useNavigate();
    const { 
        cart, cartSubtotal, cartItemCount, removeFromCart, addToCart,
        orderType, deliveryInfo, collectionSlot, setOrderType,
        user, logout, setDeliveryInfo, setCollectionSlot,
        isSearchOpen, setIsSearchOpen, searchTerm, setSearchTerm, setIsCartOpen
    } = useApp();

    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [activeCategorySlug, setActiveCategorySlug] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    
    // Newsletter State
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [alreadySubscribed, setAlreadySubscribed] = useState(false);
    const [submittingNewsletter, setSubmittingNewsletter] = useState(false);
    const [dynamicFaqs, setDynamicFaqs] = useState([]);
    
    // Add to Cart Feedback state
    const [addedFeedback, setAddedFeedback] = useState({});

    // Category scroll states & refs
    const scrollRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollWidth - scrollLeft - clientWidth > 10);
        }
    };

    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.7; // Scroll 70% of view area
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
        }
        window.addEventListener('resize', checkScroll);
        return () => {
            if (el) el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [catalog]);

    // Fetch the menu catalog with session caching to avoid flashes
    useEffect(() => {
        const cachedCatalog = sessionStorage.getItem(CATALOG_CACHE_KEY);
        if (cachedCatalog) {
            const parsed = JSON.parse(cachedCatalog);
            setCatalog(parsed);
            if (parsed.length > 0) {
                setActiveCategorySlug(parsed[0].slug);
            }
            setLoading(false);
        } else {
            setLoading(true);
        }

        fetch('/api/menu-catalog')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setCatalog(res.data);
                    sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(res.data));
                    if (res.data.length > 0 && !cachedCatalog) {
                        setActiveCategorySlug(res.data[0].slug);
                    }
                }
            })
            .catch(err => console.error("Error loading menu catalog:", err))
            .finally(() => setLoading(false));
    }, []);

    // Fetch FAQs on mount
    useEffect(() => {
        fetch('/api/faqs')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    setDynamicFaqs(res.data);
                }
            })
            .catch(err => console.error("Error loading FAQs:", err));
    }, []);

    useEffect(() => {
        if (!loading && catalog.length > 0) {
            const savedScrollPos = sessionStorage.getItem('categories_scroll_pos');
            if (savedScrollPos) {
                const hasCache = !!sessionStorage.getItem(CATALOG_CACHE_KEY);
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedScrollPos, 10));
                    sessionStorage.removeItem('categories_scroll_pos');
                }, hasCache ? 0 : 100);
            }
        }
    }, [loading, catalog]);

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

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setSubmittingNewsletter(true);
        setAlreadySubscribed(false);

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                setSubscribed(true);
                setAlreadySubscribed(!!data.already_subscribed);
                setEmail('');
            }
        } catch (err) {
            console.error("Error subscribing to newsletter:", err);
            toast.error("Failed to subscribe. Please try again.");
        } finally {
            setSubmittingNewsletter(false);
        }
    };

    // Filter products for global search
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
    const allCategoryProducts = activeCategory ? activeCategory.products : [];
    const productsToShow = allCategoryProducts.slice(0, 4);

    // Custom V Monogram SVG Logo
    const Logo = () => (
        <svg className="w-8 h-8 text-white fill-current transition-transform hover:scale-105" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 26.5L6.5 13.5H11.5L16 19.5L20.5 13.5H25.5L16 26.5Z" />
            <path d="M16 11.5L11.5 5.5H20.5L16 11.5Z" />
        </svg>
    );

    // Map Category Icons
    const getCategoryIcon = (catOrSlug) => {
        const cat = typeof catOrSlug === 'object' ? catOrSlug : catalog.find(c => c.slug === catOrSlug);
        const iconName = cat?.icon;
        
        if (iconName) {
            const IconComponent = Lucide[iconName];
            if (IconComponent) return <IconComponent size={22} strokeWidth={1.6} />;
        }

        return null; // Return null if no icon is set
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
        <div className="min-h-screen bg-[#1e1008] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <div>
                {/* Dripping Chocolate Top Banner */}
                <div 
                    className="w-full h-[180px] md:h-[220px] relative flex flex-col justify-between overflow-hidden"
                    style={{
                        backgroundImage: "url('/images/chocolate-banner-optimized.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Shadow overlay to make text pop */}
                    <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none"></div>

                    {/* Header Controls */}
                    <header className="w-full py-6 px-4 md:px-12 flex justify-between items-center z-30 bg-transparent">
                        <button 
                            onClick={() => setIsMenuOpen(true)} 
                            className="text-white hover:text-white/80 transition-colors p-1.5 pl-0 cursor-pointer focus:outline-none"
                            aria-label="Open menu"
                        >
                            <Menu size={24} strokeWidth={1.5} />
                        </button>

                        <div className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer py-2" onClick={() => navigate('/')}>
                            <Logo />
                        </div>

                        <div className="flex items-center space-x-0 md:space-x-4">
                            <button 
                                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                                className="text-white hover:text-white/80 transition-colors px-1 py-1.5 md:p-2 cursor-pointer focus:outline-none"
                                aria-label="Search"
                            >
                                <Search size={22} strokeWidth={1.5} />
                            </button>
                                 <button 
                                    onClick={() => setIsCartOpen(true)} 
                                    className="text-white hover:text-white/80 transition-colors px-1 py-1.5 md:p-2 cursor-pointer relative focus:outline-none"
                                    aria-label="Cart"
                                 animate-fadeIn>
                                    <img src="/images/icons/bag.png" alt="Cart" className="w-[22px] h-[22px] object-contain inline-block" style={{ filter: 'brightness(0) invert(1)' }} />
                                    {cartItemCount > 0 && (
                                        <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white text-[#8e5233] text-[9px] font-black rounded-full flex items-center justify-center">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </button>
                            <button 
                                onClick={() => navigate(user ? '/account' : '/login')} 
                                className="text-white hover:text-white/80 transition-colors pl-1 pr-0 py-1.5 md:p-2 cursor-pointer focus:outline-none"
                                aria-label="User"
                            >
                                <User size={22} strokeWidth={1.5} />
                            </button>
                        </div>
                    </header>

                    {/* Header Central Title */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-4 pt-2 md:pt-3 pointer-events-none">
                        <h2 className="text-white text-3xl md:text-4xl font-light tracking-wide drop-shadow-md">
                            Discover Sweets Delight!
                        </h2>
                    </div>


                </div>

                {/* Pill-like Category Container Layout - Full Width & Overlap Footer */}
                <div className="w-full -mt-4 mb-[-32px] md:mb-[-48px] rounded-[24px] md:rounded-[36px] relative z-30 px-6 pt-6 pb-10 md:px-12 md:pt-8 md:pb-16" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                    <div className="max-w-7xl mx-auto w-full">
                    
                    {/* Category List Section */}
                    <section className="mb-14">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-2 text-left">
                            <div>
                                <h1 className="text-[#8e5233] text-3xl font-light tracking-tight">Category</h1>
                            </div>
                        </div>

                        {/* Category Cards Row with Horizontal Scrolling */}
                        <div className="relative w-full">
                            {/* Left Scroll Arrow */}
                            {showLeftArrow && (
                                <button 
                                    onClick={() => handleScroll('left')}
                                    className="absolute -left-2 md:-left-4 top-[45%] -translate-y-1/2 z-40 bg-white/95 hover:bg-white text-[#8e5233] w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-[#8e5233]/15 transition-all duration-300 hover:scale-110 cursor-pointer"
                                    aria-label="Scroll left"
                                >
                                    <ChevronLeft size={18} strokeWidth={2.5} />
                                </button>
                            )}

                            {/* Right Scroll Arrow */}
                            {showRightArrow && (
                                <button 
                                    onClick={() => handleScroll('right')}
                                    className="absolute -right-2 md:-right-4 top-[45%] -translate-y-1/2 z-40 bg-white/95 hover:bg-white text-[#8e5233] w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-[#8e5233]/15 transition-all duration-300 hover:scale-110 cursor-pointer"
                                    aria-label="Scroll right"
                                >
                                    <ChevronRight size={18} strokeWidth={2.5} />
                                </button>
                            )}

                            <div 
                                ref={scrollRef}
                                className="flex items-start overflow-x-auto gap-5 md:gap-8 pt-4 pb-4 px-4 md:px-6 scrollbar-none w-full scroll-smooth"
                            >
                                {catalog.map((cat, index) => {
                                    const isActive = activeCategorySlug === cat.slug && !searchTerm;
                                    const isLabelOnTop = index % 2 === 1;
                                    return (
                                        <div 
                                            key={cat.id} 
                                            className="flex flex-col shrink-0 w-[140px] md:w-[170px] cursor-pointer group"
                                        >
                                            {isLabelOnTop ? (
                                                <div className="h-8 flex items-center mb-2 pl-1.5">
                                                    <div className="flex items-center space-x-2 text-left">
                                                        {getCategoryIcon(cat) && (
                                                            <span className="text-[#8e5233]">
                                                                {getCategoryIcon(cat)}
                                                            </span>
                                                        )}
                                                        <span className="text-xs md:text-sm font-bold text-neutral-800 tracking-wide">{cat.name}</span>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Image Card Container */}
                                            <div
                                                onClick={() => {
                                                    sessionStorage.setItem('categories_scroll_pos', window.scrollY);
                                                    navigate(`/categories/${cat.slug}`);
                                                    setSearchTerm(''); // Clear search
                                                }}
                                                className="relative w-full aspect-[3/4]"
                                            >
                                                <div
                                                    className={`w-full h-full rounded-[28px] overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md relative ${
                                                        isActive 
                                                            ? 'scale-[1.02]' 
                                                            : ''
                                                    }`}
                                                    style={{ transform: 'translateZ(0)' }}
                                                >
                                                    <img 
                                                        src={(cat.image || (cat.images && cat.images.length > 0)) ? getImageUrl(cat) : getImageUrl(cat.products && cat.products[0])} 
                                                        alt={cat.name} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            e.target.src = "/images/placeholder.svg";
                                                        }}
                                                    />
                                                </div>
                                                 {/* Border Overlay - placed outside overflow-hidden to prevent clipping */}
                                                 <div className={`absolute inset-0 rounded-[28px] border border-white/40 pointer-events-none transition-all duration-300 ${
                                                     isActive ? 'scale-[1.02]' : ''
                                                 }`} />
                                            </div>
                                            
                                            {!isLabelOnTop ? (
                                                <div className="h-8 flex items-center mt-2 pl-1.5">
                                                    <div className="flex items-center space-x-2 text-left">
                                                         {getCategoryIcon(cat) && (
                                                             <span className="text-[#8e5233]">
                                                                 {getCategoryIcon(cat)}
                                                             </span>
                                                         )}
                                                        <span className="text-xs md:text-sm font-bold text-neutral-800 tracking-wide">{cat.name}</span>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

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
                             <div className="flex justify-between items-center mb-8">
                                 <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-none text-left">
                                     {catalog.map((cat) => (
                                         <button
                                             key={cat.id}
                                             onClick={() => setActiveCategorySlug(cat.slug)}
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
                                 <button 
                                     onClick={() => {
                                         sessionStorage.setItem('categories_scroll_pos', window.scrollY);
                                         navigate(`/categories/${activeCategorySlug}`);
                                     }}
                                     className="text-xs md:text-sm font-bold text-[#8e5233] hover:text-[#8F5336] transition-colors flex items-center gap-1 cursor-pointer focus:outline-none whitespace-nowrap shrink-0 pl-4"
                                 >
                                     <span>See all</span>
                                     <ArrowDownRight size={16} strokeWidth={2.5} />
                                 </button>
                             </div>
                        )}

                        {/* Product Grid Render */}
                        {searchTerm ? (
                            searchResults.length === 0 ? (
                                <div className="text-center py-16 text-neutral-400 font-light text-sm">
                                    No desserts match your query. Try searching for "cake" or "coffee".
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

                    {/* Subscription Newsletter Banner Section */}
                    <section className="mb-16">
                                <div className="bg-[#f4ebe1] rounded-[24px] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[220px] shadow-sm">
                                    {/* Left Form Column */}
                                    <div className="col-span-12 md:col-span-8 p-8 md:p-10 flex flex-col justify-center text-left">
                                        <h3 className="text-[#8e5233]">
                                            <span className="block text-2xl md:text-[28px] font-light leading-tight">Subscribe to</span>
                                            <span className="block text-3xl md:text-[38px] font-bold leading-tight">Our Newsletter</span>
                                        </h3>
                                        <BrandLine className="w-full max-w-sm my-4" />
                                        <p className="text-neutral-500 text-xs font-light tracking-wide max-w-sm mb-6 leading-relaxed">
                                            Every dessert tells a story. Every bite is a moment of pure bliss at Sweet Spot System.
                                        </p>
                                        
                                        <form onSubmit={handleNewsletterSubmit} className="flex w-full bg-white rounded-full border border-neutral-200/80 p-1 pl-4 focus-within:border-[#8e5233] transition-all">
                                            <input 
                                                type="email" 
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email here" 
                                                required
                                                disabled={subscribed || submittingNewsletter}
                                                className="bg-transparent text-xs w-full text-neutral-800 focus:outline-none placeholder-neutral-400 font-light pr-2"
                                            />
                                            <button 
                                                type="submit"
                                                disabled={subscribed || submittingNewsletter}
                                                className="bg-[#8e5233] hover:bg-[#7b462a] active:bg-[#6c3d25] text-white text-xs font-medium px-6 py-3 rounded-full transition-all shrink-0 cursor-pointer disabled:opacity-80 flex items-center justify-center gap-1.5"
                                            >
                                                {submittingNewsletter ? (
                                                    <span className="animate-spin border-2 border-white border-t-transparent h-3.5 w-3.5 rounded-full"></span>
                                                ) : subscribed ? (
                                                    <Check size={14} />
                                                ) : (
                                                    <>
                                                        <span>Subscribe</span>
                                                        <ArrowRight size={14} />
                                                    </>
                                                )}
                                            </button>
                                         </form>
                                         {subscribed && (
                                             <p className={`${alreadySubscribed ? 'text-amber-700' : 'text-emerald-700'} text-[11px] font-bold mt-3.5 tracking-wide animate-fadeIn`}>
                                                 {alreadySubscribed 
                                                     ? "✓ You are already subscribed to our newsletter!" 
                                                     : "✓ Thank you! You've successfully subscribed to our newsletter."
                                                 }
                                             </p>
                                         )}
                                     </div>

                                    {/* Right Image Column */}
                                    <div className="col-span-12 md:col-span-4 relative hidden md:block overflow-hidden">
                                        <img 
                                            src="/images/hero-dessert.png" 
                                            alt="Glazed Mango Pastry Detail" 
                                            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-[1200ms]"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* FAQ Collapsible Cards Section */}
                            {dynamicFaqs.length > 0 && (
                                <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 py-12 border-t border-neutral-200/60">
                                    {/* FAQ Left Title */}
                                    <div className="col-span-12 md:col-span-4 text-left flex flex-col justify-start">
                                        <span className="text-[#8e5233]/70 text-xs uppercase font-bold tracking-widest mb-3">
                                            FAQ's
                                        </span>
                                        <h2 className="text-[#8e5233] leading-snug mb-3">
                                            <span className="block text-2xl md:text-[28px] font-light">Any question?</span>
                                            <span className="block text-3xl md:text-[38px] font-bold">We got you.</span>
                                        </h2>
                                        <BrandLine className="w-full my-4" />
                                        <p className="text-neutral-400 text-xs font-light leading-relaxed">
                                            Every dessert tells a story. Every bite is a moment of pure bliss at Sweet Spot System.
                                        </p>
                                    </div>

                                    {/* FAQ Right List */}
                                    <div className="col-span-12 md:col-span-8 space-y-2.5">
                                        {dynamicFaqs.map((item, index) => {
                                            const isOpen = openFaq === index;
                                            return (
                                                <div key={index} className="w-full bg-white border border-[#8e5233]/30 rounded-[20px] overflow-hidden">
                                                    <button
                                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                                        className="flex justify-between items-center w-full pl-4 pr-2.5 py-2 text-left text-xs md:text-sm font-normal text-neutral-800 cursor-pointer focus:outline-none"
                                                    >
                                                        <span>{item.question}</span>
                                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shrink-0 ml-3 ${
                                                            isOpen 
                                                                ? 'border-[#8e5233] bg-[#8e5233] text-white rotate-180' 
                                                                : 'border-[#8e5233] text-[#8e5233] bg-transparent'
                                                        }`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-6-6m6 6l6-6" />
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    
                                                    {isOpen && (
                                                        <div className="pl-4 pr-4 pb-3.5 pt-2 text-xs font-light text-neutral-500 leading-relaxed border-t border-[#8e5233]/15 animate-fadeIn text-left">
                                                            {item.answer}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                            <BrandPartnerSection />
                    </div>
                </div>
            </div>

            <Footer 
                catalog={catalog} 
                onCategoryClick={(cat) => { setActiveCategorySlug(cat.slug); window.scrollTo({ top: 200, behavior: 'smooth' }); }} 
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
