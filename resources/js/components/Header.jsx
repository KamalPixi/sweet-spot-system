import React from 'react';
import { Menu, Search, User } from 'lucide-react';

import { useApp } from '../AppContext';
import { useLocation } from 'react-router-dom';

const Logo = () => (
    <svg className="w-8 h-8 text-white fill-current transition-transform hover:scale-105" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 26.5L6.5 13.5H11.5L16 19.5L20.5 13.5H25.5L16 26.5Z" />
        <path d="M16 11.5L11.5 5.5H20.5L16 11.5Z" />
    </svg>
);

export default function Header({ setIsMenuOpen, setIsSearchOpen, isSearchOpen, navigate, cartItemCount, user }) {
    const { setIsCartOpen } = useApp();
    const location = useLocation();
    const isCartRoute = location.pathname === '/cart' || location.pathname === '/checkout';

    const handleCartClick = () => {
        if (isCartRoute) return;
        setIsCartOpen(true);
    };
    return (
        <div className="bg-primary">
            <div className="w-full h-[72px] md:h-[80px] bg-primary relative overflow-hidden">
                <header className="w-full h-full px-4 md:px-12 flex justify-between items-center z-30 bg-transparent relative transform translate-y-[2px]">
                    <button 
                        onClick={() => setIsMenuOpen(true)} 
                        className="text-white hover:text-white/80 transition-colors p-1.5 pl-0 cursor-pointer focus:outline-none flex items-center justify-center"
                        aria-label="Open menu"
                    >
                        <Menu size={24} strokeWidth={1.5} />
                    </button>

                    <div 
                        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center select-none" 
                        onClick={() => navigate('/')}
                    >
                        <img 
                            src="/logo-white-sweetspot.png" 
                            alt="Sweet Spot" 
                            className="h-9 sm:h-11 w-auto object-contain transition-transform hover:scale-105" 
                        />
                    </div>

                    <div className="flex items-center space-x-0 md:space-x-4">
                        <button 
                            onClick={() => setIsSearchOpen(!isSearchOpen)} 
                            className="text-white hover:text-white/80 transition-colors px-1 py-1.5 md:p-2 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="Search"
                        >
                            <Search size={22} strokeWidth={1.5} />
                        </button>
                        <button 
                            onClick={handleCartClick} 
                            className="text-white hover:text-white/80 transition-colors px-1 py-1.5 md:p-2 cursor-pointer relative focus:outline-none"
                            aria-label="Cart"
                        >
                            <img src="/images/icons/bag.png" alt="Cart" className="w-[22px] h-[22px] object-contain inline-block" style={{ filter: 'brightness(0) invert(1)' }} />
                            {cartItemCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white text-[#8e5233] text-[9px] font-black rounded-full flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => navigate(user ? '/account' : '/login')} 
                            className="text-white hover:text-white/80 transition-colors pl-1 pr-0 py-1.5 md:p-2 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="User"
                        >
                            <User size={22} strokeWidth={1.5} />
                        </button>
                    </div>
                </header>
            </div>
        </div>
    );
}
