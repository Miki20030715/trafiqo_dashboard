/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Trafiqo brand palette (from /context/brand_colors.txt)
        brand: {
          50: '#FCE7F0',
          100: '#F9CFE0',
          200: '#F2A0C2',
          300: '#EB70A3',
          400: '#E34585',
          500: '#D6206B', // Magenta — primary
          600: '#B81A5B',
          700: '#8F1447',
          800: '#660E33',
          900: '#3D0820',
        },
        orange: {
          50: '#FEF1E4',
          100: '#FDE3C9',
          200: '#FBC793',
          300: '#F9AB5D',
          400: '#F79538',
          500: '#F5821F', // Orange — accent
          600: '#D66C12',
          700: '#A8540E',
          800: '#7A3C0A',
          900: '#4D2606',
        },
        green: {
          50: '#E4F6EE',
          100: '#C9EDDD',
          200: '#93DBBB',
          300: '#5DC999',
          400: '#38BA82',
          500: '#1FA86B', // Green — accent
          600: '#1A8C59',
          700: '#146B45',
          800: '#0E4A30',
          900: '#08291B',
        },
        ink: {
          DEFAULT: '#1A1B25',
          soft: '#3C3F52',
          muted: '#6B6F86',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 2px 4px rgba(16, 24, 40, 0.06), 0 8px 28px rgba(16, 24, 40, 0.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
