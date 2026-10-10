import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bike, Store, MapPin, Calendar, Clock, ArrowRight, 
    X, Check, AlertCircle, Loader2, ChevronRight, UtensilsCrossed, Sparkles 
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

const calculatePopoverPosition = (anchorElement) => {
    if (typeof window === 'undefined') {
        return { top: 0, left: 0, arrowTop: 32, isReady: false };
    }
    if (!anchorElement) {
        return { top: 0, left: 0, arrowTop: 0, isReady: true, isModal: true };
    }
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) {
        return { top: 0, left: 0, arrowTop: 0, isReady: true };
    }

    const rect = anchorElement.getBoundingClientRect();
    const popoverWidth = 420;
    const popoverHeight = 460;

    let left = rect.right + 16;
    if (left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, rect.left - popoverWidth - 16);
    }

    const btnCenterY = rect.top + (rect.height / 2);
    let top = btnCenterY - (popoverHeight / 2);

    if (top < 16) {
        top = 16;
    }
    const maxTop = window.innerHeight - popoverHeight - 16;
    if (top > maxTop) {
        top = Math.max(16, maxTop);
    }

    const arrowTop = Math.max(24, Math.min(popoverHeight - 24, btnCenterY - top));
    return { top, left, arrowTop, isReady: true };
};

