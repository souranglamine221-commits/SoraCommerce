/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sora: {
          dark: "#0B132B",
          primary: "#1C2541",
          accent: "#FF6B00",
          light: "#F8F9FA",
          white: "#FFFFFF",
        }
      },
    },
  },
  plugins: [],
}