# Hex Dungeon Crawler - Code Standards & Configuration

## 🎯 **Code Standards Philosophy**

**Core Principle**: Every piece of code should be instantly readable by any developer (including future you) without context. Consistency eliminates cognitive load and enables faster development.

**Enforcement Strategy**: All standards are enforced by automated tools. No manual checking required.

---

## 📝 **Naming Conventions**

### **Variables & Functions**
```javascript
// ✅ CORRECT - camelCase
const playerHealth = 100;
const maxDamagePerRound = 50;
const isGameActive = true;

function calculateDamage(attacker, target) {}
function validatePlayerAction(action) {}
function generateDungeonLayout() {}

// ❌ INCORRECT
const player_health = 100;        // snake_case
const PlayerHealth = 100;         // PascalCase
const playerhp = 100;            // unclear abbreviation
```

### **Classes, Interfaces & Types**
```javascript
// ✅ CORRECT - PascalCase
class GameEngine {}
class PlayerCharacter {}
interface AbilityDefinition {}
type PlayerAction = 'attack' | 'defend' | 'heal';
enum GamePhase { Setup, Playing, Completed }

// ❌ INCORRECT
class gameEngine {}              // camelCase
interface IAbilityDefinition {}  // "I" prefix
type playerAction = string;      // camelCase
```

### **File Naming**
```javascript
// ✅ CORRECT
// Regular code files - camelCase
gameEngine.js
playerManager.js
hexMath.js
abilityProcessor.js

// Component files - PascalCase
GameBoard.jsx
PlayerCard.jsx
AbilityPanel.jsx
HexTile.jsx

// Test files - match source + .test
gameEngine.test.js
PlayerCard.test.jsx
hexMath.test.js

// Simulation files - hyphen-case
game-balance-analysis.js
player-behavior-simulation.js
performance-stress-test.js
```

### **Constants & Enums**
```javascript
// ✅ CORRECT - UPPER_SNAKE_CASE for module-level constants
const MAX_PLAYERS_PER_GAME = 6;
const DEFAULT_PLAYER_HEALTH = 100;
const WEBSOCKET_RECONNECT_DELAY = 5000;

// ✅ CORRECT - PascalCase for enum members
enum AbilityType {
  Attack,
  Defense,
  Healing,
  Utility
}

enum GamePhase {
  WaitingForPlayers,
  CharacterSelection,
  InProgress,
  GameComplete
}
```

### **Type Parameters**
```javascript
// ✅ CORRECT - Prefix with T
function processGameEvent<TEvent>(event: TEvent): void {}
interface Repository<TEntity, TId> {}
class EventHandler<TEventData> {}

// Multiple type parameters
function mapPlayerData<TSource, TTarget>(
  source: TSource, 
  mapper: (s: TSource) => TTarget
): TTarget {}
```

---

## 🔧 **ESLint Configuration**

### **.eslintrc.js**
```javascript
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
        format: ['camelCase']
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
```

---

## 🎨 **Prettier Configuration**

### **.prettierrc.js**
```javascript
module.exports = {
  // === BASIC FORMATTING ===
  useTabs: false,                    // Spaces, not tabs
  tabWidth: 2,                       // 2 spaces per indentation level
  semi: true,                        // Always include semicolons
  singleQuote: true,                 // Single quotes for strings
  quoteProps: 'as-needed',           // Only quote object props when needed
  trailingComma: 'es5',              // Trailing commas where valid in ES5
  
  // === LINE FORMATTING ===
  printWidth: 100,                   // Wrap lines at 100 characters
  endOfLine: 'lf',                   // Unix line endings
  
  // === OBJECT FORMATTING ===
  bracketSpacing: true,              // Spaces inside object brackets
  bracketSameLine: false,            // Put > on new line in JSX
  
  // === JSX FORMATTING ===
  jsxSingleQuote: true,              // Single quotes in JSX
  
  // === ARROW FUNCTIONS ===
  arrowParens: 'avoid',              // Omit parens when possible
  
  // === OVERRIDES FOR SPECIFIC FILES ===
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2,
        printWidth: 80
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2
      }
    },
    {
      files: '**/simulations/**/*.js',
      options: {
        printWidth: 120  // Longer lines for simulation files
      }
    }
  ]
};
```

