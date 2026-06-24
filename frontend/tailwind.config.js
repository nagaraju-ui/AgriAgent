/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#166534",
        secondary: "#22C55E",
        accent: "#84CC16",
        base: "#F8FAF8",
        ink: "#1F2937",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      borderRadius: { "4xl": "1.75rem", "5xl": "2.25rem" },
      boxShadow: {
        soft: "0 12px 32px -12px rgba(22,101,52,0.22)",
        card: "0 8px 28px -10px rgba(16,24,40,0.10)",
        glow: "0 10px 40px -8px rgba(34,197,94,0.45)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: { float: "float 5s ease-in-out infinite" },
    },
  },
  plugins: [],
};
