import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Minus, Plus, Check } from 'lucide-react';
import { useApp } from '../AppContext';
import { CartBagIcon } from './HeaderIcons';

const formatImageUrl = (url) => {
    if (!url) return '/images/placeholder.svg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
    return `/storage/${cleanUrl}`;
};

export default function ProductDetailModal({ isOpen, onClose, product }) {
    const { addToCart, setIsCartOpen } = useApp();

    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);
    const [addedFeedback, setAddedFeedback] = useState(false);

    // Synchronize initial state whenever product changes or modal opens
    useEffect(() => {
        if (product) {
            setQuantity(1);
            setCurrentSlideIndex(0);
            setAddedFeedback(false);
            if (product.has_variations && product.variations && product.variations.length > 0) {
                setSelectedVariation(product.variations[0]);
            } else {
                setSelectedVariation(null);
            }
        }
    }, [product, isOpen]);

    // Close on Escape key & manage scroll lock
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    // Build image list from variation or product
    const getImagesList = () => {
        const list = [];
        // If current variation has dedicated images
        if (selectedVariation?.images && selectedVariation.images.length > 0) {
            selectedVariation.images.forEach(img => {
                const u = typeof img === 'string' ? img : (img.url || img.image);
                if (u) list.push(formatImageUrl(u));
            });
        }
        if (selectedVariation?.image) {
            list.push(formatImageUrl(selectedVariation.image));
        }

        // Product gallery images
        if (product.images && product.images.length > 0) {
            const sorted = [...product.images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
            sorted.forEach(img => {
                const u = typeof img === 'string' ? img : (img.url || img.image);
                if (u) list.push(formatImageUrl(u));
            });
        }

        // Product fallback image
        if (product.image) {
            list.push(formatImageUrl(product.image));
        }

        // Deduplicate
        const unique = Array.from(new Set(list));
        return unique.length > 0 ? unique : ['/images/placeholder.svg'];
    };

    const images = getImagesList();
    const activeImage = images[Math.min(currentSlideIndex, images.length - 1)] || images[0];

    // Slide navigation
    const handlePrev = (e) => {
        e?.stopPropagation();
        setCurrentSlideIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e?.stopPropagation();
        setCurrentSlideIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    // Touch swipe handling for mobile
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

    // Pricing calculation
    const unitPrice = selectedVariation
        ? parseFloat(selectedVariation.price)
        : parseFloat(product.base_price || 0);
    const totalPrice = (unitPrice * quantity).toFixed(2);

    const handleAddToCart = (e) => {
        e?.stopPropagation();
        addToCart(product, selectedVariation, quantity);
        setAddedFeedback(true);
        setTimeout(() => {
            setAddedFeedback(false);
            setIsCartOpen(true);
            onClose();
        }, 600);
    };

    const descriptionText = product.description 
        || product.short_description 
        || "Every dessert tells a story. Freshly prepared, made with love, and delivered straight to your doorstep.";

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg md:max-w-3xl lg:max-w-[820px] bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col md:flex-row my-auto max-h-[90vh] md:max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    type="button"
                    aria-label="Close modal"
                    className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-neutral-600 hover:text-neutral-900 flex items-center justify-center shadow-md transition-all cursor-pointer border border-neutral-200/60 active:scale-95"
                >
                    <X size={16} strokeWidth={2.5} />
                </button>

                {/* Left: Image Slideshow */}
                <div 
                    className="relative w-full md:w-[46%] aspect-square md:aspect-auto md:min-h-[380px] bg-[#faf7f2] flex items-center justify-center select-none overflow-hidden shrink-0"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <img 
                        src={activeImage} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-all duration-300"
                        onError={(e) => { e.target.src = '/images/placeholder.svg'; }}
                    />

                    {/* Prev / Next Slide Arrows (only if multiple images) */}
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={handlePrev}
                                aria-label="Previous image"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-neutral-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-all active:scale-90 cursor-pointer"
                            >
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                            <button
                                type="button"
                                onClick={handleNext}
                                aria-label="Next image"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-neutral-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-all active:scale-90 cursor-pointer"
                            >
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </button>

                            {/* Dots Indicator */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-xs">
                                {images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentSlideIndex(idx);
                                        }}
                                        aria-label={`Slide ${idx + 1}`}
                                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                            idx === currentSlideIndex 
                                                ? 'w-4 bg-white' 
                                                : 'w-1.5 bg-white/50 hover:bg-white/80'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Product Details & Actions */}
                <div className="p-6 sm:p-7 md:p-8 flex-1 flex flex-col justify-between overflow-y-auto">
                    <div>
                        {/* Category Label */}
                        <div className="mb-2 pr-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                {product.category?.name || 'Sweet Spot Treat'}
                            </span>
                        </div>

                        {/* Product Title */}
                        <h2 className="text-xl sm:text-2xl font-black text-[#24161b] leading-tight">
                            {product.name}
                        </h2>

                        {/* Description */}
                        <p className="text-xs sm:text-[13px] text-neutral-500 font-light leading-relaxed mt-2.5 line-clamp-3">
                            {descriptionText}
                        </p>

                        {/* Variation Selector (if available) */}
                        {product.has_variations && product.variations && product.variations.length > 1 && (
                            <div className="mt-4 pt-3.5 border-t border-neutral-100">
                                <div className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-2">
                                    Option
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.variations.map((variation) => {
                                        const isSelected = selectedVariation?.id === variation.id;
                                        return (
                                            <button
                                                key={variation.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedVariation(variation);
                                                    setCurrentSlideIndex(0);
                                                }}
                                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[#24161b] text-[#e5b582] border-[#24161b] shadow-xs'
                                                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                                                }`}
                                            >
                                                {variation.name} (£{parseFloat(variation.price).toFixed(2)})
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="mt-6 pt-4 border-t border-neutral-100 space-y-3">
                        <div className="flex items-center gap-3">
                            {/* Quantity Stepper */}
                            <div className="flex items-center justify-between border border-neutral-900 rounded-full px-2.5 py-1 bg-white shadow-2xs w-24 sm:w-26 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                    disabled={quantity <= 1}
                                    aria-label="Decrease quantity"
                                    className={`w-6 h-6 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 transition-all ${
                                        quantity <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-neutral-100 active:scale-90 cursor-pointer'
                                    }`}
                                >
                                    <Minus size={11} strokeWidth={2.5} />
                                </button>
                                <span className="font-bold text-xs sm:text-[13px] text-neutral-900 select-none">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(prev => prev + 1)}
                                    aria-label="Increase quantity"
                                    className="w-6 h-6 rounded-full bg-[#24161b] text-white hover:bg-black flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                                >
                                    <Plus size={11} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Add to Cart CTA */}
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                className="flex-1 bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 rounded-full py-2.5 px-4 text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
                            >
                                {addedFeedback ? (
                                    <>
                                        <Check size={14} className="text-green-400" />
                                        <span className="text-green-400 whitespace-nowrap">Added!</span>
                                    </>
                                ) : (
                                    <>
                                        <CartBagIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                                        <span className="whitespace-nowrap">Add to cart • £ {totalPrice}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
