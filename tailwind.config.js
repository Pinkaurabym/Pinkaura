/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Pinks
        pink: {
          50: '#FDF7FB',
          100: '#FCF0F8',
          200: '#F9D9E8',
          300: '#F5B8D1',
          400: '#F285B0',
          500: '#EE5B8F',  // Main Brand Pink
          600: '#E63E73',
          700: '#D12E5A',
          800: '#A61F47',
          900: '#7D1534',
          aura: '#FFB6D9',  // Light "Aura" Pink
        },
        // Purples (Complementary)
        purple: {
          50: '#FAF4FF',
          100: '#F3E8FF',
          200: '#E8D5FF',
          300: '#D8B5FF',
          400: '#C084FC',
          500: '#A855F7',  // Main Purple
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          lavender: '#E6D9F5',  // Light Lavender
        },
        // Mint (Accent)
        mint: {
          50: '#F0FFF9',
          100: '#D9FFF0',
          200: '#A7FDD9',
          300: '#6FFFC4',
          400: '#3DFFB1',
          500: '#0FE5A8',  // Mint Accent
          600: '#00D699',
          700: '#00A878',
          800: '#007A5A',
          900: '#005240',
        },
        // Brand Colors
        'brand-bg': '#f9e8ee',  // Logo background color (extracted from logo.png)
        'brand-bg-pink': '#FAE8F0',  // Pinkaura logo background color (legacy)
        // Neutrals
        dark: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      backgroundImage: {
        'gradient-aura': 'linear-gradient(135deg, #FFB6D9 0%, #E6D9F5 100%)',
        'gradient-mint': 'linear-gradient(135deg, #0FE5A8 0%, #6FFFC4 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'gradient-dark': 'linear-gradient(135deg, #212121 0%, #424242 100%)',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Poppins', 'sans-serif'],
        script: ['Pinyon Script', 'cursive'],
      },
      fontSize: {
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glow-pink': '0 0 20px rgba(238, 91, 143, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.glass': {
          '@apply bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl': {},
        },
        '.glass-dark': {
          '@apply bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-3xl': {},
        },
        '.text-gradient': {
          '@apply bg-gradient-to-r bg-clip-text text-transparent': {},
        },
      });
    },
  ],
};
