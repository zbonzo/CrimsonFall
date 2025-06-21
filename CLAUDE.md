# CLAUDE.MD - Hex Dungeon Crawler Project

## 🎯 **Project Identity & Vision**

**Project Name**: Crimsonfall (Hex Dungeon Crawler)  
**Developer**: Solo developer with system administration background  
**Core Vision**: A 5-10 minute tactical hex-based dungeon crawler inspired by Gloomhaven's combat depth but eliminating analysis paralysis through streamlined decision-making.

### **Primary Goals (Ranked)**
1. **Learning Project (10/10)**: Master TypeScript, SQL, CI/CD, and explore AI development tools
2. **Friend Gaming Platform (9/10)**: Create engaging multiplayer experiences for busy professional adults
3. **Portfolio Showcase (8/10)**: Demonstrate full-stack technical skills to potential employers
4. **Future Commercial Potential (4/10)**: Long-term monetization possibility

### **Success Metrics**
- **Technical**: Complete MVP with 2-player combat system featuring different classes and abilities
- **Learning**: Gain proficiency in TypeScript, game balance theory, and full-stack architecture
- **Personal**: Maintain consistent engagement without feature boredom
- **Dream Goal**: 100 active players consistently (aspirational)

---

## 🎮 **Game Design Philosophy**

### **Core Design Constraints**
- **Session Length**: 5-10 minutes maximum (busy professionals with valuable time)
- **Decision Paralysis Solution**: Limit abilities to 4-6 options max (2x2 or 2x3 grid)
- **Tone**: Delicious in Dungeon inspired - 75% light-hearted fun, 25% dark/serious moments
- **Accessibility First**: Personal need (visual impairment) drives inclusive design philosophy

### **Combat Simplification Strategy**
**Problem Solved**: Gloomhaven's overwhelming card selection and initiative management
**Solution**: 
- Basic Attack (top-left), Wait (bottom-right) as constants
- 2-4 variable ability slots
- Clear visual hierarchy with name/icon/description per ability
- Eliminate complex initiative and card burning mechanics

### **Thematic Inspirations**
- **Gloomhaven**: Tactical combat depth and class variety
- **Delicious in Dungeon**: Whimsical tone with occasional dark moments
- **WoW Torghast**: Temporary ability acquisition and progression
- **Lethal Company**: Absurd cooperative fun and emergent chaos

---

## 🏗️ **Technical Architecture & Standards**

### **Technology Stack**
```typescript
// Core Technologies
- TypeScript 5.0.2 (primary learning objective)
- Node.js 18+ with Express 4.18.2
- React 18.2.0 with TypeScript
- Socket.IO 4.7.4 (WebSocket communication)
- Jest 29.5.0 (testing framework)
- Vite 5.1.3 (build tool)
```

### **Project Structure**
```
hex-dungeon-crawler/
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Node.js backend (Express + Socket.IO)
├── shared/          # Common types and utilities
└── tests/           # Cross-application testing
```

### **Architecture Principles**
- **Domain-Driven Design**: Business logic separated from infrastructure
- **Event-Driven Architecture**: Loosely coupled systems via events
- **Hexagonal Architecture**: Dependencies point inward, external concerns isolated
- **Test-First Design**: Architecture shaped by testing requirements (90%+ coverage)

### **Performance Targets**
- **Action Response**: <100ms from click to visual feedback
- **Turn Processing**: <200ms from action to game state update
- **Session Creation**: <2 seconds from request to playable state
- **Uptime**: 99.5% system availability

---

## 📝 **Code Standards & Conventions**

### **Naming Conventions**
```typescript
// ✅ CORRECT - Semantic Function Prefixes
function isPlayerAlive(player: Player): boolean {}           // State checking
function validateUserInput(input: string): ValidationResult {} // Input validation
function getPlayerById(id: string): Player | null {}         // Quick lookups
function searchPlayersInRadius(center: Position): Player[] {} // Complex queries
function calculateDamage(attacker: Player): number {}        // Math operations
function handlePlayerAction(action: PlayerAction): void {}   // Event handlers
function processGameRound(state: GameState): GameResult {}   // Complex processing

// ✅ CORRECT - Case Conventions
const playerHealth = 100;                    // camelCase variables
const MAX_PLAYERS_PER_GAME = 6;             // UPPER_SNAKE_CASE constants
class GameEngine {}                          // PascalCase classes
interface AbilityDefinition {}              // PascalCase interfaces (no "I" prefix)
enum GamePhase { Setup, Playing }           // PascalCase enums
type PlayerAction<TData> = { ... }          // T-prefixed type parameters
```

