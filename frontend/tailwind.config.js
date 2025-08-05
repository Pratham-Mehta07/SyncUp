/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "radial-gradient-green-5pc":
          "radial-gradient(circle, rgba(34, 197, 94, 0.05) 0%, transparent 60%)",
        "radial-gradient-green-3pc":
          "radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%)",
        "grid-pattern":
          "linear-gradient(rgba(34, 197, 94, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.02) 1px, transparent 1px)",
      },
      backgroundSize: {
        "50px": "50px 50px",
      },
      keyframes: {
        slowFloat: {
          "0%, 100%": {
            transform: "translateY(0px) translateX(0px) scale(1)",
            opacity: "0.7",
          },
          "50%": {
            transform: "translateY(-15px) translateX(10px) scale(1.02)",
            opacity: "1",
          },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "slowFloat-before": "slowFloat 25s ease-in-out infinite",
        "slowFloat-after": "slowFloat 20s ease-in-out infinite reverse",
        "fadeInUp-delay": "fadeInUp 1.2s ease-out 0.4s both",
        slideInRight: "slideInRight 0.8s ease-out",
      },
      colors: {
        // Define your custom gradient stops if you want more specific names
        "gradient-start": "#0a0a0a",
        "gradient-middle-1": "#0d2818",
        "gradient-middle-2": "#1a332a",
        "gradient-end": "#0a0a0a",
      },
    },
  },
  plugins: [],
};
