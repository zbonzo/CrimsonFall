module.exports = {
  useTabs: false,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  quoteProps: "as-needed",
  trailingComma: "es5",
  printWidth: 100,
  endOfLine: "lf",
  bracketSpacing: true,
  bracketSameLine: false,
  jsxSingleQuote: true,
  arrowParens: "avoid",
  overrides: [
    {
      files: "*.json",
      options: {
        tabWidth: 2,
        printWidth: 80
      }
    },
    {
      files: "*.md",
      options: {
        printWidth: 80,
        proseWrap: "always",
        tabWidth: 2
      }
    },
    {
      files: "**/simulations/**/*.js",
      options: {
        printWidth: 120
      }
    }
  ]
};
