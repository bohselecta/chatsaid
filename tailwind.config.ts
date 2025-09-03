import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      colors: {
        csbg: '#0b0b0d',
        csfg: '#f5f7fb',
        csaccent: '#d11a2a', // cherry
        csmuted: '#9aa0a6',
        cscard: '#111214',
        cherry: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        }
      },
      boxShadow: {
        'card': '0 6px 18px rgba(0,0,0,0.5)'
      }
    },
  },
  plugins: [],
}

export default config
