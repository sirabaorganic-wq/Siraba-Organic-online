import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { products as initialProducts } from '../data/products'; // Keep for fast seeding if needed

const ProductContext = createContext();

export const useProducts = () => {
    return useContext(ProductContext);
};

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    // Keep internal state for home content, defaults until fetched
    const [homeContent, setHomeContent] = useState({
        subheading: "Curated Excellence",
        heading: "Signature Collection",
        signatureProducts: []
    });

    const fetchProducts = async () => {
        try {
            const { data } = await client.get('/products');
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    useEffect(() => {
        const fetchHomeContent = async () => {
            try {
                const { data } = await client.get('/settings/home');
                if (data) setHomeContent(data);
            } catch (error) {
                console.error("Failed to fetch home content", error);
            }
        };

        fetchProducts();
        fetchHomeContent();
    }, []);

    const addProduct = async (newProduct) => {
        try {
            const { data } = await client.post('/products', newProduct);
            setProducts(prev => [...prev, data]);
        } catch (error) {
            console.error("Failed to add product", error);
            alert("Failed to add product. Ensure backend is running and you are Admin.");
        }
    };

    const updateProduct = async (updatedProduct) => {
        try {
            const { data } = await client.put(`/products/${updatedProduct._id || updatedProduct.id}`, updatedProduct);
            setProducts(prev => prev.map(p => (p._id === data._id ? data : p)));
        } catch (error) {
            console.error("Failed to update product", error);
        }
    };

    const deleteProduct = async (id) => {
        try {
            await client.delete(`/products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id && p.id !== id));
        } catch (error) {
            console.error("Failed to delete product", error);
        }
    };

    const searchProducts = async (params = {}) => {
        try {
            const query = new URLSearchParams(params).toString();
            const { data } = await client.get(`/products?${query}`);
            return data;
        } catch (error) {
            console.error("Failed to search products", error);
            return [];
        }
    };

    const updateHomeContent = async (newContent) => {
        try {
            // Optimistic update
            const updated = { ...homeContent, ...newContent };
            setHomeContent(updated);

            // Persist to DB
            await client.put('/settings/home', updated);
        } catch (error) {
            console.error("Failed to update home content", error);
            // Revert or alert if needed
        }
    };

    return (
        <ProductContext.Provider value={{
            products,
            addProduct,
            updateProduct,
            deleteProduct,
            searchProducts,
            homeContent,
            updateHomeContent
        }}>
            {children}
        </ProductContext.Provider>
    );
};
