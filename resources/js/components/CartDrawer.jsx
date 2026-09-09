import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { X, Minus, Plus, Trash2, ShoppingBag, Truck } from 'lucide-react';

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
        orderType
    } = useApp();

    const drawerRef = useRef(null);

    // Prevent body scrolling when the drawer is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen]);

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

    return (
        <>
            {/* Backdrop Blur Overlay */}
            <div 
                onClick={handleBackdropClick}
                className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
                    isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                {/* Sliding Drawer Container */}
                <div 
                    ref={drawerRef}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute right-0 top-0 h-full w-full max-w-md bg-[#fdfaf5] shadow-2xl flex flex-col justify-between transition-transform duration-300 transform ${
                        isCartOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[#8e5233]/15 flex justify-between items-center bg-[#8e5233]/5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#8e5233] text-white flex items-center justify-center">
                                <img src="/images/icons/bag.png" alt="Cart" className="w-[15px] h-[15px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-[#8e5233] text-base">Your Basket</h3>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">
                                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsCartOpen(false)}
                            className="w-8 h-8 rounded-full bg-white border border-[#8e5233]/20 flex items-center justify-center text-neutral-500 hover:text-[#8e5233] hover:border-[#8e5233] transition-colors cursor-pointer focus:outline-none"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable Cart Items List */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                                <div className="w-12 h-12 rounded-full border border-dashed border-[#8e5233]/40 flex items-center justify-center text-neutral-450">
                                    <img src="/images/icons/bag.png" alt="Empty Cart" className="w-[20px] h-[20px] object-contain opacity-55" />
                                </div>
                                <p className="text-neutral-400 text-xs font-light">Your shopping basket is empty.</p>
                                <button 
                                    onClick={() => setIsCartOpen(false)}
                                    className="text-xs font-bold text-[#8e5233] hover:underline"
                                >
                                    Explore our sweets
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-200/50">
                                {cart.map((item) => (
                                    <div key={item.key} className="py-4 first:pt-0 flex items-stretch gap-4 text-xs text-left">
                                        {/* Image */}
                                        <div className="w-[72px] h-[72px] bg-[#eae2d5] rounded-xl overflow-hidden shrink-0 border border-neutral-200/60">
                                            <img 
                                                src={getImageUrl(item.image)} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => {
                                                    e.target.src = "/images/placeholder.svg";
                                                }}
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-grow flex flex-col justify-between">
                                            <div>
                                                <span className="font-semibold text-neutral-900 leading-tight block pr-2">
                                                    {item.name}
                                                </span>
                                                {item.variation_name && (
                                                    <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
                                                        {item.variation_name}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Quantity Pill Selector */}
                                            <div className="flex items-center border border-[#8e5233] bg-white rounded-full w-fit px-1.5 py-0.5 mt-1">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); updateCartQty(item.key, item.quantity - 1); }}
                                                    className="w-6 h-6 rounded-full text-[#8e5233] hover:bg-[#8e5233] hover:text-white flex items-center justify-center transition-colors font-bold cursor-pointer active:scale-90"
                                                >
                                                    <Minus size={10} />
                                                </button>
                                                <span className="px-2 text-[10px] font-bold text-neutral-750">{item.quantity}</span>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); updateCartQty(item.key, item.quantity + 1); }}
                                                    className="w-6 h-6 rounded-full text-[#8e5233] hover:bg-[#8e5233] hover:text-white flex items-center justify-center transition-colors font-bold cursor-pointer active:scale-90"
                                                >
                                                    <Plus size={10} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Right side: Delete & Price */}
                                        <div className="shrink-0 flex flex-col justify-between items-end">
                                            <button 
                                                type="button"
                                                onClick={() => removeFromCart(item.key)}
                                                className="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer flex items-center justify-center focus:outline-none -mr-1"
                                                title="Remove item"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                            
                                            <div className="text-right">
                                                <span className="font-serif font-semibold text-neutral-800 text-sm">
                                                    £{(item.price * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer / Summary Totals */}
                    {cart.length > 0 && (
                        <div className="p-6 border-t border-[#8e5233]/15 bg-[#8e5233]/5 space-y-4">
                            <div className="flex justify-between items-baseline text-left">
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Subtotal</span>
                                <span className="font-serif font-bold text-xl text-[#8e5233]">
                                    £{cartSubtotal.toFixed(2)}
                                </span>
                            </div>
                            {orderType === 'delivery' && (
                                <p className="flex items-center gap-1.5 text-[10px] text-neutral-400 text-left">
                                    <Truck size={11} className="shrink-0 text-[#8e5233]/70" />
                                    Delivery charge will be calculated at checkout.
                                </p>
                            )}

                            <div className="space-y-2">
                                <button 
                                    onClick={handleCheckoutRedirect}
                                    className="w-full bg-[#8e5233] hover:bg-[#723e25] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center shadow-md shadow-[#8e5233]/10 transition-colors cursor-pointer font-serif text-sm tracking-wide"
                                >
                                    View Basket & Checkout
                                </button>
                                <button 
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full bg-white hover:bg-neutral-50 text-[#8e5233] border border-[#8e5233]/30 font-semibold rounded-xl py-3 flex items-center justify-center transition-colors cursor-pointer text-xs uppercase tracking-wider"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
