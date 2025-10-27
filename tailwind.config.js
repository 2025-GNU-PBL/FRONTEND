/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        allimjang: ["'Hakgyoansim Allimjang OTF'", "sans-serif"],
        pretendard: ["'Pretendard'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
