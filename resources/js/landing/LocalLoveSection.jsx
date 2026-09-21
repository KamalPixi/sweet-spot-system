import React, { useState, useEffect } from 'react';
import { Star, ChevronRight } from 'lucide-react';

const DEFAULT_REVIEWS = [
    {
        id: 1,
        quote: "The cookie dough is absolutely out of this world! Warm, gooey, and perfect.",
        author_name: "Sarah A.",
        source: "Google Review",
        rating: 5
    },
    {
        id: 2,
        quote: "Best dessert spot in Barking! Exceptional service and the milkshakes are unmatched.",
        author_name: "Michael R.",
        source: "Google Review",
        rating: 5
    },
    {
        id: 3,
        quote: "Super fast delivery and everything arrived piping hot. Will definitely order again!",
        author_name: "Emma T.",
        source: "Google Review",
        rating: 5
    }
];

export default function LocalLoveSection() {
    const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
    const [avgRating, setAvgRating] = useState('4.9');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicReviews = async () => {
            try {
                const res = await fetch('/api/reviews');
                const data = await res.json();
                if (data.success && data.data && data.data.length > 0) {
                    setReviews(data.data);
                    if (data.meta && data.meta.average_rating) {
                        setAvgRating(data.meta.average_rating.toFixed(1));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch public reviews:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicReviews();
    }, []);

    return (
        <section className="w-full bg-transparent py-10 md:py-14 px-6 md:px-12 lg:px-16 text-neutral-900">
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
                            {avgRating}/5 Avg Rating
                        </span>
                    </div>
                </div>

                {/* Testimonial Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-[#FDEEF2]/90 rounded-2xl p-5 flex flex-col justify-between text-left border border-rose-200/50 shadow-xs hover:shadow-sm transition-all duration-300"
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
                                        {review.author_name || review.author}
                                    </h4>
                                    <span className="text-[10px] text-neutral-500 font-light">
                                        {review.source}
                                    </span>
                                </div>

                                <div className="flex items-center text-rose-500">
                                    {[...Array(review.rating || 5)].map((_, i) => (
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
                        className="border border-rose-300 hover:border-rose-400 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold px-6 py-2 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                        <span>See all</span>
                        <ChevronRight size={13} className="text-rose-500" />
                    </button>
                </div>
            </div>
        </section>
    );
}
