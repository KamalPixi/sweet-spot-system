import React, { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

export default function DifferenceSection({ configs = {} }) {
    const [openIndex, setOpenIndex] = useState(0);

    const badgeTag = configs.diff_badge || "Why Choose Us";
    const titleLine1 = configs.diff_title_1 || "The Sweet Spot";
    const titleLine2 = configs.diff_title_2 || "Difference";
    const descriptionText = configs.diff_description || "What makes us special? It's the little things — made with intention, served with love.";

    const items = [
        {
            title: configs.diff_item_1_title || "Made with love",
            content: configs.diff_item_1_content || "Every dessert is crafted by hand using traditional recipes and genuine passion for sweetness. We bake in small batches to guarantee unmatched flavor and texture in every mouthful."
        },
        {
            title: configs.diff_item_2_title || "Premium Ingredients",
            content: configs.diff_item_2_content || "We source real Madagascan vanilla pods, pure Belgian cocoa, organic British dairy, and seasonal fresh berries without artificial flavorings or shortcuts."
        },
        {
            title: configs.diff_item_3_title || "Hygienic Promise",
            content: configs.diff_item_3_content || "Our kitchen strictly adheres to five-star food hygiene standards. All bakes are prepared, sealed, and packaged under certified cleanroom protocols."
        }
    ];

    const toggle = (idx) => {
        setOpenIndex(openIndex === idx ? -1 : idx);
    };

    return (
        <section className="w-full bg-transparent py-10 md:py-14 px-6 md:px-12 lg:px-16 text-neutral-900">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Heading and Subtitle */}
                <div className="lg:col-span-5 flex flex-col items-start text-left">
                    <span className="text-[11px] md:text-xs font-semibold tracking-wider text-rose-500 uppercase mb-2">
                        {badgeTag}
                    </span>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1f191b] tracking-tight leading-[1.15]">
                        {titleLine1}<br />
                        <span className="font-bold">{titleLine2}</span>
                    </h2>

                    <p className="mt-3 text-xs sm:text-sm text-neutral-600 font-light leading-relaxed max-w-sm">
                        {descriptionText}
                    </p>
                </div>

                {/* Right: Rounded Pill Accordion Stack */}
                <div className="lg:col-span-7 flex flex-col space-y-2.5 w-full">
                    {items.map((item, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div
                                key={idx}
                                className={`w-full rounded-xl transition-all duration-300 border ${
                                    isOpen 
                                        ? 'border-neutral-300 bg-white shadow-xs p-4 sm:p-5' 
                                        : 'border-neutral-200 bg-white hover:border-neutral-300 p-3 sm:p-4'
                                }`}
                            >
                                <button
                                    onClick={() => toggle(idx)}
                                    className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
                                >
                                    <span className={`text-xs sm:text-sm font-semibold tracking-tight transition-colors ${
                                        isOpen ? 'text-rose-500' : 'text-neutral-800'
                                    }`}>
                                        {item.title}
                                    </span>

                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                        isOpen 
                                            ? 'bg-neutral-900 text-white shadow-xs' 
                                            : 'border border-neutral-300 text-neutral-500'
                                    }`}>
                                        {isOpen ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="mt-3 pt-2.5 border-t border-neutral-100 text-xs text-neutral-600 font-light leading-relaxed animate-fadeIn text-left">
                                        {item.content}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
