import SaffronImg from '../assets/Saffron.png';
import HingImg from '../assets/Hing.png';
import Bg1 from '../assets/bgimage1.png';
import Bg2 from '../assets/bgimage2.png';

export const products = [
    {
        id: 1,
        name: "Kashmiri Mongra Saffron",
        slug: "kashmiri-mongra-saffron",
        description: "Grade A1 Premium Organic Saffron. Hand-harvested from the fields of Pampore. Known for its potent aroma and deep crimson color.",
        fullDescription: "Our Kashmiri Mongra Saffron is the finest quality saffron available, distinguished by its dark red color and long, thick stigmas. Sourced directly from the heritage fields of Pampore, Kashmir, each flower is hand-picked at dawn to preserve its delicate aroma and potent flavor. Lab-tested for purity, it contains no additives, artificial colors, or preservatives. Perfect for culinary masterpieces, traditional recipes, and holistic wellness.",
        price: 850,
        currency: "₹",
        image: SaffronImg,
        rating: 5,
        reviews: 128,
        tag: "Best Seller",
        category: "Spices",
        features: ["100% Organic", "Hand Picked", "Lab Tested", "GI Tagged"],
        ingredients: "100% Pure Crocus Sativus Stigmas"
    },
    {
        id: 2,
        name: "Premium Asafoetida (Hing)",
        slug: "premium-asafoetida-hing",
        description: "Strong, aromatic, and pure compounded Asafoetida. Essential for authentic Indian cuisine and traditional wellness.",
        fullDescription: "Experience the robust and pungent aroma of our Premium Asafoetida (Hing). Sourced from the high-altitude deserts, this resin is carefully compounded to deliver an authentic flavor profile essential for Indian cooking. Known for its digestive properties, a tiny pinch goes a long way in transforming your dals, curries, and vegetable dishes.",
        price: 450,
        currency: "₹",
        image: HingImg,
        rating: 4.8,
        reviews: 94,
        tag: "New Arrival",
        category: "Spices",
        features: ["Strong Aroma", "Digestive Aid", "No Artificial Fillers"],
        ingredients: "Edible Gum, Wheat Flour, Asafoetida"
    },
    {
        id: 3,
        name: "Himalayan Shilajit Resin",
        slug: "himalayan-shilajit-resin",
        description: "Pure, mineral-rich soft resin sourced from high-altitude rocks. Supports vitality and immunity.",
        fullDescription: "Harvested from the pristine heights of the Himalayas, our Shilajit Resin is a natural powerhouse of fulvic acid and over 80 trace minerals. It is purified using traditional Ayurvedic methods to ensure safety and potency. Regular consumption supports energy levels, builds immunity, and promotes overall well-being and vitality.",
        price: 1250,
        currency: "₹",
        image: Bg1,
        rating: 4.9,
        reviews: 45,
        tag: "Trending",
        category: "Wellness",
        features: ["Rich in Fulvic Acid", "High Altitude Source", "Lab Tested"],
        ingredients: "Pure Shilajit Resin"
    },
    {
        id: 4,
        name: "Kashmiri Mamra Almonds",
        slug: "kashmiri-mamra-almonds",
        description: "Oil-rich, sweet, and crunchy almonds with a high concave shape. Known for superior nutritional value.",
        fullDescription: "Mamra Almonds are the most premium variety of almonds, grown organically in the valleys of Kashmir. Unlike commercially mass-produced almonds, Mamra almonds are rich in natural oils and have a distinct curvature. They offer a sweeter taste and significantly higher nutritional content, making them excellent for brain health and skin.",
        price: 1800,
        currency: "₹",
        image: Bg2,
        rating: 4.7,
        reviews: 62,
        tag: "Premium",
        category: "Dry Fruits",
        features: ["High Oil Content", "Crunchy Texture", "Heart Healthy"],
        ingredients: "Whole Almond Kernels"
    },
    {
        id: 5,
        name: "Organic Turmeric Powder",
        slug: "organic-turmeric-powder",
        description: "High curcumin content turmeric with vibrant color and earthy aroma. Ground from naturally dried roots.",
        fullDescription: "Our Organic Turmeric Powder is made from heritage variety turmeric roots known for their high curcumin content. Grown without synthetic pesticides, the roots are sun-dried and stone-ground to preserve their essential oils and medicinal properties. Adds a brilliant golden hue and warm flavor to your food while boosting immunity.",
        price: 250,
        currency: "₹",
        image: SaffronImg,
        rating: 4.6,
        reviews: 110,
        tag: "Essential",
        category: "Spices",
        features: ["High Curcumin", "Vibrant Color", "Anti-inflammatory"],
        ingredients: "100% Organic Turmeric Root"
    }
];
