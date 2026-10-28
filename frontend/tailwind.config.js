/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#08432a',
          darkHover: '#053320',
          emerald: '#07643b',
          emeraldLight: '#057a4c',
          mintBg: '#f3fbf6',
          blob: '#c8eedb',
          badgeCircle: '#c8eedb',
          subtext: '#4a5b52',
          heading: '#121a16',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
