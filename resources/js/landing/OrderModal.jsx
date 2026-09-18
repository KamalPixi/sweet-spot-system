import React from 'react';
import { X, Bike, Store, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function OrderModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { setOrderType } = useApp();

    if (!isOpen) return null;

    const handleSelectType = (type) => {
        setOrderType(type);
        onClose();
        if (type === 'delivery') {
            navigate('/delivery-setup');
        } else {
            navigate('/collection-setup');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-neutral-100 text-neutral-900">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                    <X size={16} />
                </button>

                <div className="text-center mb-6">
                    <span className="text-xs font-semibold tracking-wider text-rose-500 uppercase">
                        Sweet Spot Delivery & Pickup
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#111111] mt-1">
                        How would you like your treats?
                    </h3>
                    <p className="text-xs text-neutral-500 font-light mt-1.5">
                        Choose your fulfillment method to begin browsing our menu.
                    </p>
                </div>

                <div className="space-y-3.5">
                    {/* Home Delivery Option */}
                    <button
                        onClick={() => handleSelectType('delivery')}
                        className="w-full bg-[#FCF3F5] hover:bg-[#fae7eb] border border-rose-200/70 hover:border-rose-300 rounded-[22px] p-4 flex items-center justify-between text-left transition-all duration-200 cursor-pointer group"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Bike size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-neutral-900 group-hover:text-rose-600 transition-colors">
                                    Home Delivery
                                </h4>
                                <p className="text-[11px] text-neutral-500 font-light">
                                    Delivered hot or cold directly to your doorstep.
                                </p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-neutral-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                    </button>

                    {/* Self Collection Option */}
                    <button
                        onClick={() => handleSelectType('collection')}
                        className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-[22px] p-4 flex items-center justify-between text-left transition-all duration-200 cursor-pointer group"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Store size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-neutral-900 group-hover:text-neutral-950 transition-colors">
                                    Self Collection
                                </h4>
                                <p className="text-[11px] text-neutral-500 font-light">
                                    Pick up fresh from our Barking bakery counter.
                                </p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            </div>
        </div>
    );
}
