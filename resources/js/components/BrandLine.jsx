import React from 'react';

export default function BrandLine({ className = "", variant = "primary" }) {
    const bg = variant === "white" 
        ? 'linear-gradient(to right, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.1) 80%, transparent 100%)'
        : 'linear-gradient(to right, rgba(142, 82, 51, 0.45) 0%, rgba(142, 82, 51, 0.08) 80%, transparent 100%)';
    return (
        <div 
            className={`h-[1.5px] ${className}`} 
            style={{ background: bg }}
        />
    );
}
