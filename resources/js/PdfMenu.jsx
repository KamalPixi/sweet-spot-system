import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ExternalLink, FileText, ShoppingBag, ArrowRight } from 'lucide-react';
import { MenuIcon, UserIcon } from './components/HeaderIcons';
import { useApp } from './AppContext';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import HeaderCartButton from './components/HeaderCartButton';
import HeaderSearchButton from './components/HeaderSearchButton';

export default function PdfMenu() {
    const navigate = useNavigate();
    const { 
        cartItemCount, 
        user, 
        logout,
        configs 
    } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const hasPdf = Boolean(configs?.menu_pdf && configs.menu_pdf.trim() !== '');

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#24161b] text-neutral-900 font-sans selection:bg-rose-500 selection:text-white relative">
            <div>
                {/* 1. Dark Plum Header */}
                <header className="w-full py-3 sm:py-3.5 px-5 md:px-10 lg:px-16 grid grid-cols-3 items-center bg-transparent z-40 relative">
                    {/* Left: Hamburger menu */}
                    <div className="flex items-center justify-start">
                        <button 
                            onClick={() => setIsMenuOpen(true)} 
                            className="text-white/90 hover:text-white transition-colors p-1.5 -ml-1.5 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="Open navigation menu"
                        >
                            <MenuIcon className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Center: Brand Logo */}
                    <div className="flex items-center justify-center">
                        <div 
                            onClick={() => navigate('/')} 
                            className="cursor-pointer flex items-center justify-center select-none"
                        >
                            {configs?.store_logo_white ? (
                                <img 
                                    src={configs.store_logo_white} 
                                    alt={configs?.store_name || "Sweet Spot"} 
                                    className="h-7 sm:h-8 w-auto object-contain transition-transform hover:scale-105" 
                                />
                            ) : configs?.store_name ? (
                                <span className="text-white font-black text-lg tracking-tight hover:opacity-90 transition-opacity">
                                    {configs.store_name}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {/* Right: Actions (Search, Cart, User) */}
                    <div className="flex items-center justify-end space-x-1 sm:space-x-2 md:space-x-3">
                        <HeaderSearchButton className="p-1.5" />

                        <HeaderCartButton />

                        <button 
                            onClick={() => navigate(user ? '/account' : '/login')} 
                            className="text-white/90 hover:text-white transition-colors p-1.5 cursor-pointer focus:outline-none flex items-center justify-center"
                            aria-label="User account"
                        >
                            <UserIcon className="w-[19px] h-[19px]" strokeWidth={1.75} />
                        </button>
                    </div>
                </header>

                {/* Top spacer */}
                <div className="w-full h-8 sm:h-12 bg-transparent" />

                {/* 2. Floating Curved White Container Layout */}
                <div className="w-full -mt-4 mb-[-32px] md:mb-[-48px] rounded-[28px] md:rounded-[36px] relative z-30 bg-white shadow-2xl p-6 sm:p-8 md:p-12 lg:p-14 min-h-[600px]">
                    <div className="max-w-6xl mx-auto w-full">
                        
                        {/* Heading Row */}
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8 text-left pb-6 border-b border-neutral-100">
                            <div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
                                    {configs?.menu_title || 'Our Menu'}
                                </h1>
                                <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed max-w-lg mt-1">
                                    {configs?.menu_subtitle || (hasPdf ? 'Browse our full menu below or download a copy to view offline.' : 'Explore our freshly prepared treats and artisan beverages.')}
                                </p>
                            </div>

                            {hasPdf && (
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <a
                                        href={configs.menu_pdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                                    >
                                        <ExternalLink size={14} />
                                        <span>Open Fullscreen</span>
                                    </a>
                                    <a
                                        href={configs.menu_pdf}
                                        download={configs.menu_pdf.split('/').pop() || 'menu.pdf'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#24161b] hover:bg-black text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                                    >
                                        <Download size={14} />
                                        <span>Download PDF</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* PDF Display or Blank State */}
                        {hasPdf ? (
                            <div className="w-full rounded-[24px] md:rounded-[30px] overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-inner relative">
                                <iframe
                                    src={`${configs.menu_pdf}#toolbar=1&navpanes=0`}
                                    title={configs?.menu_title || "Menu PDF"}
                                    className="w-full h-[650px] sm:h-[800px] md:h-[950px] border-0 block"
                                />
                            </div>
                        ) : (
                            /* Clean Empty / Blank State */
                            <div className="w-full py-16 sm:py-24 px-6 rounded-[24px] md:rounded-[30px] bg-neutral-50 border border-dashed border-neutral-200 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-[#24161b]/5 flex items-center justify-center mb-4 text-[#24161b]">
                                    <FileText className="w-8 h-8 stroke-1 text-neutral-400" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-[#111111] mb-2 tracking-tight">
                                    No PDF Menu Uploaded
                                </h3>
                                <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-8 leading-relaxed">
                                    There is currently no downloadable menu file uploaded. You can browse and order from our complete live catalog online.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/shop')}
                                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#24161b] hover:bg-black text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                                >
                                    <ShoppingBag size={16} />
                                    <span>Browse Online Menu</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Sidebar Navigation Drawer */}
            <Sidebar 
                isMenuOpen={isMenuOpen} 
                setIsMenuOpen={setIsMenuOpen} 
                navigate={navigate} 
                cartItemCount={cartItemCount} 
                user={user} 
                logout={logout} 
            />

            {/* Global Dark Footer */}
            <Footer />
        </div>
    );
}

