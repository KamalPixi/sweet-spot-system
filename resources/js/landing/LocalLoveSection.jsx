import React from 'react';
import { Star, Quote, ChevronRight } from 'lucide-react';

const REVIEWS = [
    {
        id: 1,
        quote: "The cookie dough is absolutely out of this world! Warm, gooey, and perfect.",
        author: "Sarah A.",
        source: "Google Review",
        rating: 5
    },
    {
        id: 2,
        quote: "The cookie dough is absolutely out of this world! Warm, gooey, and perfect.",
        author: "Sarah A.",
        source: "Google Review",
        rating: 5
    },
    {
        id: 3,
        quote: "The cookie dough is absolutely out of this world! Warm, gooey, and perfect.",
        author: "Sarah A.",
        source: "Google Review",
        rating: 5
    }
];

export default function LocalLoveSection() {
    return (
        <section className="w-full bg-white py-16 md:py-24 px-6 md:px-12 lg:px-20 text-neutral-900 border-t border-neutral-100">
            <div className="max-w-7xl mx-auto">
                {/* Header with Title and Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-10 text-left">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight">
                        Local Love
                    </h2>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-rose-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
                            ))}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-neutral-500">
                            4.9/5 Avg Rating
                        </span>
                    </div>
                </div>

                {/* Testimonial Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {REVIEWS.map((review) => (
                        <div
                            key={review.id}
                            className="bg-[#FCF3F5] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between text-left border border-rose-100/80 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <div>
                                {/* Quote Icon */}
                                <div className="text-rose-400 mb-3 select-none">
                                    <span className="font-serif text-4xl leading-none block font-bold text-rose-300">“</span>
                                </div>

                                <p className="text-xs sm:text-sm text-neutral-700 font-light leading-relaxed mb-6">
                                    {review.quote}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-rose-200/40 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                                        {review.author}
                                    </h4>
                                    <span className="text-[11px] text-neutral-500 font-light">
                                        {review.source}
                                    </span>
                                </div>

                                <div className="flex items-center text-rose-500">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Center Pill CTA */}
                <div className="flex justify-center mt-10">
                    <button 
                        onClick={() => window.open('https://maps.google.com', '_blank')}
                        className="border border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-neutral-700 text-xs font-medium px-6 py-2 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                        <span>See all</span>
                        <ChevronRight size={13} className="text-rose-500" />
                    </button>
                </div>
            </div>
        </section>
    );
}
