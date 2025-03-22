/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        card: "#1A1A1A",
        text: "#E0E0E0",
        aqua: "#00FFD1",
        pink: "#FF007F",
        yellow: "#FFDD44",
      }
    },
  },
  plugins: [],
} 