/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Trafiqo brand palette — aligned to the official logo (blue / green / yellow / red).
        // Blue is primary; green, amber (yellow) and red are the logo accents.
        brand: {
          50: '#EFF5FE',
          100: '#D9E7FC',
          200: '#AECCF8',
          300: '#7DAEF3',
          400: '#4B90EE',
          500: '#1B72E8', // Blue — primary
          600: '#1660C4',
          700: '#124C9B',
          800: '#0E3A75',
          900: '#0A2A55',
        },
        green: {
          50: '#EBF8EE',
          100: '#D2F0D9',
          200: '#A6E0B3',
          300: '#74CE89',
          400: '#46BC62',
          500: '#2DA84A', // Green — accent
          600: '#248B3D',
          700: '#1B6B2F',
          800: '#134B21',
          900: '#0B2E14',
        },
        amber: {
          50: '#FFF9E9',
          100: '#FEF1CE',
          200: '#FDE49C',
          300: '#FCD566',
          400: '#FBC62F',
          500: '#F8B500', // Yellow — accent
          600: '#D29800',
          700: '#A37600',
          800: '#745300',
          900: '#463200',
        },
        red: {
          50: '#FDEDEC',
          100: '#FBD9D6',
          200: '#F8BAB5',
          300: '#F39189',
          400: '#EF6A5E',
          500: '#EA4335', // Red — accent / signature dot
          600: '#C9342A',
          700: '#9F2820',
          800: '#741C17',
          900: '#4A110E',
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
