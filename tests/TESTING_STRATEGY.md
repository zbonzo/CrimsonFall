# Testing Strategy - Crimsonfall Hex Dungeon Crawler

## 🎯 **Testing Philosophy**

### **Core Principles**
- **Test-First Development**: Red → Green → Refactor for every feature
- **90%+ Coverage**: Enforced by CI/CD pipeline  
- **AI Code Validation**: Extensive testing to catch AI-generated edge cases
- **Clear Test Boundaries**: Distinct unit, integration, and e2e test layers

### **Success Metrics**
- **Unit Test Coverage**: 90%+ branches, functions, lines, statements
- **Integration Test Coverage**: All key workflows tested end-to-end
- **Performance Tests**: <100ms per game round, <50ms for 20 entities
- **Accessibility Tests**: Screen reader compatibility, keyboard navigation

---

## 🧪 **Test Categories & Boundaries**

### **Unit Tests** (`tests/unit/`)
**Definition**: Single class/function in isolation with mocks
**Scope**: Pure functions, individual classes, single responsibility components
**Mock Strategy**: Heavy mocking of all external dependencies

**Examples**:
- `hexCoordinates.test.ts` → Pure mathematical functions
- `EntityStatsManager.test.ts` → Single class with mocked dependencies
- `ThreatCalculator.test.ts` → Utility class with no external state

**Characteristics**:
- Fast execution (< 1ms per test)
- No external dependencies
- Deterministic results
- High volume (hundreds of tests)

### **Integration Tests** (`tests/integration/`)
**Definition**: Multiple components working together with real implementations
**Scope**: Feature workflows, system interactions, cross-component behavior
**Mock Strategy**: Minimal mocking, real implementations where possible

**Examples**:
- `Player.test.ts` → Player + all managers working together
- `combat.test.ts` → Complete combat system workflow
- `GameLoop.test.ts` → Full game flow with real entities

**Characteristics**:
- Moderate execution time (< 100ms per test)
- Real component interactions
- Focused on workflows
- Medium volume (dozens of tests)

### **E2E Tests** (`tests/e2e/`)
**Definition**: Complete user workflows from start to finish
**Scope**: Full game sessions, multiplayer scenarios, client-server communication
**Mock Strategy**: No mocking, real network communication

**Examples**:
- `multiplayer-session.test.ts` → Complete 2v2 game session
- `client-server-integration.test.ts` → WebSocket communication
- `accessibility.test.ts` → Screen reader and keyboard navigation

**Characteristics**:
- Slow execution (seconds per test)
- Real network/IO operations
- End-user perspective
- Low volume (handful of tests)

---

## 🏗️ **Test Structure Organization**

### **Directory Layout**
```
tests/
├── unit/                           # Unit tests (isolated components)
│   ├── entities/                   # Entity class tests
│   │   ├── Player.test.ts         # Player class unit tests
│   │   ├── Monster.test.ts        # Monster class unit tests
│   │   └── behaviors/             # Behavior strategy tests
│   ├── systems/                   # System class tests
│   │   ├── GameLoop.test.ts       # GameLoop unit tests
│   │   ├── ThreatManager.test.ts  # ThreatManager unit tests
│   │   └── ActionProcessor.test.ts # ActionProcessor unit tests
│   ├── managers/                  # Manager class tests
│   │   ├── EntityStatsManager.test.ts
│   │   ├── EntityMovementManager.test.ts
│   │   └── EntityStatusEffectsManager.test.ts
│   └── utils/                     # Utility function tests
│       ├── hex/                   # Hex system tests
│       └── validation/            # Validation utility tests
├── integration/                   # Integration tests (workflows)
│   ├── combat/                    # Combat system integration
│   │   ├── basic-combat.test.ts   # Basic combat workflows
│   │   ├── abilities.test.ts      # Ability system integration
│   │   └── status-effects.test.ts # Status effect workflows
│   ├── gameFlow/                  # Game flow integration
│   │   ├── gameLoop.test.ts       # Complete game loop workflows
│   │   ├── turn-management.test.ts # Turn-based system integration
│   │   └── win-conditions.test.ts # Victory condition workflows
│   └── ai/                        # AI system integration
│       ├── monster-ai.test.ts     # Monster AI decision making
│       ├── threat-system.test.ts  # Threat system workflows
│       └── targeting.test.ts      # Target selection integration
├── e2e/                          # End-to-end tests
│   ├── multiplayer/              # Multiplayer scenarios
│   ├── client-server/            # Client-server communication
│   └── accessibility/            # Accessibility compliance
├── fixtures/                     # Test data and scenarios
│   ├── players.ts                # Player test data
│   ├── monsters.ts               # Monster test data
│   ├── abilities.ts              # Ability test data
│   └── scenarios.ts              # Complete game scenarios
├── mocks/                        # Mock implementations
│   ├── entities.ts               # Entity mocks
│   ├── services.ts               # Service mocks
│   └── managers.ts               # Manager mocks
├── helpers/                      # Test utilities
│   ├── testUtils.ts              # Common test utilities
│   ├── assertions.ts             # Custom Jest matchers
│   └── builders.ts               # Test data builders
├── config/                       # Test configuration
│   ├── jest.config.js            # Jest configuration
│   └── test-env.ts               # Test environment setup
└── TESTING_STRATEGY.md           # This document
```

