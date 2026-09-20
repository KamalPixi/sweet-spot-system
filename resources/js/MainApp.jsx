// resources/js/MainApp.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './AppContext';
import { Search, X } from 'lucide-react';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';

// Lazy-loaded Pages & Components
const Landing = lazy(() => import('./Landing'));
const DeliverySetup = lazy(() => import('./DeliverySetup'));
const CollectionSetup = lazy(() => import('./CollectionSetup'));
const Categories = lazy(() => import('./Categories'));
const CategoryDetail = lazy(() => import('./CategoryDetail'));
const Cart = lazy(() => import('./Cart'));
const Checkout = lazy(() => import('./Checkout'));
const OrderTracking = lazy(() => import('./OrderTracking'));
const PaymentSuccess = lazy(() => import('./PaymentSuccess'));
const PaymentFailed = lazy(() => import('./PaymentFailed'));
const Auth = lazy(() => import('./Auth'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminOrderDetailPage = lazy(() => import('./admin/pages/AdminOrderDetailPage'));
const AdminCustomerDetailPage = lazy(() => import('./admin/pages/AdminCustomerDetailPage'));
const CustomerPortal = lazy(() => import('./customer/pages/CustomerPortal'));
const Shop = lazy(() => import('./Shop'));
const ResetPassword = lazy(() => import('./ResetPassword'));
const PdfMenu = lazy(() => import('./PdfMenu'));

const getImageUrl = (item) => {
    if (!item) return '/images/placeholder.svg';
    if (item.images && item.images.length > 0) {
        const primary = item.images.find(img => img.is_primary);
        const url = primary ? primary.url : item.images[0].url;
        return url.startsWith('http') ? url : `/storage/${url}`;
    }
    if (item.image) {
        return item.image.startsWith('http') ? item.image : `/storage/${item.image}`;
    }
    return '/images/placeholder.svg';
};

const getNoResultsMessage = (term) => {
    if (!term) return '';
    const messages = [
        "No sweet matches found for",
        "Our bakers couldn't find anything matching",
        "We couldn't find any treats matching",
        "No delicious matches for",
        "No desserts found matching"
    ];
    let hash = 0;
    for (let i = 0; i < term.length; i++) {
        hash = term.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % messages.length;
    return `${messages[index]} "${term}"`;
};

function AppToaster() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <Toaster
            position="top-right"
            gutter={12}
            containerStyle={{
                top: isAdminRoute ? '4.75rem' : '1rem',
            }}
            toastOptions={{
                duration: 3500,
                className: '',
                style: {
                    borderRadius: '14px',
                    padding: '14px 16px',
                    border: '1px solid #e5e5e5',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                    fontSize: '12px',
                    fontWeight: 600,
                    maxWidth: '360px',
                },
                success: {
                    style: {
                        background: isAdminRoute ? '#171717' : '#8F5336',
                        color: '#ffffff',
                        border: isAdminRoute ? '1px solid #262626' : '1px solid #ffffff',
                        borderRadius: isAdminRoute ? '12px' : '24px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    },
                    iconTheme: {
                        primary: '#ffffff',
                        secondary: isAdminRoute ? '#171717' : '#8F5336',
                    },
                },
                error: {
                    style: {
                        background: '#fef2f2',
                        color: '#991b1b',
                        borderColor: '#fecaca',
                    },
                },
            }}
        />
    );
}

function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white text-neutral-500 text-xs font-semibold uppercase tracking-wider">
            <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin border-2 border-neutral-900 border-t-transparent h-5 w-5 rounded-full"></div>
                <span>Loading...</span>
            </div>
        </div>
    );
}

function RequireAdmin({ children }) {
    const { adminToken } = useApp();

    if (!adminToken) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}

