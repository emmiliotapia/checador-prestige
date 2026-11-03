/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        gold: {
          50: 'rgb(var(--gold-50) / <alpha-value>)',
          100: 'rgb(var(--gold-100) / <alpha-value>)',
          200: 'rgb(var(--gold-200) / <alpha-value>)',
          300: 'rgb(var(--gold-300) / <alpha-value>)',
          400: 'rgb(var(--gold-400) / <alpha-value>)',
          500: 'rgb(var(--gold-500) / <alpha-value>)',
          600: 'rgb(var(--gold-600) / <alpha-value>)',
          700: 'rgb(var(--gold-700) / <alpha-value>)',
          800: 'rgb(var(--gold-800) / <alpha-value>)',
          900: 'rgb(var(--gold-900) / <alpha-value>)',
          950: 'rgb(var(--gold-950) / <alpha-value>)',
        },
        obsidian: {
          50: 'rgb(var(--obs-50) / <alpha-value>)',
          100: 'rgb(var(--obs-100) / <alpha-value>)',
          200: 'rgb(var(--obs-200) / <alpha-value>)',
          300: 'rgb(var(--obs-300) / <alpha-value>)',
          400: 'rgb(var(--obs-400) / <alpha-value>)',
          500: 'rgb(var(--obs-500) / <alpha-value>)',
          600: 'rgb(var(--obs-600) / <alpha-value>)',
          700: 'rgb(var(--obs-700) / <alpha-value>)',
          800: 'rgb(var(--obs-800) / <alpha-value>)',
          900: 'rgb(var(--obs-900) / <alpha-value>)',
          950: 'rgb(var(--obs-950) / <alpha-value>)',
        },
      },
      boxShadow: {
        'luxury': '0 4px 24px -4px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'luxury-dark': '0 8px 32px -4px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
