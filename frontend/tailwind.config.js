/** @type {import('tailwindcss').Config} */
module.exports = {
   content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
   ],
   darkMode: "class",
   theme: {
      extend: {
         screens: {
            'xs': '480px',
         },
         backgroundImage: {
            "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
            "gradient-conic":
               "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
         },
         animation: {
            blob: "blob 7s infinite",
            float: "float 6s ease-in-out infinite",
            fadeIn: "fadeIn 0.3s ease-out forwards",
         },
         keyframes: {
            blob: {
               "0%": {
                  transform: "scale(1) translate(0px, 0px)",
               },
               "33%": {
                  transform: "scale(1.1) translate(20px, -30px)",
               },
               "66%": {
                  transform: "scale(0.9) translate(-20px, 30px)",
               },
               "100%": {
                  transform: "scale(1) translate(0px, 0px)",
               },
            },
            float: {
               "0%": {
                  transform: "translateY(0px)",
               },
               "50%": {
                  transform: "translateY(-20px)",
               },
               "100%": {
                  transform: "translateY(0px)",
               },
            },
            fadeIn: {
               "0%": {
                  opacity: 0,
                  transform: "translateY(10px)",
               },
               "100%": {
                  opacity: 1,
                  transform: "translateY(0)",
               },
            },
         },
      },
   },
   plugins: [],
};