function GlobalSearchOverlay() {
    const navigate = useNavigate();
    const { isSearchOpen, setIsSearchOpen, searchTerm, setSearchTerm, catalog, openProductModal } = useApp();

    if (!isSearchOpen) return null;

    // Filter products globally
    const filteredProducts = [];
    if (searchTerm.trim() && catalog) {
        catalog.forEach(category => {
            if (category.products) {
                category.products.forEach(product => {
                    const match = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
                    if (match && !filteredProducts.some(p => p.id === product.id)) {
                        filteredProducts.push(product);
                    }
                });
            }
        });
    }

    return (
        <>
            {/* Overlay background blur/dimmer for content below */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-49 transition-opacity duration-300"
                onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}
            />
            
            {/* Search Input Bar */}
            <div className="fixed top-0 inset-x-0 h-[88px] md:h-[96px] bg-primary/95 backdrop-blur-md z-50 px-6 md:px-12 flex items-center justify-between animate-fadeIn shadow-2xl border-b border-white/10">
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (searchTerm.trim()) {
                            navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
                            setIsSearchOpen(false);
                        }
                    }}
                    className="flex-grow max-w-lg mx-auto relative flex items-center bg-white/10 rounded-full border border-white/20 px-5 py-3 focus-within:border-rose-400 focus-within:bg-white/15 transition-all"
                >
                    <Search size={18} className="text-white/60 mr-3 shrink-0" />
                    <input 
                        type="text" 
                        placeholder="Search artisanal cakes, coffee, treats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm w-full text-white placeholder-white/40 focus:outline-none font-light"
                        autoFocus
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} className="text-white/60 hover:text-white cursor-pointer ml-2">
                            <X size={14} />
                        </button>
                    )}
                </form>
                <button 
                    onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}
                    className="ml-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Global Search Results Dropdown Panel */}
            {searchTerm.trim() && (
                <div className="fixed top-[88px] md:top-[96px] left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-[#24161b] border border-white/15 rounded-b-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[420px] animate-fadeIn">
                    {filteredProducts.length > 0 ? (
                        <>
                            <div className="overflow-y-auto divide-y divide-white/5 flex-1 custom-scrollbar">
                                {filteredProducts.slice(0, 5).map(product => (
                                    <div 
                                        key={product.id}
                                        onClick={() => {
                                            openProductModal(product);
                                            setIsSearchOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className="flex items-center p-4 hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <img 
                                            src={getImageUrl(product)} 
                                            alt={product.name}
                                            className="w-13 h-13 object-cover rounded-xl border border-white/10 shrink-0"
                                            onError={(e) => {
                                                e.target.src = "/images/placeholder.svg";
                                            }}
                                        />
                                        <div className="ml-4 flex-grow text-left">
                                            <h4 className="text-sm font-semibold text-white group-hover:text-rose-300 transition-colors leading-tight">{product.name}</h4>
                                            <p className="text-xs text-white/45 mt-1 line-clamp-1 font-light">{product.description}</p>
                                        </div>
                                        <div className="text-right ml-4 text-nowrap">
                                            <span className="text-sm font-bold text-rose-400">
                                                £{(parseFloat(product.base_price) === 0 && product.variations?.length 
                                                    ? parseFloat(product.variations[0].price) 
                                                    : parseFloat(product.base_price || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
                                    setIsSearchOpen(false);
                                }}
                                className="w-full bg-white/[0.04] hover:bg-rose-500 hover:text-white text-rose-300 text-xs font-semibold py-3.5 text-center transition-all border-t border-white/10 cursor-pointer focus:outline-none shrink-0 uppercase tracking-wider"
                            >
                                View all results ({filteredProducts.length})
                            </button>
                        </>
                    ) : (
                        <div className="p-8 text-center text-white/60 text-xs font-light">
                            {getNoResultsMessage(searchTerm)}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

function TitleUpdater() {
    const location = useLocation();
    const { configs } = useApp();
    
    useEffect(() => {
        const path = location.pathname;
        let title = 'Sweet Spot System';
        
        if (path === '/') {
            title = configs?.seo_title || 'Handcrafted Cakes & Specialty Coffee | Sweet Spot System';
        } else if (path === '/delivery-setup') {
            title = 'Setup Delivery | Sweet Spot System';
        } else if (path === '/collection-setup') {
            title = 'Setup Collection | Sweet Spot System';
        } else if (path === '/categories') {
            title = 'Our Categories | Sweet Spot System';
        } else if (path.startsWith('/categories/')) {
            const slug = path.split('/').pop();
            const categoryName = slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Category';
            title = `${categoryName} | Sweet Spot System`;
        } else if (path === '/menu' || path === '/pdf-menu') {
            title = 'Our Menu | Sweet Spot System';
        } else if (path === '/products') {
            title = 'Shop Our Menu | Sweet Spot System';
        } else if (path === '/cart' || path === '/checkout') {
            title = 'Secure Checkout | Sweet Spot System';
        } else if (path.startsWith('/track')) {
            title = 'Track Your Order | Sweet Spot System';
        } else if (path === '/payment/success') {
            title = 'Order Successful! | Sweet Spot System';
        } else if (path === '/payment/failed') {
            title = 'Payment Failed | Sweet Spot System';
        } else if (path === '/login') {
            title = 'Sign In | Sweet Spot';
        } else if (path === '/register' || path === '/signup') {
            title = 'Create Account | Sweet Spot';
        } else if (path === '/forgot-password') {
            title = 'Reset Password | Sweet Spot';
        } else if (path === '/reset-password') {
            title = 'Choose New Password | Sweet Spot';
        } else if (path.startsWith('/account')) {
            title = 'My Account Center | Sweet Spot';
        } else if (path.startsWith('/admin')) {
            if (path === '/admin/login') {
                title = 'Admin Login | Sweet Spot System';
            } else {
                const subPath = path.split('/')[2] || 'dashboard';
                const adminSection = subPath.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                title = `Admin ${adminSection} | Sweet Spot System`;
            }
        }
        
        document.title = title;
    }, [location]);
    
    return null;
}

function GlobalProductModal() {
    const { modalProduct, closeProductModal } = useApp();
    return (
        <ProductDetailModal
            isOpen={!!modalProduct}
            onClose={closeProductModal}
            product={modalProduct}
        />
    );
}

export default function MainApp() {
    return (
        <AppProvider>
            <Router>
                <TitleUpdater />
                <AppToaster />
                <GlobalSearchOverlay />
                <GlobalProductModal />
                <CartDrawer />
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Storefront Customer Routes */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/delivery-setup" element={<DeliverySetup />} />
                        <Route path="/collection-setup" element={<CollectionSetup />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/categories/:categorySlug" element={<CategoryDetail />} />
                        <Route path="/menu" element={<PdfMenu />} />
                        <Route path="/pdf-menu" element={<PdfMenu />} />
                        <Route path="/products" element={<Shop />} />
                        <Route path="/product/:productSlug" element={<Navigate to="/products" replace />} />
                        <Route path="/product/*" element={<Navigate to="/products" replace />} />
                        <Route path="/cart" element={<Checkout />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/track" element={<OrderTracking />} />
                        <Route path="/track/:orderNumber" element={<OrderTracking />} />
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/payment/failed" element={<PaymentFailed />} />
                        <Route path="/login" element={<Auth defaultMode="login" />} />
                        <Route path="/register" element={<Auth defaultMode="register" />} />
                        <Route path="/signup" element={<Auth defaultMode="register" />} />
                        <Route path="/forgot-password" element={<Auth defaultMode="forgot_password" />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/account/*" element={<CustomerPortal />} />

                        {/* Admin Routes */}
                        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/orders" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/orders/:orderNumber" element={<RequireAdmin><AdminOrderDetailPage /></RequireAdmin>} />
                        <Route path="/admin/tables" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/printers" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/collection-slots" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/reports" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/categories" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/products" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/customers" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/customers/:id" element={<RequireAdmin><AdminCustomerDetailPage /></RequireAdmin>} />
                        <Route path="/admin/newsletter" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/profile" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/settings" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/trash" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                        <Route path="/admin/login" element={<Auth defaultMode="admin" />} />
                    </Routes>
                </Suspense>
            </Router>
        </AppProvider>
    );
}
