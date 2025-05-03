/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./entrypoints/**/*.{js,jsx,ts,tsx,html,css}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          "900": "#7b4a1e",
          "800": "#9a5d26",
          "700": "#b8702f",
          "600": "#d68338",
          "500": "#f49541",
          "400": "#f6a752",
          "300": "#f8b963",
          "200": "#fbcb74",
          "100": "#fdde85",
          "50": "#ffe096"
        }
      }
    }
  },
  plugins: [],
}