### **File Organization**
```typescript
// File Naming
gameEngine.ts         // camelCase for regular files
GameBoard.tsx         // PascalCase for React components
gameEngine.test.ts    // match source + .test
game-balance-analysis.ts // hyphen-case for simulations

// Import Organization (enforced by ESLint)
// 1. Node.js built-ins
import { readFile } from 'node:fs/promises';
// 2. External packages  
import express from 'express';
import { Server } from 'socket.io';
// 3. Internal packages (@/ alias)
import { GameEngine } from '@/core/GameEngine';
// 4. Relative imports - parent directories
import { Logger } from '../../utils/Logger';
// 5. Relative imports - same directory
import { SocketEventHandler } from './SocketEventHandler';
```

### **TypeScript Requirements**
```typescript
// ✅ REQUIRED - Explicit return types
function calculateDamage(attacker: Player, target: Player): number {
  return attacker.attack - target.defense;
}

// ✅ REQUIRED - Documented interfaces
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

// ✅ REQUIRED - Error handling
function getPlayer(playerId: string): Player {
  const player = this.players.get(playerId);
  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }
  return player;
}

// ❌ FORBIDDEN - Default exports (except config files)
export default MyComponent; // Use: export { MyComponent };

// ❌ FORBIDDEN - any type
function processData(data: any): any {} // Use specific types

// ❌ FORBIDDEN - Magic numbers
if (player.health < 25) {} // Use: const CRITICAL_HEALTH = 25;
```

---

## 🧪 **Testing Strategy & Quality Assurance**

### **Testing Philosophy**
- **Test-First Development**: Red → Green → Refactor for every feature
- **90%+ Coverage**: Enforced by CI/CD pipeline
- **AI Code Validation**: Extensive testing to catch AI-generated edge cases

### **Testing Patterns**
```typescript
// Unit Test Structure
describe('HexCoordinateSystem', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between adjacent hexes', () => {
      const from = createTestHex(0, 0);
      const to = createTestHex(1, 0);
      expect(calculateDistance(from, to)).toBe(1);
    });
    
    it('should handle edge case of same hex', () => {
      const hex = createTestHex(2, -1);
      expect(calculateDistance(hex, hex)).toBe(0);
    });
  });
});

// Test Utilities (available globally)
global.createTestHex = (q, r) => ({ q, r, s: -q - r });
global.expectHexEqual = (actual, expected) => {
  expect(actual.q).toBe(expected.q);
  expect(actual.r).toBe(expected.r);
  expect(actual.s).toBe(expected.s);
};
```

### **Quality Gates**
- **No Code Merge**: Without passing tests and automated checks
- **No Feature Complete**: Without documentation and accessibility audit
- **Coverage Threshold**: 90% branches, functions, lines, statements
- **Performance Tests**: Load testing for multiplayer scenarios

---

## ♿ **Accessibility Architecture**

### **Design Philosophy**
- **Personal Necessity**: Visual impairment drives comprehensive implementation
- **Equal Playing Field**: Different interaction methods, same strategic depth
- **WCAG AA Compliance**: Full adherence to accessibility standards

### **Implementation Patterns**
```typescript
// Accessible Component Base
interface AccessibleProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  focusable?: boolean;
}

// Semantic Game Information
const AccessibleAbilityCard = ({ ability, onSelect, disabled }: Props) => (
  <button
    aria-label={`Use ${ability.name}. ${ability.description}. Damage: ${ability.damage}.`}
    disabled={disabled}
    onClick={() => onSelect(ability)}
  >
    <span className="ability-name">{ability.name}</span>
    <span aria-hidden="true">⚔️ {ability.damage}</span>
    <span className="sr-only">
      {disabled ? 'Currently unavailable.' : 'Press Enter to select.'}
    </span>
  </button>
);
```