---

## 📐 **TypeScript Configuration**

### **tsconfig.json** (Root)
```json
{
  "compilerOptions": {
    // === COMPILER OPTIONS ===
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "node",
    "allowJs": false,
    "checkJs": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": false,
    "importHelpers": true,
    
    // === MODULE RESOLUTION ===
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/client/*": ["client/src/*"],
      "@/server/*": ["server/src/*"],
      "@/shared/*": ["shared/src/*"],
      "@/tests/*": ["tests/*"]
    },
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    
    // === TYPE CHECKING (STRICT MODE) ===
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    
    // === ADDITIONAL CHECKS ===
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // === EMIT ===
    "noEmitOnError": true,
    "preserveConstEnums": true,
    
    // === EXPERIMENTAL ===
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    
    // === ADVANCED ===
    "skipLibCheck": true,
    "incremental": true
  },
  "include": [
    "src/**/*",
    "client/src/**/*",
    "server/src/**/*",
    "shared/src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/simulations/**/*"
  ]
}
```

---

## 🧪 **Testing Configuration**

### **jest.config.js**
```javascript
module.exports = {
  // === TEST ENVIRONMENT ===
  preset: 'ts-jest',
  testEnvironment: 'jsdom',  // For React components
  
  // === TEST FILE PATTERNS ===
  testMatch: [
    '**/tests/**/*.test.{js,jsx,ts,tsx}',
    '!**/tests/**/simulations/**/*'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/simulations/'
  ],
  
  // === MODULE RESOLUTION ===
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/client/(.*)$': '<rootDir>/client/src/$1',
    '^@/server/(.*)$': '<rootDir>/server/src/$1',
    '^@/shared/(.*)$': '<rootDir>/shared/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // === COVERAGE ===
  collectCoverage: true,
  coverageDirectory: 'tests/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'client/src/**/*.{js,jsx,ts,tsx}',
    'server/src/**/*.{js,jsx,ts,tsx}',
    'shared/src/**/*.{js,jsx,ts,tsx}',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/tests/**/*',
    '!**/simulations/**/*',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // === SETUP ===
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // === PERFORMANCE ===
  testTimeout: 10000,
  maxWorkers: '50%',
  
  // === MISC ===
  clearMocks: true,
  restoreMocks: true,
  verbose: true
};
```

---

## 📁 **File Organization Patterns**

### **Import Organization Example**
```javascript
// ✅ CORRECT - Grouped and alphabetized
// Node.js built-ins
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// External packages
import express from 'express';
import { Server } from 'socket.io';
import { z } from 'zod';

// Internal packages (with @/ alias)
import { GameEngine } from '@/core/GameEngine';
import { PlayerManager } from '@/managers/PlayerManager';
import { ValidationService } from '@/services/ValidationService';

// Relative imports - parent directories
import { DatabaseConnection } from '../../database/DatabaseConnection';
import { Logger } from '../../utils/Logger';

// Relative imports - same directory
import { SocketEventHandler } from './SocketEventHandler';
import { WebSocketServer } from './WebSocketServer';

// ❌ INCORRECT - Mixed grouping
import express from 'express';
import { GameEngine } from '@/core/GameEngine';
import { readFile } from 'node:fs/promises';
import { Logger } from '../../utils/Logger';
```

### **Function Organization Example**
```javascript
// ✅ CORRECT - Alphabetical order
class PlayerManager {
  private players: Map<string, Player> = new Map();

  public addPlayer(player: Player): void {}
  
  public getPlayer(playerId: string): Player | null {}
  
  public getPlayerCount(): number {}
  
  public removePlayer(playerId: string): boolean {}
  
  public updatePlayerHealth(playerId: string, health: number): void {}
  
  private validatePlayer(player: Player): boolean {}
}

// ❌ INCORRECT - Random order
class PlayerManager {
  public updatePlayerHealth(playerId: string, health: number): void {}
  
  private validatePlayer(player: Player): boolean {}
  
  public addPlayer(player: Player): void {}
  
  public getPlayer(playerId: string): Player | null {}
}
```

