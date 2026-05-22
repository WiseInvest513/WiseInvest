import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FACC15",
          foreground: "#000000",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-nunito)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      animation: {
        'spring': 'spring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-slow': 'spring 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-fast': 'spring 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'float-attention': 'float-attention 2.4s ease-in-out 0.3s 3',
      },
      keyframes: {
        spring: {
          '0%': { transform: 'scale(0.8) translateY(20px)', opacity: '0' },
          '50%': { transform: 'scale(1.05) translateY(-5px)' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float-attention': {
          '0%':   { transform: 'translateY(0px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
          '25%':  { transform: 'translateY(-10px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.15)' },
          '50%':  { transform: 'translateY(0px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
          '75%':  { transform: 'translateY(-6px)', boxShadow: '0 12px 16px -4px rgb(0 0 0 / 0.12)' },
          '100%': { transform: 'translateY(0px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;

