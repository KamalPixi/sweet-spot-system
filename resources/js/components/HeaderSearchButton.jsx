import React from 'react';
import { useApp } from '../AppContext';
import { SearchIcon } from './HeaderIcons';

export default function HeaderSearchButton({ className = "" }) {
    const { isSearchOpen, setIsSearchOpen } = useApp();

    return (
        <button 
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)} 
            className={`relative p-2 rounded-full text-white/90 hover:text-white transition-all cursor-pointer focus:outline-none flex items-center justify-center group active:scale-90 ${className}`}
            aria-label="Search treats"
            title={isSearchOpen ? "Close search" : "Search treats"}
        >
            {/* Subtle rotating gold spinner halo while search modal is open */}
            {isSearchOpen && (
                <>
                    <span className="absolute inset-0 rounded-full bg-[#e5b582]/25 animate-ping pointer-events-none" />
                    <span className="absolute inset-0.5 rounded-full border-2 border-white/10 border-t-[#e5b582] border-r-[#e5b582] animate-spin pointer-events-none" />
                </>
            )}

            {/* Search Icon with matching transition */}
            <span className={`transition-all duration-200 ${
                isSearchOpen ? 'scale-90 text-[#e5b582]' : 'group-hover:scale-105 text-white'
            }`}>
                <SearchIcon className="w-[19px] h-[19px]" strokeWidth={1.75} />
            </span>
        </button>
    );
}
