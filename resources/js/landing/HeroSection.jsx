import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function HeroSection({ onOrderClick }) {
    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#24161b] via-[#2f1b21] to-[#3a2028] text-white pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 px-6 md:px-12 lg:px-20">
            {/* Subtle background ambient warm glow */}
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-[#c47c5d]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#d97757]/15 rounded-full blur-[90px] pointer-events-none" />

            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                {/* Left Column: Typography & Order Call-to-Action */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-extrabold tracking-tight text-white leading-[1.08] uppercase">
                        <span className="block font-sans font-black tracking-normal text-white">HOT OR COLD, WE</span>
                        <span className="flex flex-wrap items-baseline gap-x-2.5 mt-0.5">
                            <span className="font-sans font-black tracking-normal text-white">SERVE</span>
                            <span 
                                className="font-script lowercase font-bold text-[#E5B582] text-4xl sm:text-5xl md:text-6xl lg:text-[68px] tracking-normal -rotate-2 select-none"
                                style={{ fontFamily: "'Dancing Script', cursive" }}
                            >
                                Sweetness
                            </span>
                        </span>
                    </h1>

                    <p className="mt-4 sm:mt-5 text-xs sm:text-sm md:text-[15px] text-white/70 max-w-lg font-light leading-relaxed">
                        We are the best dessert spot for your cravings. Handcrafted waffles, sundaes, and shakes served fresh daily.
                    </p>

                    <div className="mt-7 flex items-center gap-4">
                        <button
                            onClick={onOrderClick}
                            className="bg-[#3a2327]/90 hover:bg-[#4d2e34] text-white/95 hover:text-white border border-white/20 hover:border-white/40 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-300 shadow-md shadow-black/20 hover:shadow-black/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2"
                        >
                            <span>Order Now</span>
                            <ArrowRight size={13} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right Column: Floating Hand with Dessert Plate */}
                <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
                    <div className="relative w-full max-w-[290px] sm:max-w-[340px] lg:max-w-[380px] flex items-center justify-center">
                        {/* Glow effect behind dessert */}
                        <div className="absolute inset-0 bg-radial from-amber-500/20 via-rose-500/10 to-transparent blur-2xl transform scale-90" />
                        
                        <img 
                            src="/images/landing-hero-hand.jpg" 
                            alt="Handcrafted Sweet Spot dessert on plate" 
                            className="w-full h-auto object-contain select-none drop-shadow-[0_16px_32px_rgba(0,0,0,0.5)] rounded-2xl"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
