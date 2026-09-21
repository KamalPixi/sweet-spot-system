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
    const location = useLocation();
    const isCartRoute = location.pathname === '/cart' || location.pathname === '/checkout';

    return (
        <div className="bg-primary">
            <div className="w-full h-[72px] md:h-[80px] bg-primary relative overflow-hidden">
                <header className="w-full h-full px-4 md:px-12 flex justify-between items-center z-30 bg-transparent relative transform translate-y-[2px]">
                    {/* Left Actions Group (Width matches Right group for visual optical balance) */}
                    <div className="flex items-center min-w-[120px] md:min-w-[160px] justify-start">
                        <button 
                            onClick={() => setIsMenuOpen(true)} 
                            className="text-white hover:text-white/80 transition-colors p-1.5 pl-0 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="Open menu"
                        >
                            <MenuIcon className="w-6 h-6" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Visually & Optically Centered Logo */}
                    <div className="flex-1 flex items-center justify-center">
                        <div 
                            className="cursor-pointer flex items-center justify-center select-none" 
                            onClick={() => navigate('/')}
                        >
                            <img 
                                src="/logo-white-sweetspot.png" 
                                alt="Sweet Spot" 
                                className="h-9 sm:h-11 w-auto object-contain transition-transform hover:scale-105" 
                            />
                        </div>
                    </div>

                    {/* Right Actions Group */}
                    <div className="flex items-center min-w-[120px] md:min-w-[160px] justify-end space-x-1 md:space-x-4">
                        <HeaderSearchButton className="p-1 md:p-2" />
                        {!isCartRoute && (
                            <HeaderCartButton />
                        )}
                        <button 
                            onClick={() => navigate(user ? '/account' : '/login')} 
                            className="text-white hover:text-white/80 transition-colors p-1 md:p-2 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="User"
                        >
                            <UserIcon className="w-[21px] h-[21px]" strokeWidth={1.75} />
                        </button>
                    </div>
                </header>
            </div>
        </div>
    );
}
