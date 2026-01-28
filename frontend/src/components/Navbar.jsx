import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import logo from '../assets/SIRABALOGO.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isMobileCurrencyOpen, setIsMobileCurrencyOpen] = useState(false);
    const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
    const currencyRef = useRef(null);
    const navigate = useNavigate();

    const { currency, setCurrency, availableCurrencies } = useCurrency();
    const { getCartCount } = useCart();
    const { products } = useProducts();
    const cartCount = getCartCount();

    // Currency symbols mapping - 27 major world currencies
    const currencySymbols = {
        INR: '₹',   // Indian Rupee
        USD: '$',   // US Dollar
        EUR: '€',   // Euro
        GBP: '£',   // British Pound
        JPY: '¥',   // Japanese Yen
        CNY: '¥',   // Chinese Yuan
        AUD: 'A$',  // Australian Dollar
        CAD: 'C$',  // Canadian Dollar
        CHF: 'CHF', // Swiss Franc
        SGD: 'S$',  // Singapore Dollar
        AED: 'د.إ', // UAE Dirham
        SAR: '﷼',   // Saudi Riyal
        KRW: '₩',   // South Korean Won
        HKD: 'HK$', // Hong Kong Dollar
        NZD: 'NZ$', // New Zealand Dollar
        SEK: 'kr',  // Swedish Krona
        NOK: 'kr',  // Norwegian Krone
        DKK: 'kr',  // Danish Krone
        ZAR: 'R',   // South African Rand
        BRL: 'R$',  // Brazilian Real
        MXN: '$',   // Mexican Peso
        RUB: '₽',   // Russian Ruble
        THB: '฿',   // Thai Baht
        MYR: 'RM',  // Malaysian Ringgit
        IDR: 'Rp',  // Indonesian Rupiah
        TWD: 'NT$', // Taiwan Dollar
        PLN: 'zł'   // Polish Złoty
    };

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Close currency dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (currencyRef.current && !currencyRef.current.contains(event.target)) {
                setIsCurrencyOpen(false);
            }
        };

        if (isCurrencyOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCurrencyOpen]);

    const handleCloseSearch = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/shop?keyword=${encodeURIComponent(searchQuery.trim())}`);
            handleCloseSearch();
        }
    };

    const handleMobileSearchSubmit = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            navigate(`/shop?keyword=${encodeURIComponent(e.target.value.trim())}`);
            setIsOpen(false);
        }
    };

    return (
        <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-secondary/20 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex justify-between items-center h-20">

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-primary hover:text-accent transition-colors"
                        >
                            <span className="sr-only">Open menu</span>
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Logo */}
                    <div className={`flex-shrink-0 flex items-center justify-center flex-1 md:flex-none md:justify-start ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}>
                        <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                            <img src={logo} alt="Siraba Organic Logo" className="h-10 w-auto md:h-12 object-contain" />
                            <div className="flex flex-col items-start">
                                <span className="font-heading text-xl md:text-2xl font-bold text-primary tracking-wide group-hover:text-accent transition-colors duration-300 leading-none">
                                    SIRABA
                                </span>
                                <span className="text-[0.55rem] md:text-[0.65rem] uppercase tracking-[0.2em] text-secondary font-medium group-hover:text-primary transition-colors duration-300 leading-tight">
                                    Organic
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation / Search Bar Transition */}
                    <div className="flex-1 flex items-center justify-end md:justify-center px-4 md:px-8 relative">
                        {!isSearchOpen ? (
                            /* Standard Nav Links */
                            <div className="hidden md:flex items-center space-x-6 lg:space-x-8 animate-fade-in">
                                {[
                                    { label: 'Shop', path: '/shop' },
                                    {
                                        label: 'About',
                                        children: [
                                            { label: 'Our Story', path: '/our-story' },
                                            { label: 'Why Siraba', path: '/why-siraba' },
                                            { label: 'Certifications', path: '/certifications' },
                                        ]
                                    },
                                    { label: 'Blog', path: '/blog' },
                                    { label: 'Contact', path: '/contact' },
                                    { label: 'Vendor', path: '/vendor' }
                                ].map((item) => (
                                    item.children ? (
                                        <div key={item.label} className="relative group">
                                            <button className="flex items-center gap-1 text-text-primary hover:text-accent font-body text-xs lg:text-sm uppercase tracking-widest transition-all duration-300 py-2">
                                                {item.label}
                                                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                                            </button>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 w-48 z-50">
                                                <div className="bg-surface shadow-xl rounded-sm border border-secondary/10 overflow-hidden py-1">
                                                    {item.children.map(child => (
                                                        <Link
                                                            key={child.label}
                                                            to={child.path}
                                                            className="block px-4 py-2 text-text-primary hover:text-accent hover:bg-secondary/5 font-body text-xs uppercase tracking-wider transition-colors text-center"
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            key={item.label}
                                            to={item.path}
                                            className="text-text-primary hover:text-accent font-body text-xs lg:text-sm uppercase tracking-widest transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap"
                                        >
                                            {item.label}
                                        </Link>
                                    )
                                ))}
                            </div>
                        ) : (
                            /* Search Bar */
                            <div className="flex flex-1 max-w-2xl relative animate-fade-in w-full">
                                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-primary/50" size={20} strokeWidth={1.5} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchSubmit}
                                    placeholder="Search details..."
                                    className="w-full bg-transparent border-none text-primary placeholder-primary/40 text-lg pl-10 pr-12 py-2 focus:ring-0 font-light outline-none"
                                />
                                <button onClick={handleCloseSearch} className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/50 text-xs uppercase tracking-wider font-bold hover:text-primary transition-colors">
                                    Close
                                </button>

                                {/* Live Search Results Dropdown */}
                                {searchQuery.trim().length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-surface shadow-xl rounded-b-sm border-t border-secondary/10 mt-4 max-h-96 overflow-y-auto z-50 animate-fade-in">
                                        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                            <div className="py-2">
                                                {products
                                                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .slice(0, 5)
                                                    .map(product => (
                                                        <Link
                                                            key={product._id || product.id}
                                                            to={`/product/${product.slug}`}
                                                            onClick={handleCloseSearch}
                                                            className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/5 transition-colors group"
                                                        >
                                                            <div className="w-12 h-12 bg-white border border-secondary/10 rounded-sm p-1 flex-shrink-0">
                                                                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-heading text-sm font-bold text-primary group-hover:text-accent truncate">{product.name}</h4>
                                                                <p className="text-xs text-text-secondary">{product.category}</p>
                                                            </div>
                                                            <div className="text-sm font-medium text-primary">
                                                                {currencySymbols[currency] || currency}{Math.round(product.price * (currency === 'USD' ? 0.012 : 1)).toLocaleString()}
                                                            </div>
                                                        </Link>
                                                    ))}
                                                <button
                                                    onClick={() => {
                                                        navigate(`/shop?keyword=${encodeURIComponent(searchQuery.trim())}`);
                                                        handleCloseSearch();
                                                    }}
                                                    className="w-full text-center py-3 text-xs uppercase tracking-wider font-bold text-accent hover:text-primary transition-colors border-t border-secondary/10 mt-2"
                                                >
                                                    View All Results
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-text-secondary text-sm">
                                                No products found for "{searchQuery}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Icons Section */}
                    <div className="flex items-center space-x-4 md:space-x-6">
                        {/* Currency Selector - Desktop */}
                        <div ref={currencyRef} className="hidden md:block relative">
                            <button
                                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/5 hover:bg-secondary/10 border border-secondary/10 hover:border-accent/30 text-sm font-bold text-primary hover:text-accent transition-all duration-200"
                            >
                                <span className="text-base">{currencySymbols[currency] || currency}</span>
                                <span className="text-xs">{currency}</span>
                                <span className={`text-[10px] transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            {isCurrencyOpen && (
                                <div className="absolute top-full right-0 mt-2 w-40 bg-surface border border-secondary/20 shadow-xl rounded-md py-2 z-50 animate-fade-in max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50">
                                    {availableCurrencies.map(curr => (
                                        <button
                                            key={curr}
                                            onClick={() => {
                                                setCurrency(curr);
                                                setIsCurrencyOpen(false);
                                            }}
                                            className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-bold hover:bg-accent/10 transition-colors ${currency === curr
                                                ? 'text-accent bg-accent/5'
                                                : 'text-primary'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="text-lg">{currencySymbols[curr] || curr}</span>
                                                <span>{curr}</span>
                                            </span>
                                            {currency === curr && <span className="text-accent">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Toggle Search visibility if closed */}
                        {!isSearchOpen && (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="group flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary/10 transition-all duration-300"
                                aria-label="Search"
                            >
                                <Search size={22} strokeWidth={1.5} className="text-primary group-hover:text-accent transition-colors" />
                            </button>
                        )}

                        <Link to="/account" className={`hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary/10 transition-all duration-300 ${isSearchOpen ? 'hidden lg:flex' : ''}`}>
                            <User size={22} strokeWidth={1.5} className="text-primary hover:text-accent transition-colors" />
                        </Link>
                        <Link to="/cart" className={`relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary/10 transition-all duration-300 group ${isSearchOpen ? 'hidden lg:flex' : ''}`}>
                            <ShoppingBag size={22} strokeWidth={1.5} className="text-primary group-hover:text-accent transition-colors" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-primary text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Backdrop for Desktop Focus */}
            {isSearchOpen && (
                <div className="hidden md:block fixed inset-0 top-20 bg-black/20 backdrop-blur-[2px] -z-10 animate-fade-in" onClick={handleCloseSearch}></div>
            )}

            {/* Mobile Menu */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-background border-b border-secondary/20 transition-all duration-300 ease-in-out transform ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                {/* Mobile Search Input */}
                <div className="p-4 border-b border-secondary/10">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            onKeyDown={handleMobileSearchSubmit}
                            className="w-full bg-secondary/5 border border-secondary/20 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                    </div>
                    <div className="border-t border-secondary/10 mt-2 pt-2">
                        <button
                            onClick={() => setIsMobileCurrencyOpen(!isMobileCurrencyOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 text-primary font-bold hover:bg-secondary/5 rounded-md transition-colors"
                        >
                            <span className="text-sm uppercase tracking-wider">Currency: {currency}</span>
                            <span className={`transition-transform duration-200 ${isMobileCurrencyOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {isMobileCurrencyOpen && (
                            <div className="grid grid-cols-3 gap-2 px-3 mt-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                                {availableCurrencies.map(curr => (
                                    <button
                                        key={curr}
                                        onClick={() => { setCurrency(curr); setIsMobileCurrencyOpen(false); setIsOpen(false); }}
                                        className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs transition-all ${currency === curr ? 'bg-accent text-primary border-accent shadow-sm' : 'bg-surface text-text-secondary border-secondary/20 hover:border-accent/50 hover:text-primary'}`}
                                    >
                                        <span className="text-sm font-bold">{currencySymbols[curr]}</span>
                                        <span className="text-[10px] uppercase">{curr}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-4 pt-2 pb-6 space-y-2">
                    {/* Shop */}
                    <Link
                        to="/shop"
                        className="block px-3 py-3 text-base font-medium text-primary hover:bg-secondary/10 hover:text-accent rounded-md transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        Shop
                    </Link>

                    {/* About Dropdown */}
                    <div>
                        <button
                            onClick={() => setIsMobileAboutOpen(!isMobileAboutOpen)}
                            className="flex items-center justify-between w-full px-3 py-3 text-base font-medium text-primary hover:bg-secondary/10 hover:text-accent rounded-md transition-colors"
                        >
                            <span>About</span>
                            <ChevronDown size={16} className={`transition-transform duration-300 ${isMobileAboutOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${isMobileAboutOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="pl-6 space-y-1 py-1">
                                {[
                                    { label: 'Our Story', path: '/our-story' },
                                    { label: 'Why Siraba', path: '/why-siraba' },
                                    { label: 'Certifications', path: '/certifications' }
                                ].map(child => (
                                    <Link
                                        key={child.label}
                                        to={child.path}
                                        onClick={() => setIsOpen(false)}
                                        className="block px-3 py-2 text-sm text-text-secondary hover:text-accent transition-colors"
                                    >
                                        {child.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {[
                        { label: 'B2B', path: '/b2b' },
                        { label: 'Blog', path: '/blog' },
                        { label: 'Contact', path: '/contact' },
                        { label: 'Track Order', path: '/track-order' }
                    ].map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            className="block px-3 py-3 text-base font-medium text-primary hover:bg-secondary/10 hover:text-accent rounded-md transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link
                        to="/account"
                        className="block px-3 py-3 text-base font-medium text-primary hover:bg-secondary/10 hover:text-accent rounded-md transition-colors border-t border-secondary/10 mt-2"
                        onClick={() => setIsOpen(false)}
                    >
                        My Account
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
