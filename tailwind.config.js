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
        black: '#191a20',
        white: '#ffffff',
        jade: {
          DEFAULT: '#00c48c',
          dark: '#009e6d',
        },
        blackflame: {
          DEFAULT: '#22223b',
          light: '#2c2c44',
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        web: {
          primary: '#00c48c', // jade
          secondary: '#22223b', // blackflame
          accent: '#00c48c', // jade
          neutral: '#191a20', // black
          'base-100': '#191a20', // main background
          'base-200': '#22223b', // card background
          'base-300': '#2c2c44', // subtle contrast
          info: '#00c48c',
          success: '#00c48c',
          warning: '#ffd700',
          error: '#e53e3e',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.5rem',
          '--rounded-badge': '1.9rem',
          '--animation-btn': '0.25s',
          '--animation-input': '0.2s',
          '--btn-text-case': 'none',
          '--btn-focus-scale': '0.98',
          '--border-btn': '1px',
          '--tab-border': '1px',
          '--tab-radius': '0.5rem',
        },
      },
    ],
    darkTheme: "web",
    base: true,
    styled: true,
    utils: true,
    logs: false,
    rtl: false,
    prefix: "",
  },
}; 