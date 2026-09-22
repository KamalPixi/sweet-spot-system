import React, { useState, useEffect } from 'react';
import { MapPin, Coffee, Maximize2, X, Store } from 'lucide-react';

export default function StoreLocationSection({ configs = {} }) {
    const address = configs.store_address || '19, Faircross Parade, Upney Ln';
    const city = configs.store_city || 'Barking';
    const postcode = configs.store_postcode || 'IG11 8UW';
    const openingHours = configs.store_opening_hours || 'Mon - Sun: From 12:00 PM - To 11:00 PM';
    const storeImage = configs.store_image || "/images/landing-storefront.jpg";

    const [isViewerOpen, setIsViewerOpen] = useState(false);

    const handleDirections = () => {
        const lat = configs.store_latitude || configs.store_lat || configs.latitude;
        const lng = configs.store_longitude || configs.store_lng || configs.longitude;

        let destination = '';
        if (lat && lng) {
            destination = `${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;
        } else {
            destination = encodeURIComponent(`${address}, ${city} ${postcode}`);
        }

        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    };

    // Close image viewer on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsViewerOpen(false);
        };
        if (isViewerOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isViewerOpen]);

    return (
        <section className="w-full bg-white pt-10 md:pt-14 pb-16 md:pb-24 px-6 md:px-12 lg:px-16 border-t border-neutral-100 text-neutral-900">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Enhanced Storefront Photo */}
                <div className="lg:col-span-5 w-full flex justify-center">
                    <div className="relative group w-full max-w-[340px]">
                        {/* Soft ambient glow behind frame */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-rose-400/20 via-amber-400/20 to-pink-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-700"></div>

                        {/* Photo Card Container */}
                        <div 
                            onClick={() => setIsViewerOpen(true)}
                            className="relative w-full aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden border border-neutral-200/90 bg-neutral-900 shadow-xl cursor-pointer select-none group"
                        >
                            <img
                                src={storeImage}
                                alt="Sweet Spot Storefront"
                                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                            />

                            {/* Gradient Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-300"></div>

                            {/* Click to expand badge overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md text-neutral-900 flex items-center justify-center shadow-lg mb-2 group-hover:scale-110 transition-transform duration-300">
                                    <Maximize2 size={20} className="text-neutral-900" />
                                </div>
                                <span className="text-xs font-semibold text-white tracking-wide drop-shadow-md">
                                    Click to expand
                                </span>
                            </div>

                            {/* Bottom Label Tag */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/10 shadow-xs">
                                    <Store size={13} className="text-rose-400" /> Storefront
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Pitch & Info Cards */}
                <div className="lg:col-span-7 flex flex-col text-left">
                    {/* Header Row: Title & Get Directions Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <span className="text-[11px] md:text-xs font-semibold tracking-wider text-rose-500 uppercase mb-1.5 block">
                                FYI, We Supply
                            </span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight">
                                <span className="font-medium text-neutral-700 block">Where dreams</span>
                                <span className="font-black text-[#111111] block">Meet Cream</span>
                            </h2>
                        </div>

                        <button
                            onClick={handleDirections}
                            className="bg-[#1e1b1d] hover:bg-black text-white text-xs sm:text-[13px] font-medium px-5 py-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer self-start sm:self-center shrink-0"
                        >
                            Get Directions
                        </button>
                    </div>

                    {/* 2 Info Cards: Location & Opening Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        {/* Location Card */}
                        <div 
                            onClick={handleDirections}
                            className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 flex items-start justify-between shadow-xs hover:border-neutral-300 transition-colors cursor-pointer"
                        >
                            <div className="space-y-0.5">
                                <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                                    Location
                                </h4>
                                <p className="text-xs text-neutral-600 font-light leading-relaxed max-w-[200px]">
                                    {address}, {city} {postcode}
                                </p>
                            </div>
                            <div className="text-neutral-700 p-1.5 shrink-0">
                                <MapPin size={18} strokeWidth={1.75} />
                            </div>
                        </div>

                        {/* Opening Hours Card */}
                        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 flex items-start justify-between shadow-xs hover:border-neutral-300 transition-colors">
                            <div className="space-y-0.5">
                                <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                                    Opening Hours
                                </h4>
                                <p className="text-xs text-neutral-600 font-light leading-relaxed max-w-[200px]">
                                    {openingHours}
                                </p>
                            </div>
                            <div className="text-neutral-700 p-1.5 shrink-0">
                                <Coffee size={18} strokeWidth={1.75} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox / Image Viewer Modal */}
            {isViewerOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
                    onClick={() => setIsViewerOpen(false)}
                >
                    {/* Top Bar with Title & Close Button */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10 pointer-events-none">
                        <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-medium text-white/90">
                            Sweet Spot Storefront
                        </div>
                        <button
                            onClick={() => setIsViewerOpen(false)}
                            className="pointer-events-auto p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10"
                            aria-label="Close image viewer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Image Box */}
                    <div 
                        className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center p-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={storeImage}
                            alt="Sweet Spot Storefront Large View"
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}

