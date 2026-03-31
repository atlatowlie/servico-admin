/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1E293B',
        surface2: '#334155',
        dark: '#0F172A',
        accent: '#10B981',
        'accent-hover': '#059669',
      },
    },
  },
  plugins: [],
}
