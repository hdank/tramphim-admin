/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro"', "Roboto", '"Noto Sans"', "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        quicksand: ["Quicksand", "sans-serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        rajdhani: ["Rajdhani", "sans-serif"],
      },
    },
  },
  plugins: [],
};
