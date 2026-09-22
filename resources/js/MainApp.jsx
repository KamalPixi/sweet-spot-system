// resources/js/MainApp.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './AppContext';
import { Search, X } from 'lucide-react';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import SearchModal from './components/SearchModal';

// Safe lazy load helper to prevent MIME type / chunk loading errors after vite builds
const safeLazy = (importFn) => lazy(async () => {
    try {
        return await importFn();
    } catch (err) {
        // Fallback or retry on dynamic import failure (e.g. outdated asset hash)
        const hasReloaded = sessionStorage.getItem('chunk_reload');
        if (!hasReloaded) {
            sessionStorage.setItem('chunk_reload', 'true');
            window.location.reload();
            return new Promise(() => {});
        }
        sessionStorage.removeItem('chunk_reload');
        throw err;
    }
});

// Lazy-loaded Pages & Components
const Landing = safeLazy(() => import('./Landing'));
const Categories = safeLazy(() => import('./Categories'));
const CategoryDetail = safeLazy(() => import('./CategoryDetail'));
const Cart = safeLazy(() => import('./Cart'));
const Checkout = safeLazy(() => import('./Checkout'));
const OrderTracking = safeLazy(() => import('./OrderTracking'));
const PaymentSuccess = safeLazy(() => import('./PaymentSuccess'));
const PaymentFailed = safeLazy(() => import('./PaymentFailed'));
const Auth = safeLazy(() => import('./Auth'));
const AdminDashboard = safeLazy(() => import('./AdminDashboard'));
const AdminOrderDetailPage = safeLazy(() => import('./admin/pages/AdminOrderDetailPage'));
const AdminCustomerDetailPage = safeLazy(() => import('./admin/pages/AdminCustomerDetailPage'));
const CustomerPortal = safeLazy(() => import('./customer/pages/CustomerPortal'));
const Shop = safeLazy(() => import('./Shop'));
const ResetPassword = safeLazy(() => import('./ResetPassword'));
const PdfMenu = safeLazy(() => import('./PdfMenu'));

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
    const { isSearchOpen, setIsSearchOpen } = useApp();
    return (
        <SearchModal 
            isOpen={isSearchOpen} 
            onClose={() => setIsSearchOpen(false)} 
        />
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

function TableParamDetector() {
    const location = useLocation();
    const { tableNumber, setDiningTable } = useApp();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const urlTable = searchParams.get('table') || searchParams.get('table_number');
        if (urlTable && urlTable.trim()) {
            const clean = urlTable.trim();
            if (clean !== tableNumber) {
                setDiningTable(clean);
                // Clean informative toast
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.success(`🍽️ Welcome! Ordering for Table #${clean}`, {
                        id: `table-welcome-${clean}`,
                        duration: 4000,
                    });
                });
            }
        }
    }, [location.search, tableNumber, setDiningTable]);

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
                <TableParamDetector />
                <AppToaster />
                <GlobalSearchOverlay />
                <GlobalProductModal />
                <CartDrawer />
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Storefront Customer Routes */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/delivery-setup" element={<Navigate to="/" replace />} />
                        <Route path="/collection-setup" element={<Navigate to="/" replace />} />
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
                        <Route path="/admin/reviews" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
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
