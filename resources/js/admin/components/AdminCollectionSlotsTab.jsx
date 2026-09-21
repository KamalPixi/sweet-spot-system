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
            {/* Header and Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-2">
                        <Clock size={12} className="text-amber-600" />
                        <span>Store Pickup & Ordering</span>
                    </div>
                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Collection Time Slots</h1>
                    <p className="text-xs text-neutral-500 mt-1">
                        Configure daily store opening hours, collection availability, and customer checkout time slot intervals.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowSimulator(prev => !prev)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                            showSimulator
                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                : 'bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800'
                        }`}
                    >
                        <Eye size={14} className={showSimulator ? 'text-white' : 'text-amber-600'} />
                        <span>{showSimulator ? 'Hide Slot Preview' : 'Test Customer Slots'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => fetchHours()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                        title="Refresh collection hours"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin text-amber-600' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Compact KPI Analytics Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Pickup Days</span>
                        <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                            <Calendar size={13} />
                        </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-neutral-900">{activeDaysCount}</span>
                        <span className="text-[10px] text-neutral-400 font-bold">/ 7 Days</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{activeDaysCount === 7 ? 'Open every day' : `${7 - activeDaysCount} day(s) closed`}</span>
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Weekly Coverage</span>
                        <span className="p-1 rounded-lg bg-amber-50 text-amber-600">
                            <Clock size={13} />
                        </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-neutral-900">{totalWeeklyHours}</span>
                        <span className="text-[10px] text-neutral-400 font-bold">Hrs / Wk</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-neutral-500 font-medium">
                        Avg {(Number(totalWeeklyHours) / (activeDaysCount || 1)).toFixed(1)} hrs/open day
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Today's Window</span>
                        <span className="p-1 rounded-lg bg-amber-50 text-amber-700">
                            <Sun size={13} />
                        </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-neutral-900">
                            {todaySchedule?.is_closed ? 'Closed Today' : `${todaySchedule?.open_time?.slice(0, 5)} - ${todaySchedule?.close_time?.slice(0, 5)}`}
                        </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-neutral-500 font-medium truncate">
                        {todaySchedule?.is_closed ? 'No collections' : `${todayDayName} · ${todaySchedule?.slot_interval}m slots`}
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Interval</span>
                        <span className="p-1 rounded-lg bg-neutral-100 text-neutral-700">
                            <Timer size={13} />
                        </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-neutral-900">15 - 30</span>
                        <span className="text-[10px] text-neutral-400 font-bold">Minutes</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-neutral-500 font-medium">
                        Max 5 orders / slot buffer
                    </div>
                </div>
            </div>

            {/* Customer Live Slot Simulator Drawer / Section */}
            {showSimulator && (
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                                <Eye size={15} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                    <span>Live Customer Slot Simulator</span>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                        Checkout Preview
                                    </span>
                                </h3>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Pick any date to preview the exact bookable collection time slots shown to customers during checkout.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <label className="text-xs font-bold text-neutral-600 flex items-center gap-2">
                                <span>Date:</span>
                                <input
                                    type="date"
                                    value={simDate}
                                    onChange={(e) => setSimDate(e.target.value)}
                                    className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-800 shadow-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 outline-none"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowSimulator(false)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {loadingSim ? (
                        <div className="py-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                            <RefreshCw size={14} className="animate-spin text-amber-600" />
                            <span>Calculating dynamic collection slots for {simDate}...</span>
                        </div>
                    ) : simSlots.length === 0 ? (
                        <div className="py-6 text-center bg-neutral-50 border border-neutral-200 rounded-xl">
                            <XCircle size={22} className="text-neutral-300 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-neutral-700">No collection slots available for this day</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">The store may be closed or operating hours have passed for today.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-2.5 text-xs">
                                <span className="font-bold text-neutral-700 text-xs">
                                    {simSlots.length} Bookable Collection Slots Available
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                    Format: 12-Hour Local Store Time
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
                                {simSlots.map((slot, idx) => (
                                    <div
                                        key={idx}
                                        className={`px-2.5 py-1.5 rounded-lg text-center border text-xs font-bold transition-all ${
                                            slot.is_available
                                                ? 'bg-white border-neutral-200 text-neutral-800 hover:border-amber-600 hover:text-amber-700 hover:shadow-xs'
                                                : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <div>{slot.time}</div>
                                        <div className="text-[9px] font-semibold text-emerald-600 mt-0.5">
                                            {slot.is_available ? 'Available' : 'Full'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 7-Day Collection Slots Grid - Matched to Tables page aesthetics */}
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
                            className={`rounded-xl border text-left transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                                hour.is_closed 
                                    ? 'border-neutral-200 bg-neutral-50/50 opacity-80 hover:opacity-100' 
                                    : isToday 
                                    ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20 shadow-sm' 
                                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/40 bg-white shadow-xs'
                            }`}
                        >
                            {/* Card Top Banner */}
                            <div>
                                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-white/70">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                            hour.is_closed 
                                                ? 'bg-neutral-200 text-neutral-500' 
                                                : isToday
                                                ? 'bg-amber-600 text-white shadow-xs'
                                                : 'bg-neutral-900 text-white'
                                        }`}>
                                            {hour.day_of_week.slice(0, 3)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-neutral-900">
                                                    {hour.day_of_week}
                                                </h3>
                                                {isToday && (
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider border border-amber-200">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-medium text-neutral-400 block">
                                                {isWeekend ? 'Weekend' : 'Weekday'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Open/Closed Status Switch */}
                                    <button
                                        type="button"
                                        onClick={() => handleQuickToggleClosed(hour)}
                                        disabled={isSaving}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border transition-all cursor-pointer ${
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
                                <div className="p-4 space-y-3">
                                    {hour.is_closed ? (
                                        <div className="py-5 text-center">
                                            <div className="h-8 w-8 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center mb-1.5">
                                                <Moon size={15} />
                                            </div>
                                            <p className="text-xs font-bold text-neutral-700">Store closed for pickup</p>
                                            <p className="text-[10px] text-neutral-400 mt-0.5">
                                                No collection slots bookable.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Operating Hours Row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Clock size={13} className="text-neutral-400" />
                                                    <span className="font-semibold text-neutral-500">Hours</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-neutral-900 block font-mono">
                                                        {hour.open_time?.slice(0, 5)} – {hour.close_time?.slice(0, 5)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-amber-700 block">
                                                        {formatTimeDisplay(hour.open_time)} – {formatTimeDisplay(hour.close_time)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Visual 24-Hour Schedule Bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] font-medium text-neutral-400">
                                                    <span>00:00</span>
                                                    <span className="text-neutral-900 font-bold">{hoursSpan}h open</span>
                                                    <span>24:00</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                                                    <div 
                                                        className={`h-full rounded-full transition-all ${
                                                            isToday ? 'bg-amber-600' : 'bg-neutral-900'
                                                        }`}
                                                        style={{
                                                            marginLeft: `${startPercent}%`,
                                                            width: `${widthPercent}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Slot Interval and Capacity Row */}
                                            <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2">
                                                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/80">
                                                    <span className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">
                                                        Interval
                                                    </span>
                                                    <div className="flex items-center gap-1 text-xs font-black text-neutral-900">
                                                        <Timer size={11} className="text-neutral-600" />
                                                        <span>{hour.slot_interval}m</span>
                                                    </div>
                                                </div>

                                                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/80">
                                                    <span className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">
                                                        Capacity
                                                    </span>
                                                    <div className="flex items-center gap-1 text-xs font-black text-neutral-900">
                                                        <Layers size={11} className="text-amber-700" />
                                                        <span>~{estimatedSlots} slots</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="px-4 py-2.5 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between">
                                <span className="text-[10px] text-neutral-400 font-medium">
                                    {hour.is_closed ? 'Closed all day' : `~${estimatedSlots} slots`}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => handleOpenEdit(hour)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:border-neutral-900 text-xs font-bold text-neutral-800 shadow-xs transition-all cursor-pointer"
                                >
                                    <Edit3 size={12} className="text-amber-600" />
                                    <span>Configure</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* EDIT DAY MODAL */}
            {editingDay && (() => {
                const isModalSaving = savingId === editingDay.id;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fade-in">
                        <div className="bg-white border border-neutral-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-in">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900">
                                        Configure {editingDay.day_of_week}
                                    </h3>
                                    <p className="text-xs text-neutral-400">
                                        Set collection availability, store hours, and slot intervals.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingDay(null)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleSaveDay} className="p-6 space-y-5 text-left">
                            {/* Open / Closed Toggle Switch */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70">
                                <div>
                                    <span className="text-xs font-bold text-neutral-800 block">
                                        Collection Availability
                                    </span>
                                    <span className="text-[11px] text-neutral-400">
                                        {editForm.is_closed ? 'Store is closed for pickup on this day' : 'Customers can select pickup slots'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, is_closed: !editForm.is_closed })}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        !editForm.is_closed ? 'bg-amber-600' : 'bg-neutral-300'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                            !editForm.is_closed ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {!editForm.is_closed && (
                                <>
                                    {/* Presets Row */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                                            Quick Presets
                                        </label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {PRESETS.map((p) => (
                                                <button
                                                    key={p.label}
                                                    type="button"
                                                    onClick={() => setEditForm({
                                                        ...editForm,
                                                        open_time: p.open,
                                                        close_time: p.close,
                                                        slot_interval: p.interval,
                                                    })}
                                                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-900 bg-white text-left text-[11px] font-semibold text-neutral-700 hover:text-neutral-900 transition-colors shadow-2xs cursor-pointer truncate"
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time Pickers */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                                Opening Time
                                            </label>
                                            <input
                                                type="time"
                                                required
                                                value={editForm.open_time}
                                                onChange={(e) => setEditForm({ ...editForm, open_time: e.target.value })}
                                                className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-900 rounded-lg focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                                Closing Time
                                            </label>
                                            <input
                                                type="time"
                                                required
                                                value={editForm.close_time}
                                                onChange={(e) => setEditForm({ ...editForm, close_time: e.target.value })}
                                                className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-900 rounded-lg focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Slot Interval */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                            Slot Interval
                                        </label>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[10, 15, 20, 30].map((intv) => (
                                                <button
                                                    key={intv}
                                                    type="button"
                                                    onClick={() => setEditForm({ ...editForm, slot_interval: intv })}
                                                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                                        Number(editForm.slot_interval) === intv
                                                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                                                    }`}
                                                >
                                                    {intv} mins
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Batch Apply Scope Selector */}
                            <div className="pt-2 border-t border-neutral-100">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                                    Apply Schedule To
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, applyScope: 'single' })}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                            editForm.applyScope === 'single'
                                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                                        }`}
                                    >
                                        {editingDay.day_of_week} Only
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, applyScope: 'weekdays' })}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                            editForm.applyScope === 'weekdays'
                                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                                        }`}
                                    >
                                        All Mon–Fri
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, applyScope: 'all' })}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                            editForm.applyScope === 'all'
                                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                                        }`}
                                    >
                                        All 7 Days
                                    </button>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setEditingDay(null)}
                                    className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isModalSaving}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {isModalSaving ? (
                                        <>
                                            <RefreshCw size={13} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            <span>Save Schedule</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                );
            })()}
        </div>
    );
}
