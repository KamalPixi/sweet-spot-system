import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from './AppContext';
import Footer from './components/Footer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BrandPartnerSection from './components/BrandPartnerSection';
import ProductCard from './components/ProductCard';
import BrandLine from './components/BrandLine';
import { ShoppingBag, Search, ChevronRight, X, User, LogOut, ArrowLeftRight, Clock, MapPin, ChevronLeft, Plus, Minus, ArrowRight, Menu, ZoomIn, Check, ArrowDownRight, ChevronUp } from 'lucide-react';

const formatImageUrl = (url) => {
    if (!url) return '/images/placeholder.svg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
    return `/storage/${cleanUrl}`;
};

const getImageUrl = (item) => {
    if (!item) return formatImageUrl(null);
    if (item.images && item.images.length > 0) {
        const primary = item.images.find(img => img.is_primary);
        const url = primary ? primary.url : item.images[0].url;
        return formatImageUrl(url);
    }
    if (item.image) {
        return formatImageUrl(item.image);
    }
    return formatImageUrl(null);
};

const Logo = () => (
    <svg className="w-8 h-8 text-white fill-current transition-transform hover:scale-105" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 26.5L6.5 13.5H11.5L16 19.5L20.5 13.5H25.5L16 26.5Z" />
        <path d="M16 11.5L11.5 5.5H20.5L16 11.5Z" />
    </svg>
);



