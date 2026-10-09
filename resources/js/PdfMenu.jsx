import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Download, 
    FileText, 
    ShoppingBag, 
    ArrowRight, 
    ChevronLeft, 
    ChevronRight, 
    Maximize2, 
    Minimize2, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { MenuIcon, UserIcon } from './components/HeaderIcons';
import { useApp } from './AppContext';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import HeaderCartButton from './components/HeaderCartButton';
import HeaderSearchButton from './components/HeaderSearchButton';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfMenu() {
    const navigate = useNavigate();
    const { 
        cartItemCount, 
        user, 
        logout,
        configs 
    } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageRendering, setPageRendering] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Zoom & Drag/Pan state (Internal viewer zoom only)
    const [zoomMultiplier, setZoomMultiplier] = useState(1); // 1 = fit, 1.3, 1.6, 2.0, 2.5
    const [isDragging, setIsDragging] = useState(false);
    const dragPosRef = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
    const [touchStartX, setTouchStartX] = useState(null);

    const viewerContainerRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);

    const pdfUrl = configs?.menu_pdf && configs.menu_pdf.trim() !== '' ? configs.menu_pdf : null;

    // 1. Load PDF Document
    useEffect(() => {
        if (!pdfUrl) {
            setPdfDoc(null);
            setTotalPages(0);
            return;
        }

        let isCancelled = false;
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument({
            url: pdfUrl,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
            cMapPacked: true,
            enableWebGL: true,
        });

        loadingTask.promise
            .then((doc) => {
                if (!isCancelled) {
                    setPdfDoc(doc);
                    setTotalPages(doc.numPages);
                    setCurrentPage(1);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("Failed to load PDF document:", err);
                if (!isCancelled) {
                    setError("Could not load menu document. You can still download the PDF directly below.");
                    setLoading(false);
                }
            });

        return () => {
            isCancelled = true;
            loadingTask.destroy();
        };
    }, [pdfUrl]);

    // 2. Render Active Page Directly to Canvas with 1:1 Hardware Pixel Sharpness
    const renderPage = useCallback(async () => {
        if (!pdfDoc || !canvasRef.current || !scrollContainerRef.current) return;

        try {
            setPageRendering(true);
            const page = await pdfDoc.getPage(currentPage);

            const container = scrollContainerRef.current;
            const containerWidth = container.clientWidth || 1000;
            const containerHeight = container.clientHeight || 700;

            const unscaledViewport = page.getViewport({ scale: 1.0 });

            // Fit page neatly inside container
            const paddingX = 32;
            const paddingY = 32;
            const scaleX = (containerWidth - paddingX) / unscaledViewport.width;
            const scaleY = (containerHeight - paddingY) / unscaledViewport.height;
            const baseFitScale = Math.min(scaleX, scaleY, 1.8);

            // Compute internal CSS scale strictly for the canvas element inside the viewer
            const cssScale = Math.max(baseFitScale * zoomMultiplier, 0.3);
            const displayWidth = Math.round(unscaledViewport.width * cssScale);
            const displayHeight = Math.round(unscaledViewport.height * cssScale);

            // Multiply by Device Pixel Ratio (Retina / 4K) for 100% native vector sharpness
            const dpr = window.devicePixelRatio || 1;
            const renderScale = cssScale * dpr;

            const viewport = page.getViewport({ scale: renderScale });
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d', { alpha: false });

            // Cancel any in-progress render task before starting a new one
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            // Set physical canvas backing store resolution (Retina crispness)
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);

            // Set CSS display dimensions inside the internal scrolling box
            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;

            const renderTask = page.render({
                canvasContext: ctx,
                viewport: viewport,
                intent: 'display',
            });

            renderTaskRef.current = renderTask;
            await renderTask.promise;
            setPageRendering(false);
        } catch (err) {
            if (err?.name !== 'RenderingCancelledException') {
                console.error("Canvas render error:", err);
            }
            setPageRendering(false);
        }
    }, [pdfDoc, currentPage, zoomMultiplier]);

    // Trigger render when document, page, or zoom changes
    useEffect(() => {
        renderPage();
    }, [renderPage]);

    // Re-render on window resize to maintain crisp sharpness
    useEffect(() => {
        let resizeTimer;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                renderPage();
            }, 150);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, [renderPage]);

    // Page navigation helpers
    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
            setZoomMultiplier(1);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = 0;
                scrollContainerRef.current.scrollTop = 0;
            }
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
            setZoomMultiplier(1);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = 0;
                scrollContainerRef.current.scrollTop = 0;
            }
        }
    };

    // Zoom handlers (Internal canvas zoom)
    const handleZoomIn = () => {
        setZoomMultiplier(prev => Math.min(prev + 0.35, 2.5));
    };

    const handleZoomOut = () => {
        setZoomMultiplier(prev => {
            const next = Math.max(prev - 0.35, 1);
            if (next === 1 && scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = 0;
                scrollContainerRef.current.scrollTop = 0;
            }
            return next;
        });
    };

    const handleResetZoom = () => {
        setZoomMultiplier(1);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = 0;
            scrollContainerRef.current.scrollTop = 0;
        }
    };

    // Hold & Drag / Mouse Panning Handlers
    const handleMouseDown = (e) => {
        if (zoomMultiplier <= 1) return;
        const container = scrollContainerRef.current;
        if (!container) return;

        setIsDragging(true);
        dragPosRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop
        };
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging || zoomMultiplier <= 1) return;
        const container = scrollContainerRef.current;
        if (!container) return;

        const dx = e.clientX - dragPosRef.current.startX;
        const dy = e.clientY - dragPosRef.current.startY;

        container.scrollLeft = dragPosRef.current.scrollLeft - dx;
        container.scrollTop = dragPosRef.current.scrollTop - dy;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch Swipe & Pan Handlers
    const handleTouchStart = (e) => {
        if (zoomMultiplier > 1) {
            setIsDragging(true);
            const container = scrollContainerRef.current;
            if (!container) return;
            dragPosRef.current = {
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                scrollLeft: container.scrollLeft,
                scrollTop: container.scrollTop
            };
        } else {
            setTouchStartX(e.touches[0].clientX);
        }
    };

    const handleTouchMove = (e) => {
        if (zoomMultiplier > 1 && isDragging) {
            const container = scrollContainerRef.current;
            if (!container) return;
            const dx = e.touches[0].clientX - dragPosRef.current.startX;
            const dy = e.touches[0].clientY - dragPosRef.current.startY;
            container.scrollLeft = dragPosRef.current.scrollLeft - dx;
            container.scrollTop = dragPosRef.current.scrollTop - dy;
        }
    };

    const handleTouchEnd = (e) => {
        if (zoomMultiplier > 1) {
            setIsDragging(false);
        } else {
            if (touchStartX === null) return;
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 45) {
                if (diff > 0) goToNextPage();
                else goToPrevPage();
            }
            setTouchStartX(null);
        }
    };

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!viewerContainerRef.current) return;
        if (!document.fullscreenElement) {
            viewerContainerRef.current.requestFullscreen().catch(err => {
                console.warn("Fullscreen request error:", err);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
            setTimeout(renderPage, 150);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [renderPage]);

    // Trap Ctrl/Cmd + Wheel to zoom inside viewer rather than browser viewport
    useEffect(() => {
        const container = viewerContainerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    setZoomMultiplier(prev => Math.min(prev + 0.25, 2.5));
                } else {
                    setZoomMultiplier(prev => Math.max(prev - 0.25, 1));
                }
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    // Keyboard navigation (Prevent browser zoom hijacking)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') goToPrevPage();
            if (e.key === 'ArrowRight') goToNextPage();
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                handleZoomIn();
            }
            if (e.key === '-') {
                e.preventDefault();
                handleZoomOut();
            }
            if (e.key === '0') {
                e.preventDefault();
                handleResetZoom();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages, zoomMultiplier]);

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#24161b] text-neutral-900 font-sans selection:bg-rose-500 selection:text-white relative">
            <div>
                {/* 1. Dark Plum Header */}
                <header className="w-full py-2 sm:py-2.5 px-4 md:px-8 lg:px-12 grid grid-cols-3 items-center bg-transparent z-40 relative">
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

                {/* 2. Floating Curved White Container Layout */}
                <div className="w-full -mt-1 mb-[-32px] md:mb-[-48px] rounded-[24px] md:rounded-[32px] relative z-30 bg-white shadow-2xl pt-2 sm:pt-3 pb-3 sm:pb-5 px-2.5 sm:px-4 md:px-5 min-h-[620px]">
                    <div className="max-w-[1520px] mx-auto w-full">
                        
                        {/* Heading & Controls Row */}
                        <div className="flex items-center justify-between gap-3 mb-2 sm:mb-2.5 px-1">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[#111111] leading-none">
                                {configs?.menu_title || 'Our Menu'}
                            </h1>

                            {pdfUrl && (
                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    {/* Internal Zoom Control Group */}
                                    <div className="flex items-center bg-neutral-100 p-0.5 sm:p-1 rounded-full border border-neutral-200/70 text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={handleZoomOut}
                                            disabled={zoomMultiplier <= 1}
                                            className={`p-1 sm:p-1.5 rounded-full transition-all cursor-pointer ${
                                                zoomMultiplier <= 1 
                                                    ? 'opacity-30 cursor-not-allowed text-neutral-400' 
                                                    : 'text-neutral-700 hover:bg-white hover:text-black shadow-xs'
                                            }`}
                                            title="Zoom Out (-)"
                                        >
                                            <ZoomOut size={13} />
                                        </button>
                                        <span className="px-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-700 select-none min-w-[36px] sm:min-w-[40px] text-center">
                                            {Math.round(zoomMultiplier * 100)}%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleZoomIn}
                                            disabled={zoomMultiplier >= 2.5}
                                            className={`p-1 sm:p-1.5 rounded-full transition-all cursor-pointer ${
                                                zoomMultiplier >= 2.5 
                                                    ? 'opacity-30 cursor-not-allowed text-neutral-400' 
                                                    : 'text-neutral-700 hover:bg-white hover:text-black shadow-xs'
                                            }`}
                                            title="Zoom In (+)"
                                        >
                                            <ZoomIn size={13} />
                                        </button>
                                        {zoomMultiplier > 1 && (
                                            <button
                                                type="button"
                                                onClick={handleResetZoom}
                                                className="p-1 sm:p-1.5 rounded-full text-neutral-500 hover:bg-white hover:text-black ml-0.5 transition-all cursor-pointer"
                                                title="Reset Zoom & Position (0)"
                                            >
                                                <RotateCcw size={11} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Fullscreen Button */}
                                    <button
                                        type="button"
                                        onClick={toggleFullscreen}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                                        title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
                                    >
                                        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                                        <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
                                    </button>

                                    {/* Download PDF Button */}
                                    <a
                                        href={pdfUrl}
                                        download={pdfUrl.split('/').pop() || 'menu.pdf'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold bg-[#24161b] hover:bg-black text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                                        title="Download PDF copy"
                                    >
                                        <Download size={13} />
                                        <span className="hidden sm:inline">Download PDF</span>
                                        <span className="sm:hidden">PDF</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Interactive Reader Stage */}
                        {pdfUrl ? (
                            <div 
                                ref={viewerContainerRef}
                                className={`w-full rounded-[18px] md:rounded-[24px] overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl relative flex flex-col justify-between ${
                                    isFullscreen 
                                        ? 'p-2 sm:p-6 h-screen' 
                                        : 'p-1.5 sm:p-3 md:p-4 min-h-[540px] sm:min-h-[660px] md:min-h-[760px] lg:min-h-[820px]'
                                }`}
                            >
                                {/* Loading Screen */}
                                {loading && (
                                    <div className="flex flex-col items-center justify-center text-center p-8 my-auto z-20">
                                        <div className="relative w-16 h-16 mb-5">
                                            <div className="w-16 h-16 rounded-full border-3 border-rose-400/20 border-t-rose-400 animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center text-rose-300">
                                                <FileText size={20} />
                                            </div>
                                        </div>
                                        <h4 className="text-white font-bold text-base sm:text-lg mb-1 tracking-tight">
                                            Loading Vector Menu
                                        </h4>
                                        <p className="text-neutral-400 text-xs sm:text-sm font-light mb-4">
                                            Rendering crystal-clear typography...
                                        </p>
                                    </div>
                                )}

                                {/* Error Fallback */}
                                {error && !loading && (
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center max-w-md mx-auto my-auto border border-white/10 text-white z-20">
                                        <p className="text-sm text-neutral-300 mb-4">{error}</p>
                                        <a
                                            href={pdfUrl}
                                            download
                                            className="inline-block px-5 py-2.5 rounded-full text-xs font-bold bg-white text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                                        >
                                            Download Menu PDF
                                        </a>
                                    </div>
                                )}

                                {/* Active Page Canvas Viewport Area with Internal Drag & Pan */}
                                {!loading && !error && pdfDoc && (
                                    <div 
                                        ref={scrollContainerRef}
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                        className={`relative w-full flex-1 overflow-auto custom-scrollbar my-auto select-none ${
                                            zoomMultiplier > 1 
                                                ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') 
                                                : 'cursor-default'
                                        }`}
                                    >
                                        <div className="min-w-full min-h-full flex items-center justify-center p-2 sm:p-4">
                                            {/* Native Vector Canvas Rendered by PDF.js */}
                                            <canvas 
                                                ref={canvasRef} 
                                                className="block max-w-none rounded-lg shadow-2xl bg-white shrink-0 pointer-events-none"
                                                style={{
                                                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                                                }}
                                            />
                                        </div>

                                        {/* Desktop Side Navigation Arrows */}
                                        {totalPages > 1 && zoomMultiplier === 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={goToPrevPage}
                                                    disabled={currentPage === 1}
                                                    className={`hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full items-center justify-center transition-all cursor-pointer ${
                                                        currentPage === 1
                                                            ? 'bg-black/30 text-white/20 cursor-not-allowed'
                                                            : 'bg-black/60 hover:bg-black/90 text-white shadow-xl hover:scale-105 active:scale-95 border border-white/10 backdrop-blur-xs'
                                                    }`}
                                                    aria-label="Previous page"
                                                    title="Previous page (Left arrow)"
                                                >
                                                    <ChevronLeft size={24} strokeWidth={2.2} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={goToNextPage}
                                                    disabled={currentPage >= totalPages}
                                                    className={`hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full items-center justify-center transition-all cursor-pointer ${
                                                        currentPage >= totalPages
                                                            ? 'bg-black/30 text-white/20 cursor-not-allowed'
                                                            : 'bg-black/60 hover:bg-black/90 text-white shadow-xl hover:scale-105 active:scale-95 border border-white/10 backdrop-blur-xs'
                                                    }`}
                                                    aria-label="Next page"
                                                    title="Next page (Right arrow)"
                                                >
                                                    <ChevronRight size={24} strokeWidth={2.2} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Bottom Page Controller Bar */}
                                {!loading && !error && totalPages > 0 && (
                                    <div className="w-full pt-2.5 pb-1 flex flex-col sm:flex-row items-center justify-between gap-2 z-30 border-t border-white/10 mt-1.5 shrink-0">
                                        {/* Left Hint */}
                                        <p className="text-[11px] text-white/50 font-light hidden sm:block">
                                            {zoomMultiplier > 1 ? 'Click and hold to drag & pan • Use 0 or Reset to center' : 'Use arrow keys or swipe to view pages'}
                                        </p>

                                        {/* Center Pagination & Page Selector */}
                                        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-white shadow-xl mx-auto sm:mx-0">
                                            <button
                                                type="button"
                                                onClick={goToPrevPage}
                                                disabled={currentPage === 1}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                                    currentPage === 1 
                                                        ? 'opacity-25 cursor-not-allowed' 
                                                        : 'hover:bg-white/20 active:scale-90'
                                                }`}
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft size={17} strokeWidth={2.2} />
                                            </button>

                                            {/* Page Jumping Dots / Indicators */}
                                            <div className="flex items-center gap-1.5 px-1">
                                                {Array.from({ length: totalPages }).map((_, idx) => {
                                                    const pageNum = idx + 1;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                setCurrentPage(pageNum);
                                                                setZoomMultiplier(1);
                                                                if (scrollContainerRef.current) {
                                                                    scrollContainerRef.current.scrollLeft = 0;
                                                                    scrollContainerRef.current.scrollTop = 0;
                                                                }
                                                            }}
                                                            className={`h-2 rounded-full transition-all cursor-pointer ${
                                                                pageNum === currentPage
                                                                    ? 'w-6 bg-rose-400'
                                                                    : 'w-2 bg-white/30 hover:bg-white/60'
                                                            }`}
                                                            aria-label={`Go to page ${pageNum}`}
                                                            title={`Page ${pageNum}`}
                                                        />
                                                    );
                                                })}
                                            </div>

                                            <span className="text-xs font-semibold tracking-wide text-white/90 min-w-[75px] text-center select-none">
                                                {currentPage} / {totalPages}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={goToNextPage}
                                                disabled={currentPage >= totalPages}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                                    currentPage >= totalPages 
                                                        ? 'opacity-25 cursor-not-allowed' 
                                                        : 'hover:bg-white/20 active:scale-90'
                                                }`}
                                                aria-label="Next page"
                                            >
                                                <ChevronRight size={17} strokeWidth={2.2} />
                                            </button>
                                        </div>

                                        {/* Mobile swipe helper */}
                                        <p className="text-[11px] text-white/50 font-light sm:hidden">
                                            {zoomMultiplier > 1 ? 'Drag to pan around' : 'Swipe to flip pages'}
                                        </p>
                                    </div>
                                )}
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
