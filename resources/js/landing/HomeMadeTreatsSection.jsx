import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomeMadeTreatsSection() {
    const navigate = useNavigate();

    // 3 Polaroid style cards with slight tilt matching the reference mockup
    const cards = [
        {
            id: 1,
            title: "Handcrafted cakes with premium layers.",
            image: "/images/landing-cat-1.jpg",
            tilt: "-rotate-2",
            delay: "0"
        },
        {
            id: 2,
            title: "Fresh artisanal waffles & delicate sponges.",
            image: "/images/landing-cat-3.jpg",
            tilt: "rotate-0",
            delay: "100"
        },
        {
            id: 3,
            title: "Decadent cookie stacks baked warm daily.",
            image: "/images/landing-cat-2.jpg",
            tilt: "rotate-2",
            delay: "200"
        }
    ];

    return (
        <section className="w-full bg-[#FCF3F5] py-16 md:py-24 px-6 md:px-12 lg:px-20 overflow-hidden">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left: Text & Pitch */}
                <div className="lg:col-span-5 flex flex-col items-start text-left">
                    <span className="text-xs md:text-sm font-semibold tracking-wider text-rose-500 uppercase mb-3">
                        See Collection
                    </span>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1f191b] tracking-tight leading-[1.15]">
                        Our Fine Home<br className="hidden sm:inline" /> Made Treats
                    </h2>

                    <p className="mt-5 text-sm sm:text-base text-neutral-600 font-light leading-relaxed max-w-md">
                        Every dessert tells a story. Every bite is a moment of pure bliss at Sweet Spot London.
                    </p>

                    <button
                        onClick={() => navigate('/products')}
                        className="mt-7 text-xs font-semibold text-rose-600 uppercase tracking-widest hover:text-rose-700 transition-colors underline underline-offset-4 cursor-pointer"
                    >
                        Explore Menu
                    </button>
                </div>

                {/* Right: 3 Polaroid-style feature cards */}
                <div className="lg:col-span-7 flex flex-wrap sm:flex-nowrap justify-center lg:justify-end gap-4 sm:gap-6 items-center">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            onClick={() => navigate('/categories')}
                            className={`w-full max-w-[210px] bg-white rounded-[24px] p-3.5 pb-5 shadow-xl shadow-rose-950/5 border border-rose-100/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:rotate-0 cursor-pointer ${card.tilt}`}
                        >
                            {/* Inner image container */}
                            <div className="aspect-[4/5] w-full rounded-[18px] overflow-hidden bg-neutral-100 mb-3.5">
                                <img
                                    src={card.image}
                                    alt={card.title}
                                    className="w-full h-full object-cover select-none"
                                />
                            </div>

                            {/* Caption text */}
                            <p className="text-[11px] sm:text-xs text-neutral-600 font-normal leading-snug px-1 text-center">
                                {card.title}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
