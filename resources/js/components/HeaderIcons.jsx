import React from 'react';

/**
 * Modern Luxury Minimalist Icon Set for Sweet Spot Storefront Header
 * Replaces the generic icons and legacy PNG files with bespoke SVG icons.
 */

export function MenuIcon({ className = "w-5 h-5", strokeWidth = 2 }) {
    return (
        <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <line x1="3.5" y1="8" x2="20.5" y2="8" />
            <line x1="3.5" y1="16" x2="14.5" y2="16" />
        </svg>
    );
}

export function SearchIcon({ className = "w-5 h-5", strokeWidth = 1.75 }) {
    return (
        <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <circle cx="11" cy="11" r="7.5" />
            <path d="m16.5 16.5 4.5 4.5" />
        </svg>
    );
}

export function CartBagIcon({ className = "w-5 h-5", strokeWidth = 1.75 }) {
    return (
        <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            {/* Boutique tote bag handles */}
            <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
            {/* Rounded tote bag body */}
            <path d="M4.5 8.5h15l-1.2 11.2a2.5 2.5 0 0 1-2.48 2.3H8.18a2.5 2.5 0 0 1-2.48-2.3L4.5 8.5Z" />
        </svg>
    );
}

export function UserIcon({ className = "w-5 h-5", strokeWidth = 1.75 }) {
    return (
        <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <circle cx="12" cy="7.5" r="4" />
            <path d="M5.5 20.5a6.5 6.5 0 0 1 13 0" />
        </svg>
    );
}
