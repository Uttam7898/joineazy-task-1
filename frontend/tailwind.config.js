/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#1c1915",
        paper: "#f4efe6",
        moss: "#2f5d50",
        clay: "#c45c26",
      },
    },
  },
  plugins: [],
};
