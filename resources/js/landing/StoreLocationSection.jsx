import React from 'react';
import { MapPin, Coffee } from 'lucide-react';

export default function StoreLocationSection({ configs = {} }) {
    const address = configs.store_address || '19, Faircross Parade, Upney Ln';
    const city = configs.store_city || 'Barking';
    const postcode = configs.store_postcode || 'IG11 8UW';
    const openingHours = configs.store_opening_hours || 'Mon - Sun: From 12:00 PM - To 11:00 PM';

    const handleDirections = () => {
        const query = encodeURIComponent(`${address}, ${city} ${postcode}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    return (
        <section className="w-full bg-white pt-10 md:pt-14 pb-16 md:pb-24 px-6 md:px-12 lg:px-16 border-t border-neutral-100 text-neutral-900">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* Left: Storefront Photo with rounded corners */}
                <div className="lg:col-span-4 w-full flex justify-center">
                    <div className="w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-neutral-200/80 shadow-md">
                        <img
                            src="/images/landing-storefront.jpg"
                            alt="Sweet Spot Storefront in Barking"
                            className="w-full h-full object-cover select-none hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                </div>

                {/* Right: Pitch & Info Cards */}
                <div className="lg:col-span-8 flex flex-col text-left">
                    {/* Header Row: Title & Get Directions Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <span className="text-[11px] md:text-xs font-semibold tracking-wider text-rose-500 uppercase mb-1.5 block">
                                FYI, We Supply
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight">
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
                        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 flex items-start justify-between shadow-xs">
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
                        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 flex items-start justify-between shadow-xs">
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
        </section>
    );
}
