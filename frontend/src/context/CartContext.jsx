import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import client from '../api/client';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Sync from DB when user logs in
    useEffect(() => {
        const fetchCart = async () => {
            if (user) {
                try {
                    const { data } = await client.get('/cart');
                    if (data && data.length > 0) {
                        setCartItems(data);
                    } else if (cartItems.length > 0) {
                        syncCartToDB(cartItems);
                    }
                } catch (error) {
                    console.error("Failed to fetch cart", error);
                }
            }
        };
        fetchCart();
    }, [user]);

    // Persist to LocalStorage always
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const syncCartToDB = async (items) => {
        if (user) {
            try {
                await client.put('/cart', { cartItems: items });
            } catch (error) {
                console.error("Failed to sync cart", error);
            }
        }
    };

    /**
     * Generate a unique cart key for a product + selected option combination.
     * This allows the same product in different sizes to coexist as separate cart items.
     */
    const getCartKey = (product, selectedOption) => {
        const id = product._id || product.id;
        const optionLabel = selectedOption?.label || '__default__';
        return `${id}::${optionLabel}`;
    };

    /**
     * addToCart(product, quantity, selectedOption)
     *
     * selectedOption: { label: "250g", price: 449 }  OR undefined
     * If a product has options, the price used is selectedOption.price (if provided);
     * otherwise it falls back to product.price.
     */
    const addToCart = (product, quantity = 1, selectedOption = null) => {
        // Resolve the effective price for this cart item
        const effectivePrice = selectedOption?.price ?? product.price;

        setCartItems((prevItems) => {
            const cartKey = getCartKey(product, selectedOption);

            const existingIndex = prevItems.findIndex((item) => item.cartKey === cartKey);

            let newItems;

            if (existingIndex !== -1) {
                // Same product + same option → just increase quantity
                newItems = prevItems.map((item, index) =>
                    index === existingIndex
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // New cart entry
                newItems = [
                    ...prevItems,
                    {
                        ...product,
                        _id: product._id || product.id,
                        id: product.id || product._id,
                        price: effectivePrice,
                        quantity,
                        cartKey,
                        selectedOption: selectedOption || null,
                    }
                ];
            }

            syncCartToDB(newItems);
            return newItems;
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (cartKey) => {
        setCartItems((prevItems) => {
            // Support both old-style _id keys and new cartKey
            const newItems = prevItems.filter(
                (item) => item.cartKey !== cartKey && (item._id || item.id) !== cartKey
            );
            syncCartToDB(newItems);
            return newItems;
        });
    };

    const updateQuantity = (cartKey, delta) => {
        setCartItems((prevItems) => {
            const newItems = prevItems.map((item) => {
                const itemKey = item.cartKey || item._id || item.id;
                if (itemKey === cartKey) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
            syncCartToDB(newItems);
            return newItems;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        syncCartToDB([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        getCartCount,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        getCartKey,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
