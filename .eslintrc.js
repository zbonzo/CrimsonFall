module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'  // Must be last to override other configs
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './client/tsconfig.json', './server/tsconfig.json'],
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'simple-import-sort',
    'unused-imports'
  ],
  rules: {
    // === NAMING CONVENTIONS ===
    '@typescript-eslint/naming-convention': [
      'error',
      // Variables and functions - camelCase
      {
        selector: 'variableLike',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'forbid'
      },
      {
        selector: 'function',
        format: ['camelCase'],
        custom: {
          regex: '^(get|set|is|has|can|add|remove|create|destroy|delete|find|search|calculate|compute|handle|process|on|ensure|validate|load|save|fetch|upload|init|reset|clear|update)[A-Z]',
          match: true
        }
      },
      // Classes, interfaces, types, enums - PascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase']
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false
        }
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      },
      {
        selector: 'enumMember',
        format: ['PascalCase']
      },
      // Type parameters - TPrefixed
      {
        selector: 'typeParameter',
        format: ['PascalCase'],
        prefix: ['T']
      },
      // Constants - UPPER_SNAKE_CASE
      {
        selector: 'variable',
        modifiers: ['const', 'global'],
        format: ['UPPER_SNAKE_CASE', 'camelCase'] // Allow both for flexibility
      }
    ],

    // === IMPORT ORGANIZATION ===
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Node.js builtins
          ['^node:'],
          // External packages
          ['^@?\\w'],
          // Internal packages (with @/ alias)
          ['^@/'],
          // Relative imports - parent directories
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Relative imports - same directory
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // Style imports (if any)
          ['^.+\\.s?css$']
        ]
      }
    ],
    'simple-import-sort/exports': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'import/no-default-export': 'error', // Prefer named exports

    // === CODE ORGANIZATION ===
    'unused-imports/no-unused-imports': 'error',
    'sort-keys': ['error', 'asc', { 
      caseSensitive: true, 
      natural: true,
      allowLineSeparatedGroups: true 
    }],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: {
          memberTypes: [
            // Static members first
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            
            // Instance fields
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            
            // Constructor
            'public-constructor',
            'protected-constructor',
            'private-constructor',
            
            // Instance methods
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method'
          ],
          order: 'alphabetically'
        }
      }
    ],

    // === CODE QUALITY ===
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for game development
    'prefer-const': 'error',
    'no-var': 'error',
    
    // === STRING PREFERENCES ===
    'quotes': ['error', 'single', { avoidEscape: true }],
    
    // === REACT SPECIFIC ===
    'react/prop-types': 'off', // Using TypeScript
    'react/react-in-jsx-scope': 'off', // React 17+
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // === ACCESSIBILITY ===
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error'
  },
  overrides: [
    // Test files - relaxed rules
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'sort-keys': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off'
      }
    },
    // Simulation files - hyphen-case naming allowed
    {
      files: ['**/simulations/**/*.js', '**/simulations/**/*.ts'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'default',
            format: ['kebab-case', 'camelCase']
          }
        ]
      }
    },
    // Configuration files
    {
      files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
      rules: {
        'import/no-default-export': 'off' // Config files often need default exports
      }
    }
  ],
  settings: {
    react: {
      version: 'detect'
    }
  }
};