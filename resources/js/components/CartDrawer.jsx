import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { X, Minus, Plus, Trash2, Truck, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { CartBagIcon } from './HeaderIcons';

const getImageUrl = (url) => {
    if (!url) return '/images/placeholder.svg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
    return `/storage/${cleanUrl}`;
};

export default function CartDrawer() {
    const navigate = useNavigate();
    const { 
        cart, 
        updateCartQty, 
        removeFromCart, 
        cartSubtotal, 
        cartItemCount,
        isCartOpen, 
        setIsCartOpen,
        orderType,
        tableNumber
    } = useApp();

    const drawerRef = useRef(null);

    // Prevent body scrolling when the drawer is open and listen for Escape key
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') setIsCartOpen(false);
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = 'unset';
                window.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isCartOpen, setIsCartOpen]);

    // Handle clicks outside of the drawer panel to close it
    const handleBackdropClick = (e) => {
        if (drawerRef.current && !drawerRef.current.contains(e.target)) {
            setIsCartOpen(false);
        }
    };

    const handleCheckoutRedirect = () => {
        setIsCartOpen(false);
        navigate('/cart');
    };

    const handleExploreMenu = () => {
        setIsCartOpen(false);
        navigate('/categories');
    };

    return (
        <div 
            onClick={handleBackdropClick}
            className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
                isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
        >
            {/* Floating Luxury Island Container (Margins on all sides, rounded island) */}
            <div 
                ref={drawerRef}
                onClick={(e) => e.stopPropagation()}
                className={`fixed z-50 top-2 bottom-2 right-2 sm:top-4 sm:bottom-4 sm:right-4 w-[calc(100%-16px)] sm:w-[500px] md:w-[520px] max-w-xl bg-[#24161b] rounded-2xl shadow-2xl border border-black/15 flex flex-col justify-between overflow-hidden transition-all duration-300 ease-out transform ${
                    isCartOpen 
                        ? 'translate-x-0 opacity-100 scale-100' 
                        : 'translate-x-12 opacity-0 scale-95 pointer-events-none'
                }`}
            >
                {/* Upper White Section: Header + Scrollable Cart Items */}
                <div className="flex flex-col flex-1 min-h-0 bg-white">
                    {/* Header Row */}
                    <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#24161b] text-[#e5b582] flex items-center justify-center shadow-xs">
                            <CartBagIcon className="w-4 h-4 text-[#e5b582]" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-[#24161b] text-base leading-tight">
                                Your Basket
                            </h3>
                            <span className="text-[10.5px] text-neutral-400 font-semibold tracking-wider uppercase">
                                {cartItemCount} {cartItemCount === 1 ? 'treat' : 'treats'} selected
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsCartOpen(false)}
                        className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer border border-neutral-200/60 active:scale-95"
                        aria-label="Close cart"
                    >
                        <X size={15} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Cart Items List */}
                <div className="flex-grow overflow-y-auto px-4 sm:px-5 py-3 space-y-2.5 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center space-y-3.5 py-12 px-4">
                            <div className="w-16 h-16 rounded-full bg-[#faf7f2] border border-[#e5b582]/40 flex items-center justify-center text-[#24161b] shadow-2xs">
                                <CartBagIcon className="w-7 h-7 text-[#24161b]" strokeWidth={1.75} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-black text-neutral-900 text-base">Your bag is empty</h4>
                                <p className="text-xs text-neutral-400 font-light max-w-[220px] mx-auto leading-relaxed">
                                    Every dessert tells a story. Discover our freshly baked artisanal treats.
                                </p>
                            </div>
                            <button 
                                onClick={handleExploreMenu}
                                className="bg-[#24161b] hover:bg-black text-[#e5b582] hover:text-white border border-[#e5b582]/30 rounded-full py-2.5 px-5 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs flex items-center gap-1.5"
                            >
                                <span>Explore Our Menu</span>
                                <ArrowRight size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div 
                                key={item.key} 
                                className="bg-[#faf7f2] rounded-xl p-3 border border-neutral-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 text-left"
                            >
                                {/* Thumbnail */}
                                <div className="w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0 border border-neutral-200/70">
                                    <img 
                                        src={getImageUrl(item.image)} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            e.target.src = "/images/placeholder.svg";
                                        }}
                                    />
                                </div>

                                {/* Item Info & Controls */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-neutral-900 text-xs sm:text-[13px] leading-snug line-clamp-1">
                                                {item.name}
                                            </h4>
                                            <div className="border border-neutral-900 rounded-full px-2 py-0.5 text-[11px] font-bold text-neutral-900 shrink-0 whitespace-nowrap">
                                                £{(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </div>

                                        {item.variation_name && !item.is_box && (
                                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-white border border-neutral-200 rounded-full text-[10px] font-semibold text-neutral-600">
                                                {item.variation_name}
                                            </span>
                                        )}

                                        {item.is_box && Array.isArray(item.box_items) && item.box_items.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {item.box_items.map((b, bi) => (
                                                    <span key={bi} className="inline-flex items-center text-[9.5px] bg-white border border-neutral-200/80 text-[#24161b] px-1.5 py-0.5 rounded-md font-medium">
                                                        {b.quantity}x {b.product_name || b.name}{b.variation_name ? ` (${b.variation_name})` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Row: Stepper & Remove */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center justify-between border border-neutral-900 rounded-full px-1.5 py-0.5 bg-white shadow-2xs w-22">
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); updateCartQty(item.key, item.quantity - 1); }}
                                                className="w-5 h-5 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 active:scale-90 transition-all cursor-pointer"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={9} strokeWidth={2.5} />
                                            </button>
                                            <span className="font-bold text-xs text-neutral-900 select-none">
                                                {item.quantity}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); updateCartQty(item.key, item.quantity + 1); }}
                                                className="w-5 h-5 rounded-full bg-[#24161b] text-white hover:bg-black flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={9} strokeWidth={2.5} />
                                            </button>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => removeFromCart(item.key)}
                                            className="text-neutral-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                            title="Remove item"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </div>

                {/* Docked Summary & Checkout Bar (Full-width, integrated with container bottom) */}
                {cart.length > 0 && (
                    <div className="w-full px-5 py-4 sm:px-6 sm:py-5 bg-[#24161b] text-white space-y-3 border-t border-black/20 shrink-0 text-left">
                        <div className="flex justify-between items-baseline">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                                Subtotal
                            </span>
                            <span className="font-black text-lg sm:text-xl text-[#e5b582]">
                                £{cartSubtotal.toFixed(2)}
                            </span>
                        </div>

                        {orderType && (
                            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                                {orderType === 'dine_in' ? (
                                    <UtensilsCrossed size={12} className="shrink-0 text-[#e5b582]" />
                                ) : (
                                    <Truck size={12} className="shrink-0 text-[#e5b582]" />
                                )}
                                <span>
                                    {orderType === 'dine_in' 
                                        ? `Dine-In Table #${tableNumber || '?'} • Table Service` 
                                        : orderType === 'delivery' 
                                            ? 'Home Delivery • calculated at checkout' 
                                            : 'Store Collection • free'}
                                </span>
                            </div>
                        )}

                        <div className="space-y-1.5 pt-1">
                            <button 
                                type="button"
                                onClick={handleCheckoutRedirect}
                                className="w-full bg-[#e5b582] hover:bg-[#d8a36b] text-[#24161b] font-bold rounded-full py-3 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98"
                            >
                                <CartBagIcon className="w-4 h-4 text-[#24161b]" strokeWidth={2} />
                                <span>Proceed to Checkout</span>
                                <ArrowRight size={13} strokeWidth={2.5} />
                            </button>

                            <button 
                                type="button"
                                onClick={() => setIsCartOpen(false)}
                                className="w-full text-center text-[11px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer py-1"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
