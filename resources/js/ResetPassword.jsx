import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './AppContext';
import { Lock, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, logout, user, token, cartItemCount, isSearchOpen, setIsSearchOpen, catalog, configs } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const tokenParam = searchParams.get('token') || '';
    const emailParam = searchParams.get('email') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!tokenParam || !emailParam) {
            setError('Invalid or missing password reset parameters.');
        }
    }, [tokenParam, emailParam]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/customer/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email_or_phone: emailParam,
                    token_or_code: tokenParam,
                    password: password,
                    password_confirmation: confirmPassword
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || 'Failed to reset password. The link may have expired.');
                setLoading(false);
                return;
            }

            setSuccess(true);
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfaf5] text-neutral-800 font-sans select-none relative flex flex-col justify-between">
            <div>
                <Header 
                    setIsMenuOpen={setIsMenuOpen}
                    setIsSearchOpen={setIsSearchOpen}
                    isSearchOpen={isSearchOpen}
                    navigate={navigate}
                    cartItemCount={cartItemCount}
                    user={user}
                />

                <div className="w-full mb-[-32px] md:mb-[-48px] rounded-b-[24px] md:rounded-b-[36px] rounded-t-none relative z-30 px-6 pt-6 pb-10 md:px-12 md:pt-8 md:pb-16" style={{ background: 'linear-gradient(to bottom, #f4edd9 0%, #ffffff 15%, #ffffff 85%, #f7f2e4 100%)' }}>
                    <div className="max-w-md mx-auto w-full flex flex-col items-start gap-4 animate-fadeIn">
                        {/* Back button */}
                        <button 
                            onClick={() => navigate('/login')} 
                            className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-[#8F5336] flex items-center gap-1.5 transition-colors cursor-pointer pl-3 bg-transparent border-none"
                        >
                            <ArrowLeft size={14} />
                            <span>Go to Login</span>
                        </button>

                        <div className="w-full bg-white border border-neutral-200/60 p-8 md:p-10 rounded-[24px] shadow-xl shadow-[#8e5233]/5 relative overflow-hidden text-left mt-2">
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-3">
                                    <img 
                                        src={configs?.store_logo || "/images/logo-colored.png"} 
                                        alt="Sweet Spot System Logo" 
                                        className="h-16 w-auto object-contain cursor-pointer"
                                        onClick={() => navigate('/')}
                                    />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-[#8F5336] mt-4">
                                    Choose New Password
                                </h2>
                                <p className="text-neutral-500 text-xs mt-1">
                                    {success ? 'Your password has been reset successfully.' : `Enter a new secure password for ${emailParam}.`}
                                </p>
                            </div>

                            {success ? (
                                <div className="space-y-4 text-center">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                        <Lock size={20} />
                                    </div>
                                    <p className="text-sm text-neutral-600">You can now sign in using your new password.</p>
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="w-full bg-[#8e5233] hover:bg-[#723e25] text-white font-bold py-3.5 rounded-xl transition-all text-xs shadow-lg shadow-[#8e5233]/15 cursor-pointer"
                                    >
                                        Proceed to Login
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="w-full">
                                    <div className="mb-4">
                                        <label className="block text-neutral-555 text-[10px] font-bold uppercase tracking-wider mb-1.5">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 text-neutral-400" size={14} />
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                required
                                                disabled={!!error}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-12 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-3 text-neutral-400 hover:text-[#8e5233] transition-colors focus:outline-none cursor-pointer p-0.5 flex items-center justify-center"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-neutral-555 text-[10px] font-bold uppercase tracking-wider mb-1.5">Confirm New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 text-neutral-400" size={14} />
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                required
                                                disabled={!!error}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-white border border-neutral-200/80 focus:border-[#8e5233] focus:ring-1 focus:ring-[#8e5233]/20 rounded-xl pl-11 pr-12 py-3 text-xs text-neutral-900 focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center space-x-2 text-red-700 bg-red-50 border border-red-200 rounded-[12px] p-3 text-xs mb-4">
                                            <AlertCircle size={16} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={loading || !!error}
                                        className="w-full bg-[#8e5233] hover:bg-[#723e25] disabled:bg-[#8e5233]/60 text-white font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#8e5233]/15 cursor-pointer"
                                    >
                                        {loading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <span>Reset Password</span>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer catalog={catalog} navigate={navigate} />

            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                cartItemCount={cartItemCount} 
                user={user} 
                logout={logout}
            />
        </div>
    );
}
