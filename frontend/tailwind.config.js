/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0F3D2E', // Deep Forest Green
                secondary: '#6B8E6E', // Olive / Sage Green
                background: '#FAFAF7', // Off-White / Ivory
                accent: '#C9A24D', // Gold / Saffron
                text: {
                    primary: '#1C1C1C',
                    secondary: '#6F6F6F',
                },
                surface: '#FFFFFF'
            },
            fontFamily: {
                heading: ['Playfair Display', 'serif'],
                body: ['Inter', 'sans-serif'],
                subheading: ['Cormorant Garamond', 'serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            keyframes: {
                scroll: {
                    'from': { transform: 'translateX(0)' },
                    'to': { transform: 'translateX(-50%)' },
                }
            },
            animation: {
                scroll: 'scroll 20s linear infinite',
            }
        },
    },
    plugins: [],
}
