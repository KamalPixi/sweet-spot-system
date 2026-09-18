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
        <section className="w-full bg-white py-16 md:py-24 px-6 md:px-12 lg:px-20 border-t border-neutral-100 text-neutral-900">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Storefront Photo with rounded corners */}
                <div className="lg:col-span-4 w-full flex justify-center">
                    <div className="w-full max-w-[320px] aspect-square rounded-[28px] overflow-hidden border border-neutral-200/80 shadow-lg">
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div>
                            <span className="text-xs md:text-sm font-semibold tracking-wider text-rose-500 uppercase mb-2 block">
                                FYI, We Supply
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight">
                                <span className="font-medium text-neutral-700 block">Where dreams</span>
                                <span className="font-black text-[#111111] block">Meet Cream</span>
                            </h2>
                        </div>

                        <button
                            onClick={handleDirections}
                            className="bg-[#1e1b1d] hover:bg-black text-white text-xs sm:text-sm font-medium px-6 py-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer self-start sm:self-center shrink-0"
                        >
                            Get Directions
                        </button>
                    </div>

                    {/* 2 Info Cards: Location & Opening Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Location Card */}
                        <div className="bg-white rounded-[24px] p-6 border border-neutral-200/80 flex items-start justify-between shadow-xs">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-neutral-900">
                                    Location
                                </h4>
                                <p className="text-xs text-neutral-600 font-light leading-relaxed max-w-[200px]">
                                    {address}, {city} {postcode}
                                </p>
                            </div>
                            <div className="text-neutral-700 p-2 shrink-0">
                                <MapPin size={22} strokeWidth={1.75} />
                            </div>
                        </div>

                        {/* Opening Hours Card */}
                        <div className="bg-white rounded-[24px] p-6 border border-neutral-200/80 flex items-start justify-between shadow-xs">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-neutral-900">
                                    Opening Hours
                                </h4>
                                <p className="text-xs text-neutral-600 font-light leading-relaxed max-w-[200px]">
                                    {openingHours}
                                </p>
                            </div>
                            <div className="text-neutral-700 p-2 shrink-0">
                                <Coffee size={22} strokeWidth={1.75} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