export default function OrderPopover({ isOpen, onClose, anchorRef, onComplete, initialTab }) {
    const navigate = useNavigate();
    const { 
        orderType, setOrderType, 
        deliveryInfo, setDeliveryInfo, 
        collectionSlot, setCollectionSlot,
        tableNumber, setDiningTable, clearDiningTable,
        configs 
    } = useApp();

    const isDeliveryEnabled = configs?.home_delivery_enabled === '1';

    const resolveDefaultTab = () => {
        if (initialTab) return initialTab;
        if (orderType === 'dine_in' || tableNumber) return 'dine_in';
        if (orderType === 'collection') return 'collection';
        if (orderType === 'delivery' && isDeliveryEnabled) return 'delivery';
        return 'collection';
    };

    const [activeTab, setActiveTab] = useState(resolveDefaultTab);

    // Sync tab when opened or initialTab/orderType updates
    useEffect(() => {
        if (isOpen) {
            if (initialTab) {
                setActiveTab(initialTab);
            } else if (orderType === 'dine_in' || tableNumber) {
                setActiveTab('dine_in');
            } else if (orderType === 'collection') {
                setActiveTab('collection');
            } else if (orderType === 'delivery' && isDeliveryEnabled) {
                setActiveTab('delivery');
            } else {
                setActiveTab('collection');
            }
        }
    }, [isOpen, initialTab, orderType, tableNumber, isDeliveryEnabled]);

    // Dine In States
    const [selectedTable, setSelectedTable] = useState(() => tableNumber || '1');
    const [customTableInput, setCustomTableInput] = useState('');
    const [dineInSuccess, setDineInSuccess] = useState(false);

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

    // Calculate initial coordinates immediately upon render if open
    const [popoverPos, setPopoverPos] = useState(() => {
        if (anchorRef?.current) {
            return calculatePopoverPosition(anchorRef.current);
        }
        return { top: 0, left: 0, arrowTop: 0, isReady: false, isModal: !anchorRef };
    });
    const [isMounted, setIsMounted] = useState(false);

    // Keep position updated synchronously on open/resize/scroll
    React.useLayoutEffect(() => {
        if (!isOpen) {
            setIsMounted(false);
            return;
        }

        const updatePosition = () => {
            if (anchorRef?.current) {
                setPopoverPos(calculatePopoverPosition(anchorRef.current));
            } else {
                setPopoverPos({ top: 0, left: 0, arrowTop: 0, isReady: true, isModal: true });
            }
        };

        updatePosition();

        const raf = requestAnimationFrame(() => {
            setIsMounted(true);
        });

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            cancelAnimationFrame(raf);
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

    // Handle Dine In Submit
    const handleDineInSubmit = (e) => {
        e.preventDefault();
        const finalTable = (customTableInput || selectedTable || '').trim();
        if (!finalTable) return;

        setDiningTable(finalTable);
        setDineInSuccess(true);

        setTimeout(() => {
            onClose();
            if (onComplete) {
                onComplete({ type: 'dine_in', table_number: finalTable });
            } else {
                navigate('/categories');
            }
        }, 600);
    };

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
                    if (onComplete) {
                        onComplete(deliveryData);
                    } else {
                        navigate('/categories');
                    }
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
            if (onComplete) {
                onComplete(slotData);
            } else {
                navigate('/categories');
            }
        }, 700);
    };

    // Compute current position synchronously if anchor is provided
    const currentPos = (anchorRef?.current && isOpen)
        ? calculatePopoverPosition(anchorRef.current)
        : popoverPos;

    if (!isOpen || typeof document === 'undefined') return null;
    if (anchorRef && !currentPos.isReady) return null;

    const storeAddress = configs?.store_address || '19, Faircross Parade, Upney Ln, Barking';
    const storePostcode = configs?.store_postcode || 'IG11 8UW';

    const isDesktopAnchored = window.innerWidth >= 768 && currentPos.isReady && !currentPos.isModal;

    // Quick table numbers list (1 to 12)
    const standardTables = Array.from({ length: 12 }, (_, i) => String(i + 1));

    const popoverContent = (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Backdrop for click outside */}
            <div 
                className={`fixed inset-0 ${currentPos.isModal ? 'bg-black/60 backdrop-blur-xs' : 'bg-black/40 md:bg-black/10 backdrop-blur-[2px] md:backdrop-blur-none'} pointer-events-auto transition-opacity duration-300 ease-out ${
                    isMounted ? 'opacity-100' : 'opacity-0'
                }`} 
                onClick={onClose}
            />

            {/* Popover Card Wrapper with Connected Arrow */}
            <div 
                className={`fixed pointer-events-auto w-[calc(100%-2rem)] max-w-[430px] max-h-[min(580px,calc(100vh-2rem))] flex flex-col rounded-2xl transition-[opacity,transform] duration-300 ease-out ${
                    isMounted 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-2'
                }`}
                style={{ 
                    filter: 'drop-shadow(0 20px 35px rgba(0,0,0,0.3))',
                    ...(isDesktopAnchored
                        ? {
                            top: `${currentPos.top}px`,
                            left: `${currentPos.left}px`,
                        }
                        : {
                            top: '50%',
                            left: '50%',
                            transform: isMounted 
                                ? 'translateX(-50%) translateY(-50%)' 
                                : 'translateX(-50%) translateY(-48%) scale(0.95)',
                        }
                    )
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Connected Arrow pointing left directly to the Order Now button (Desktop with Anchor) */}
                {isDesktopAnchored && (
                    <div 
                        className="hidden md:block absolute -left-2 w-4 h-4 bg-white border-b border-l border-neutral-200 transform rotate-45 z-30"
                        style={{ top: `${currentPos.arrowTop || 32}px` }}
                    />
                )}

                {/* Inner Card Container */}
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

                        {/* Active Table indicator if dining in */}
                        {orderType === 'dine_in' && tableNumber && (
                            <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <UtensilsCrossed size={14} className="text-amber-700 shrink-0" />
                                    <span className="text-[11px] font-bold text-amber-900 truncate">
                                        Selected Table #{tableNumber}
                                    </span>
                                </div>
                                <span className="text-[10px] font-semibold text-amber-700 shrink-0">
                                    Change below
                                </span>
                            </div>
                        )}

                        {/* Tabs Pill Switcher */}
                        <div className={`grid ${isDeliveryEnabled ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 bg-neutral-200/70 p-1 rounded-xl`}>
                            {/* Self Collection Tab */}
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

                            {/* Dine In Tab */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('dine_in')}
                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'dine_in'
                                        ? 'bg-white text-neutral-950 shadow-xs'
                                        : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                            >
                                <UtensilsCrossed size={14} className={activeTab === 'dine_in' ? 'text-amber-600' : ''} />
                                <span>Dine In</span>
                            </button>

                            {/* Optional Home Delivery Tab (when enabled) */}
                            {isDeliveryEnabled && (
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
                                    <span>Delivery</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tab Content 1: Dine In (Table Selection) */}
                    {activeTab === 'dine_in' && (
                        <form onSubmit={handleDineInSubmit} className="p-5 space-y-4 text-left overflow-y-auto overscroll-contain">
                            {/* Table Service Banner */}
                            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                                    <UtensilsCrossed size={14} />
                                </div>
                                <div>
                                    <p className="font-bold text-amber-950">In-Store Table Ordering</p>
                                    <p className="text-amber-800/90 mt-0.5">
                                        Choose your table number below and our team will prepare your dessert and bring it straight to your seat.
                                    </p>
                                </div>
                            </div>

                            {/* Quick Table Grid */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                                    Select Table Number *
                                </label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {standardTables.map((num) => {
                                        const isSelected = (customTableInput ? customTableInput === num : selectedTable === num);
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTable(num);
                                                    setCustomTableInput('');
                                                }}
                                                className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all border text-center cursor-pointer flex flex-col items-center justify-center ${
                                                    isSelected
                                                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs scale-105'
                                                        : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200'
                                                }`}
                                            >
                                                <span className="text-[9px] font-normal uppercase opacity-70">T-</span>
                                                <span className="text-sm font-bold leading-none mt-0.5">{num}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Table Number Input */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                    Or Enter Other Table / Booth # (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={customTableInput}
                                    onChange={(e) => {
                                        setCustomTableInput(e.target.value);
                                        if (e.target.value) {
                                            setSelectedTable(e.target.value);
                                        }
                                    }}
                                    placeholder="e.g. Table 14, Booth B, or Patio 3"
                                    className="w-full bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl px-3.5 py-2 text-xs text-neutral-900 font-semibold transition-all focus:outline-none"
                                />
                            </div>

                            {dineInSuccess && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2 font-bold">
                                    <Check size={14} />
                                    <span>Table #{customTableInput || selectedTable} confirmed! Redirecting to menu...</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={dineInSuccess || (!selectedTable && !customTableInput)}
                                className="w-full mt-2 py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {dineInSuccess ? (
                                    <span>Table #{customTableInput || selectedTable} Confirmed!</span>
                                ) : (
                                    <>
                                        <span>Confirm Table #{customTableInput || selectedTable || ''} & Browse Menu</span>
                                        <ArrowRight size={13} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Tab Content 2: Self Collection Schedule */}
                    {activeTab === 'collection' && (
                        <form onSubmit={handleCollectionSubmit} className="p-5 space-y-3.5 text-left overflow-y-auto overscroll-contain">
                            {/* Store Pickup Location snippet */}
                            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/70 text-[11px] flex items-start gap-2">
                                <MapPin size={14} className="text-[#8e5233] shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-neutral-900">Store Collection Counter</p>
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

                    {/* Tab Content 3: Delivery Address Form (Only when enabled) */}
                    {activeTab === 'delivery' && isDeliveryEnabled && (
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
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(popoverContent, document.body);
}
