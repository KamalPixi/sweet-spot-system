import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import OrderPopover from './OrderPopover';

export default function HeroSection({ onOrderClick, configs = {} }) {
    const [imageError, setImageError] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Dynamic config overrides with defaults
    const heroBgImage = configs?.hero_bg_image || '/images/hero-bg.png';
    const heroTitleLine1 = configs?.hero_title_line_1 || 'HOT OR COLD, WE';
    const heroTitleLine2Prefix = configs?.hero_title_line_2_prefix || 'SERVE';
    const heroTitleHighlight = configs?.hero_title_highlight || 'Sweetness';
    const heroSubtitle = configs?.hero_subtitle || 'We are the best dessert spot for your cravings. Handcrafted waffles, sundaes, and shakes served fresh daily.';
    const heroButtonText = configs?.hero_button_text || 'Order Now';
    const hasBgImage = !imageError && Boolean(heroBgImage);
    const buttonRef = React.useRef(null);

    return (
        <section 
            className="relative w-full overflow-hidden text-white pt-20 sm:pt-24 md:pt-28 pb-14 sm:pb-16 md:pb-20 px-6 md:px-12 lg:px-20 min-h-[420px] sm:min-h-[460px] md:min-h-[500px] lg:min-h-[540px] flex items-center bg-[#24161b]"
        >
            {/* Background Layer: Dynamic Image or Fallback Gradient */}
            {hasBgImage ? (
                <>
                    {/* Hero Background Image */}
                    <img
                        src={heroBgImage}
                        alt="Sweet Spot Handcrafted Desserts"
                        onError={() => setImageError(true)}
                        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
                    />
                    {/* Subtle dark gradient overlay to ensure text contrast across all device viewports */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#24161b]/90 via-[#24161b]/60 to-transparent pointer-events-none" />
                </>
            ) : (
                /* Primary Color Gradient Fallback */
                <div className="absolute inset-0 bg-gradient-to-b from-[#24161b] via-[#2f1b21] to-[#3a2028] pointer-events-none">
                    <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-[#c47c5d]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#d97757]/15 rounded-full blur-[90px] pointer-events-none" />
                </div>
            )}

            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center relative z-10">
                {/* Left Column: Typography & Order Call-to-Action */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[48px] font-extrabold tracking-tight text-white leading-[1.08] uppercase drop-shadow-sm">
                        <span className="block font-sans font-black tracking-normal text-white">{heroTitleLine1}</span>
                        <span className="flex flex-wrap items-baseline gap-x-2.5 mt-0.5">
                            <span className="font-sans font-black tracking-normal text-white">{heroTitleLine2Prefix}</span>
                            <span 
                                className="font-script lowercase font-bold text-[#E5B582] text-3xl sm:text-4xl md:text-5xl lg:text-[58px] tracking-normal -rotate-2 select-none"
                                style={{ fontFamily: "'Dancing Script', cursive" }}
                            >
                                {heroTitleHighlight}
                            </span>
                        </span>
                    </h1>

                    <p className="mt-3 sm:mt-3.5 text-xs sm:text-sm text-white/80 max-w-lg font-light leading-relaxed drop-shadow-xs">
                        {heroSubtitle}
                    </p>

                    <div className="mt-5 sm:mt-6 relative flex items-center">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={() => setIsPopoverOpen(prev => !prev)}
                            className="bg-[#3a2327]/90 hover:bg-[#4d2e34] text-white/95 hover:text-white border border-white/20 hover:border-white/40 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-300 shadow-md shadow-black/20 hover:shadow-black/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2 z-20"
                        >
                            <span>{heroButtonText}</span>
                            <ArrowRight size={13} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        {/* Connected Popover (Right / Under on Desktop with connected arrow pin) */}
                        <OrderPopover
                            isOpen={isPopoverOpen}
                            onClose={() => setIsPopoverOpen(false)}
                            anchorRef={buttonRef}
                        />
                    </div>
                </div>

                {/* Right Column: Only shown in fallback mode if no full background image is active */}
                {!hasBgImage && (
                    <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
                        <div className="relative w-full max-w-[290px] sm:max-w-[340px] lg:max-w-[380px] flex items-center justify-center">
                            <div className="absolute inset-0 bg-radial from-amber-500/20 via-rose-500/10 to-transparent blur-2xl transform scale-90" />
                            <img 
                                src="/images/landing-hero-hand.jpg" 
                                alt="Handcrafted Sweet Spot dessert on plate" 
                                className="w-full h-auto object-contain select-none drop-shadow-[0_16px_32px_rgba(0,0,0,0.5)] rounded-2xl"
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
