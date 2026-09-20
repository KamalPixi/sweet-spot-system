import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    // Customer Auth State
    const [token, setToken] = useState(() => localStorage.getItem('pl_token') || null);
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('pl_user');
        return saved ? JSON.parse(saved) : null;
    });

    // Admin Auth State
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('pl_admin_token') || null);
    const [adminUser, setAdminUser] = useState(() => {
        const saved = localStorage.getItem('pl_admin_user');
        return saved ? JSON.parse(saved) : null;
    });

    // Cart State
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('pl_cart');
        return saved ? JSON.parse(saved) : [];
    });

    // Checkout Flow State
    const [orderType, setOrderType] = useState(() => localStorage.getItem('pl_order_type') || null); // 'delivery' or 'collection'
    const [deliveryInfo, setDeliveryInfo] = useState(() => {
        const saved = localStorage.getItem('pl_delivery_info');
        return saved ? JSON.parse(saved) : null; // { postcode, address_line_1, address_line_2, city, distance_miles, delivery_fee }
    });
    const [collectionSlot, setCollectionSlot] = useState(() => {
        const saved = localStorage.getItem('pl_collection_slot');
        return saved ? JSON.parse(saved) : null; // { date, time, datetime }
    });

    // Store configurations
    const [configs, setConfigs] = useState({});
    const [catalog, setCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCartLoading, setIsCartLoading] = useState(false);
    const [modalProduct, setModalProduct] = useState(null);

    const openProductModal = (product) => {
        setModalProduct(product);
    };

    const closeProductModal = () => {
        setModalProduct(null);
    };

    const openCart = () => {
        setIsCartLoading(true);
        setIsCartOpen(true);
        setTimeout(() => {
            setIsCartLoading(false);
        }, 400);
    };

    // Fetch Configurations on load
    useEffect(() => {
        fetch('/api/configs')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setConfigs(res.data);
                }
            })
            .catch(err => console.error("Error loading configurations:", err));

        setCatalogLoading(true);
        fetch('/api/menu-catalog')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setCatalog(res.data);
                }
            })
            .catch(err => console.error("Error loading menu catalog:", err))
            .finally(() => setCatalogLoading(false));
    }, []);

    // Sync state to local storage
    useEffect(() => {
        if (token) localStorage.setItem('pl_token', token);
        else localStorage.removeItem('pl_token');
    }, [token]);

    useEffect(() => {
        if (user) localStorage.setItem('pl_user', JSON.stringify(user));
        else localStorage.removeItem('pl_user');
    }, [user]);

    useEffect(() => {
        if (adminToken) localStorage.setItem('pl_admin_token', adminToken);
        else localStorage.removeItem('pl_admin_token');
    }, [adminToken]);

    useEffect(() => {
        if (adminUser) localStorage.setItem('pl_admin_user', JSON.stringify(adminUser));
        else localStorage.removeItem('pl_admin_user');
    }, [adminUser]);

    useEffect(() => {
        localStorage.setItem('pl_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (orderType) localStorage.setItem('pl_order_type', orderType);
        else localStorage.removeItem('pl_order_type');
    }, [orderType]);

    useEffect(() => {
        if (deliveryInfo) localStorage.setItem('pl_delivery_info', JSON.stringify(deliveryInfo));
        else localStorage.removeItem('pl_delivery_info');
    }, [deliveryInfo]);

    useEffect(() => {
        if (collectionSlot) localStorage.setItem('pl_collection_slot', JSON.stringify(collectionSlot));
        else localStorage.removeItem('pl_collection_slot');
    }, [collectionSlot]);

    // Actions
    const login = (newToken, newUser, type) => {
        if (type === 'admin') {
            setAdminToken(newToken);
            setAdminUser(newUser);
        } else {
            setToken(newToken);
            setUser(newUser);
        }
    };

    const logout = (type = 'customer') => {
        if (type === 'admin') {
            setAdminToken(null);
            setAdminUser(null);
            localStorage.removeItem('pl_admin_token');
            localStorage.removeItem('pl_admin_user');
        } else {
            setToken(null);
            setUser(null);
            localStorage.removeItem('pl_token');
            localStorage.removeItem('pl_user');
        }
    };

    const addToCart = (product, variation, quantity) => {
        setIsCartLoading(true);
        setIsCartOpen(true);
        setTimeout(() => {
            setIsCartLoading(false);
        }, 400);
        setCart(prev => {
            const key = variation ? `${product.id}-${variation.id}` : `${product.id}`;
            const existingIndex = prev.findIndex(item => item.key === key);

            // Resolve image string for the cart item
            let resolvedImage = null;
            if (variation && variation.images && variation.images.length > 0) {
                const primary = variation.images.find(img => img.is_primary);
                resolvedImage = primary ? primary.url : variation.images[0].url;
            } else if (variation && variation.image) {
                resolvedImage = variation.image;
            } else if (product.images && product.images.length > 0) {
                const primary = product.images.find(img => img.is_primary);
                resolvedImage = primary ? primary.url : product.images[0].url;
            } else if (product.image) {
                resolvedImage = product.image;
            }

            const cartItem = {
                key,
                product_id: product.id,
                product_variation_id: variation ? variation.id : null,
                name: product.name,
                variation_name: variation ? variation.name : null,
                price: parseFloat(variation ? variation.price : product.base_price),
                weight: variation ? variation.weight : product.base_weight,
                image: resolvedImage,
                quantity: quantity,
            };

            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].quantity += quantity;
                return updated;
            }

            return [...prev, cartItem];
        });
    };

    const updateCartQty = (key, qty) => {
        if (qty <= 0) {
            removeFromCart(key);
            return;
        }
        setCart(prev => prev.map(item => item.key === key ? { ...item, quantity: qty } : item));
    };

    const removeFromCart = (key) => {
        setCart(prev => prev.filter(item => item.key !== key));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const freeDeliveryThreshold = configs.free_delivery_threshold ? parseFloat(configs.free_delivery_threshold) : null;
    const flatDeliveryFee = configs.delivery_fee ? parseFloat(configs.delivery_fee) : (deliveryInfo ? parseFloat(deliveryInfo.delivery_fee) : 0);
    const isFreeDelivery = freeDeliveryThreshold !== null && cartSubtotal >= freeDeliveryThreshold;
    const cartDeliveryFee = orderType === 'delivery' && deliveryInfo ? (isFreeDelivery ? 0 : flatDeliveryFee) : 0;
    const cartTotal = cartSubtotal + cartDeliveryFee;
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const userType = token ? 'customer' : (adminToken ? 'admin' : null);

    return (
        <AppContext.Provider value={{
            token, user, adminToken, adminUser, login, logout, userType,
            cart, addToCart, updateCartQty, removeFromCart, clearCart,
            cartSubtotal, cartDeliveryFee, flatDeliveryFee, cartTotal, cartItemCount,
            isFreeDelivery, freeDeliveryThreshold,
            orderType, setOrderType,
            deliveryInfo, setDeliveryInfo,
            collectionSlot, setCollectionSlot,
            configs,
            catalog, setCatalog, catalogLoading, setCatalogLoading,
            isSearchOpen, setIsSearchOpen,
            searchTerm, setSearchTerm,
            isCartOpen, setIsCartOpen,
            isCartLoading, setIsCartLoading, openCart,
            modalProduct, setModalProduct, openProductModal, closeProductModal
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
