module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  extends: [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./client/tsconfig.json", "./server/tsconfig.json"],
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    "@typescript-eslint",
    "react",
    "react-hooks", 
    "jsx-a11y",
    "import",
    "simple-import-sort",
    "unused-imports"
  ],
  rules: {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "variableLike",
        format: ["camelCase"],
        leadingUnderscore: "allow",
        trailingUnderscore: "forbid"
      },
      {
        selector: "function",
        format: ["camelCase"]
      },
      {
        selector: "typeLike",
        format: ["PascalCase"]
      },
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: false
        }
      },
      {
        selector: "enum",
        format: ["PascalCase"]
      },
      {
        selector: "enumMember", 
        format: ["PascalCase"]
      },
      {
        selector: "typeParameter",
        format: ["PascalCase"],
        prefix: ["T"]
      }
    ],
    "simple-import-sort/imports": [
      "error",
      {
        groups: [
          ["^node:"],
          ["^@?\\w"],
          ["^@/"],
          ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
          ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"]
        ]
      }
    ],
    "simple-import-sort/exports": "error",
    "import/first": "error",
    "import/newline-after-import": "error", 
    "import/no-duplicates": "error",
    "import/no-default-export": "error",
    "unused-imports/no-unused-imports": "error",
    "sort-keys": ["error", "asc", { caseSensitive: true, natural: true }],
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "prefer-const": "error",
    "no-var": "error",
    "quotes": ["error", "single", { avoidEscape: true }],
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  overrides: [
    {
      files: ["**/*.test.js", "**/*.test.jsx", "**/*.test.ts", "**/*.test.tsx"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "sort-keys": "off"
      }
    },
    {
      files: ["**/simulations/**/*.js", "**/simulations/**/*.ts"],
      rules: {
        "@typescript-eslint/naming-convention": [
          "error",
          {
            selector: "default",
            format: ["kebab-case", "camelCase"]
          }
        ]
      }
    },
    {
      files: ["*.config.js", "*.config.ts", ".eslintrc.js", "vite.config.ts"],
      rules: {
        "import/no-default-export": "off"
      }
    }
  ],
  settings: {
    react: {
      version: "detect"
    }
  }
};
