import React from 'react';
import { MenuIcon, SearchIcon, UserIcon } from './HeaderIcons';
import { useApp } from '../AppContext';
import { useLocation } from 'react-router-dom';
import HeaderCartButton from './HeaderCartButton';
import HeaderSearchButton from './HeaderSearchButton';

const Logo = () => (
    <svg className="w-8 h-8 text-white fill-current transition-transform hover:scale-105" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 26.5L6.5 13.5H11.5L16 19.5L20.5 13.5H25.5L16 26.5Z" />
        <path d="M16 11.5L11.5 5.5H20.5L16 11.5Z" />
    </svg>
);

export default function Header({ setIsMenuOpen, setIsSearchOpen, isSearchOpen, navigate, cartItemCount, user }) {
    const { configs } = useApp();
    const location = useLocation();
    const isCartRoute = location.pathname === '/cart' || location.pathname === '/checkout';

    return (
        <div className="bg-primary">
            <div className="w-full h-[72px] md:h-[80px] bg-primary relative">
                <header className="w-full h-full px-5 md:px-10 lg:px-16 grid grid-cols-3 items-center z-30 bg-transparent relative transform translate-y-[2px]">
                    {/* Left: Hamburger menu */}
                    <div className="flex items-center justify-start">
                        <button 
                            onClick={() => setIsMenuOpen(true)} 
                            className="text-white/90 hover:text-white transition-colors p-1.5 -ml-1.5 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="Open menu"
                        >
                            <MenuIcon className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Center: Brand Logo (Exactly in the middle 1/3) */}
                    <div className="flex items-center justify-center">
                        <div 
                            className="cursor-pointer flex items-center justify-center select-none" 
                            onClick={() => navigate('/')}
                        >
                            {configs?.store_logo_white ? (
                                <img 
                                    src={configs.store_logo_white} 
                                    alt={configs?.store_name || "Sweet Spot"} 
                                    className="h-7 sm:h-8 w-auto object-contain transition-transform hover:scale-105" 
                                />
                            ) : (
                                <span className="text-white font-black text-lg tracking-tight hover:opacity-90 transition-opacity">
                                    {configs?.store_name || ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions (Search, Cart, User) */}
                    <div className="flex items-center justify-end space-x-1 sm:space-x-2 md:space-x-3">
                        <HeaderSearchButton className="p-1.5" />
                        {!isCartRoute && (
                            <HeaderCartButton />
                        )}
                        <button 
                            onClick={() => navigate(user ? '/account' : '/login')} 
                            className="text-white/90 hover:text-white transition-colors p-1.5 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="User"
                        >
                            <UserIcon className="w-[19px] h-[19px]" strokeWidth={1.75} />
                        </button>
                    </div>
                </header>
            </div>
        </div>
    );
}
