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
                    // If DB has items, use them. If DB empty but local has items, maybe sync local to DB?
                    // For simplicity: DB wins if it has items, otherwise keep local (and we'll sync next).
                    if (data && data.length > 0) {
                        setCartItems(data);
                    } else if (cartItems.length > 0) {
                        // User logged in with items in local cart -> sync to DB
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

    const addToCart = (product, quantity = 1) => {
        setCartItems((prevItems) => {
            // Get the unique identifier for the product
            const getProductId = (item) => item._id || item.id;
            const productId = getProductId(product);

            // Debug logging
            console.log('Adding to cart:', {
                productName: product.name,
                productId: productId,
                quantity: quantity,
                currentCart: prevItems.map(item => ({
                    name: item.name,
                    id: getProductId(item)
                }))
            });

            // Check if this exact product already exists in cart
            const existingItemIndex = prevItems.findIndex((item) => {
                const itemId = getProductId(item);
                return itemId === productId;
            });

            let newItems;

            if (existingItemIndex !== -1) {
                // Product exists - update quantity
                console.log('Product exists in cart, updating quantity');
                newItems = prevItems.map((item, index) =>
                    index === existingItemIndex
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // New product - add to cart
                console.log('New product, adding to cart');
                newItems = [
                    ...prevItems,
                    {
                        ...product,
                        quantity,
                        // Ensure we have a valid ID
                        _id: product._id || product.id,
                        id: product.id || product._id
                    }
                ];
            }

            syncCartToDB(newItems);
            return newItems;
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => {
            const newItems = prevItems.filter((item) => (item._id || item.id) !== productId);
            syncCartToDB(newItems);
            return newItems;
        });
    };

    const updateQuantity = (productId, delta) => {
        setCartItems((prevItems) => {
            const newItems = prevItems.map((item) => {
                if ((item._id || item.id) === productId) {
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
        setIsCartOpen
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
