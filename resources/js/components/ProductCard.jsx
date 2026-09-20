import React from 'react';
import { useApp } from '../AppContext';
import { Minus, Plus } from 'lucide-react';

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

export default function ProductCard({ product }) {
    const { cart, addToCart, updateCartQty, setIsCartOpen, openProductModal } = useApp();

    const pPrice = product.has_variations && product.variations && product.variations.length > 0
        ? parseFloat(product.variations[0].price).toFixed(2)
        : parseFloat(product.base_price || 0).toFixed(2);

    // Find cart items matching this product
    const matchingCartItems = cart.filter(item => item.product_id === product.id);
    const totalQty = matchingCartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleCardClick = () => {
        openProductModal(product);
    };

    const handleAdd = (e) => {
        e.stopPropagation();
        if (product.has_variations && product.variations && product.variations.length > 1) {
            openProductModal(product);
            return;
        }
        const variation = product.has_variations && product.variations && product.variations.length > 0 
            ? product.variations[0] 
            : null;
        addToCart(product, variation, 1);
    };

    const handleIncrement = (e) => {
        e.stopPropagation();
        if (matchingCartItems.length > 0) {
            const firstItem = matchingCartItems[0];
            updateCartQty(firstItem.key, firstItem.quantity + 1);
        } else {
            handleAdd(e);
        }
    };

    const handleDecrement = (e) => {
        e.stopPropagation();
        if (matchingCartItems.length > 0) {
            const firstItem = matchingCartItems[0];
            updateCartQty(firstItem.key, firstItem.quantity - 1);
        }
    };

    const handleBagClick = (e) => {
        e.stopPropagation();
        setIsCartOpen(true);
    };

    // Default friendly description snippet if product doesn't have one
    const descriptionText = product.description 
        || product.short_description 
        || "Every dessert tells a story. Every bite is a moment of pure bliss at Sweet Spot.";

    return (
        <div 
            onClick={handleCardClick}
            className="bg-white rounded-2xl p-3.5 sm:p-4 border border-neutral-200/70 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer text-left w-full select-none"
        >
            <div>
                {/* Product Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#faf7f2] rounded-xl border border-neutral-100 mb-3.5">
                    <img 
                        src={getImageUrl(product)} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            e.target.src = "/images/placeholder.svg";
                        }}
                    />
                </div>

                {/* Header Row: Product Name + Price Pill */}
                <div className="flex items-start justify-between gap-2.5">
                    <h3 className="font-bold text-neutral-900 text-sm sm:text-[14.5px] leading-snug line-clamp-1 group-hover:text-primary transition-colors flex-1">
                        {product.name}
                    </h3>
                    <div className="border border-neutral-900 rounded-full px-2.5 py-0.5 text-xs font-bold text-neutral-900 shrink-0 whitespace-nowrap">
                        £ {pPrice}
                    </div>
                </div>

                {/* Description snippet */}
                <p className="text-[11px] sm:text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed mt-1.5 min-h-[32px]">
                    {descriptionText}
                </p>
            </div>

            {/* Bottom Action Row: Default 'Add to Cart' or Active Qty Pill + Bag */}
            <div className="mt-3">
                {totalQty === 0 ? (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="w-full bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 rounded-full py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-xs"
                    >
                        <img 
                            src="/images/icons/bag.png" 
                            alt="Add" 
                            className="w-3.5 h-3.5 object-contain inline-block" 
                            style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(26%) saturate(693%) hue-rotate(345deg) brightness(96%) contrast(89%)' }} 
                        />
                        <span>Add to cart</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        {/* Quantity Controller Pill */}
                        <div className="flex-1 flex items-center justify-between border border-neutral-900 rounded-full px-1.5 py-1 bg-white shadow-2xs">
                            <button
                                type="button"
                                onClick={handleDecrement}
                                aria-label="Decrease quantity"
                                className="w-6 h-6 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:border-neutral-900 active:scale-90 transition-all cursor-pointer"
                            >
                                <Minus size={11} strokeWidth={2.5} />
                            </button>
                            <span className="font-bold text-xs sm:text-[13px] text-neutral-900 min-w-[20px] text-center select-none">
                                {totalQty}
                            </span>
                            <button
                                type="button"
                                onClick={handleIncrement}
                                aria-label="Increase quantity"
                                className="w-6 h-6 rounded-full bg-[#24161b] text-white hover:bg-black flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                            >
                                <Plus size={11} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* View in Cart Bag Button */}
                        <button
                            type="button"
                            onClick={handleBagClick}
                            aria-label="Open cart"
                            className="w-10 h-8 sm:w-11 sm:h-8.5 rounded-xl bg-[#24161b] hover:bg-black text-[#e5b582] flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
                            title="View in Cart"
                        >
                            <img 
                                src="/images/icons/bag.png" 
                                alt="Cart" 
                                className="w-3.5 h-3.5 object-contain inline-block" 
                                style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(26%) saturate(693%) hue-rotate(345deg) brightness(96%) contrast(89%)' }} 
                            />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
