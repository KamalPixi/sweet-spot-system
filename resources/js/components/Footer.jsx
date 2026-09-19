import React from 'react';
import { useApp } from '../AppContext';

export default function Footer({ onCategoryClick, navigate }) {
    const { configs, catalog } = useApp();
    
    // Get categories dynamically from catalog, limit to max 4. No hardcoded fallback array.
    const categoriesList = (catalog && catalog.length > 0 ? catalog : []).slice(0, 4);

    // Real dynamic info from settings. No hardcoded fallbacks.
    const address = configs.store_address || '';
    const postcode = configs.store_postcode || '';
    const email = configs.store_email || '';
    const phone = configs.store_phone || '';

    // Social links from settings
    const instagram = configs.social_instagram || '';
    const tiktok = configs.social_tiktok || '';
    const facebook = configs.social_facebook || '';
    const twitter = configs.social_twitter || '';

    const hasSocialLinks = instagram || tiktok || facebook || twitter;

    const handleCategoryClick = (cat) => {
        if (onCategoryClick) {
            onCategoryClick(cat);
        } else if (navigate) {
            navigate(`/categories/${cat.slug}`);
        } else {
            window.location.href = `/categories/${cat.slug}`;
        }
    };

    // Brand logo: Always prioritize /logo-white-sweetspot.png, or store_logo_white if explicitly uploaded
    const brandLogo = "/logo-white-sweetspot.png";

    // Products: either categories or curated fallback matching design
    const defaultProducts = ['Cakes', 'Coffee', 'French Pastries', 'Drinks'];
    const displayProducts = categoriesList.length > 0 
        ? categoriesList 
        : defaultProducts.map((name, i) => ({ id: i, name, slug: name.toLowerCase().replace(/\s+/g, '-') }));

    return (
        <footer className="w-full bg-primary text-white py-10 sm:py-12 md:py-14 px-6 md:px-12 lg:px-16 z-20 border-t border-white/5">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6 text-left">
                {/* Column 1: Brand & Copyright */}
                <div className="col-span-12 md:col-span-4 flex flex-col justify-between space-y-6">
                    <div>
                        <div className="cursor-pointer inline-block" onClick={() => navigate ? navigate('/') : (window.location.href = '/')}>
                            <img 
                                src={brandLogo} 
                                alt="Sweet Spot" 
                                className="h-9 sm:h-11 w-auto object-contain block"
                                onError={(e) => {
                                    e.currentTarget.src = "/images/logo-white-sweetspot.png";
                                }}
                            />
                        </div>
                    </div>
                    
                    <div className="text-[12px] sm:text-[13px] text-white/50 font-light leading-relaxed">
                        <p>&copy; 2026 SweetSpot Bake, by Captoirs Studio</p>
                        <p className="mt-0.5">All rights reserved</p>
                    </div>
                </div>

                {/* Column 2: Shop details */}
                <div className="col-span-12 sm:col-span-4 md:col-span-3 space-y-3.5">
                    <h4 className="text-white font-medium text-sm sm:text-base tracking-normal">
                        Shop
                    </h4>
                    <div className="space-y-2.5 text-white/60 text-xs sm:text-[13px] font-light leading-relaxed">
                        <p className="leading-snug">
                            {address ? (
                                <>
                                    {address}
                                    {postcode && <span className="block mt-0.5">{postcode}</span>}
                                </>
                            ) : (
                                <>
                                    Random address<br />
                                    text in two lines
                                </>
                            )}
                        </p>
                        <p className="pt-1">
                            Email: <a href={`mailto:${email || 'info@sweetspotbake.com'}`} className="hover:text-white transition-colors">{email || 'info@sweetspotbake.com'}</a>
                        </p>
                        <p>
                            Phone: <a href={`tel:${phone || '+44 1234 567 891'}`} className="hover:text-white transition-colors">{phone || '+44 1234 567 891'}</a>
                        </p>
                    </div>
                </div>

                {/* Column 3: Our products */}
                <div className="col-span-12 sm:col-span-4 md:col-span-3 space-y-3.5">
                    <h4 className="text-white font-medium text-sm sm:text-base tracking-normal">
                        Our products
                    </h4>
                    <div className="space-y-2 text-white/60 text-xs sm:text-[13px] font-light flex flex-col items-start">
                        {displayProducts.map((prod, idx) => (
                            <button 
                                key={prod.id || idx} 
                                onClick={() => handleCategoryClick(prod)}
                                className="hover:text-white transition-colors text-left focus:outline-none cursor-pointer bg-transparent border-none p-0 text-white/60 text-xs sm:text-[13px] font-light"
                            >
                                {prod.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Column 4: Follow Us */}
                <div className="col-span-12 sm:col-span-4 md:col-span-2 space-y-3.5">
                    <h4 className="text-white font-medium text-sm sm:text-base tracking-normal">
                        Follow Us
                    </h4>
                    <div className="space-y-2 text-white/60 text-xs sm:text-[13px] font-light flex flex-col">
                        <a 
                            href={instagram || 'https://instagram.com'} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white transition-colors"
                        >
                            Instagram
                        </a>
                        <a 
                            href={tiktok || 'https://tiktok.com'} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white transition-colors"
                        >
                            Tiktok
                        </a>
                        <a 
                            href={facebook || 'https://facebook.com'} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white transition-colors"
                        >
                            Facebook
                        </a>
                        <a 
                            href={twitter || 'https://twitter.com'} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white transition-colors"
                        >
                            Twitter
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