### **Object Key Organization**
```javascript
// ✅ CORRECT - Alphabetical keys
const gameConfig = {
  defaultPlayerHealth: 100,
  maxPlayersPerGame: 6,
  maxRoundsPerGame: 20,
  turnTimeoutSeconds: 30
};

const abilityDefinition = {
  cooldownTurns: 3,
  damage: 25,
  description: 'A powerful fire attack',
  name: 'Fireball',
  range: 4,
  type: AbilityType.Attack
};

// ❌ INCORRECT - Random order
const gameConfig = {
  maxPlayersPerGame: 6,
  defaultPlayerHealth: 100,
  turnTimeoutSeconds: 30,
  maxRoundsPerGame: 20
};
```

---

## 🔗 **Package.json Scripts**

### **package.json** (Root)
```json
{
  "scripts": {
    "// === DEVELOPMENT ===": "",
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    
    "// === BUILDING ===": "",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    
    "// === TESTING ===": "",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false --maxWorkers=2",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    
    "// === CODE QUALITY ===": "",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    
    "// === COMBINED CHECKS ===": "",
    "check": "npm run type-check && npm run lint && npm run format:check && npm run test:ci",
    "fix": "npm run lint:fix && npm run format",
    
    "// === SIMULATION ===": "",
    "simulate": "node simulations/game-balance-analysis.js",
    "simulate:performance": "node simulations/performance-stress-test.js",
    
    "// === UTILITIES ===": "",
    "clean": "rimraf dist coverage client/dist server/dist",
    "clean:install": "npm run clean && rm -rf node_modules */node_modules && npm install",
    "prepare": "husky install",
    "validate": "npm run check"
  }
}
```

---

## 🪝 **Git Hooks (Husky)**

### **.husky/pre-commit**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for staged files
npx lint-staged

# Run tests related to staged files
npm run test:ci -- --findRelatedTests --passWithNoTests
```

### **.husky/pre-push**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Full validation before push
npm run check
```

### **lint-staged Configuration**
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css,scss}": [
      "prettier --write"
    ],
    "*.{js,jsx,ts,tsx}": [
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

---

## 🚨 **Error Prevention Rules**

### **Forbidden Patterns**
```javascript
// ❌ NEVER USE - Default exports (except config files)
export default MyComponent;

// ✅ ALWAYS USE - Named exports
export { MyComponent };

// ❌ NEVER USE - Magic numbers
if (player.health < 25) {}

// ✅ ALWAYS USE - Named constants
const CRITICAL_HEALTH_THRESHOLD = 25;
if (player.health < CRITICAL_HEALTH_THRESHOLD) {}

// ❌ NEVER USE - Mutable exports
export let gameState = {};

// ✅ ALWAYS USE - Immutable exports
export const createGameState = () => ({});

// ❌ NEVER USE - any type
function processData(data: any): any {}

// ✅ ALWAYS USE - Specific types
function processData<T>(data: T): ProcessedData<T> {}
```

### **Mandatory Patterns**
```javascript
// ✅ REQUIRED - All functions must have return types
function calculateDamage(attacker: Player, target: Player): number {
  return attacker.attack - target.defense;
}

// ✅ REQUIRED - All interfaces must be documented
/**
 * Represents a player's ability in the game
 */
interface AbilityDefinition {
  /** Unique identifier for the ability */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Damage dealt by this ability */
  readonly damage: number;
}

// ✅ REQUIRED - All error cases must be handled
function getPlayer(playerId: string): Player {
  const player = this.players.get(playerId);
  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }
  return player;
}
```

This configuration ensures consistent, high-quality code while automating all formatting and basic quality checks. The tools will catch issues before they reach the repository, maintaining the codebase quality as you develop solo.