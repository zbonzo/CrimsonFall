# Crimsonfall
### A Fast-Paced Tactical Hex Dungeon Crawler

> **5-10 minute tactical sessions for busy professionals**  
> Strategic depth without analysis paralysis

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/Coverage-90%25+-success.svg)](https://github.com/zbonzo/crimsonfall)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 **Vision & Goals**

**Crimsonfall** is a hex-based tactical dungeon crawler designed to deliver Gloomhaven's strategic combat depth in focused 5-10 minute sessions. Built with accessibility-first principles and streamlined decision-making to eliminate analysis paralysis.

### **Primary Objectives**
1. **Learning Project (10/10)**: Master TypeScript, full-stack architecture, and modern development practices
2. **Friend Gaming Platform (9/10)**: Create engaging multiplayer experiences for busy adults
3. **Portfolio Showcase (8/10)**: Demonstrate comprehensive technical skills
4. **Accessibility Innovation**: Visual impairment-driven inclusive design

### **Design Philosophy**
- **Session Length**: 5-10 minutes maximum (respect for valuable time)
- **Decision Clarity**: 4-6 ability maximum (eliminate analysis paralysis)
- **Tone**: 75% Delicious in Dungeon whimsy, 25% tactical depth
- **Accessibility**: Equal strategic depth across interaction methods

---

## 🏗️ **Architecture Overview**

### **Technology Stack**

```
Frontend:     React 18 + TypeScript + Vite
Backend:      Node.js + Express + Socket.IO  
Testing:      Jest (90%+ coverage requirement)
Quality:      ESLint + Prettier + Husky
Structure:    Monorepo (client/server/shared)
```

### **Core Principles**
- **Domain-Driven Design**: Business logic separated from infrastructure
- **Event-Driven Architecture**: Loosely coupled system communication
- **Hexagonal Architecture**: Dependencies point inward
- **Test-First Development**: 90%+ coverage with comprehensive testing

### **Project Structure**
```
crimsonfall/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Main application pages
│   │   ├── contexts/    # State management
│   │   ├── hooks/       # Custom React hooks
│   │   └── services/    # API communication
│   └── package.json
│
├── server/              # Node.js backend application  
│   ├── src/
│   │   ├── core/        # Game engine & business logic
│   │   │   ├── entities/    # Game entities (Player, Monster)
│   │   │   ├── systems/     # Game systems (GameLoop, Combat)
│   │   │   └── types/       # TypeScript definitions
│   │   ├── config/      # Game configuration & balance
│   │   ├── controllers/ # Request handlers
│   │   └── utils/       # Utility functions
│   └── package.json
│
├── shared/              # Shared types and utilities
├── tests/               # Cross-application testing
└── package.json         # Workspace configuration
```

---

## 🎮 **Game Design**

### **Combat System**
- **Turn-Based**: Simultaneous action submission with priority resolution
- **Hex Grid**: Tactical positioning with line-of-sight mechanics
- **Ability Limits**: 4-6 abilities max per character (2x2 or 2x3 grid)
- **Status Effects**: Rich buff/debuff system with visual clarity

### **Core Loop**
1. **Setup** (30s): Character selection and positioning
2. **Combat** (4-6 minutes): Turn-based tactical encounters
3. **Resolution** (30s): Victory conditions and progression

### **Player Experience**
- **Visual Hierarchy**: Clear ability presentation with name/icon/description
- **Keyboard Navigation**: Full accessibility for screen readers
- **Theme Support**: Light/dark/colorblind-friendly options
- **Performance**: <100ms action response, <200ms turn processing

---

## 📋 **Current Status**

### **✅ Completed Systems**
- **Hex Coordinate System**: 190 tests, full coverage, performance optimized
- **Project Architecture**: Modular design with clean separation  
- **Entity Framework**: Player/Monster classes with manager pattern
- **Game Loop**: Turn-based processing with action resolution
- **Development Tooling**: TypeScript, testing, linting, formatting
- **Quality Gates**: Automated enforcement and CI/CD ready

### **🚧 In Development**
- **AI Systems**: Monster behavior and targeting
- **Combat Resolution**: Damage calculation and status effects
- **Threat Management**: Dynamic difficulty and engagement
- **WebSocket Integration**: Real-time multiplayer communication

### **📋 Planned Features**
- **UI Components**: React hex grid visualization
- **Character Classes**: Distinct playstyles and abilities
- **Procedural Generation**: Dynamic encounter creation
- **Progressive Web App**: Offline capability and mobile optimization

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- npm 8+

### **Installation**
```bash
# Clone the repository
git clone https://github.com/zbonzo/crimsonfall.git
cd crimsonfall

# Install dependencies
npm install

# Start development servers
npm run dev
```

### **Development Commands**
```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Client only (React + Vite)
npm run dev:server       # Server only (Node.js + Express)

# Testing
npm run test             # Run all tests
npm run test:coverage    # Run with coverage report
npm run test:watch       # Watch mode for development

# Code Quality
npm run lint             # Check code style
npm run format           # Format code
npm run type-check       # TypeScript validation
npm run check            # Full quality check

# Building
npm run build            # Build for production
```

---

## 🧪 **Testing Strategy**

### **Coverage Requirements**
- **90%+ coverage** across branches, functions, lines, and statements
- **Test-first development** for all new features
- **AI code validation** with comprehensive test suites

### **Testing Approach**
```javascript
// Unit Tests - Core business logic
describe('HexCoordinateSystem', () => {
  it('should calculate distance between adjacent hexes', () => {
    const from = createTestHex(0, 0);
    const to = createTestHex(1, 0);
    expect(calculateDistance(from, to)).toBe(1);
  });
});

// Integration Tests - System interactions
describe('GameLoop Integration', () => {
  it('should process complete combat round', async () => {
    const gameLoop = createTestGameLoop();
    const result = await gameLoop.processRound(gameState);
    expect(result.actionResults).toBeDefined();
  });
});
```

---

## ♿ **Accessibility Features**

### **Design Priorities**
- **Personal Necessity**: Visual impairment drives comprehensive implementation
- **WCAG AA Compliance**: Full adherence to accessibility standards
- **Equal Playing Field**: Different interaction methods, same strategic options

### **Implementation**
```typescript
// Accessible Component Example
const AccessibleAbilityCard = ({ ability, onSelect, disabled }) => (
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
- **High Contrast**: Automatic detection and enhanced visibility
- **Colorblind Support**: Deuteranopia/protanopia friendly palettes
- **Reduced Motion**: Respect for motion sensitivity preferences
- **Keyboard Navigation**: Full game playability without mouse

---

## 📝 **Code Standards**

### **Naming Conventions**
```typescript
// Variables & Functions - camelCase
const playerHealth = 100;
function calculateDamage(attacker: Player): number {}

// Classes & Interfaces - PascalCase  
class GameEngine {}
interface AbilityDefinition {}

// Constants - UPPER_SNAKE_CASE
const MAX_PLAYERS_PER_GAME = 6;

// Type Parameters - T-prefixed
function processEvent<TEvent>(event: TEvent): void {}
```

### **Quality Requirements**
- **Explicit Return Types**: All functions must specify return types
- **No `any` Types**: Strict TypeScript with specific typing
- **Named Exports**: Prefer named exports over default exports
- **Error Handling**: Comprehensive error cases with meaningful messages
- **Documentation**: JSDoc comments for all public interfaces

### **Automated Enforcement**
- **ESLint**: Naming conventions, import organization, TypeScript standards
- **Prettier**: Code formatting (single quotes, 100-char lines, trailing commas)
- **Husky**: Pre-commit hooks for linting and testing
- **Jest**: Coverage thresholds with performance testing

---

## 🤝 **Contributing**

### **Development Workflow**
1. **Feature Planning**: Use issue templates for feature requests
2. **Branch Strategy**: Feature branches from `main`
3. **Code Quality**: All checks must pass (lint, test, format)
4. **Pull Requests**: Comprehensive description with testing evidence

### **Quality Gates**
- ✅ All tests passing (90%+ coverage)
- ✅ TypeScript compilation without errors
- ✅ ESLint validation passing
- ✅ Prettier formatting applied
- ✅ No accessibility regressions

---

## 📊 **Performance Targets**

- **Action Response**: <100ms from click to visual feedback
- **Turn Processing**: <200ms from action to game state update  
- **Session Creation**: <2 seconds from request to playable state
- **Uptime**: 99.5% system availability
- **Mobile Performance**: 60fps on mid-range devices

---

## 🎯 **Roadmap**

### **Phase 1: Core Foundation** (Current)
- ✅ Hex coordinate system and pathfinding
- ✅ Entity management and game loop
- 🚧 Combat resolution and AI behaviors
- 📋 WebSocket multiplayer implementation

### **Phase 2: User Experience**
- 📋 React components and game interface
- 📋 Accessibility testing and optimization
- 📋 Progressive Web App features
- 📋 Performance optimization

### **Phase 3: Game Content**
- 📋 Character classes and abilities
- 📋 Procedural dungeon generation
- 📋 Balance testing and refinement
- 📋 Achievement and progression systems

### **Phase 4: Polish & Launch**
- 📋 User testing and feedback integration
- 📋 Production deployment pipeline
- 📋 Analytics and monitoring
- 📋 Community features and social sharing

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Gloomhaven**: Inspiration for tactical combat depth
- **Delicious in Dungeon**: Whimsical tone and character dynamics
- **Accessibility Community**: Guidelines and best practices for inclusive design
- **TypeScript Community**: Tools and patterns for type-safe development

---

**Built with ❤️ for accessible gaming and modern web development**

*Crimsonfall - Where strategy meets accessibility in fast-paced tactical combat*