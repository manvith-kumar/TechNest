/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#101828', 800: '#1B2638', 700: '#263249' },
        slate2: '#344B68',
        brand: { DEFAULT: '#356DF3', dark: '#2756CC', soft: '#EAF0FE' },
        violet2: { DEFAULT: '#7866E8', soft: '#EFEDFD' },
        surface: '#F7F9FC',
        ink: '#172033',
        muted: '#667085',
        line: '#E6EAF0',
        success: { DEFAULT: '#12A878', soft: '#E3F6EF' },
        warning: { DEFAULT: '#F59E0B', soft: '#FEF3DC' },
        danger: { DEFAULT: '#E5484D', soft: '#FDECEC' },
      },
      fontFamily: {
        heading: ['Manrope', 'system-ui', 'sans-serif'],       // headings, section titles
        body: ['Inter', 'system-ui', 'sans-serif'],            // body copy, interface
        nav: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'], // navigation, admin section titles
        brand: ['"Space Grotesk"', 'system-ui', 'sans-serif'], // wordmark, prices, promo headlines
        label: ['"DM Sans"', 'system-ui', 'sans-serif'],       // labels, captions, badges
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)',
        lift: '0 12px 28px -8px rgba(16,24,40,.16)',
      },
      borderRadius: { xl2: '14px' },
    },
  },
  plugins: [],
};
