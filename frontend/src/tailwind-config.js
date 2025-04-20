/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // IBM Carbon color palette
        'carbon-gray-10': '#f4f4f4',
        'carbon-gray-20': '#e0e0e0',
        'carbon-gray-30': '#c6c6c6',
        'carbon-gray-40': '#a8a8a8',
        'carbon-gray-50': '#8d8d8d',
        'carbon-gray-60': '#6f6f6f',
        'carbon-gray-70': '#525252',
        'carbon-gray-80': '#393939',
        'carbon-gray-90': '#262626',
        'carbon-gray-100': '#161616',
        'carbon-blue-10': '#edf5ff',
        'carbon-blue-20': '#d0e2ff',
        'carbon-blue-30': '#a6c8ff',
        'carbon-blue-40': '#78a9ff',
        'carbon-blue-50': '#4589ff',
        'carbon-blue-60': '#0f62fe',
        'carbon-blue-70': '#0043ce',
        'carbon-blue-80': '#002d9c',
        'carbon-blue-90': '#001d6c',
        'carbon-blue-100': '#001141',
        'carbon-red-60': '#da1e28',
        'carbon-green-60': '#198038',
        'carbon-purple-60': '#8a3ffc',
        'carbon-teal-60': '#009d9a',
        'jamtax-red': '#e74c3c',
        'jamtax-blue': '#2980b9',
      },
      fontFamily: {
        'carbon': ['IBM Plex Sans', 'sans-serif'],
      },
      spacing: {
        // IBM Carbon spacing tokens
        '01': '0.125rem', // 2px
        '02': '0.25rem',  // 4px
        '03': '0.5rem',   // 8px
        '04': '0.75rem',  // 12px
        '05': '1rem',     // 16px
        '06': '1.5rem',   // 24px
        '07': '2rem',     // 32px
        '08': '2.5rem',   // 40px
        '09': '3rem',     // 48px
        '10': '4rem',     // 64px
        '11': '5rem',     // 80px
        '12': '6rem',     // 96px
        '13': '10rem',    // 160px
      },
      borderRadius: {
        'carbon-sm': '0.125rem', // 2px
        'carbon-md': '0.25rem',  // 4px
        'carbon-lg': '0.5rem',   // 8px
      },
      boxShadow: {
        'carbon-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        'carbon-md': '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        'carbon-lg': '0 8px 16px 0 rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
  // Add important to all utilities to make sure they override Carbon styles
  important: true,
}