---

## 🎭 **Mock Strategy & Patterns**

### **Mock Categories**

#### **1. Entity Mocks** (`tests/mocks/entities.ts`)
```typescript
// Player mocks for different scenarios
export const MockPlayer = {
  basic: () => createTestPlayer({ hp: 100, armor: 2 }),
  damaged: () => createTestPlayer({ hp: 30, armor: 2 }),
  dead: () => createTestPlayer({ hp: 0, armor: 2 }),
  poisoned: () => createTestPlayer({ hp: 80, statusEffects: ['poison'] })
};

// Monster mocks for different AI behaviors
export const MockMonster = {
  aggressive: () => createTestMonster({ aiType: 'aggressive' }),
  defensive: () => createTestMonster({ aiType: 'defensive' }),
  tactical: () => createTestMonster({ aiType: 'tactical' })
};
```

#### **2. Service Mocks** (`tests/mocks/services.ts`)
```typescript
// Mock external services and dependencies
export const MockGameStateService = {
  getOccupiedPositions: jest.fn(() => new Set()),
  getObstacles: jest.fn(() => new Set()),
  updateEntityPosition: jest.fn()
};

export const MockThreatService = {
  calculateThreat: jest.fn(() => 10),
  recordThreat: jest.fn(),
  getTopThreats: jest.fn(() => [])
};
```

#### **3. Manager Mocks** (`tests/mocks/managers.ts`)
```typescript
// Mock entity managers for isolation
export const MockStatsManager = {
  takeDamage: jest.fn(() => ({ damageDealt: 10, killed: false })),
  heal: jest.fn(() => ({ amountHealed: 15 })),
  getCurrentHp: jest.fn(() => 100)
};
```

### **Mock Lifecycle Management**
```typescript
// Global mock setup in tests/setup.ts
beforeEach(() => {
  jest.clearAllMocks();
  resetMockStates();
});

afterEach(() => {
  jest.restoreAllMocks();
  validateMockCalls();
});
```

---

## 📊 **Test Fixtures & Data**

### **Player Fixtures** (`tests/fixtures/players.ts`)
```typescript
export const TestPlayers = {
  warrior: createPlayerFixture({
    class: 'fighter',
    abilities: ['power_strike', 'defensive_stance'],
    position: { q: 0, r: 0, s: 0 }
  }),
  
  archer: createPlayerFixture({
    class: 'ranger', 
    abilities: ['shortbow_shot', 'hunter_mark'],
    position: { q: 1, r: 0, s: -1 }
  }),
  
  healer: createPlayerFixture({
    class: 'cleric',
    abilities: ['heal_self', 'bless'],
    position: { q: -1, r: 0, s: 1 }
  })
};
```

