import React, { useState } from 'react';
import { ArrowRight, Bike, Store, ChevronRight, Edit3, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../AppContext';
import OrderPopover from './OrderPopover';

export default function HeroSection({ onOrderClick, configs = {} }) {
    const { orderType, deliveryInfo, collectionSlot, tableNumber } = useApp();
    const [imageError, setImageError] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Dynamic config overrides with defaults
    const heroBgImage = configs?.hero_bg_image || '/images/hero-bg.png';
    const heroTitleLine1 = configs?.hero_title_line_1 || 'HOT OR COLD, WE';
    const heroTitleLine2Prefix = configs?.hero_title_line_2_prefix || 'SERVE';
    const heroTitleHighlight = configs?.hero_title_highlight || 'Sweetness';
    const heroSubtitle = configs?.hero_subtitle || 'We are the best dessert spot for your cravings. Handcrafted waffles, sundaes, and shakes served fresh daily.';
    
    // Determine fulfillment state and appropriate button text
    const hasSelection = Boolean(
        (orderType === 'dine_in' && tableNumber) ||
        (orderType === 'delivery' && deliveryInfo?.postcode) ||
        (orderType === 'collection' && collectionSlot?.time)
    );

    let buttonLabel = 'Set Delivery or Collection';
    let selectionSummary = null;

    if (orderType === 'dine_in' && tableNumber) {
        buttonLabel = 'Dine-In Table';
        selectionSummary = `Table #${tableNumber}`;
    } else if (orderType === 'delivery' && deliveryInfo?.postcode) {
        buttonLabel = 'Delivering to';
        selectionSummary = deliveryInfo.postcode;
    } else if (orderType === 'collection' && collectionSlot?.time) {
        buttonLabel = 'Collection';
        // Check slot date safely, extract from datetime or fallback to 'Today'
        const datePart = collectionSlot.date || (collectionSlot.datetime ? collectionSlot.datetime.split(' ')[0] : null);
        let dayLabel = 'Today';
        if (datePart) {
            const todayStr = new Date().toISOString().split('T')[0];
            dayLabel = datePart === todayStr ? 'Today' : datePart;
        }
        selectionSummary = `${dayLabel} @ ${collectionSlot.time}`;
    } else if (configs?.hero_button_text && configs.hero_button_text !== 'Order Now') {
        buttonLabel = configs.hero_button_text;
    }

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

                    <div className="mt-5 sm:mt-6 relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={() => setIsPopoverOpen(prev => !prev)}
                            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl sm:rounded-full text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2.5 z-20 group border ${
                                hasSelection
                                    ? 'bg-[#2a171d]/90 hover:bg-[#381f27] border-amber-500/40 hover:border-amber-400 text-white shadow-amber-950/20'
                                    : 'bg-[#3a2327]/90 hover:bg-[#4d2e34] border-white/20 hover:border-white/40 text-white shadow-black/25'
                            } hover:-translate-y-0.5 active:translate-y-0`}
                        >
                            {/* Icon based on selection */}
                            <span className={`p-1 rounded-full ${hasSelection ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/80'}`}>
                                {orderType === 'dine_in' && tableNumber ? (
                                    <UtensilsCrossed size={14} />
                                ) : orderType === 'delivery' && deliveryInfo?.postcode ? (
                                    <Bike size={14} />
                                ) : orderType === 'collection' && collectionSlot?.time ? (
                                    <Store size={14} />
                                ) : (
                                    <Bike size={14} />
                                )}
                            </span>

                            {/* Text content */}
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/70 font-semibold leading-none">
                                    {buttonLabel}
                                </span>
                                {selectionSummary ? (
                                    <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wide mt-0.5 leading-tight flex items-center gap-1">
                                        <span>{selectionSummary}</span>
                                        <Edit3 size={11} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                                    </span>
                                ) : (
                                    <span className="text-xs sm:text-[13px] font-bold text-white tracking-normal mt-0.5 leading-tight">
                                        Choose Delivery or Collection
                                    </span>
                                )}
                            </div>

                            <ChevronRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ml-1 shrink-0 text-white" />
                        </button>

                        {/* Connected Popover (Right / Screen-aware via Portal) */}
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
