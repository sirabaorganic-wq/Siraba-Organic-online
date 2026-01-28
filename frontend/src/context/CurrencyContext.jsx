import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
    // Default to INR as base currency (product prices are in INR)
    const [currency, setCurrency] = useState(() => {
        // Try to get saved currency from localStorage
        return localStorage.getItem('selectedCurrency') || 'INR';
    });
    const [exchangeRates, setExchangeRates] = useState({});
    const [loading, setLoading] = useState(true);

    // Save currency preference to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('selectedCurrency', currency);
    }, [currency]);

    // Fetch exchange rates on mount and refresh every hour
    useEffect(() => {
        const fetchRates = async () => {
            try {
                // Using ExchangeRate-API - Free tier: 1,500 requests/month
                // This is more reliable and provides better coverage than Frankfurter
                const response = await axios.get('https://api.exchangerate-api.com/v4/latest/INR');
                const rates = response.data.rates;

                // Add INR as base
                setExchangeRates({ INR: 1, ...rates });
                setLoading(false);
                console.log('✅ Exchange rates updated successfully');
            } catch (error) {
                console.error("Failed to fetch exchange rates from ExchangeRate-API, trying fallback...", error);

                // Fallback to Frankfurter API
                try {
                    const { data } = await axios.get('https://api.frankfurter.app/latest?from=INR');
                    const rates = { INR: 1, ...data.rates };
                    setExchangeRates(rates);
                    setLoading(false);
                    console.log('✅ Exchange rates updated from fallback API');
                } catch (fallbackError) {
                    console.error("Fallback API also failed, using static rates", fallbackError);
                    // Static fallback rates (updated as of Jan 2026)
                    setExchangeRates({
                        INR: 1,
                        USD: 0.012,
                        EUR: 0.011,
                        GBP: 0.0095,
                        AED: 0.044,
                        CAD: 0.016,
                        AUD: 0.018,
                        SGD: 0.016,
                        JPY: 1.75,
                        CNY: 0.086
                    });
                    setLoading(false);
                }
            }
        };

        fetchRates();

        // Refresh rates every hour
        const interval = setInterval(fetchRates, 3600000);

        return () => clearInterval(interval);
    }, []);

    // Helper to format price
    const formatPrice = (priceInINR) => {
        if (loading || !exchangeRates[currency]) return `₹${priceInINR.toFixed(2)}`;

        const convertedPrice = priceInINR * exchangeRates[currency];

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(convertedPrice);
    };

    // Helper to just get converted value number (for calculations)
    const convertPrice = (priceInINR) => {
        if (loading || !exchangeRates[currency]) return priceInINR;
        return priceInINR * exchangeRates[currency];
    }

    const value = {
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
        exchangeRates,
        // Support 25+ major world currencies for global e-commerce
        availableCurrencies: Object.keys(exchangeRates).length > 0
            ? [
                'INR',  // Indian Rupee
                'USD',  // US Dollar
                'EUR',  // Euro
                'GBP',  // British Pound
                'JPY',  // Japanese Yen
                'CNY',  // Chinese Yuan
                'AUD',  // Australian Dollar
                'CAD',  // Canadian Dollar
                'CHF',  // Swiss Franc
                'SGD',  // Singapore Dollar
                'AED',  // UAE Dirham
                'SAR',  // Saudi Riyal
                'KRW',  // South Korean Won
                'HKD',  // Hong Kong Dollar
                'NZD',  // New Zealand Dollar
                'SEK',  // Swedish Krona
                'NOK',  // Norwegian Krone
                'DKK',  // Danish Krone
                'ZAR',  // South African Rand
                'BRL',  // Brazilian Real
                'MXN',  // Mexican Peso
                'RUB',  // Russian Ruble
                'THB',  // Thai Baht
                'MYR',  // Malaysian Ringgit
                'IDR',  // Indonesian Rupiah
                'TWD',  // Taiwan Dollar
                'PLN'   // Polish Złoty
            ].filter(curr => exchangeRates[curr]) // Only show currencies with rates
            : ['INR', 'USD', 'EUR', 'GBP', 'AED']
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