### **Monster Fixtures** (`tests/fixtures/monsters.ts`)
```typescript
export const TestMonsters = {
  goblinWarrior: createMonsterFixture({
    type: 'goblin_warrior',
    aiType: 'aggressive',
    position: { q: 3, r: 0, s: -3 }
  }),
  
  goblinArcher: createMonsterFixture({
    type: 'goblin_archer', 
    aiType: 'tactical',
    position: { q: 4, r: -1, s: -3 }
  }),
  
  direWolf: createMonsterFixture({
    type: 'dire_wolf',
    aiType: 'berserker',
    position: { q: 2, r: 2, s: -4 }
  })
};
```

### **Scenario Fixtures** (`tests/fixtures/scenarios.ts`)
```typescript
export const TestScenarios = {
  basic2v2: createScenarioFixture({
    players: [TestPlayers.warrior, TestPlayers.archer],
    monsters: [TestMonsters.goblinWarrior, TestMonsters.goblinArcher],
    obstacles: []
  }),
  
  healingScenario: createScenarioFixture({
    players: [TestPlayers.warrior, TestPlayers.healer],
    monsters: [TestMonsters.direWolf],
    playerConditions: { warrior: { hp: 30 } }  // Warrior starts damaged
  })
};
```

---

## 🔧 **Test Utilities & Helpers**

### **Custom Jest Matchers** (`tests/helpers/assertions.ts`)
```typescript
expect.extend({
  toBeValidHexCoordinate(received) {
    const pass = Math.abs(received.q + received.r + received.s) < Number.EPSILON;
    return {
      pass,
      message: () => pass 
        ? `expected ${JSON.stringify(received)} not to be a valid hex coordinate`
        : `expected ${JSON.stringify(received)} to be a valid hex coordinate (q + r + s = 0)`
    };
  },
  
  toBeInRange(received, min, max) {
    const pass = received >= min && received <= max;
    return {
      pass,
      message: () => `expected ${received} to be between ${min} and ${max}`
    };
  },
  
  toHaveStatusEffect(received, effectName) {
    const pass = received.hasStatusEffect(effectName);
    return {
      pass,
      message: () => `expected entity to ${pass ? 'not ' : ''}have status effect: ${effectName}`
    };
  }
});
```

### **Test Data Builders** (`tests/helpers/builders.ts`)
```typescript
export class PlayerBuilder {
  private data: Partial<PlayerData> = {};
  
  withClass(playerClass: string) {
    this.data.class = playerClass;
    return this;
  }
  
  withAbilities(abilities: string[]) {
    this.data.abilities = abilities;
    return this;
  }
  
  withPosition(position: HexCoordinate) {
    this.data.position = position;
    return this;
  }
  
  withStatusEffect(effect: string, duration: number) {
    if (!this.data.statusEffects) this.data.statusEffects = [];
    this.data.statusEffects.push({ effect, duration });
    return this;
  }
  
  build(): Player {
    return createTestPlayer(this.data);
  }
}

// Usage:
const testPlayer = new PlayerBuilder()
  .withClass('fighter')
  .withAbilities(['power_strike'])
  .withPosition({ q: 0, r: 0, s: 0 })
  .withStatusEffect('poison', 3)
  .build();
```

---

## ⚙️ **Configuration Validation**

### **JSON Schema Validation** (`tests/config/schemas/`)

#### **Ability Configuration Schema**
```typescript
export const abilityConfigSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["id", "name", "type", "range"],
  properties: {
    id: { type: "string", pattern: "^[a-z_]+$" },
    name: { type: "string", minLength: 1 },
    type: { enum: ["attack", "healing", "support", "movement"] },
    damage: { type: "number", minimum: 0 },
    healing: { type: "number", minimum: 0 },
    range: { type: "number", minimum: 0 },
    cooldown: { type: "number", minimum: 0 },
    statusEffects: {
      type: "array",
      items: {
        type: "object",
        required: ["effectName", "duration"],
        properties: {
          effectName: { type: "string" },
          duration: { type: "number", minimum: 1 },
          chance: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    }
  }
};
```

