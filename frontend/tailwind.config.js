/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'signal-green': '#10b981',
        'signal-yellow': '#f59e0b',
        'signal-red': '#ef4444',
      },
    },
  },
  plugins: [],
}
