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

    return (
        <footer className="w-full bg-[#8F5336] text-white/80 pt-20 md:pt-24 pb-12 px-6 md:px-12 rounded-none z-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 text-left text-xs">
                {/* Brand Info */}
                <div className="col-span-12 md:col-span-4 space-y-4">
                    <div className="mb-2">
                        <img src={configs?.store_logo_white || "/images/footer-logo.png"} alt="Sweet Spot System" className="h-14 w-auto" />
                    </div>
                    <p className="text-white/40 font-light max-w-xs leading-relaxed">
                        Handcrafted daily in the heart of London. Indulge in artisanal cakes, braids, and specialty coffees.
                    </p>
                    <p className="text-white/30 text-[10px] font-light pt-2">
                        &copy; 2026 Sweet Spot System, by Captoirs Studio <span className="block mt-0.5">All rights reserved</span>
                    </p>
                </div>

                {/* Shop details */}
                <div className="col-span-12 sm:col-span-4 md:col-span-3 space-y-3">
                    <h4 className="text-white font-bold uppercase tracking-wider text-[10px] border-b border-white/10 pb-2">
                        Shop
                    </h4>
                    <div className="space-y-1.5 text-white/60 font-light">
                        {address && <p>{address}</p>}
                        {postcode && <p>{postcode}</p>}
                        {email && <p className="pt-2">Email: <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a></p>}
                        {phone && <p>Phone: {phone}</p>}
                    </div>
                </div>

                {/* Links - Only show if categories exist in the database */}
                {categoriesList.length > 0 && (
                    <div className="col-span-12 sm:col-span-4 md:col-span-3 space-y-3">
                        <h4 className="text-white font-bold uppercase tracking-wider text-[10px] border-b border-white/10 pb-2">
                            Our Products
                        </h4>
                        <div className="space-y-1.5 text-white/60 font-light flex flex-col items-start gap-1">
                            {categoriesList.map(cat => (
                                <button 
                                    key={cat.id} 
                                    onClick={() => handleCategoryClick(cat)}
                                    className="hover:text-white transition-colors text-left focus:outline-none cursor-pointer bg-transparent border-none p-0 text-white/60 text-xs font-light"
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Socials - Only show if social links are configured in the database */}
                {hasSocialLinks && (
                    <div className="col-span-12 sm:col-span-4 md:col-span-2 space-y-3">
                        <h4 className="text-white font-bold uppercase tracking-wider text-[10px] border-b border-white/10 pb-2">
                            Follow Us
                        </h4>
                        <div className="space-y-1.5 text-white/60 font-light flex flex-col">
                            {instagram && <a href={instagram} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a>}
                            {tiktok && <a href={tiktok} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">TikTok</a>}
                            {facebook && <a href={facebook} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a>}
                            {twitter && <a href={twitter} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter</a>}
                        </div>
                    </div>
                )}
            </div>
        </footer>
    );
}
