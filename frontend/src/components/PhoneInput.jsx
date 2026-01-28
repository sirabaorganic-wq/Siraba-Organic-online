import React from 'react';
import { Phone } from 'lucide-react';

/**
 * PhoneInput Component
 * Provides a phone input with country code selector
 */
const PhoneInput = ({ value, onChange, label, placeholder, required = false }) => {
    // Common country codes
    const countryCodes = [
        { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
        { code: '+1', country: 'US', flag: '🇺🇸', name: 'USA' },
        { code: '+44', country: 'GB', flag: '🇬🇧', name: 'UK' },
        { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
        { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
        { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
        { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
        { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
        { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
        { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
    ];

    // Parse existing value to extract country code and number
    const parsePhoneNumber = (phoneValue) => {
        if (!phoneValue) return { countryCode: '+91', number: '' };

        // Check if it starts with a known country code
        const matchedCode = countryCodes.find(c => phoneValue.startsWith(c.code));
        if (matchedCode) {
            return {
                countryCode: matchedCode.code,
                number: phoneValue.substring(matchedCode.code.length).trim()
            };
        }

        // Default to India if no country code found
        return { countryCode: '+91', number: phoneValue };
    };

    const { countryCode, number } = parsePhoneNumber(value);

    const handleCountryCodeChange = (newCode) => {
        const newValue = number ? `${newCode}${number}` : newCode;
        onChange(newValue);
    };

    const handleNumberChange = (e) => {
        const newNumber = e.target.value.replace(/[^0-9]/g, ''); // Only digits
        const newValue = newNumber ? `${countryCode}${newNumber}` : '';
        onChange(newValue);
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative flex">
                {/* Country Code Select */}
                <div className="relative">
                    <select
                        value={countryCode}
                        onChange={(e) => handleCountryCodeChange(e.target.value)}
                        className="appearance-none h-full pl-3 pr-8 py-2 border-l border-t border-b border-secondary/20 rounded-l-sm bg-background text-primary focus:outline-none focus:border-accent cursor-pointer"
                        style={{ minWidth: '90px' }}
                    >
                        {countryCodes.map((country) => (
                            <option key={country.code} value={country.code}>
                                {country.flag} {country.code}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Phone Number Input */}
                <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={16} />
                    <input
                        type="tel"
                        value={number}
                        onChange={handleNumberChange}
                        placeholder={placeholder || "Enter phone number"}
                        className="w-full pl-10 pr-4 py-2 border border-secondary/20 rounded-r-sm bg-transparent focus:outline-none focus:border-accent text-primary"
                        maxLength={10}
                        required={required}
                    />
                </div>
            </div>

            {/* Preview/Helper Text */}
            {value && (
                <p className="text-xs text-text-secondary mt-1">
                    Complete number: <span className="font-mono font-medium text-primary">{value}</span>
                </p>
            )}
        </div>
    );
};

export default PhoneInput;
