import React, { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

export default function DifferenceSection() {
    const [openIndex, setOpenIndex] = useState(0);

    const items = [
        {
            title: "Made with love",
            content: "Every dessert is crafted by hand using traditional recipes and genuine passion for sweetness. We bake in small batches to guarantee unmatched flavor and texture in every mouthful."
        },
        {
            title: "Premium Ingredients",
            content: "We source real Madagascan vanilla pods, pure Belgian cocoa, organic British dairy, and seasonal fresh berries without artificial flavorings or shortcuts."
        },
        {
            title: "Hygienic Promise",
            content: "Our kitchen strictly adheres to five-star food hygiene standards. All bakes are prepared, sealed, and packaged under certified cleanroom protocols."
        }
    ];

    const toggle = (idx) => {
        setOpenIndex(openIndex === idx ? -1 : idx);
    };

    return (
        <section className="w-full bg-white py-16 md:py-24 px-6 md:px-12 lg:px-20 text-neutral-900">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left: Heading and Subtitle */}
                <div className="lg:col-span-5 flex flex-col items-start text-left">
                    <span className="text-xs md:text-sm font-semibold tracking-wider text-rose-500 uppercase mb-3">
                        Why Choose Us
                    </span>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1f191b] tracking-tight leading-[1.15]">
                        The Sweet Spot<br />
                        <span className="font-bold">Difference</span>
                    </h2>

                    <p className="mt-5 text-sm sm:text-base text-neutral-600 font-light leading-relaxed max-w-md">
                        What makes us special? It's the little things — made with intention, served with love.
                    </p>
                </div>

                {/* Right: Rounded Pill Accordion Stack */}
                <div className="lg:col-span-7 flex flex-col space-y-3.5 w-full">
                    {items.map((item, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div
                                key={idx}
                                className={`w-full rounded-[26px] transition-all duration-300 border ${
                                    isOpen 
                                        ? 'border-neutral-300 bg-white shadow-sm p-6' 
                                        : 'border-neutral-200 bg-white hover:border-neutral-300 p-4 sm:p-5'
                                }`}
                            >
                                <button
                                    onClick={() => toggle(idx)}
                                    className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
                                >
                                    <span className={`text-sm sm:text-base font-semibold tracking-tight transition-colors ${
                                        isOpen ? 'text-rose-500' : 'text-neutral-800'
                                    }`}>
                                        {item.title}
                                    </span>

                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                        isOpen 
                                            ? 'bg-neutral-900 text-white shadow-sm' 
                                            : 'border border-neutral-300 text-neutral-500'
                                    }`}>
                                        {isOpen ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="mt-4 pt-3 border-t border-neutral-100 text-xs sm:text-sm text-neutral-600 font-light leading-relaxed animate-fadeIn text-left">
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
