import React, { useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Layout: items-end stagger (shorter card 2 sits higher visually)
 * Rotation is on the container with overflow-hidden so rounded corners follow the tilt.
 * Hover: rotation resets to 0 and card scales up slightly.
 */
const DEFAULT_CATEGORIES = [
    {
        id: 1,
        name: 'Strawberry Cake',
        slug: 'cakes',
        image: '/images/landing-cat-1.jpg',
        rotation: -2,
        titlePosition: 'bottom',
        height: 'tall',
    },
    {
        id: 2,
        name: 'Artisan Cookies',
        slug: 'cookies',
        image: '/images/landing-cat-2.jpg',
        rotation: 1.5,
        titlePosition: 'top',
        height: 'short',
    },
    {
        id: 3,
        name: 'Sponge Gateau',
        slug: 'puddings',
        image: '/images/landing-cat-3.jpg',
        rotation: -1,
        titlePosition: 'bottom',
        height: 'tall',
    },
    {
        id: 4,
        name: 'New York Cheesecake',
        slug: 'cheesecakes',
        image: '/images/landing-cat-4.jpg',
        rotation: 2.5,
        titlePosition: 'top',
        height: 'tall',
    },
];

export default function CategorySection({ categories = [] }) {
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

    const displayList = categories.length > 0
        ? categories.map((cat, idx) => {
            const def = DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length];
            const primaryImg = cat.images?.find(i => i.is_primary)?.url || cat.image;
            const resolveUrl = (url) => {
                if (!url) return def.image;
                if (url.startsWith('http')) return url;
                return `/storage/${url.replace(/^\/?(storage\/)+/, '')}`;
            };
            return {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                image: (cat.images?.length || cat.image) ? resolveUrl(primaryImg) : def.image,
                rotation: def.rotation,
                titlePosition: def.titlePosition,
                height: def.height,
            };
        })
        : DEFAULT_CATEGORIES;

    const onScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        if (max <= 0) return setActiveIndex(0);
        setActiveIndex(Math.min(2, Math.round((el.scrollLeft / max) * 2)));
    }, []);

    const scrollByCard = (dir) => {
        const el = scrollRef.current;
        if (!el) return;
        const card = el.querySelector('[data-card]');
        const amount = card ? card.offsetWidth + 24 : 280;
        el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    const scrollToPage = (i) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ left: (el.scrollWidth - el.clientWidth) * (i / 2), behavior: 'smooth' });
    };

    const onMouseDown = (e) => {
        dragRef.current = { active: true, startX: e.pageX, scrollLeft: scrollRef.current.scrollLeft, moved: false };
    };
    const onMouseMove = (e) => {
        if (!dragRef.current.active) return;
        e.preventDefault();
        const walk = (e.pageX - dragRef.current.startX) * 1.4;
        if (Math.abs(walk) > 5) dragRef.current.moved = true;
        scrollRef.current.scrollLeft = dragRef.current.scrollLeft - walk;
    };
    const onMouseUp = () => { dragRef.current.active = false; };
    const onCardClick = (slug) => {
        if (!dragRef.current.moved) navigate(`/categories/${slug || 'cakes'}`);
    };

    return (
        <section className="w-full bg-white py-12 md:py-20 select-none">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 lg:px-20">

                {/* Header */}
                <div className="flex items-center justify-between mb-10 md:mb-14">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#191919] tracking-tight leading-none">
                        Category
                    </h2>
                    <button
                        onClick={() => navigate('/categories')}
                        className="flex items-center gap-1 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors group cursor-pointer"
                    >
                        See all
                        <ArrowDownRight size={16} className="group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                </div>

                {/* py-6 gives rotated card corners room; overflow-x-auto handles scrolling */}
                <div
                    ref={scrollRef}
                    onScroll={onScroll}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    className="flex items-end gap-5 md:gap-6 overflow-x-auto py-6 scrollbar-none cursor-grab active:cursor-grabbing"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {displayList.map((item, idx) => {
                        const isTitleTop = item.titlePosition === 'top';
                        const isTall = item.height !== 'short';

                        return (
                            <div
                                key={item.id || idx}
                                data-card
                                onClick={() => onCardClick(item.slug)}
                                className="flex-none flex flex-col cursor-pointer group"
                                style={{
                                    /* Tall cards: ~270px wide, Short card: ~235px wide */
                                    width: isTall ? 'clamp(200px, 22vw, 270px)' : 'clamp(170px, 18vw, 235px)',
                                }}
                            >
                                {/* Label ABOVE (cards 2 & 4) */}
                                {isTitleTop && (
                                    <p className="mb-2.5 text-[15px] md:text-[17px] font-semibold text-[#1a1a1a] tracking-tight leading-tight group-hover:text-rose-500 transition-colors truncate">
                                        {item.name}
                                    </p>
                                )}

                                {/* Rotation on the container — overflow-hidden clips the rounded corners correctly */}
                                <div
                                    className="w-full overflow-hidden rounded-[20px] md:rounded-[24px] transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                                    style={{
                                        height: isTall ? 'clamp(210px, 20vw, 270px)' : 'clamp(175px, 17vw, 230px)',
                                        transform: `rotate(${item.rotation}deg)`,
                                    }}
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        draggable={false}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].image; }}
                                    />
                                </div>

                                {/* Label BELOW (cards 1 & 3) */}
                                {!isTitleTop && (
                                    <p className="mt-2.5 text-[15px] md:text-[17px] font-semibold text-[#1a1a1a] tracking-tight leading-tight group-hover:text-rose-500 transition-colors truncate">
                                        {item.name}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mt-10 md:mt-12">
                    <button
                        onClick={() => scrollByCard('left')}
                        aria-label="Previous"
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1c1410] text-white hover:bg-black active:scale-90 transition-all shadow-sm cursor-pointer"
                    >
                        <ArrowLeft size={15} strokeWidth={2.5} />
                    </button>

                    <div className="flex items-center gap-2">
                        {[0, 1, 2].map(i => (
                            <button
                                key={i}
                                onClick={() => scrollToPage(i)}
                                aria-label={`Slide ${i + 1}`}
                                className={`h-[6px] rounded-full transition-all duration-300 cursor-pointer ${
                                    activeIndex === i
                                        ? 'w-12 bg-[#1c1410]'
                                        : 'w-7 bg-[#dcdcdc] hover:bg-[#bbb]'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => scrollByCard('right')}
                        aria-label="Next"
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-[#888] text-[#1c1410] hover:border-black hover:bg-neutral-100 active:scale-90 transition-all cursor-pointer"
                    >
                        <ArrowRight size={15} strokeWidth={2.5} />
                    </button>
                </div>

            </div>
        </section>
    );
}
