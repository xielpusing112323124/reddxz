/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'cyber-black': '#050505',
        'cyber-gray': '#121212',
        'cyber-dark': '#0a0a0a',
        'cyber-cyan': '#00f3ff',
        'cyber-cyan-dim': '#00f3ff20',
        'cyber-green': '#00ff9d',
        'cyber-yellow': '#f3ff00',
        'cyber-red': '#ff0055',
      },
      fontFamily: {
        inter: ['var(--font-inter)'],
      },
    },
  },
  plugins: [],
}
