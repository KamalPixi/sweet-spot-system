import React, { useState, useEffect, useMemo } from 'react';
import { 
    Clock, Calendar, Sparkles, CheckCircle2, XCircle, AlertCircle, 
    Edit3, Copy, Layers, Timer, Sliders, Check, Eye, RefreshCw,
    Sun, Moon, ChevronRight, X, Info, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKENDS = ['Saturday', 'Sunday'];

const PRESETS = [
    { label: 'Standard (08:00 – 22:00)', open: '08:00', close: '22:00', interval: 15 },
    { label: 'Morning & Daytime (09:00 – 18:00)', open: '09:00', close: '18:00', interval: 15 },
    { label: 'Evening & Late Night (12:00 – 23:00)', open: '12:00', close: '23:00', interval: 15 },
    { label: 'Weekend Brunch & Treats (10:00 – 21:00)', open: '10:00', close: '21:00', interval: 30 },
];

function formatTimeDisplay(timeStr) {
    if (!timeStr) return '--:--';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minFormatted = String(m || 0).padStart(2, '0');
    return `${hour12}:${minFormatted} ${period}`;
}

function calculateSlotEstimate(openStr, closeStr, intervalMins, isClosed) {
    if (isClosed || !openStr || !closeStr || !intervalMins) return 0;
    const [oh, om] = openStr.split(':').map(Number);
    const [ch, cm] = closeStr.split(':').map(Number);
    const startMins = oh * 60 + (om || 0);
    const endMins = ch * 60 + (cm || 0);
    const diff = endMins - startMins;
    if (diff <= 0) return 0;
    return Math.floor(diff / intervalMins);
}

function calculateOperatingHoursSpan(openStr, closeStr, isClosed) {
    if (isClosed || !openStr || !closeStr) return 0;
    const [oh, om] = openStr.split(':').map(Number);
    const [ch, cm] = closeStr.split(':').map(Number);
    const startMins = oh * 60 + (om || 0);
    const endMins = ch * 60 + (cm || 0);
    const diff = endMins - startMins;
    return diff > 0 ? (diff / 60).toFixed(1) : 0;
}

export default function AdminCollectionSlotsTab({ token, openingHours = [], onUpdated }) {
    const [hours, setHours] = useState(openingHours);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);

    // Edit Modal State
    const [editingDay, setEditingDay] = useState(null);
    const [editForm, setEditForm] = useState({
        open_time: '08:00',
        close_time: '22:00',
        slot_interval: 15,
        is_closed: false,
        applyScope: 'single', // 'single', 'weekdays', 'all'
    });

    // Customer Slot Simulator State
    const [showSimulator, setShowSimulator] = useState(false);
    const [simDate, setSimDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [simSlots, setSimSlots] = useState([]);
    const [loadingSim, setLoadingSim] = useState(false);

    // Keep internal hours in sync with prop
    useEffect(() => {
        if (openingHours && openingHours.length > 0) {
            setHours(openingHours);
        }
    }, [openingHours]);

    // Fetch fresh hours
    const fetchHours = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/admin/opening-hours', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const d = await res.json();
            if (d.success) {
                setHours(d.data || []);
                if (onUpdated) onUpdated();
            }
        } catch (err) {
            console.error('Failed to fetch opening hours', err);
            if (!silent) toast.error('Failed to refresh collection hours.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Quick toggle open / closed from the card
    const handleQuickToggleClosed = async (day) => {
        const newIsClosed = !day.is_closed;
        setSavingId(day.id);
        try {
            const res = await fetch(`/api/admin/opening-hours/${day.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    open_time: day.open_time,
                    close_time: day.close_time,
                    slot_interval: parseInt(day.slot_interval, 10),
                    is_closed: newIsClosed,
                })
            });
            const d = await res.json();
            if (d.success) {
                toast.success(`${day.day_of_week} is now marked as ${newIsClosed ? 'Closed' : 'Open'}.`);
                fetchHours(true);
            } else {
                toast.error(d.message || 'Failed to update day status.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Network error saving changes.');
        } finally {
            setSavingId(null);
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (day) => {
        setEditingDay(day);
        setEditForm({
            open_time: day.open_time ? day.open_time.slice(0, 5) : '08:00',
            close_time: day.close_time ? day.close_time.slice(0, 5) : '22:00',
            slot_interval: day.slot_interval || 15,
            is_closed: !!day.is_closed,
            applyScope: 'single',
        });
    };

    // Save Edit Form
    const handleSaveDay = async (e) => {
        if (e) e.preventDefault();
        if (!editingDay) return;

        setSavingId(editingDay.id);
        const formatTimeWithSeconds = (t) => (t && t.length === 5 ? `${t}:00` : t);

        const payload = {
            open_time: formatTimeWithSeconds(editForm.open_time),
            close_time: formatTimeWithSeconds(editForm.close_time),
            slot_interval: parseInt(editForm.slot_interval, 10),
            is_closed: !!editForm.is_closed,
        };

        // Determine target days
        let targetDays = [editingDay];
        if (editForm.applyScope === 'weekdays') {
            targetDays = hours.filter(h => WEEKDAYS.includes(h.day_of_week));
        } else if (editForm.applyScope === 'all') {
            targetDays = hours;
        }

        try {
            await Promise.all(
                targetDays.map(d =>
                    fetch(`/api/admin/opening-hours/${d.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    })
                )
            );

            const scopeLabel = editForm.applyScope === 'weekdays' 
                ? 'all weekdays (Mon–Fri)' 
                : editForm.applyScope === 'all' 
                ? 'all 7 days' 
                : editingDay.day_of_week;

            toast.success(`Updated collection slot schedule for ${scopeLabel}!`);
            setEditingDay(null);
            fetchHours(true);
            if (showSimulator) fetchSimulatorSlots(simDate);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save collection slot settings.');
        } finally {
            setSavingId(null);
        }
    };

    // Apply Preset
    const applyPreset = (preset) => {
        setEditForm(prev => ({
            ...prev,
            open_time: preset.open,
            close_time: preset.close,
            slot_interval: preset.interval,
            is_closed: false
        }));
    };

    // Fetch Simulator Slots
    const fetchSimulatorSlots = async (dateStr) => {
        setLoadingSim(true);
        try {
            const res = await fetch(`/api/collection-slots?date=${dateStr}`);
            const d = await res.json();
            if (d.success) {
                setSimSlots(d.data.slots || []);
            } else {
                setSimSlots([]);
            }
        } catch (err) {
            console.error(err);
            setSimSlots([]);
        } finally {
            setLoadingSim(false);
        }
    };

    useEffect(() => {
        if (showSimulator && simDate) {
            fetchSimulatorSlots(simDate);
        }
    }, [showSimulator, simDate]);

    // Computed Analytics
    const sortedHours = useMemo(() => {
        return [...hours].sort((a, b) => DAYS_ORDER.indexOf(a.day_of_week) - DAYS_ORDER.indexOf(b.day_of_week));
    }, [hours]);

    const activeDaysCount = useMemo(() => {
        return sortedHours.filter(h => !h.is_closed).length;
    }, [sortedHours]);

    const totalWeeklyHours = useMemo(() => {
        return sortedHours.reduce((acc, h) => {
            return acc + Number(calculateOperatingHoursSpan(h.open_time, h.close_time, h.is_closed));
        }, 0).toFixed(0);
    }, [sortedHours]);

    const todayDayName = useMemo(() => {
        return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    }, []);

    const todaySchedule = useMemo(() => {
        return sortedHours.find(h => h.day_of_week === todayDayName);
    }, [sortedHours, todayDayName]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-2 border-b border-stone-200/70">
                <div>
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-primary/5 border border-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                        <Clock size={12} className="text-secondary" />
                        <span>Store Pickup & Ordering</span>
                    </div>
                    <h1 className="text-3xl font-black text-stone-900 tracking-tight">Collection Time Slots</h1>
                    <p className="text-xs text-stone-500 mt-1">
                        Configure daily store opening hours, collection availability, and customer checkout time slot intervals.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowSimulator(prev => !prev)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-2xs ${
                            showSimulator
                                ? 'bg-primary text-white hover:bg-primary-hover'
                                : 'bg-white border border-stone-250 hover:border-primary text-stone-800'
                        }`}
                    >
                        <Eye size={14} className={showSimulator ? 'text-accent' : 'text-secondary'} />
                        <span>{showSimulator ? 'Hide Live Slot Preview' : 'Test Customer Slots'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => fetchHours()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-900 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
                        title="Refresh collection hours"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin text-secondary' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Compact KPI Analytics Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-stone-200/80 rounded-lg p-3 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Pickup Days</span>
                        <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                            <Calendar size={12} />
                        </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-stone-900">{activeDaysCount}</span>
                        <span className="text-[10px] text-stone-400 font-bold">/ 7 Days</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{activeDaysCount === 7 ? 'Open every day' : `${7 - activeDaysCount} day(s) closed`}</span>
                    </div>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-lg p-3 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Weekly Coverage</span>
                        <span className="p-1 rounded bg-secondary/10 text-secondary">
                            <Clock size={12} />
                        </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-stone-900">{totalWeeklyHours}</span>
                        <span className="text-[10px] text-stone-400 font-bold">Hrs / Wk</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-stone-500 font-medium">
                        Avg {(Number(totalWeeklyHours) / (activeDaysCount || 1)).toFixed(1)} hrs/open day
                    </div>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-lg p-3 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Today's Window</span>
                        <span className="p-1 rounded bg-accent/25 text-primary">
                            <Sun size={12} />
                        </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-stone-900">
                            {todaySchedule?.is_closed ? 'Closed Today' : `${todaySchedule?.open_time?.slice(0, 5)} - ${todaySchedule?.close_time?.slice(0, 5)}`}
                        </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-stone-500 font-medium truncate">
                        {todaySchedule?.is_closed ? 'No collections' : `${todayDayName} · ${todaySchedule?.slot_interval}m slots`}
                    </div>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-lg p-3 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Interval</span>
                        <span className="p-1 rounded bg-primary/5 text-primary">
                            <Timer size={12} />
                        </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-stone-900">15 - 30</span>
                        <span className="text-[10px] text-stone-400 font-bold">Minutes</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-stone-500 font-medium">
                        Max 5 orders / slot buffer
                    </div>
                </div>
            </div>

            {/* Customer Live Slot Simulator Drawer / Section */}
            {showSimulator && (
                <div className="bg-gradient-to-br from-primary/[0.04] via-canvas to-surface border border-primary/20 rounded-lg p-4 shadow-sm space-y-3 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-primary/10 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-primary text-accent flex items-center justify-center shadow-xs">
                                <Eye size={14} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-stone-900 flex items-center gap-2">
                                    <span>Live Customer Slot Simulator</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20">
                                        Checkout Preview
                                    </span>
                                </h3>
                                <p className="text-[11px] text-stone-500 mt-0.5">
                                    Pick any date to preview the exact bookable collection time slots shown to customers during checkout.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
                                <span>Date:</span>
                                <input
                                    type="date"
                                    value={simDate}
                                    onChange={(e) => setSimDate(e.target.value)}
                                    className="px-2 py-1 bg-white border border-stone-300 rounded text-[11px] font-bold text-stone-800 shadow-2xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowSimulator(false)}
                                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {loadingSim ? (
                        <div className="py-6 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                            <RefreshCw size={13} className="animate-spin text-secondary" />
                            <span>Calculating dynamic collection slots for {simDate}...</span>
                        </div>
                    ) : simSlots.length === 0 ? (
                        <div className="py-5 text-center bg-white border border-stone-200/80 rounded">
                            <XCircle size={20} className="text-stone-300 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-stone-700">No collection slots available for this day</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">The store may be closed or operating hours have passed for today.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-2 text-xs">
                                <span className="font-bold text-stone-700 text-[11px]">
                                    {simSlots.length} Bookable Collection Slots Available
                                </span>
                                <span className="text-[10px] text-stone-400">
                                    Format: 12-Hour Local Store Time
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
                                {simSlots.map((slot, idx) => (
                                    <div
                                        key={idx}
                                        className={`px-2 py-1.5 rounded text-center border text-[11px] font-bold transition-all ${
                                            slot.is_available
                                                ? 'bg-white border-stone-200 text-stone-800 hover:border-primary hover:text-primary hover:shadow-2xs'
                                                : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <div>{slot.time}</div>
                                        <div className="text-[8px] font-semibold text-emerald-600 mt-0.5">
                                            {slot.is_available ? 'Available' : 'Full'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 7-Day Collection Slots Grid - Compact Smaller Boxes with Low Curves */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {sortedHours.map((hour) => {
                    const isToday = hour.day_of_week === todayDayName;
                    const isWeekend = WEEKENDS.includes(hour.day_of_week);
                    const isSaving = savingId === hour.id;
                    const estimatedSlots = calculateSlotEstimate(hour.open_time, hour.close_time, hour.slot_interval, hour.is_closed);
                    const hoursSpan = calculateOperatingHoursSpan(hour.open_time, hour.close_time, hour.is_closed);

                    // Timeline percentage calculations for visual bar
                    const [oh = 8, om = 0] = hour.open_time ? hour.open_time.split(':').map(Number) : [8, 0];
                    const [ch = 22, cm = 0] = hour.close_time ? hour.close_time.split(':').map(Number) : [22, 0];
                    const startPercent = Math.min(100, Math.max(0, ((oh * 60 + om) / 1440) * 100));
                    const endPercent = Math.min(100, Math.max(0, ((ch * 60 + cm) / 1440) * 100));
                    const widthPercent = Math.max(0, endPercent - startPercent);

                    return (
                        <div
                            key={hour.id}
                            className={`bg-white border rounded-lg shadow-2xs transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                                hour.is_closed 
                                    ? 'border-stone-200 opacity-75 hover:opacity-100' 
                                    : isToday 
                                    ? 'border-primary ring-1 ring-primary/25 shadow-xs' 
                                    : 'border-stone-200/80 hover:border-primary/40 hover:shadow-xs'
                            }`}
                        >
                            {/* Card Top Banner */}
                            <div>
                                <div className="px-3.5 py-2.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/40">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-6.5 w-6.5 rounded-[4px] flex items-center justify-center font-black text-[11px] ${
                                            hour.is_closed 
                                                ? 'bg-stone-100 text-stone-400' 
                                                : isToday
                                                ? 'bg-primary text-accent'
                                                : 'bg-primary/10 text-primary'
                                        }`}>
                                            {hour.day_of_week.slice(0, 3)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <h3 className="text-xs font-black text-stone-900">
                                                    {hour.day_of_week}
                                                </h3>
                                                {isToday && (
                                                    <span className="px-1 py-0.2 rounded-[3px] bg-secondary/10 text-secondary text-[8px] font-black uppercase tracking-wider border border-secondary/20">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-stone-400 block -mt-0.5">
                                                {isWeekend ? 'Weekend' : 'Weekday'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Open/Closed Status Switch */}
                                    <button
                                        type="button"
                                        onClick={() => handleQuickToggleClosed(hour)}
                                        disabled={isSaving}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[9px] font-extrabold border transition-all cursor-pointer ${
                                            hour.is_closed
                                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                        title={`Click to switch to ${hour.is_closed ? 'Open' : 'Closed'}`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${hour.is_closed ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                                        <span>{hour.is_closed ? 'CLOSED' : 'OPEN'}</span>
                                    </button>
                                </div>

                                {/* Card Body */}
                                <div className="p-3.5 space-y-2.5">
                                    {hour.is_closed ? (
                                        <div className="py-4 text-center">
                                            <div className="h-7 w-7 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-1.5">
                                                <Moon size={14} />
                                            </div>
                                            <p className="text-[11px] font-bold text-stone-600">Store closed for pickup</p>
                                            <p className="text-[9px] text-stone-400 mt-0.5">
                                                No collection slots bookable.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Operating Hours Row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                    <Clock size={12} className="text-stone-400" />
                                                    <span className="font-bold text-stone-500">Hours</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[11px] font-black text-stone-900 block font-mono">
                                                        {hour.open_time?.slice(0, 5)} – {hour.close_time?.slice(0, 5)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-secondary block">
                                                        {formatTimeDisplay(hour.open_time)} – {formatTimeDisplay(hour.close_time)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Visual 24-Hour Schedule Bar */}
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between text-[8px] font-bold text-stone-400">
                                                    <span>00:00</span>
                                                    <span className="text-primary font-black">{hoursSpan}h open</span>
                                                    <span>24:00</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-stone-100 rounded-sm overflow-hidden relative">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-primary via-primary-light to-secondary rounded-sm"
                                                        style={{
                                                            marginLeft: `${startPercent}%`,
                                                            width: `${widthPercent}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Slot Interval and Capacity Row */}
                                            <div className="pt-1.5 border-t border-stone-100 grid grid-cols-2 gap-2">
                                                <div className="bg-canvas p-1.5 rounded-[4px] border border-stone-200/70">
                                                    <span className="block text-[8px] font-black uppercase tracking-wider text-stone-400 mb-0.5">
                                                        Interval
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[11px] font-black text-stone-900">
                                                        <Timer size={10} className="text-secondary" />
                                                        <span>{hour.slot_interval}m</span>
                                                    </div>
                                                </div>

                                                <div className="bg-canvas p-1.5 rounded-[4px] border border-stone-200/70">
                                                    <span className="block text-[8px] font-black uppercase tracking-wider text-stone-400 mb-0.5">
                                                        Capacity
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[11px] font-black text-stone-900">
                                                        <Layers size={10} className="text-accent-hover" />
                                                        <span>~{estimatedSlots} slots</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="px-3.5 py-2 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
                                <span className="text-[10px] text-stone-400 font-medium">
                                    {hour.is_closed ? 'Closed all day' : `~${estimatedSlots} slots`}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => handleOpenEdit(hour)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-white border border-stone-200 hover:border-primary hover:text-primary text-[11px] font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
                                >
                                    <Edit3 size={11} className="text-secondary" />
                                    <span>Configure</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* EDIT DAY MODAL */}
            {editingDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-stone-200 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-scale-in">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-[4px] bg-primary text-accent flex items-center justify-center font-black text-sm">
                                    <Clock size={15} className="text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-stone-900">
                                        Configure {editingDay.day_of_week}
                                    </h3>
                                    <p className="text-[11px] text-stone-400">
                                        Set collection availability, store hours, and slot intervals.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingDay(null)}
                                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveDay} className="p-5 space-y-5">
                            {/* Open / Closed Switch */}
                            <div className="p-3.5 bg-canvas rounded-md border border-stone-200/80 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-black text-stone-900 block">
                                        Store Open for Collection
                                    </span>
                                    <span className="text-[11px] text-stone-500">
                                        When closed, no collection time slots will be bookable on this day.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditForm(prev => ({ ...prev, is_closed: !prev.is_closed }))}
                                    className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        !editForm.is_closed ? 'bg-primary' : 'bg-stone-300'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            !editForm.is_closed ? 'translate-x-4.5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {!editForm.is_closed && (
                                <>
                                    {/* Quick Preset Buttons */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-stone-400">
                                            Quick Presets
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PRESETS.map((p, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => applyPreset(p)}
                                                    className="text-left px-2.5 py-1.5 rounded-md border border-stone-200 hover:border-primary hover:bg-canvas text-[11px] font-bold text-stone-700 transition-colors"
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time Inputs */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                                                Opening Time
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={editForm.open_time}
                                                    onChange={(e) => setEditForm({ ...editForm, open_time: e.target.value })}
                                                    required
                                                    className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-md text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                            <span className="block text-[10px] text-secondary font-bold mt-1">
                                                {formatTimeDisplay(editForm.open_time)}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                                                Closing Time
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={editForm.close_time}
                                                    onChange={(e) => setEditForm({ ...editForm, close_time: e.target.value })}
                                                    required
                                                    className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-md text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                            <span className="block text-[10px] text-secondary font-bold mt-1">
                                                {formatTimeDisplay(editForm.close_time)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Slot Interval Select */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                                            Slot Booking Interval
                                        </label>
                                        <select
                                            value={editForm.slot_interval}
                                            onChange={(e) => setEditForm({ ...editForm, slot_interval: parseInt(e.target.value, 10) })}
                                            className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-md text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                                        >
                                            <option value={10}>10 Minutes</option>
                                            <option value={15}>15 Minutes (Standard & Recommended)</option>
                                            <option value={20}>20 Minutes</option>
                                            <option value={30}>30 Minutes</option>
                                            <option value={45}>45 Minutes</option>
                                            <option value={60}>60 Minutes (1 Hour)</option>
                                            <option value={120}>120 Minutes (2 Hours)</option>
                                        </select>
                                    </div>

                                    {/* Slot Output Preview Hint */}
                                    <div className="p-2.5 bg-canvas border border-primary/15 rounded-md flex items-center gap-2 text-xs text-primary">
                                        <Sparkles size={15} className="text-secondary shrink-0" />
                                        <span>
                                            Generates approximately <strong>{calculateSlotEstimate(editForm.open_time, editForm.close_time, editForm.slot_interval, false)} collection slots</strong> between {editForm.open_time} and {editForm.close_time}.
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* Bulk Apply Scope Options */}
                            <div className="space-y-1.5 pt-2 border-t border-stone-100">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-stone-400">
                                    Apply Schedule To:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, applyScope: 'single' })}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                                            editForm.applyScope === 'single'
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                        }`}
                                    >
                                        {editingDay.day_of_week} Only
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, applyScope: 'weekdays' })}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                                            editForm.applyScope === 'weekdays'
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                        }`}
                                    >
                                        All Mon–Fri
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, applyScope: 'all' })}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                                            editForm.applyScope === 'all'
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                        }`}
                                    >
                                        All 7 Days
                                    </button>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingDay(null)}
                                    className="px-3.5 py-2 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-black transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw size={13} className="animate-spin text-accent" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} className="text-accent" />
                                            <span>Save Schedule</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
