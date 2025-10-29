// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brittany Chiang–style palette
        navy: {
          900: "#0A192F", // background
          800: "#112240",
          700: "#1D2D50",
        },
        teal: {
          500: "#64FFDA", // primary accent
        },
        ink: {
          // text colors
          heading: "#E6F1FF",
          primary: "#CCD6F6",
          secondary: "#8892B0",
        },

        // semantic (handy aliases)
        background: "#0A192F",
        foreground: "#CCD6F6",
        muted: "#8892B0",
        accent: "#64FFDA",
        card: "#0A192F",
        border: "#233554",
      },
      boxShadow: {
        accent: "0 0 0 2px #64FFDA33", // subtle glow
      },
      ringColor: {
        accent: "#64FFDA",
      },
    },
  },
  plugins: [],
};
