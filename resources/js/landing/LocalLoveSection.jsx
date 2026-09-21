import React, { useState, useEffect } from 'react';
import { Star, ChevronRight, X, Heart, MessageSquare, Search, Sparkles } from 'lucide-react';

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

    // Modal state for "See all"
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [modalRatingFilter, setModalRatingFilter] = useState('all');

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

    // Close modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsModalOpen(false);
        };
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);

    // Initial 3 reviews displayed on landing section
    const displayedLandingReviews = reviews.slice(0, 3);

    // Filtered reviews inside the modal
    const filteredModalReviews = reviews.filter((r) => {
        const matchesSearch = 
            (r.author_name || r.author || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
            (r.quote || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
            (r.source || '').toLowerCase().includes(modalSearch.toLowerCase());
        
        const matchesRating = 
            modalRatingFilter === 'all' ? true : r.rating === parseInt(modalRatingFilter);

        return matchesSearch && matchesRating;
    });

    return (
        <section className="w-full bg-transparent py-10 md:py-14 px-6 md:px-12 lg:px-16 text-neutral-900">
            <div className="max-w-6xl mx-auto">
                {/* Header with Title and Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
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

                    {reviews.length > 3 && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer self-start sm:self-center transition-colors"
                        >
                            <span>View All {reviews.length} Reviews</span>
                            <ChevronRight size={14} />
                        </button>
                    )}
                </div>

                {/* Testimonial Cards Grid (Initial 3) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    {displayedLandingReviews.map((review) => (
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
                        onClick={() => setIsModalOpen(true)}
                        className="border border-rose-300 hover:border-rose-400 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold px-6 py-2 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                        <span>See all ({reviews.length})</span>
                        <ChevronRight size={13} className="text-rose-500" />
                    </button>
                </div>
            </div>

            {/* Full-Screen "All Customer Reviews" Lightbox Modal */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn text-left"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-rose-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-rose-100/80 bg-gradient-to-r from-rose-50/50 via-white to-pink-50/30 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                        <Heart size={11} className="fill-rose-500 text-rose-500" /> Local Love
                                    </span>
                                    <span className="text-xs font-medium text-neutral-500">
                                        {reviews.length} Verified Reviews
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                                    Customer Testimonials
                                </h3>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-2xl border border-rose-200/60">
                                    <div className="flex text-rose-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-rose-700">
                                        {avgRating} / 5.0
                                    </span>
                                </div>

                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div className="px-5 py-3.5 bg-neutral-50/80 border-b border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search feedback or customer..."
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                    className="w-full bg-white border border-neutral-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-rose-400"
                                />
                                {modalSearch && (
                                    <button 
                                        onClick={() => setModalSearch('')} 
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1">
                                    Rating:
                                </span>
                                {['all', '5', '4', '3'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setModalRatingFilter(r)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                            modalRatingFilter === r
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60'
                                        }`}
                                    >
                                        {r === 'all' ? 'All' : `${r} Stars ⭐`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Reviews Grid */}
                        <div className="p-5 sm:p-6 overflow-y-auto flex-grow max-h-[60vh]">
                            {filteredModalReviews.length === 0 ? (
                                <div className="py-12 text-center space-y-2">
                                    <MessageSquare size={32} className="mx-auto text-neutral-300" />
                                    <p className="text-xs font-semibold text-neutral-600">No matching reviews found</p>
                                    <p className="text-[11px] text-neutral-400">Try changing your search term or rating filter.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredModalReviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="bg-[#FDEEF2]/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-rose-200/50 shadow-2xs hover:shadow-xs transition-all"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center text-rose-500">
                                                        {[...Array(review.rating || 5)].map((_, i) => (
                                                            <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 text-rose-700 border border-rose-200/50">
                                                        {review.source || 'Google Review'}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-neutral-700 font-light leading-relaxed mb-4 italic">
                                                    "{review.quote}"
                                                </p>
                                            </div>

                                            <div className="pt-2 border-t border-rose-200/40 flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-neutral-900">
                                                    {review.author_name || review.author}
                                                </h4>
                                                <span className="text-[10px] text-rose-400 font-medium">
                                                    Verified Customer
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
                            <span className="text-neutral-500 text-[11px]">
                                Reviews are collected from verified Google and customer feedback.
                            </span>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-all cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
