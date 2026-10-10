import React from 'react';
import { useApp } from '../AppContext';
import { SocialIcon, getPlatformInfo } from './SocialIcons';

export default function Footer({ onCategoryClick, navigate }) {
    const { configs, catalog } = useApp();
    
    // Filter active categories flagged for footer ("Our Products"), or fallback to top active categories if none flagged
    const activeCatalog = (catalog && Array.isArray(catalog)) ? catalog.filter(c => c && c.status !== false) : [];
    const footerFlaggedCategories = activeCatalog.filter(cat => Boolean(cat.show_in_footer));

    const displayCategories = footerFlaggedCategories.length > 0
        ? footerFlaggedCategories
        : activeCatalog.slice(0, 4);

    // Products: either flagged categories or curated fallback matching design
    const defaultProducts = ['Cakes', 'Puddings', 'Braids', 'Toasts'];
    const displayProducts = displayCategories.length > 0 
        ? displayCategories 
        : defaultProducts.map((name, i) => ({ id: i, name, slug: name.toLowerCase().replace(/\s+/g, '-') }));

    // Real dynamic info from settings.
    const address = configs.store_address || '';
    const postcode = configs.store_postcode || '';
    const email = configs.store_email || '';
    const phone = configs.store_phone || '';

    // Parse dynamic social links array from configs
    let parsedSocialLinks = [];
    if (configs?.social_links) {
        try {
            const raw = typeof configs.social_links === 'string' ? JSON.parse(configs.social_links) : configs.social_links;
            if (Array.isArray(raw)) {
                parsedSocialLinks = raw.filter(item => item && item.url && item.url.trim() !== '');
            }
        } catch (e) {
            console.warn("Error parsing social_links config:", e);
        }
    }

    // If dynamic array is empty, fall back to legacy individual keys
    if (parsedSocialLinks.length === 0) {
        if (configs.social_instagram) parsedSocialLinks.push({ platform: 'instagram', url: configs.social_instagram, label: 'Instagram' });
        if (configs.social_tiktok) parsedSocialLinks.push({ platform: 'tiktok', url: configs.social_tiktok, label: 'TikTok' });
        if (configs.social_facebook) parsedSocialLinks.push({ platform: 'facebook', url: configs.social_facebook, label: 'Facebook' });
        if (configs.social_twitter) parsedSocialLinks.push({ platform: 'twitter', url: configs.social_twitter, label: 'Twitter' });
    }

    // Default fallback list if nothing has been set yet
    if (parsedSocialLinks.length === 0) {
        parsedSocialLinks = [
            { platform: 'instagram', url: 'https://instagram.com', label: 'Instagram' },
            { platform: 'tiktok', url: 'https://tiktok.com', label: 'TikTok' },
            { platform: 'facebook', url: 'https://facebook.com', label: 'Facebook' },
            { platform: 'twitter', url: 'https://x.com', label: 'Twitter / X' },
        ];
    }

    const handleCategoryClick = (cat) => {
        if (onCategoryClick) {
            onCategoryClick(cat);
        } else if (navigate) {
            navigate(`/categories/${cat.slug}`);
        } else {
            window.location.href = `/categories/${cat.slug}`;
        }
    };

    // Helper to format social links cleanly with http/https fallback
    const formatExternalUrl = (url, fallback = '#') => {
        if (!url || !url.trim()) return fallback;
        const trimmed = url.trim();
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }
        return `https://${trimmed}`;
    };

    return (
        <footer className="w-full bg-primary text-white pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-12 md:pb-14 px-6 md:px-12 lg:px-16 relative z-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6 text-left">
                {/* Column 1: Brand & Copyright */}
                <div className="col-span-12 md:col-span-4 flex flex-col justify-between space-y-6">
                    <div>
                        {configs?.store_logo_white ? (
                            <div className="cursor-pointer inline-block" onClick={() => navigate ? navigate('/') : (window.location.href = '/')}>
                                <img 
                                    src={configs.store_logo_white} 
                                    alt={configs?.store_name || "Sweet Spot"} 
                                    className="h-9 sm:h-11 w-auto object-contain block"
                                />
                            </div>
                        ) : configs?.store_name ? (
                            <div className="cursor-pointer inline-block" onClick={() => navigate ? navigate('/') : (window.location.href = '/')}>
                                <span className="text-white font-black text-xl tracking-tight">
                                    {configs.store_name}
                                </span>
                            </div>
                        ) : null}
                    </div>
                    
                    <div className="text-[12px] sm:text-[13px] text-white/50 font-light leading-relaxed">
                        <p>{configs.footer_copyright ?? '© 2026 SweetSpot Bake, by Captoirs Studio'}</p>
                        <p className="mt-0.5">{configs.footer_subtext ?? 'All rights reserved'}</p>
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

                {/* Column 4: Follow Us (With Dynamic Brand Icons & Multiple Accounts) */}
                <div className="col-span-12 sm:col-span-4 md:col-span-2 space-y-3.5">
                    <h4 className="text-white font-medium text-sm sm:text-base tracking-normal">
                        Follow Us
                    </h4>
                    <div className="space-y-2 text-white/60 text-xs sm:text-[13px] font-light flex flex-col items-start">
                        {parsedSocialLinks.map((link, idx) => {
                            const platformInfo = getPlatformInfo(link.platform);
                            const displayName = link.label && link.label.trim() !== '' 
                                ? link.label.trim() 
                                : platformInfo.defaultLabel;

                            return (
                                <a 
                                    key={idx}
                                    href={formatExternalUrl(link.url)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="group inline-flex items-center gap-2.5 text-white/60 hover:text-white transition-all text-xs sm:text-[13px] font-light py-0.5"
                                    title={`${platformInfo.name}: ${displayName}`}
                                >
                                    <span className="w-5 h-5 rounded-md bg-white/10 group-hover:bg-white/25 flex items-center justify-center transition-all text-white/80 group-hover:text-white shrink-0 group-hover:scale-105">
                                        <SocialIcon platform={link.platform} className="w-3.5 h-3.5" size={14} />
                                    </span>
                                    <span className="truncate group-hover:translate-x-0.5 transition-transform">
                                        {displayName}
                                    </span>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </footer>
    );
}
