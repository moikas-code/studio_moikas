// Strict lint-staged configuration with TypeScript checking
module.exports = {
  // TypeScript and JavaScript files
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 0"],

  // JSON, Markdown, and other files
  "*.{json,md,mdx,css,scss,yaml,yml}": ["prettier --write"],

  // Check TypeScript compilation for staged files
  "*.{ts,tsx}": () => "tsc --noEmit",
};
