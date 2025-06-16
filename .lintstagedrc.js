module.exports = {
  // TypeScript and JavaScript files
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],

  // JSON, Markdown, and other files
  "*.{json,md,mdx,css,scss,yaml,yml}": ["prettier --write"],

  // Check TypeScript compilation for staged files
  // Note: TypeScript checking is currently disabled due to existing errors
  // Uncomment the line below once all TypeScript errors are fixed
  // "*.{ts,tsx}": () => "tsc --noEmit"
};
