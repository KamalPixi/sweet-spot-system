// resources/js/MainApp.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './AppContext';
import { Search, X } from 'lucide-react';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import SearchModal from './components/SearchModal';

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
