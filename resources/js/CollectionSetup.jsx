import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from './AppContext';
import { X, MapPin, Loader2, AlertCircle, Calendar, Clock, ArrowLeft } from 'lucide-react';

const UK_TIME_ZONE = 'Europe/London';
const DEFAULT_STORE_LOCATION = {
    name: 'Pudding London',
    address: '10 Soho Street, London',
    postcode: 'W1D 1AN',
    lat: 51.5133,
    lng: -0.1307,
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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

export default function CollectionSetup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setCollectionSlot, configs } = useApp();

    const mapContainerRef = useRef(null);
    const [mapError, setMapError] = useState(false);
    const storeLocation = useMemo(() => {
        const lat = parseFloat(configs?.store_latitude);
        const lng = parseFloat(configs?.store_longitude);
        const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);

        return {
            name: configs?.store_name || DEFAULT_STORE_LOCATION.name,
            address: configs?.store_address || DEFAULT_STORE_LOCATION.address,
            postcode: configs?.store_postcode || DEFAULT_STORE_LOCATION.postcode,
            lat: hasValidCoords ? lat : DEFAULT_STORE_LOCATION.lat,
            lng: hasValidCoords ? lng : DEFAULT_STORE_LOCATION.lng,
        };
    }, [configs]);
    const storeAddressLine = [storeLocation.address, storeLocation.postcode].filter(Boolean).join(', ');

    const [selectedDate, setSelectedDate] = useState(() => {
        return formatDateKey(getUKTodayParts());
    });
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const [openingHours, setOpeningHours] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingHours, setLoadingHours] = useState(false);
    const [error, setError] = useState(null);

    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);
    const routeLineRef = useRef(null);
    const [locating, setLocating] = useState(false);
    const [calculatedDistance, setCalculatedDistance] = useState(null);

    // Initialize Leaflet Map (completely free, zero-config)
    useEffect(() => {
        if (!mapContainerRef.current) return;

        let mapInstance = null;

        const initMap = () => {
            try {
                // Prevent double initialization
                if (mapRef.current) {
                    mapRef.current.remove();
                }

                const L = window.L;
                if (!L) return;

                mapInstance = L.map(mapContainerRef.current, {
                    zoomControl: false
                }).setView([storeLocation.lat, storeLocation.lng], 15);

                mapRef.current = mapInstance;

                // Dynamically select tiles: Mapbox if token is present, otherwise CartoDB
                const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
                if (mapboxToken) {
                    L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
                        attribution: '&copy; Mapbox &copy; OpenStreetMap',
                        tileSize: 512,
                        zoomOffset: -1
                    }).addTo(mapInstance);
                } else {
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
                    }).addTo(mapInstance);
                }

                // Add zoom control to top-right
                L.control.zoom({ position: 'topright' }).addTo(mapInstance);

                // Add custom brand colored marker (pin shape pointing to exact location on ground)
                const customIcon = L.divIcon({
                    html: `<div style="display: block; margin: 0; padding: 0;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 24 28" fill="#8e5233" stroke="white" stroke-width="1.8" style="display: block;">
                                <path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 9 15 9 15s9-9.75 9-15c0-4.97-4.03-9-9-9z" />
                                <g transform="translate(6.5, 5.5) scale(0.45)" stroke="white" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 9h18"/>
                                    <path d="M3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/>
                                    <path d="M3 9L5 3h14l2 6"/>
                                    <path d="M9 22v-8h6v8"/>
                                </g>
                            </svg>
                           </div>`,
                    className: '',
                    iconSize: [36, 42],
                    iconAnchor: [18, 42]
                });

                L.marker([storeLocation.lat, storeLocation.lng], { icon: customIcon })
                    .bindPopup(`
                        <div style="color: #1e1008; font-family: sans-serif; font-size: 11px; line-height: 1.4; padding: 2px;">
                            <strong style="font-weight: 700; color: #8e5233;">${escapeHtml(storeLocation.name)}</strong>
                            <p style="margin: 4px 0 0 0; color: #555;">${escapeHtml(storeAddressLine)}</p>
                        </div>
                    `)
                    .addTo(mapInstance);

            } catch (err) {
                console.error('Leaflet initialization error:', err);
                setMapError(true);
            }
        };

        // Load Leaflet CSS if not already present
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        // Load Leaflet JS if not already present, or init map immediately
        if (window.L) {
            initMap();
        } else {
            const scriptId = 'leaflet-js';
            let script = document.getElementById(scriptId);
            if (!script) {
                script = document.createElement('script');
                script.id = scriptId;
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                document.body.appendChild(script);
            }
            script.addEventListener('load', initMap);
            script.addEventListener('error', () => setMapError(true));
        }

        return () => {
            if (mapInstance) {
                mapInstance.remove();
                mapRef.current = null;
            }
        };
    }, [storeLocation, storeAddressLine]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // List next 5 available days to choose from
    const getNextDays = () => {
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
    };

    const daysList = getNextDays();

    // Helper to check if a day is closed
    const isDayClosed = (dayName) => {
        const matched = openingHours.find(oh => oh.day_of_week === dayName);
        return matched ? matched.is_closed : false;
    };

    // Helper to format 24h time to 12h AM/PM
    const formatTimeStr = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        const hour = parseInt(parts[0], 10);
        const minute = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        return `${displayHour.toString().padStart(2, '0')}:${minute} ${ampm}`;
    };

    // Fetch opening hours once on load
    useEffect(() => {
        setLoadingHours(true);
        fetch('/api/opening-hours')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setOpeningHours(res.data);
                }
            })
            .catch(err => {
                console.error('Error fetching opening hours:', err);
            })
            .finally(() => {
                setLoadingHours(false);
            });
    }, []);

    // Fetch slots when date changes
    useEffect(() => {
        if (!selectedDate) return;
        setLoadingSlots(true);
        setError(null);
        setSelectedSlot(null);

        fetch(`/api/collection-slots?date=${selectedDate}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setSlots(res.data.slots);
                } else {
                    setError('Failed to fetch available slots.');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Network error. Failed to load slots.');
            })
            .finally(() => {
                setLoadingSlots(false);
            });
    }, [selectedDate]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 3959; // Radius of earth in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleLocateUser = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const storeLat = storeLocation.lat;
                const storeLng = storeLocation.lng;

                const dist = calculateDistance(latitude, longitude, storeLat, storeLng);
                setCalculatedDistance(dist.toFixed(1));

                const map = mapRef.current;
                const L = window.L;

                if (map && L) {
                    // Remove old user marker/line if they exist
                    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
                    if (routeLineRef.current) map.removeLayer(routeLineRef.current);

                    // Add blue dot user marker
                    const userIcon = L.divIcon({
                        html: `<div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white shadow-xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
                                <div class="w-3 h-3 bg-white rounded-full"></div>
                               </div>`,
                        className: '',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });

                    userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
                        .bindPopup(`
                            <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
                                <strong>Your Location</strong>
                                <p style="margin: 4px 0 0 0; color: #666;">Distance: ${dist.toFixed(1)} miles away</p>
                            </div>
                        `)
                        .addTo(map);

                    // Draw a clean dashed line connecting them
                    routeLineRef.current = L.polyline(
                        [[latitude, longitude], [storeLat, storeLng]],
                        { color: '#8e5233', weight: 2, dashArray: '6, 6', opacity: 0.8 }
                    ).addTo(map);

                    // Fit map bounds to show both
                    const bounds = L.latLngBounds([[latitude, longitude], [storeLat, storeLng]]);
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
                setLocating(false);
            },
            (err) => {
                console.error(err);
                toast.error('Permission denied or location not found.');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedSlot) return;

        setCollectionSlot({
            date: selectedDate,
            time: selectedSlot.time,
            datetime: selectedSlot.datetime,
            label: selectedSlot.formatted_label
        });

        const redirectUrl = searchParams.get('redirect') || '/categories';
        navigate(redirectUrl);
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 font-sans select-none relative"
            style={{
                background: 'radial-gradient(circle at 75% 50%, #8e5233 0%, #2b1409 100%)'
            }}
        >
            <div className="flex flex-col items-start gap-4 max-w-4xl w-full animate-fadeIn">
                {/* Back Button (above card) */}
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center space-x-1.5 text-white/60 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer pl-3"
                    aria-label="Back to Home"
                >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                </button>

                {/* Modal Card */}
                <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden w-full grid grid-cols-1 md:grid-cols-12 min-h-[520px] relative">
                    {/* Close Button */}
                    <button 
                        onClick={() => navigate('/')} 
                        className="absolute top-6 right-6 text-neutral-300 hover:text-neutral-500 transition-colors border border-neutral-200 hover:border-neutral-300 rounded-full p-1 cursor-pointer focus:outline-none z-30 bg-white/80 backdrop-blur-xs"
                        aria-label="Close"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>

                    {/* Left Column (Map / Vector Fallback) */}
                    <div className="col-span-12 md:col-span-6 bg-[#eae2d5] text-neutral-800 relative min-h-[300px] md:min-h-full overflow-hidden flex flex-col justify-between p-8 md:p-10">
                        {!mapError ? (
                            <>
                                {/* Map Container */}
                                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
                                
                                {/* Floating Store Badge */}
                                <div className="absolute top-6 left-6 z-10 bg-[#1e1008]/95 border border-white/10 text-white p-3.5 rounded-[20px] shadow-lg max-w-[240px] backdrop-blur-md text-left">
                                    <div className="flex items-center space-x-2 text-white">
                                        <MapPin size={14} className="text-[#a6603a]" />
                                        <h2 className="text-xs font-bold tracking-wide">{storeLocation.name}</h2>
                                    </div>
                                    <p className="text-[10px] text-white/60 mt-1 leading-relaxed">
                                        {storeAddressLine}
                                    </p>
                                    {calculatedDistance && (
                                        <p className="text-[10px] font-bold text-blue-400 mt-2 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md inline-block">
                                            🧭 {calculatedDistance} miles away
                                        </p>
                                    )}
                                </div>

                                {/* Locate Me Button */}
                                <button
                                    type="button"
                                    onClick={handleLocateUser}
                                    disabled={locating}
                                    className="absolute bottom-12 right-6 z-10 p-3 rounded-full bg-white text-neutral-750 border border-neutral-200 hover:border-[#8e5233]/40 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center"
                                    title="Show My Location"
                                >
                                    {locating ? (
                                        <Loader2 className="animate-spin text-[#8e5233]" size={18} />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e5233" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <circle cx="12" cy="12" r="3"/>
                                            <line x1="12" y1="1" x2="12" y2="3"/>
                                            <line x1="12" y1="21" x2="12" y2="23"/>
                                            <line x1="1" y1="12" x2="3" y2="12"/>
                                            <line x1="21" y1="12" x2="23" y2="12"/>
                                        </svg>
                                    )}
                                </button>

                                {/* Map Attributions / Branding */}
                                <div className="absolute bottom-4 left-4 z-10 text-[9px] text-neutral-500 bg-white/80 px-2.5 py-1 rounded-full backdrop-blur-xs font-medium">
                                    Live Store Map
                                </div>
                            </>
                        ) : (
                            /* Vector Fallback design if no Mapbox token */
                            <div 
                                className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 md:p-10 text-white"
                                style={{
                                    backgroundImage: 'radial-gradient(circle at 100% 100%, #a6603a 0%, #6d3a21 100%)'
                                }}
                            >
                                {/* Stylized street grid vector overlays */}
                                <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
                                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="white" strokeWidth="2" />
                                        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="white" strokeWidth="2" />
                                        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="white" strokeWidth="2" />
                                        <line x1="75%" y1="0" x2="75%" y2="100%" stroke="white" strokeWidth="2" />
                                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="white" strokeWidth="1" strokeDasharray="6" />
                                    </svg>
                                </div>

                                <div className="z-10">
                                    <div className="flex items-center space-x-2 text-white/90">
                                        <MapPin size={20} strokeWidth={2} />
                                        <h2 className="text-lg font-light tracking-wide">Store Location</h2>
                                    </div>
                                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-semibold">
                                        {storeLocation.name} Collection Point
                                    </p>
                                </div>

                                {/* Centered Map Marker */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                                    <div className="w-14 h-14 rounded-full bg-white/10 border border-white/40 flex items-center justify-center text-white animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-white text-[#8e5233] flex items-center justify-center shadow-lg">
                                            <MapPin size={18} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    <span className="mt-3 text-[10px] bg-black/50 border border-white/15 text-white px-3 py-1 rounded-md font-semibold tracking-wider uppercase backdrop-blur-xs">
                                        {storeLocation.postcode}
                                    </span>
                                </div>

                                {/* Map Sandbox Footer Info */}
                                <div className="z-10 text-[9px] text-white/40 font-light flex justify-between items-end">
                                    <span>{storeLocation.address}</span>
                                    <span className="opacity-80">{storeLocation.name}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (White / Slots & Day choosing + Continue button) */}
                    <div className="col-span-12 md:col-span-6 bg-white p-8 md:p-10 flex flex-col justify-between min-h-[420px] md:min-h-full z-10">
                    <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full w-full">
                        <div>
                            {/* Header */}
                            <h1 className="text-[#8e5233] text-3xl font-medium tracking-wide">
                                Self Collection
                            </h1>
                            <div className="text-neutral-400 text-[10px] tracking-wide mt-1.5 mb-6 space-y-1">
                                <p>*Please collect your order directly from our shop:</p>
                                <p className="flex items-center gap-1 font-semibold text-neutral-600">
                                    <MapPin size={12} className="text-[#8e5233] shrink-0" />
                                    <span>{storeAddressLine}</span>
                                </p>
                            </div>

                            {/* Date choosing horizontal slider */}
                            <div className="space-y-2 mb-5">
                                <p className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider pl-1">
                                    Choose Date
                                </p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {daysList.map((item) => {
                                        const closed = isDayClosed(item.dayName);
                                        const isSelected = selectedDate === item.date;
                                        return (
                                            <button
                                                key={item.date}
                                                type="button"
                                                disabled={closed}
                                                onClick={() => setSelectedDate(item.date)}
                                                className={`px-4 py-2.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer focus:outline-none ${
                                                    isSelected
                                                        ? 'bg-[#8e5233] text-white shadow-md'
                                                        : closed
                                                            ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed border border-neutral-100'
                                                            : 'bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time slot choosing grid */}
                            <div className="space-y-2">
                                <p className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider pl-1">
                                    Select Slot Time
                                </p>
                                {loadingSlots ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="animate-spin text-[#8e5233]" size={24} />
                                    </div>
                                ) : error ? (
                                    <div className="text-red-650 text-xs py-2">{error}</div>
                                ) : slots.length === 0 ? (
                                    <div className="text-neutral-400 text-xs py-8 text-center font-light">
                                        No collection slots available or store is closed on this day.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                                        {slots.map((slot) => {
                                            const isSelected = selectedSlot && selectedSlot.datetime === slot.datetime;
                                            return (
                                                <button
                                                    key={slot.datetime}
                                                    type="button"
                                                    disabled={!slot.is_available}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none border ${
                                                        !slot.is_available
                                                            ? 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed'
                                                            : isSelected
                                                                ? 'bg-[#8e5233] text-white border-[#8e5233] shadow-md font-bold'
                                                                : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200'
                                                    }`}
                                                >
                                                    {slot.time}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Continue Button */}
                        <div className="mt-8">
                            {!selectedSlot && (
                                <p className="text-neutral-400 text-xs text-center mb-3 animate-pulse">
                                    Please select a slot time to proceed.
                                </p>
                            )}
                            <button 
                                type="submit" 
                                disabled={!selectedSlot || loadingSlots}
                                className="w-full bg-[#8e5233] hover:bg-[#7b462a] active:bg-[#6c3d25] text-white font-medium py-4 rounded-xl transition-all text-sm tracking-wide shadow-md shadow-[#8e5233]/15 hover:shadow-[#8e5233]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                Continue
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
);
}
