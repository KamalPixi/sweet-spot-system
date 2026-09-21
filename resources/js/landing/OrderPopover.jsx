import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bike, Store, MapPin, Calendar, Clock, ArrowRight, 
    X, Check, AlertCircle, Loader2, ChevronRight 
} from 'lucide-react';
import { useApp } from '../AppContext';

import ReactDOM from 'react-dom';

const UK_TIME_ZONE = 'Europe/London';

const getUKTodayParts = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: UK_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());

    return {
        year: Number(parts.find(part => part.type === 'year')?.value),
        month: Number(parts.find(part => part.type === 'month')?.value),
        day: Number(parts.find(part => part.type === 'day')?.value),
    };
};

const addDaysToDateParts = (parts, days) => {
    const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
    };
};

const formatDateKey = ({ year, month, day }) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export default function OrderPopover({ isOpen, onClose, anchorRef }) {
    const navigate = useNavigate();
    const { 
        orderType, setOrderType, 
        deliveryInfo, setDeliveryInfo, 
        collectionSlot, setCollectionSlot,
        configs 
    } = useApp();

    const [activeTab, setActiveTab] = useState(() => orderType === 'collection' ? 'collection' : 'delivery');

    // Sync tab when opened or orderType updates
    useEffect(() => {
        if (isOpen && orderType) {
            setActiveTab(orderType);
        }
    }, [isOpen, orderType]);

    // Popover placement coordinates for desktop portal rendering
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, arrowTop: 0, isReady: false });

    // Delivery Form States
    const [postcode, setPostcode] = useState(() => deliveryInfo?.postcode || '');
    const [addressLine1, setAddressLine1] = useState(() => deliveryInfo?.address_line_1 || '');
    const [verifyingDelivery, setVerifyingDelivery] = useState(false);
    const [deliveryError, setDeliveryError] = useState(null);
    const [deliverySuccess, setDeliverySuccess] = useState(false);

    // Collection Form States
    const [selectedDate, setSelectedDate] = useState(() => formatDateKey(getUKTodayParts()));
    const [openingHours, setOpeningHours] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [collectionError, setCollectionError] = useState(null);
    const [collectionSuccess, setCollectionSuccess] = useState(false);

    // Dynamic position calculation based on anchorRef (the Order button)
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (!anchorRef?.current) return;
            const rect = anchorRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            const isDesktop = window.innerWidth >= 768; // md breakpoint

            if (isDesktop) {
                // Dimensions & viewport bounds
                const popoverWidth = 420;
                const popoverHeight = 440;
                
                // Position to the right of the button with a 16px gap
                let left = rect.right + 16;
                // If overflowing right edge of window, flip or constrain
                if (left + popoverWidth > window.innerWidth - 16) {
                    left = Math.max(16, rect.left - popoverWidth - 16);
                }

                // Center vertically relative to the button
                const btnCenterY = rect.top + (rect.height / 2);
                let top = btnCenterY - (popoverHeight / 2);

                // Prevent top viewport overflow
                if (top < 16) {
                    top = 16;
                }

                // Prevent bottom viewport overflow (keeps the full card and submit button visible on screen)
                const maxTop = window.innerHeight - popoverHeight - 16;
                if (top > maxTop) {
                    top = Math.max(16, maxTop);
                }

                // Calculate arrow position relative to the popover top
                const arrowTop = Math.max(24, Math.min(popoverHeight - 24, btnCenterY - top));

                setPopoverPos({ top, left, arrowTop, isReady: true });
            } else {
                setPopoverPos({ top: 0, left: 0, arrowTop: 0, isReady: true });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, anchorRef]);

    // Days list for collection
    const daysList = React.useMemo(() => {
        const list = [];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayUK = getUKTodayParts();
        for (let i = 0; i < 5; i++) {
            const dateParts = addDaysToDateParts(todayUK, i);
            const d = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day));
            const dateStr = formatDateKey(dateParts);
            const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${days[d.getUTCDay()]} (${dateParts.day}/${dateParts.month})`;
            list.push({ date: dateStr, label, dayName: days[d.getUTCDay()] });
        }
        return list;
    }, []);

    // Fetch opening hours
    useEffect(() => {
        if (!isOpen) return;
        fetch('/api/opening-hours')
            .then(res => res.json())
            .then(res => {
                if (res.success) setOpeningHours(res.data || []);
            })
            .catch(err => console.error('Opening hours error:', err));
    }, [isOpen]);

    // Fetch slots on date change
    useEffect(() => {
        if (!isOpen || activeTab !== 'collection' || !selectedDate) return;
        setLoadingSlots(true);
        setCollectionError(null);
        setSelectedSlot(null);

        fetch(`/api/collection-slots?date=${selectedDate}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setSlots(res.data.slots || []);
                } else {
                    setCollectionError('Failed to fetch time slots.');
                }
            })
            .catch(err => {
                console.error(err);
                setCollectionError('Failed to load slots.');
            })
            .finally(() => setLoadingSlots(false));
    }, [isOpen, activeTab, selectedDate]);

    // Handle Delivery Submit
    const handleDeliverySubmit = async (e) => {
        e.preventDefault();
        if (!postcode || !addressLine1) return;
        setVerifyingDelivery(true);
        setDeliveryError(null);

        try {
            const res = await fetch('/api/check-postcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postcode }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setDeliveryError(data.message || 'Verification failed. Please check your postcode.');
                setVerifyingDelivery(false);
                return;
            }

            const info = data.data;
            if (info.is_allowed) {
                const deliveryData = {
                    postcode: info.postcode,
                    address_line_1: addressLine1,
                    city: 'London',
                    distance_miles: info.distance_miles,
                    delivery_fee: info.delivery_fee,
                    type: 'home',
                };
                setOrderType('delivery');
                setDeliveryInfo(deliveryData);
                setDeliverySuccess(true);

                setTimeout(() => {
                    onClose();
                    navigate('/categories');
                }, 700);
            } else {
                setDeliveryError(`We only deliver within ${info.max_radius_miles} miles. You are ${info.distance_miles} miles away.`);
            }
        } catch (err) {
            console.error(err);
            setDeliveryError('Network error. Please try again.');
        } finally {
            setVerifyingDelivery(false);
        }
    };

    // Handle Collection Submit
    const handleCollectionSubmit = (e) => {
        e.preventDefault();
        if (!selectedSlot) return;

        // Parse date from slot datetime (format: YYYY-MM-DD HH:MM:SS) or selectedDate
        const slotDate = selectedSlot.date || (selectedSlot.datetime ? selectedSlot.datetime.split(' ')[0] : selectedDate);

        const slotData = {
            date: slotDate,
            time: selectedSlot.time,
            datetime: selectedSlot.datetime,
            formatted_label: selectedSlot.formatted_label,
        };
        setOrderType('collection');
        setCollectionSlot(slotData);
        setCollectionSuccess(true);

        setTimeout(() => {
            onClose();
            navigate('/categories');
        }, 700);
    };

    if (!isOpen || typeof document === 'undefined') return null;

    const storeAddress = configs?.store_address || '10 Soho Street, London';
    const storePostcode = configs?.store_postcode || 'W1D 1AN';

    const popoverContent = (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Backdrop for click outside */}
            <div 
                className="fixed inset-0 bg-black/40 md:bg-black/10 backdrop-blur-[2px] md:backdrop-blur-none pointer-events-auto transition-opacity" 
                onClick={onClose}
            />

            {/* Popover Card Wrapper with Connected Arrow */}
            <div 
                className="fixed pointer-events-auto w-[calc(100%-2rem)] max-w-[420px] max-h-[min(540px,calc(100vh-2rem))] flex flex-col rounded-2xl animate-fadeIn"
                style={{ 
                    filter: 'drop-shadow(0 20px 35px rgba(0,0,0,0.3))',
                    ...(popoverPos.isReady && window.innerWidth >= 768
                        ? {
                            top: `${popoverPos.top}px`,
                            left: `${popoverPos.left}px`,
                            transform: 'none',
                        }
                        : {
                            top: '5rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }
                    )
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Connected Arrow pointing left directly to the Order Now button (Desktop) */}
                {window.innerWidth >= 768 && popoverPos.isReady && (
                    <div 
                        className="hidden md:block absolute -left-2 w-4 h-4 bg-white border-b border-l border-neutral-200 transform rotate-45 z-30"
                        style={{ top: `${popoverPos.arrowTop || 32}px` }}
                    />
                )}

                {/* Inner Card Container with strict overflow-hidden & rounded-2xl so all corners are beautifully smooth */}
                <div className="relative w-full h-full flex flex-col bg-white rounded-2xl border border-neutral-200/90 text-neutral-900 overflow-hidden shadow-2xl">
                    {/* Header & Tabs */}
                    <div className="bg-neutral-50/80 border-b border-neutral-200/70 p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                                Choose Fulfillment
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Tabs Pill Switcher */}
                    <div className="grid grid-cols-2 gap-1.5 bg-neutral-200/70 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab('delivery')}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'delivery'
                                    ? 'bg-white text-neutral-950 shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                        >
                            <Bike size={14} className={activeTab === 'delivery' ? 'text-amber-600' : ''} />
                            <span>Home Delivery</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('collection')}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'collection'
                                    ? 'bg-white text-neutral-950 shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                        >
                            <Store size={14} className={activeTab === 'collection' ? 'text-amber-600' : ''} />
                            <span>Self Collection</span>
                        </button>
                    </div>
                </div>

                {/* Tab 1: Delivery Address Form */}
                {activeTab === 'delivery' && (
                    <form onSubmit={handleDeliverySubmit} className="p-5 space-y-3.5 text-left overflow-y-auto overscroll-contain">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                Delivery Postcode *
                            </label>
                            <input
                                type="text"
                                required
                                value={postcode}
                                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                                placeholder="e.g. IG11 8TB or W1D 1AN"
                                className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl px-3 py-2 text-xs text-neutral-900 font-bold uppercase tracking-wider transition-all focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                Street Address & House No. *
                            </label>
                            <input
                                type="text"
                                required
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                placeholder="e.g. 14 High Street, Flat 2"
                                className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl px-3 py-2 text-xs text-neutral-900 transition-all focus:outline-none"
                            />
                        </div>

                        {deliveryError && (
                            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-start gap-2">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <span>{deliveryError}</span>
                            </div>
                        )}

                        {deliverySuccess && (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2 font-bold">
                                <Check size={14} />
                                <span>Address verified! Redirecting to menu...</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={verifyingDelivery || deliverySuccess || !postcode || !addressLine1}
                            className="w-full mt-2 py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {verifyingDelivery ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Verifying Address...</span>
                                </>
                            ) : deliverySuccess ? (
                                <span>Address Confirmed!</span>
                            ) : (
                                <>
                                    <span>Confirm Delivery & Browse Menu</span>
                                    <ArrowRight size={13} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Tab 2: Self Collection Schedule */}
                {activeTab === 'collection' && (
                    <form onSubmit={handleCollectionSubmit} className="p-5 space-y-3.5 text-left overflow-y-auto overscroll-contain">
                        {/* Store Pickup Location snippet */}
                        <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/70 text-[11px] flex items-start gap-2">
                            <MapPin size={14} className="text-[#8e5233] shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-neutral-900">Bakery Collection Counter</p>
                                <p className="text-neutral-500 mt-0.5">{storeAddress}, {storePostcode}</p>
                            </div>
                        </div>

                        {/* Date selection pills */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
                                <Calendar size={11} />
                                <span>Select Collection Date</span>
                            </label>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {daysList.map((dayItem) => {
                                    const isSelected = selectedDate === dayItem.date;
                                    return (
                                        <button
                                            key={dayItem.date}
                                            type="button"
                                            onClick={() => setSelectedDate(dayItem.date)}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-neutral-950 text-white shadow-xs'
                                                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                                            }`}
                                        >
                                            {dayItem.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time slots grid */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
                                <Clock size={11} />
                                <span>Select Pickup Time</span>
                            </label>

                            {loadingSlots ? (
                                <div className="py-6 flex items-center justify-center gap-2 text-neutral-400 text-xs">
                                    <Loader2 size={16} className="animate-spin text-amber-600" />
                                    <span>Loading collection slots...</span>
                                </div>
                            ) : collectionError ? (
                                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-[11px]">
                                    {collectionError}
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="py-6 text-center text-neutral-400 text-xs">
                                    No slots available for this date.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                                    {slots.map((slot) => {
                                        const isSelected = selectedSlot?.datetime === slot.datetime;
                                        return (
                                            <button
                                                key={slot.datetime}
                                                type="button"
                                                disabled={!slot.is_available}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border text-center cursor-pointer ${
                                                    !slot.is_available
                                                        ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                                                            : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                                                }`}
                                            >
                                                {slot.time}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {collectionSuccess && (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2 font-bold">
                                <Check size={14} />
                                <span>Slot confirmed! Redirecting to menu...</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!selectedSlot || collectionSuccess || loadingSlots}
                            className="w-full mt-2 py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {collectionSuccess ? (
                                <span>Slot Reserved!</span>
                            ) : (
                                <>
                                    <span>Confirm Pickup & Browse Menu</span>
                                    <ArrowRight size={13} />
                                </>
                            )}
                        </button>
                    </form>
                )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(popoverContent, document.body);
}
