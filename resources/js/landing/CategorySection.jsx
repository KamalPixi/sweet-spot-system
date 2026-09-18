import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_CATEGORIES = [
    {
        id: 1,
        name: 'Strawberry Cake',
        slug: 'cakes',
        bgColor: 'bg-[#C2162B]', // Rich red
        image: '/images/landing-cat-1.jpg'
    },
    {
        id: 2,
        name: 'Artisan Cookies',
        slug: 'cookies',
        bgColor: 'bg-[#E39556]', // Warm amber/orange
        image: '/images/landing-cat-2.jpg'
    },
    {
        id: 3,
        name: 'Sponge Gateau',
        slug: 'puddings',
        bgColor: 'bg-[#15462D]', // Forest green
        image: '/images/landing-cat-3.jpg'
    },
    {
        id: 4,
        name: 'New York Cheesecake',
        slug: 'cheesecakes',
        bgColor: 'bg-[#DFB339]', // Golden yellow
        image: '/images/landing-cat-4.jpg'
    }
];

export default function CategorySection({ categories = [] }) {
    const navigate = useNavigate();
    const scrollContainerRef = useRef(null);

    // Merge database categories with curated UI cards
    const displayList = categories.length > 0
        ? categories.map((cat, idx) => {
            const defaultItem = DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length];
            const primaryImg = cat.images?.find(i => i.is_primary)?.url || cat.image;
            const resolveUrl = (url) => {
                if (!url) return defaultItem.image;
                if (url.startsWith('http')) return url;
                const clean = url.replace(/^\/?(storage\/)+/, '');
                return `/storage/${clean}`;
            };
            return {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                bgColor: defaultItem.bgColor,
                image: cat.images?.length || cat.image ? resolveUrl(primaryImg) : defaultItem.image
            };
        })
        : DEFAULT_CATEGORIES;

    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="w-full bg-white py-14 md:py-20 px-6 md:px-12 lg:px-20 text-neutral-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 md:mb-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight">
                        Category
                    </h2>
                    <button
                        onClick={() => navigate('/categories')}
                        className="text-xs md:text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
                    >
                        <span>See All</span>
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Category Cards Carousel / Row */}
                <div 
                    ref={scrollContainerRef}
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-4 scrollbar-none"
                >
                    {displayList.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            onClick={() => navigate(`/categories/${item.slug || 'cakes'}`)}
                            className="flex flex-col group cursor-pointer"
                        >
                            {/* Card with colorful background */}
                            <div className={`relative aspect-square w-full ${item.bgColor} rounded-[24px] md:rounded-[32px] overflow-hidden p-3 sm:p-4 md:p-5 flex items-center justify-center transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl`}>
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-contain rounded-2xl drop-shadow-md"
                                    onError={(e) => {
                                        e.target.src = DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].image;
                                    }}
                                />
                            </div>

                            {/* Label */}
                            <span className="mt-3.5 text-xs sm:text-sm md:text-base font-medium text-neutral-800 tracking-tight group-hover:text-rose-600 transition-colors text-left pl-1">
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Controls Bar: Arrow Dots Indicator */}
                <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                        onClick={() => handleScroll('left')}
                        className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-all cursor-pointer shadow-sm"
                        aria-label="Previous Category"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    {/* Progress indicator capsule */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-8 h-1.5 rounded-full bg-neutral-900" />
                        <span className="w-4 h-1.5 rounded-full bg-neutral-300" />
                        <span className="w-4 h-1.5 rounded-full bg-neutral-300" />
                    </div>

                    <button
                        onClick={() => handleScroll('right')}
                        className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-600 flex items-center justify-center hover:border-neutral-900 hover:text-neutral-900 transition-all cursor-pointer"
                        aria-label="Next Category"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </section>
    );
}