#### **Monster Configuration Schema**
```typescript
export const monsterConfigSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["id", "name", "type", "stats", "aiType"],
  properties: {
    id: { type: "string", pattern: "^[a-z_]+$" },
    name: { type: "string", minLength: 1 },
    type: { const: "monster" },
    stats: {
      type: "object",
      required: ["maxHp", "baseArmor", "baseDamage", "movementRange"],
      properties: {
        maxHp: { type: "number", minimum: 1 },
        baseArmor: { type: "number", minimum: 0 },
        baseDamage: { type: "number", minimum: 0 },
        movementRange: { type: "number", minimum: 1 }
      }
    },
    aiType: { enum: ["aggressive", "defensive", "tactical", "berserker", "support", "passive"] },
    difficulty: { type: "number", minimum: 1, maximum: 10 }
  }
};
```

### **Runtime Validation** (`tests/config/validation.ts`)
```typescript
import Ajv from 'ajv';
import { abilityConfigSchema, monsterConfigSchema } from './schemas';

const ajv = new Ajv({ allErrors: true });

export function validateAbilityConfig(config: unknown): ValidationResult {
  const validate = ajv.compile(abilityConfigSchema);
  const valid = validate(config);
  
  return {
    valid,
    errors: validate.errors || [],
    formatted: valid ? null : ajv.errorsText(validate.errors)
  };
}

export function validateMonsterConfig(config: unknown): ValidationResult {
  const validate = ajv.compile(monsterConfigSchema);
  const valid = validate(config);
  
  return {
    valid,
    errors: validate.errors || [],
    formatted: valid ? null : ajv.errorsText(validate.errors)
  };
}
```

---

## 📈 **Coverage Requirements**

### **Minimum Coverage Thresholds**
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Stricter requirements for critical systems
    './server/src/utils/hex/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './server/src/core/entities/': {
      branches: 92,
      functions: 92,
      lines: 92,
      statements: 92
    }
  }
};
```

### **Coverage Exclusions**
- Debug utilities (`**/debug/**`)
- Test files (`**/*.test.ts`)
- Configuration files (`**/config/*.json`)
- Type definitions (`**/*.d.ts`)

---

## 🚀 **Implementation Timeline**

### **Phase 1: Foundation (Days 1-2)**
- [x] Create testing strategy document
- [x] Reorganize test directory structure
- [x] Set up mock factories and utilities
- [x] Create base test fixtures

### **Phase 2: Unit Tests (Days 2-3)**
- [x] Create unit tests for hex coordinate utilities (32 tests passing)
- [x] Create unit tests for ThreatCalculator system utility (26 tests passing)
- [ ] Fix import issues in existing entity tests
- [ ] Create system unit tests with isolation
- [ ] Build additional utility function test suites
- [ ] Achieve 90% unit test coverage

### **Phase 3: Integration Tests (Days 3-4)**
- [ ] Write combat system integration tests
- [ ] Create game flow integration tests
- [ ] Build AI system integration tests
- [ ] Test configuration validation

### **Phase 4: Configuration & Validation (Days 4-5)**
- [ ] Implement JSON schema validation
- [ ] Create monster configuration loader
- [ ] Build runtime validation system
- [ ] Test configuration loading workflows

### **Phase 5: E2E & Performance (Day 5)**
- [ ] Write critical E2E test scenarios
- [ ] Implement performance benchmarks
- [ ] Add accessibility test coverage
- [ ] Finalize test automation

---

## 🔍 **Quality Gates**

### **Pre-Commit Checks**
- All tests pass
- 90%+ code coverage maintained
- TypeScript compilation successful
- ESLint violations resolved

### **CI/CD Pipeline**
- Unit tests (< 30 seconds)
- Integration tests (< 2 minutes)
- E2E tests (< 5 minutes)
- Performance benchmarks
- Coverage reporting

### **Release Criteria**
- 100% critical path test coverage
- All integration tests passing
- Performance benchmarks met
- Accessibility compliance verified

---

*This testing strategy provides a comprehensive foundation for maintaining code quality and catching regressions in the Crimsonfall hex dungeon crawler project.*