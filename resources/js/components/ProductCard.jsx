import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Check } from 'lucide-react';

const getImageUrl = (item) => {
    if (!item) return '/images/placeholder.svg';
    const resolveUrl = (url) => {
        if (!url) return '/images/placeholder.svg';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
        return `/storage/${cleanUrl}`;
    };
    if (item.images && item.images.length > 0) {
        const primary = item.images.find(img => img.is_primary);
        const url = primary ? primary.url : item.images[0].url;
        return resolveUrl(url);
    }
    if (item.image) {
        return resolveUrl(item.image);
    }
    return '/images/placeholder.svg';
};

export default function ProductCard({ product }) {
    const navigate = useNavigate();
    const { cart, addToCart } = useApp();
    const [addedFeedback, setAddedFeedback] = useState(false);

    const pPrice = product.has_variations && product.variations && product.variations.length > 0
        ? parseFloat(product.variations[0].price).toFixed(2)
        : parseFloat(product.base_price).toFixed(2);

    const isInCart = cart.some(item => item.product_id === product.id);

    const handleAdd = (e) => {
        e.stopPropagation();
        const variation = product.has_variations && product.variations && product.variations.length > 0 
            ? product.variations[0] 
            : null;
        addToCart(product, variation, 1);
        setAddedFeedback(true);
        setTimeout(() => {
            setAddedFeedback(false);
        }, 1500);
    };

    return (
        <div 
            onClick={() => navigate(`/product/${product.slug}`)}
            className="flex flex-col group cursor-pointer text-left w-full"
        >
            <div className="relative aspect-[3/4] overflow-hidden bg-[#eae2d5] shrink-0 mb-4 rounded-[20px] border border-neutral-200/60 transition-transform duration-300 group-hover:scale-[1.02]">
                <img 
                    src={getImageUrl(product)} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = "/images/placeholder.svg";
                    }}
                />
                <span className="bg-white text-[#8f5336] font-bold text-xs px-3 py-1.5 rounded-full absolute top-3 right-3 border border-neutral-100 shadow-sm">
                    £{pPrice}
                </span>
            </div>
            
            <div className="flex justify-between items-center gap-2 px-1">
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-neutral-800 text-sm leading-snug group-hover:text-[#8e5233] transition-colors truncate">
                        {product.name}
                    </h3>
                </div>
                <button 
                    onClick={handleAdd}
                    className={`w-9 h-9 rounded-[12px] border flex items-center justify-center shrink-0 transition-all cursor-pointer focus:outline-none ${
                        addedFeedback || isInCart
                            ? 'bg-[#8e5233] border-[#8e5233] text-white'
                            : 'border-[#8e5233] hover:bg-[#8e5233]/5 text-[#8e5233] bg-transparent'
                    }`}
                >
                    {addedFeedback || isInCart ? (
                        <Check size={22} strokeWidth={2.5} />
                    ) : (
                        <img src="/images/icons/bag-primary.png" alt="Add to cart" className="w-5 h-5 object-contain inline-block" />
                    )}
                </button>
            </div>
        </div>
    );
}
