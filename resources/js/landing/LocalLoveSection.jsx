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
        <section className="w-full bg-white py-10 md:py-14 px-6 md:px-12 lg:px-16 text-neutral-900 border-t border-neutral-100">
            <div className="max-w-6xl mx-auto">
                {/* Header with Title and Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 mb-6 text-left">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a1a1a] tracking-tight">
                        Local Love
                    </h2>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-rose-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={15} fill="currentColor" strokeWidth={0} />
                            ))}
                        </div>
                        <span className="text-xs md:text-[13px] font-medium text-neutral-500">
                            4.9/5 Avg Rating
                        </span>
                    </div>
                </div>

                {/* Testimonial Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    {REVIEWS.map((review) => (
                        <div
                            key={review.id}
                            className="bg-[#FCF3F5] rounded-[18px] p-4 sm:p-5 flex flex-col justify-between text-left border border-rose-100/80 shadow-xs hover:shadow-sm transition-all duration-300"
                        >
                            <div>
                                {/* Quote Icon */}
                                <div className="text-rose-400 mb-1.5 select-none">
                                    <span className="font-serif text-3xl leading-none block font-bold text-rose-300">“</span>
                                </div>

                                <p className="text-xs text-neutral-700 font-light leading-relaxed mb-4">
                                    {review.quote}
                                </p>
                            </div>

                            <div className="pt-2.5 border-t border-rose-200/40 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-900">
                                        {review.author}
                                    </h4>
                                    <span className="text-[10px] text-neutral-500 font-light">
                                        {review.source}
                                    </span>
                                </div>

                                <div className="flex items-center text-rose-500">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Center Pill CTA */}
                <div className="flex justify-center mt-6">
                    <button 
                        onClick={() => window.open('https://maps.google.com', '_blank')}
                        className="border border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-neutral-700 text-xs font-medium px-5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                        <span>See all</span>
                        <ChevronRight size={12} className="text-rose-500" />
                    </button>
                </div>
            </div>
        </section>
    );
}
