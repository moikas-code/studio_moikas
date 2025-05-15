// eslint-disable-next-line @typescript-eslint/no-var-requires
const daisyui = require('daisyui');

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#18181b',
        purple: {
          DEFAULT: '#7c3aed',
          dark: '#5b21b6',
        },
        green: {
          DEFAULT: '#22c55e',
          dark: '#166534',
        },
        gold: {
          DEFAULT: '#ffd700',
          dark: '#bfa600',
        },
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        alchemist: {
          primary: '#7c3aed', // purple
          secondary: '#ffd700', // gold
          accent: '#22c55e', // green
          neutral: '#18181b', // black
          'base-100': '#18181b',
          info: '#7c3aed',
          success: '#22c55e',
          warning: '#ffd700',
          error: '#b91c1c',
        },
      },
    ],
  },
}; 