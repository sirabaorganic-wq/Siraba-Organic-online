import { ArrowRight, Star, Leaf, ShieldCheck, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import HeroVideo from '../assets/Siraba_s_Organic_Spices_Video_Ready.mp4';
import SaffronImg from '../assets/Saffron.png';
import HingImg from '../assets/Hing.png';
import BgImage2 from '../assets/bgimage2.png';
import BgImage1 from '../assets/bgimage1.png'; // Fallback or extra usage
import TextMarquee from '../components/TextMarquee';

const Home = () => {
    const { homeContent, products } = useProducts();

    const getSignatureProducts = () => {
        if (homeContent.signatureProducts && homeContent.signatureProducts.length > 0) {
            return homeContent.signatureProducts
                .map(id => products.find(p => (p._id === id || p.id === id)))
                .filter(Boolean); // Filter out any undefineds if product deleted
        }
        return products.slice(0, 2);
    };

    return (
        <div className="w-full">
            {/* Hero Section */}
            <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover blur-[2px] scale-105"
                        poster={BgImage1}
                    >
                        <source src={HeroVideo} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div className="absolute inset-0 bg-primary/40 md:bg-primary/30 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up">
                    <span className="font-subheading text-accent text-xs md:text-sm tracking-[0.15em] uppercase font-bold text-shadow-sm border border-accent/30 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm mb-4">
                        USDA Organic • NPOP Certified • Globally Certified • Export-Ready
                    </span>
                    <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-surface leading-tight text-shadow max-w-6xl mx-auto">
                        World’s Finest Organic Kashmiri Saffron (Keshar) <span className="italic text-accent">&</span> Premium Asafetida (Hing)
                    </h1>
                    <p className="font-body text-white/90 text-base md:text-lg max-w-3xl mx-auto font-light leading-relaxed">
                        From the pristine valleys of Kashmir to certified Indian spice laboratories, Siraba Organic delivers globally trusted, lab-verified, premium organic ingredients to conscious kitchens worldwide.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6">
                        <Link
                            to="/shop"
                            className="bg-accent text-primary font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
                        >
                            Shop Products
                        </Link>
                        <Link
                            to="/b2b"
                            className="bg-primary text-surface border border-accent/50 font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface hover:text-primary transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
                        >
                            Order Wholesale
                        </Link>
                        <Link
                            to="/vendor/intro"
                            className="bg-white/10 backdrop-blur text-surface border border-white/20 font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface hover:text-primary transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
                        >
                            Become Vendor
                        </Link>
                    </div>
                </div>
            </section>

            {/* Trust Indicators */}
            <section className="bg-background py-16 border-b border-secondary/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center space-y-4 p-6 hover:bg-white/50 rounded-xl transition-colors duration-300">
                            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-primary mb-2">
                                <Leaf size={32} strokeWidth={1} />
                            </div>
                            <h3 className="font-heading text-xl text-primary font-bold">100% Certified Organic</h3>
                            <p className="text-text-secondary text-sm leading-relaxed max-w-xs font-light">
                                USDA NPOP certified. Free from pesticides, additives, and artificial colors. Pure nature.
                            </p>
                        </div>
                        <div className="flex flex-col items-center space-y-4 p-6 hover:bg-white/50 rounded-xl transition-colors duration-300">
                            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-primary mb-2">
                                <ShieldCheck size={32} strokeWidth={1} />
                            </div>
                            <h3 className="font-heading text-xl text-primary font-bold">Lab Tested Quality</h3>
                            <p className="text-text-secondary text-sm leading-relaxed max-w-xs font-light">
                                Rigorously tested by Eurofins (Germany). Guaranteed potency and purity in every strand.
                            </p>
                        </div>
                        <div className="flex flex-col items-center space-y-4 p-6 hover:bg-white/50 rounded-xl transition-colors duration-300">
                            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-primary mb-2">
                                <Globe size={32} strokeWidth={1} />
                            </div>
                            <h3 className="font-heading text-xl text-primary font-bold">Direct Farm to Home</h3>
                            <p className="text-text-secondary text-sm leading-relaxed max-w-xs font-light">
                                Fresh from Kashmir's heritage farms delivered securely to your doorstep.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Moving Text Banner */}
            <TextMarquee />

            {/* Featured Products */}
            <section className="py-20 bg-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 space-y-4">
                        <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">Curated Excellence</span>
                        <h2 className="font-heading text-4xl md:text-5xl text-primary">Signature Collection</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                        {getSignatureProducts().map((product) => (
                            <Link key={product._id || product.id} to={`/product/${product.slug}`} className="group cursor-pointer">
                                <div className="relative aspect-[4/5] overflow-hidden bg-background mb-6 rounded-sm">
                                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors duration-500" />
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-8 transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <button className="w-full bg-white/90 backdrop-blur text-primary py-4 uppercase tracking-wider text-xs font-bold hover:bg-accent hover:text-primary transition-colors duration-300 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 shadow-md">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="font-heading text-2xl text-primary group-hover:text-accent transition-colors duration-300">{product.name}</h3>
                                    <p className="text-text-secondary text-sm font-light">From {product.currency}{product.price}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>



            {/* Customer Trust & CTA Section */}
            <section className="py-20 md:py-32 bg-primary text-surface relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img src={BgImage2} alt="Background" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/90"></div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-8">
                    <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">Customer Trust & CTA</span>
                    <h2 className="font-heading text-4xl md:text-6xl leading-tight font-bold">
                        Bring Real Organic Into Your Kitchen
                    </h2>
                    <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-3xl mx-auto">
                        Across the world, families, chefs, and wellness-conscious consumers choose Siraba Organic for one simple reason — <span className="text-accent italic">they trust what they eat.</span>
                    </p>
                    <p className="text-base md:text-lg font-light text-white/70 leading-relaxed max-w-3xl mx-auto">
                        Our Kashmiri Saffron and Premium Hing are sourced, tested, and packaged with a level of care that mass-market brands cannot match. Every batch reflects our promise of purity, authenticity, and global-grade quality.
                    </p>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link to="/shop?category=Saffron" className="w-full sm:w-auto bg-accent text-primary px-10 py-4 font-bold uppercase tracking-widest hover:bg-surface transition-all duration-300 shadow-lg transform hover:-translate-y-1">
                            Shop Kashmiri Saffron
                        </Link>
                        <Link to="/shop?category=Hing" className="w-full sm:w-auto bg-transparent border border-accent text-surface px-10 py-4 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg transform hover:-translate-y-1">
                            Shop Premium Hing
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
