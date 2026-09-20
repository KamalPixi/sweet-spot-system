import React from 'react';
import { useApp } from '../AppContext';

export default function HeaderCartButton({ className = "" }) {
    const { cartItemCount, isCartLoading, openCart } = useApp();

    return (
        <button 
            type="button"
            onClick={openCart} 
            className={`relative p-2 rounded-full text-white/90 hover:text-white transition-all cursor-pointer focus:outline-none flex items-center justify-center group active:scale-90 ${className}`}
            aria-label="Open shopping basket"
            title={isCartLoading ? "Opening basket..." : "View basket"}
        >
            {/* Subtle rotating gold spinner halo while opening */}
            {isCartLoading && (
                <>
                    <span className="absolute inset-0 rounded-full bg-[#e5b582]/25 animate-ping pointer-events-none" />
                    <span className="absolute inset-0.5 rounded-full border-2 border-white/10 border-t-[#e5b582] border-r-[#e5b582] animate-spin pointer-events-none" />
                </>
            )}

            {/* Bag Icon */}
            <img 
                src="/images/icons/bag.png" 
                alt="Cart" 
                className={`w-[19px] h-[19px] object-contain transition-all duration-200 ${
                    isCartLoading ? 'scale-90' : 'group-hover:scale-105'
                }`}
                style={{ 
                    filter: isCartLoading 
                        ? 'brightness(0) saturate(100%) invert(80%) sepia(26%) saturate(693%) hue-rotate(345deg) brightness(96%) contrast(89%)' 
                        : 'brightness(0) invert(1)' 
                }} 
            />

            {/* Brand Cart Count Badge */}
            {cartItemCount > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 bg-[#e5b582] text-[#24161b] text-[9.5px] font-black rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center shadow-xs transition-transform ${
                    isCartLoading ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                    {cartItemCount}
                </span>
            )}
        </button>
    );
}