export default function ProductDetail() {
    const { productSlug } = useParams();
    const navigate = useNavigate();
    const relatedScrollRef = useRef(null);
    
    // States for expanding sections inline
    const [showAllRelated, setShowAllRelated] = useState(false);
    const [showAllCategoryProducts, setShowAllCategoryProducts] = useState(false);

    const { 
        cart, cartSubtotal, cartItemCount, removeFromCart, addToCart,
        orderType, deliveryInfo, collectionSlot, setOrderType,
        user, logout, setDeliveryInfo, setCollectionSlot,
        catalog, isSearchOpen, setIsSearchOpen
    } = useApp();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [addedFeedback, setAddedFeedback] = useState(false);
    const [addedFeedbackRelated, setAddedFeedbackRelated] = useState({});
    const [showCartDropdown, setShowCartDropdown] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState('delivery'); // 'delivery' or 'ingredients'
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [selectedCategorySlug, setSelectedCategorySlug] = useState('');

    // Reset active image index and details when variation selection or slug changes
    useEffect(() => {
        setActiveImageIndex(0);
    }, [selectedVariation]);

    // Fetch product details on load and when slug changes
    useEffect(() => {
        if (!productSlug) return;
        setLoading(true);
        setError(null);
        setQuantity(1);
        setActiveImageIndex(0);
        setAddedFeedback(false);

        fetch(`/api/products/${productSlug}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setProduct(res.data);
                    if (res.data.has_variations && res.data.variations.length > 0) {
                        setSelectedVariation(res.data.variations[0]);
                    } else {
                        setSelectedVariation(null);
                    }
                } else {
                    setError('Failed to load product details.');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Network error. Failed to load product.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [productSlug]);

    const handleQtyChange = (val) => {
        if (val < 1) return;
        setQuantity(val);
    };

    const handleAddToCart = () => {
        if (!product) return;
        addToCart(product, selectedVariation, quantity);
        setAddedFeedback(true);
        setTimeout(() => {
            setAddedFeedback(false);
        }, 2000);

        const displayName = selectedVariation ? `${product.name} (${selectedVariation.name})` : product.name;
    };

    const handleRelatedAdd = (e, rp) => {
        e.stopPropagation();
        const variation = rp.has_variations && rp.variations.length > 0 ? rp.variations[0] : null;
        addToCart(rp, variation, 1);
        setAddedFeedbackRelated(prev => ({ ...prev, [rp.id]: true }));
        setTimeout(() => {
            setAddedFeedbackRelated(prev => ({ ...prev, [rp.id]: false }));
        }, 1500);

        const displayName = variation ? `${rp.name} (${variation.name})` : rp.name;
    };

    const getPrice = () => {
        if (!product) return 0;
        return selectedVariation ? parseFloat(selectedVariation.price) : parseFloat(product.base_price);
    };

    const getWeight = () => {
        if (!product) return null;
        return selectedVariation ? selectedVariation.weight : product.base_weight;
    };

    const getAllImages = () => {
        if (!product) return [];
        let list = [];
        if (selectedVariation && selectedVariation.images && selectedVariation.images.length > 0) {
            list = selectedVariation.images;
        } else if (product.images && product.images.length > 0) {
            list = product.images;
        } else {
            if (selectedVariation && selectedVariation.image) {
                list = [{ url: selectedVariation.image }];
            } else if (product.image) {
                list = [{ url: product.image }];
            }
        }

        const mapped = list.map(img => {
            const url = typeof img === 'string' ? img : (img?.url || img?.image || '');
            return formatImageUrl(url);
        });

        if (mapped.length === 0) {
            mapped.push(formatImageUrl(null));
        }

        return mapped;
    };

    const handleSwitchOrderType = () => {
        setOrderType(null);
        setDeliveryInfo(null);
        setCollectionSlot(null);
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-950 border-t-transparent"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-center items-center">
                <p className="text-red-700 font-medium mb-4">{error || 'Product not found.'}</p>
                <button onClick={() => navigate('/categories')} className="bg-neutral-950 px-6 py-2.5 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors">
                    Back to Categories
                </button>
            </div>
        );
    }

    // Fallback logic for related/matching products from the same category
    let displayRelated = product?.related_products || [];
    if (displayRelated.length === 0 && catalog && product) {
        const matchingCategory = catalog.find(c => c.id === product.category_id || (product.category && c.id === product.category.id));
        if (matchingCategory && matchingCategory.products) {
            displayRelated = matchingCategory.products.filter(p => p.id !== product.id);
        }
    }
    if (displayRelated.length === 0 && catalog) {
        const allProds = [];
        catalog.forEach(c => {
            if (c.products) {
                c.products.forEach(p => {
                    if (p.id !== product.id) allProds.push(p);
                });
            }
        });
        displayRelated = allProds;
    }

    return (
        <div className="min-h-screen bg-[#fdfaf5] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <Header 
                setIsMenuOpen={setIsMenuOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSearchOpen={isSearchOpen}
                navigate={navigate}
                cartItemCount={cartItemCount}
                user={user}
            />

                {/* Mobile Order Type Banner */}
                {orderType && (
                    <div className="flex sm:hidden justify-between items-center bg-[#f5e6d3]/30 border-b border-neutral-200/80 px-6 py-2.5 text-xs text-neutral-600">
                        {orderType === 'delivery' ? (
                            <span>Delivery: <strong className="text-neutral-900 font-bold">{deliveryInfo?.postcode}</strong></span>
                        ) : (
                            <span>Collection: <strong className="text-neutral-900 font-bold">{collectionSlot?.time}</strong></span>
                        )}
                        <button onClick={handleSwitchOrderType} className="text-[#8e5233] hover:underline font-bold uppercase text-[10px]">Change</button>
                    </div>
                )}

                {/* Curved overlap container matching Category pages */}
                <div className="w-full mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-6 pt-6 pb-10 md:px-12 md:pt-8 md:pb-16" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                    {/* Product Detail Main Block */}
                    <main className="max-w-6xl mx-auto w-full">
                    
                    {/* Back Link */}
                    <div className="mb-4 text-left animate-fade-in">
                        <button 
                            onClick={() => {
                                if (window.history.state && window.history.state.idx > 0) {
                                    navigate(-1);
                                } else {
                                    navigate(product.category?.slug ? `/categories/${product.category.slug}` : '/categories');
                                }
                            }}
                            className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <ChevronLeft size={14} /> 
                            {window.history.state && window.history.state.idx > 0 
                                ? 'Back' 
                                : `Back to ${product.category?.name || 'Categories'}`
                            }
                        </button>
                    </div>

                    {/* Primary Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 text-left mb-12 items-start">
                        {/* Left Column: Image Gallery Slider */}
                        <div className="col-span-12 md:col-span-5 flex flex-col">
                            <div 
                                className="relative aspect-[4/5] bg-[#eae2d5] overflow-hidden mb-6 rounded-[24px] border border-neutral-200/60 shadow-sm group cursor-zoom-in"
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                {/* Zoom Icon Button overlay */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsLightboxOpen(true);
                                    }}
                                    className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-20 shadow-xs cursor-pointer border border-white/10"
                                    aria-label="Zoom image"
                                >
                                    <ZoomIn size={16} />
                                </button>

                                {/* Sliding track */}
                                <div 
                                    className="flex w-full h-full transition-transform duration-500 ease-in-out"
                                    style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                                >
                                    {getAllImages().map((url, idx) => (
                                        <div key={idx} className="w-full h-full shrink-0 overflow-hidden">
                                            <img 
                                                src={url} 
                                                alt={`${product.name} ${idx + 1}`}
                                                className="w-full h-full object-cover animate-fadeIn"
                                                onError={(e) => {
                                                    e.target.src = "/images/placeholder.svg";
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Gallery Arrow Selectors */}
                                {getAllImages().length > 1 && (
                                    <>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveImageIndex(prev => (prev - 1 + getAllImages().length) % getAllImages().length);
                                            }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/20 backdrop-blur-xs text-white hover:bg-white/40 p-2 rounded-full border border-white/20 transition-all cursor-pointer z-10"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveImageIndex(prev => (prev + 1) % getAllImages().length);
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/20 backdrop-blur-xs text-white hover:bg-white/40 p-2 rounded-full border border-white/20 transition-all cursor-pointer z-10"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight size={18} />
                                        </button>

                                        {/* Dot Indicators */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                                            {getAllImages().map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveImageIndex(idx);
                                                    }}
                                                    className={`w-2 h-2 rounded-full transition-all ${
                                                        activeImageIndex === idx ? 'bg-white w-4' : 'bg-white/50'
                                                    }`}
                                                    aria-label={`Go to slide ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail Selectors */}
                            {getAllImages().length > 1 && (
                                <div className="flex flex-wrap gap-3 justify-start">
                                    {getAllImages().map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`w-[72px] h-[72px] overflow-hidden rounded-[16px] border-2 transition-all ${
                                                activeImageIndex === idx ? 'border-[#8e5233] scale-102 shadow-sm' : 'border-transparent hover:border-[#8e5233]/40'
                                            }`}
                                        >
                                            <img 
                                                src={url} 
                                                alt="" 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => {
                                                    e.target.src = "/images/placeholder.svg";
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Metadata & Option Selectors */}
                        <div className="col-span-12 md:col-span-7 flex flex-col space-y-6 pt-2">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-serif text-[#8F5336] font-semibold mt-2 tracking-wide">
                                    {product.name}
                                </h1>
                            </div>

                            <p className="text-neutral-500 text-sm font-light leading-relaxed">{product.description}</p>

                            <BrandLine className="w-full my-2" />

                            {getWeight() && (
                                <p className="text-xs text-neutral-400">
                                    Average Weight: <span className="text-neutral-600 font-semibold">{getWeight()}g</span>
                                </p>
                            )}

                            {/* Variations Selection */}
                            {product.has_variations && product.variations.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider">Choose Option</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {product.variations.map((v) => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => setSelectedVariation(v)}
                                                className={`p-3.5 rounded-[12px] border text-xs text-left flex justify-between items-center transition-all ${
                                                    selectedVariation && selectedVariation.id === v.id
                                                        ? 'bg-[#8e5233] border-[#8e5233] text-white shadow-sm'
                                                        : 'bg-white border-neutral-200 hover:border-[#8e5233]/45 text-neutral-600'
                                                }`}
                                            >
                                                <span className={`font-bold block ${selectedVariation && selectedVariation.id === v.id ? 'text-white' : 'text-neutral-900'}`}>{v.name}</span>
                                                <span className={selectedVariation && selectedVariation.id === v.id ? 'text-white/80' : 'text-[#8e5233]'}>£{parseFloat(v.price).toFixed(2)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity and Add to Cart Section */}
                            <div className="pt-4 flex flex-col space-y-4">
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                                    {/* Qty Counter */}
                                    <div className="flex items-center justify-between bg-[#f5e6d3]/40 border border-neutral-200/80 rounded-full px-2 h-12 w-full sm:w-auto">
                                        <button 
                                            onClick={() => handleQtyChange(quantity - 1)}
                                            className="w-8 h-8 rounded-full bg-white text-[#8e5233] hover:bg-[#8e5233] hover:text-white flex items-center justify-center transition-colors font-bold shadow-xs cursor-pointer"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-10 text-center text-sm font-bold text-neutral-800">{quantity}</span>
                                        <button 
                                            onClick={() => handleQtyChange(quantity + 1)}
                                            className="w-8 h-8 rounded-full bg-[#8e5233] text-white hover:bg-[#723e25] flex items-center justify-center transition-colors font-bold shadow-xs cursor-pointer"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    {/* CTA Add */}
                                    <button
                                        onClick={handleAddToCart}
                                        className="bg-[#8e5233] hover:bg-[#723e25] text-white font-semibold rounded-full px-8 h-12 flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer"
                                    >
                                        <img src="/images/icons/bag.png" alt="Add to cart" className="w-[22px] h-[22px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                                        <span>{addedFeedback ? 'Added ✓' : `Add to cart - £${(getPrice() * quantity).toFixed(2)}`}</span>
                                    </button>
                                </div>
                             </div>

                            {/* Tabs below detail area */}
                            <div className="pt-6 border-t border-neutral-200/60">
                                <div className="flex space-x-6 border-b border-neutral-200/60 pb-2">
                                    <button
                                        onClick={() => setActiveDetailTab('delivery')}
                                        className={`font-serif text-lg font-bold pb-2 relative transition-colors cursor-pointer ${
                                            activeDetailTab === 'delivery' ? 'text-[#8e5233]' : 'text-neutral-450 hover:text-neutral-700'
                                        }`}
                                    >
                                        Delivery
                                        {activeDetailTab === 'delivery' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8e5233]"></div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveDetailTab('ingredients')}
                                        className={`font-serif text-lg font-bold pb-2 relative transition-colors cursor-pointer ${
                                            activeDetailTab === 'ingredients' ? 'text-[#8e5233]' : 'text-neutral-450 hover:text-neutral-700'
                                        }`}
                                    >
                                        Ingredients
                                        {activeDetailTab === 'ingredients' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8e5233]"></div>
                                        )}
                                    </button>
                                </div>
                                <div className="pt-4 text-xs leading-relaxed text-neutral-600/90 space-y-3">
                                    {activeDetailTab === 'delivery' ? (
                                        <div className="bg-[#f5e6d3]/20 border border-neutral-200/50 rounded-[16px] p-4 text-xs">
                                            {orderType === 'delivery' ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-neutral-800 font-bold uppercase tracking-wider text-[10px]">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        Selected: Home Delivery
                                                    </div>
                                                    <p className="text-neutral-700 font-semibold">{deliveryInfo?.address_line_1}, {deliveryInfo?.city}</p>
                                                    <p className="text-neutral-500">Postcode: <strong className="text-neutral-800 font-bold">{deliveryInfo?.postcode}</strong></p>
                                                </div>
                                            ) : orderType === 'collection' ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-neutral-800 font-bold uppercase tracking-wider text-[10px]">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                        Selected: Store Collection
                                                    </div>
                                                    <p className="text-neutral-700">Collect from: <strong className="text-neutral-900 font-bold">10 Soho Street, London</strong></p>
                                                    <p className="text-neutral-500">Date: <strong className="text-neutral-800 font-semibold">{collectionSlot?.date}</strong></p>
                                                    <p className="text-neutral-500">Time Window: <strong className="text-neutral-800 font-semibold">{collectionSlot?.time}</strong></p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <p className="text-neutral-500 font-medium">No delivery or collection method selected yet.</p>
                                                    <button 
                                                        onClick={() => navigate('/')} 
                                                        className="text-[#8e5233] font-bold hover:underline uppercase text-[10px] tracking-wider block"
                                                    >
                                                        Choose delivery options on home page →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 bg-[#f5e6d3]/10 border border-neutral-200/40 rounded-[16px] p-4">
                                            {product.ingredients ? (
                                                <p className="text-neutral-700 whitespace-pre-line text-xs">
                                                    {product.ingredients}
                                                </p>
                                            ) : (
                                                <p className="text-neutral-500 italic text-xs">
                                                    No ingredients information available for this product.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Products Section */}
                    {displayRelated && displayRelated.length > 0 && (
                        <div className="pt-12 text-left">
                            <BrandLine className="w-full mb-12" />
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold font-serif text-[#8F5336]">You may also like</h3>
                                <div className="flex items-center gap-4">
                                    {/* Scroll Arrows */}
                                    {!showAllRelated && displayRelated.length > 4 && (
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => {
                                                    if (relatedScrollRef.current) {
                                                        relatedScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                                                    }
                                                }}
                                                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-[#8e5233] hover:bg-[#8e5233]/5 transition-colors cursor-pointer"
                                                aria-label="Scroll left"
                                            >
                                                <ChevronLeft size={16} strokeWidth={2.5} />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (relatedScrollRef.current) {
                                                        relatedScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                                                    }
                                                }}
                                                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-[#8e5233] hover:bg-[#8e5233]/5 transition-colors cursor-pointer"
                                                aria-label="Scroll right"
                                            >
                                                <ChevronRight size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => setShowAllRelated(!showAllRelated)} 
                                        className="text-xs md:text-sm font-bold text-[#8e5233] hover:text-[#8F5336] transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
                                    >
                                        <span>{showAllRelated ? 'Show less' : 'See all'}</span>
                                        {showAllRelated ? (
                                            <ChevronUp size={16} strokeWidth={2.5} />
                                        ) : (
                                            <ArrowDownRight size={16} strokeWidth={2.5} />
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            {showAllRelated ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {displayRelated.map((rp) => (
                                        <ProductCard key={rp.id} product={rp} />
                                    ))}
                                </div>
                            ) : (
                                <div 
                                    ref={relatedScrollRef}
                                    className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
                                >
                                    {displayRelated.slice(0, 10).map((rp) => (
                                        <div key={rp.id} className="w-[180px] sm:w-[220px] md:w-[240px] shrink-0">
                                            <ProductCard product={rp} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Category Products Rows section mirroring mockup */}
                    {catalog && catalog.length > 0 && (() => {
                        const activeCatSlug = selectedCategorySlug || catalog[0].slug;
                        const activeCategory = catalog.find(c => c.slug === activeCatSlug) || catalog[0];
                        return (
                            <div className="pt-12 text-left">
                                <BrandLine className="w-full mb-12" />
                                <div className="space-y-8">
                                     <div className="flex justify-between items-center gap-4 w-full pb-2">
                                         <div className="flex items-center gap-x-6 overflow-x-auto scrollbar-none text-left scroll-smooth flex-1 min-w-0">
                                             {catalog.map((cat) => {
                                                 const isActive = cat.slug === activeCatSlug;
                                                 return (
                                                     <button
                                                         key={cat.id}
                                                         onClick={() => setSelectedCategorySlug(cat.slug)}
                                                         className={`font-serif text-base font-normal pb-2 relative transition-colors cursor-pointer focus:outline-none shrink-0 whitespace-nowrap ${
                                                             isActive ? 'text-[#8e5233]' : 'text-neutral-400 hover:text-neutral-600'
                                                         }`}
                                                     >
                                                         {cat.name}
                                                         {isActive && (
                                                             <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8e5233]"></div>
                                                         )}
                                                     </button>
                                                 );
                                             })}
                                         </div>
                                         <button 
                                             onClick={() => setShowAllCategoryProducts(!showAllCategoryProducts)} 
                                             className="text-xs md:text-sm font-bold text-[#8e5233] hover:text-[#8F5336] transition-colors flex items-center gap-1 cursor-pointer focus:outline-none whitespace-nowrap shrink-0 pl-4"
                                         >
                                             <span>{showAllCategoryProducts ? 'Show less' : 'See all'}</span>
                                             {showAllCategoryProducts ? (
                                                 <ChevronUp size={16} strokeWidth={2.5} />
                                             ) : (
                                                 <ArrowDownRight size={16} strokeWidth={2.5} />
                                             )}
                                         </button>
                                     </div>

                                     <div>
                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                             {activeCategory.products && activeCategory.products.slice(0, 4).map((p) => (
                                                 <ProductCard key={p.id} product={p} />
                                             ))}
                                         </div>
                                         {activeCategory.products && activeCategory.products.length > 4 && (
                                             <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-500 ease-in-out overflow-hidden ${
                                                 showAllCategoryProducts ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                                             }`}>
                                                 {activeCategory.products.slice(4).map((p) => (
                                                     <ProductCard key={p.id} product={p} />
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="mt-12 md:mt-16">
                        <BrandPartnerSection />
                    </div>
                </main>
            </div>

            <Footer catalog={catalog} navigate={navigate} />

            {/* Sidebar Navigation Drawer */}
            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                cartItemCount={cartItemCount} 
                user={user} 
                logout={logout} 
            />
            {/* Fullscreen Image Lightbox Modal */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col justify-between p-6 select-none animate-fadeIn">
                    {/* Header Controls */}
                    <div className="flex justify-between items-center w-full max-w-6xl mx-auto z-10">
                        <span className="text-white/60 text-xs font-light font-mono">
                            {activeImageIndex + 1} / {getAllImages().length}
                        </span>
                        <button 
                            onClick={() => setIsLightboxOpen(false)}
                            className="text-white/70 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                            aria-label="Close fullscreen"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Main Image Frame */}
                    <div className="relative flex-grow flex items-center justify-center max-w-4xl mx-auto w-full h-[60vh] my-4">
                        <img 
                            src={getAllImages()[activeImageIndex]} 
                            alt={`${product.name} fullscreen`}
                            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-scaleIn"
                            onError={(e) => {
                                e.target.src = "/images/placeholder.svg";
                            }}
                        />

                        {/* Navigation Arrows */}
                        {getAllImages().length > 1 && (
                            <>
                                <button 
                                    onClick={() => setActiveImageIndex(prev => (prev - 1 + getAllImages().length) % getAllImages().length)}
                                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-all cursor-pointer"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button 
                                    onClick={() => setActiveImageIndex(prev => (prev + 1) % getAllImages().length)}
                                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-all cursor-pointer"
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails list at base */}
                    {getAllImages().length > 1 && (
                        <div className="w-full max-w-xl mx-auto z-10 flex justify-center gap-3 overflow-x-auto py-2 custom-scrollbar">
                            {getAllImages().map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`w-14 h-14 overflow-hidden rounded-xl border-2 shrink-0 transition-all ${
                                        activeImageIndex === idx ? 'border-white scale-102 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'
                                    }`}
                                >
                                    <img 
                                        src={url} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            e.target.src = "/images/placeholder.svg";
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