### **Theme System**
```css
:root {
  /* Semantic game colors */
  --color-health: #38a169;
  --color-damage: #e53e3e;
  --color-mana: #3182ce;
}

/* Colorblind-friendly theme */
[data-theme="colorblind"] {
  --color-success: #0066cc;
  --color-error: #cc0000;
}

/* High contrast support */
@media (prefers-contrast: high) {
  :root {
    --border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🔄 **Development Workflow & Tools**

### **AI-Assisted Development**
- **Primary Tools**: Claude, ChatGPT, Cursor, Gemini
- **Code Generation**: All AI code must include comprehensive tests
- **Quality Control**: Extensive testing compensates for AI reliability concerns
- **Learning Integration**: Each feature connects to TypeScript/architecture mastery

### **Development Environment**
```json
// Workspace Scripts
{
  "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
  "test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest",
  "test:coverage": "jest --coverage",
  "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
  "format": "prettier --write .",
  "check": "npm run type-check && npm run lint && npm run format:check && npm run test:ci"
}
```

### **Quality Automation**
- **ESLint**: Enforces naming conventions, import organization, TypeScript standards
- **Prettier**: Code formatting (single quotes, 100-char lines, trailing commas)
- **Husky**: Pre-commit hooks for linting and testing
- **Jest**: 90%+ coverage requirements with performance testing

### **Git Workflow**
```bash
# Pre-commit (automated)
- Run lint-staged for changed files
- Execute tests for related code
- Type checking validation

# Pre-push (automated)  
- Full test suite execution
- Complete linting validation
- Format checking
```

---

## 🎯 **AI Collaboration Guidelines**

### **Problem-Solving Approach**
1. **First Move**: Build prototypes and iterate quickly
2. **Second Move**: Ask for specific technical guidance on roadblocks
3. **Architecture**: Periodic reviews for scalability and maintainability
4. **Learning**: Connect each implementation to broader TypeScript/game design concepts

### **Code Generation Requirements**
```typescript
// ✅ All generated code must include:
- Explicit TypeScript return types
- Comprehensive error handling  
- Complete test coverage
- JSDoc documentation
- Accessibility considerations
- Performance implications

// ✅ Follow established patterns:
- Semantic naming conventions
- Modular architecture design
- Event-driven communication
- Hex system integration
```

### **Feature Development Process**
1. **Design**: Discuss architecture and approach
2. **Prototype**: Generate working implementation with tests
3. **Review**: Architectural soundness and learning opportunities
4. **Iterate**: Refine based on feedback and testing
5. **Document**: Update relevant documentation

### **Areas Requiring Special Attention**
- **Procedural Generation** (4/4 anxiety): Algorithm design, testing strategies
- **Game Balance** (3/4 anxiety): Mathematical models, fairness metrics
- **UI/UX Complexity** (2/4 anxiety): Component architecture, accessibility
- **Scope Management**: Help maintain focus on core features vs. exciting tangents

---

## 🚀 **Current Foundation & Next Steps**

### **Completed Systems**
- ✅ **Hex Coordinate System**: 190 tests, full coverage, performance optimized
- ✅ **Project Architecture**: Modular design with clean separation
- ✅ **Development Tooling**: TypeScript, testing, linting, formatting
- ✅ **Quality Standards**: Automated enforcement and CI/CD ready

### **Immediate Development Priorities**
1. **Entity System**: Player and Monster classes extending hex system
2. **Combat Framework**: Turn-based resolution with ability execution
3. **UI Foundation**: React components for hex grid visualization  
4. **WebSocket Integration**: Real-time multiplayer communication

### **Learning Integration Goals**
- **TypeScript Mastery**: Advanced patterns, type safety, generic design
- **Game Theory**: Balance algorithms, engagement mechanics, fairness testing
- **Architecture Evolution**: Scalable patterns, performance optimization
- **Accessibility Innovation**: Inclusive design technical implementation

---

## 💡 **Context for Optimal Collaboration**

### **Developer Background**
- **Expertise**: System administration, automation scripting (PowerShell/Python)
- **Learning Curve**: High technical aptitude, specific game development knowledge gaps
- **Weakness**: Project management (scope control, timeline adherence, feature prioritization)
- **Strength**: Modern tech awareness, testing discipline, accessibility focus

### **Time & Schedule**
- **Availability**: 2-hour daily work blocks + evening sessions
- **Timeline**: Accelerated 9-month MVP with AI assistance
- **Sustainability**: Need continuous novel challenges to prevent boredom/abandonment

### **Quality Expectations**
- **Code Standards**: Strict TypeScript, comprehensive testing, accessibility-first
- **Architecture**: Clean separation, event-driven, domain-focused design
- **Performance**: Sub-100ms responses, mobile-responsive, optimized loading
- **Documentation**: Complete API coverage, architectural decision records

---

*This document serves as the definitive guide for AI collaboration on the Hex Dungeon Crawler project. All code generation, architectural decisions, and feature development should align with these standards and goals.*