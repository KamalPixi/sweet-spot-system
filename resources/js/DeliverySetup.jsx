import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './AppContext';
import { X, Loader2, AlertCircle, Check, ArrowLeft } from 'lucide-react';

export default function DeliverySetup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { deliveryInfo, setDeliveryInfo, configs } = useApp();
    
    const [postcode, setPostcode] = useState(() => deliveryInfo?.postcode || '');
    const [line1, setLine1] = useState(() => deliveryInfo?.address_line_1 || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [results, setResults] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!postcode || !line1) return;
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const res = await fetch('/api/check-postcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postcode })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || 'Verification failed. Please check your postcode.');
                setLoading(false);
                return;
            }

            const info = data.data;

            if (info.is_allowed) {
                const deliveryData = {
                    postcode: info.postcode,
                    address_line_1: line1,
                    city: 'London',
                    distance_miles: info.distance_miles,
                    delivery_fee: info.delivery_fee,
                    type: 'home',
                };
                setDeliveryInfo(deliveryData);
                setResults({
                    allowed: true,
                    distance: info.distance_miles,
                    fee: info.delivery_fee
                });
                setSuccess(true);
                
                setTimeout(() => {
                    const redirectUrl = searchParams.get('redirect') || '/categories';
                    navigate(redirectUrl);
                }, 1200);
            } else {
                setError(`We only deliver within ${info.max_radius_miles} miles. You are ${info.distance_miles} miles away.`);
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 font-sans select-none relative"
            style={{
                background: 'radial-gradient(circle at 75% 50%, #8e5233 0%, #2b1409 100%)'
            }}
        >
            <div className="flex flex-col items-start gap-4 max-w-[420px] w-full animate-fadeIn">
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
                <div className="bg-white rounded-[32px] shadow-2xl p-10 w-full relative">
                    {/* Close Button */}
                    <button 
                        onClick={() => navigate('/')} 
                        className="absolute top-6 right-6 text-neutral-300 hover:text-neutral-500 transition-colors border border-neutral-200 hover:border-neutral-300 rounded-full p-1 cursor-pointer focus:outline-none"
                        aria-label="Close"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>

                    {/* Header */}
                    <h1 className="text-[#8e5233] text-3xl font-medium mb-8 text-left tracking-wide">
                        Delivery
                    </h1>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[#8e5233] text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-3">Address</label>
                            <input 
                                type="text" 
                                required
                                disabled={loading || success}
                                value={line1}
                                onChange={(e) => {
                                    setLine1(e.target.value);
                                    setError(null);
                                }}
                                placeholder="e.g. 10 Soho Street"
                                className="w-full bg-white border border-neutral-200 focus:border-[#8e5233] px-5 py-3.5 rounded-xl text-sm text-neutral-800 focus:outline-none placeholder-neutral-400/80 transition-all font-light"
                            />
                        </div>

                        <div>
                            <label className="block text-[#8e5233] text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-3">Postcode</label>
                            <input 
                                type="text" 
                                required
                                disabled={loading || success}
                                value={postcode}
                                onChange={(e) => {
                                    setPostcode(e.target.value.toUpperCase());
                                    setError(null);
                                }}
                                placeholder="e.g. W1D 1AN"
                                className="w-full bg-white border border-neutral-200 focus:border-[#8e5233] px-5 py-3.5 rounded-xl text-sm text-neutral-800 focus:outline-none placeholder-neutral-400/80 transition-all font-light uppercase"
                            />
                        </div>

                        {/* Radius subtext */}
                        <p className="text-neutral-400 text-[10px] pl-2 tracking-wide text-left">
                            *Delivery availability within the {configs.store_delivery_radius_miles || '3'} - mile radius
                        </p>

                        {/* Error display */}
                        {error && (
                            <div className="flex items-center space-x-2 text-red-650 bg-red-50/50 border border-red-100 rounded-2xl p-3 text-xs text-left">
                                <AlertCircle size={14} className="shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* Success Notice */}
                        {success && results && (
                            <div className="flex flex-col items-center justify-center space-y-1 text-green-700 bg-green-50/50 border border-green-150 rounded-2xl p-3.5 text-xs text-center font-medium animate-fadeIn">
                                <div className="flex items-center space-x-2">
                                    <Loader2 size={12} className="animate-spin text-green-700" />
                                    <span>Address Verified! ({Number(results.distance).toFixed(1)} miles away)</span>
                                </div>
                                <span className="text-[10px] text-green-600/70">Redirecting...</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading || success || !postcode || !line1}
                            className="w-full bg-[#8e5233] hover:bg-[#7b462a] active:bg-[#6c3d25] text-white font-medium py-4 rounded-xl transition-all text-sm tracking-wide shadow-md shadow-[#8e5233]/15 hover:shadow-[#8e5233]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <span>Continue</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
