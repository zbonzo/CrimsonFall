/**
 * @fileoverview Entity mock factories for unit testing
 * Provides mocked entities for isolated testing scenarios
 *
 * @file tests/mocks/entities.ts
 */

import { jest } from '@jest/globals';
import type { HexCoordinate } from '@/utils/hex/hexCoordinates.js';
import type { PlayerSpecialization } from '@/core/types/entityTypes.js';
import { createTestHex } from '../helpers/testUtils.js';

// === MOCK ENTITY INTERFACES ===

export interface MockPlayer {
  id: string;
  name: string;
  playerSpecialization: PlayerSpecialization;
  position: HexCoordinate;
  maxHp: number;
  currentHp: number;
  isAlive: boolean;
  effectiveArmor: number;
  baseArmor: number;
  baseDamage: number;
  movementRange: number;
  activeStatusEffects: Array<{ name: string; duration: number; value?: number }>;
  
  // Methods
  takeDamage: jest.MockedFunction<any>;
  heal: jest.MockedFunction<any>;
  addStatusEffect: jest.MockedFunction<any>;
  removeStatusEffect: jest.MockedFunction<any>;
  hasStatusEffect: jest.MockedFunction<any>;
  canAct: jest.MockedFunction<any>;
  canMove: jest.MockedFunction<any>;
  moveTo: jest.MockedFunction<any>;
  submitAction: jest.MockedFunction<any>;
  getAbility: jest.MockedFunction<any>;
  useAbility: jest.MockedFunction<any>;
  canUseAbility: jest.MockedFunction<any>;
  getAvailableAbilities: jest.MockedFunction<any>;
  calculateDamageOutput: jest.MockedFunction<any>;
  setPosition: jest.MockedFunction<any>;
}

export interface MockMonster {
  id: string;
  name: string;
  variant: string;
  position: HexCoordinate;
  maxHp: number;
  currentHp: number;
  isAlive: boolean;
  effectiveArmor: number;
  baseArmor: number;
  baseDamage: number;
  movementRange: number;
  activeStatusEffects: Array<{ name: string; duration: number; value?: number }>;
  lastDecision: any;
  difficulty: number;
  
  // Methods
  takeDamage: jest.MockedFunction<any>;
  heal: jest.MockedFunction<any>;
  addStatusEffect: jest.MockedFunction<any>;
  removeStatusEffect: jest.MockedFunction<any>;
  hasStatusEffect: jest.MockedFunction<any>;
  canAct: jest.MockedFunction<any>;
  canMove: jest.MockedFunction<any>;
  moveTo: jest.MockedFunction<any>;
  makeDecision: jest.MockedFunction<any>;
  recordPlayerAttack: jest.MockedFunction<any>;
  recordPlayerHealing: jest.MockedFunction<any>;
  recordPlayerAbility: jest.MockedFunction<any>;
  getThreat: jest.MockedFunction<any>;
  getTopThreats: jest.MockedFunction<any>;
  calculateDamageOutput: jest.MockedFunction<any>;
  setPosition: jest.MockedFunction<any>;
}

// === PLAYER MOCK FACTORIES ===

export const MockPlayerFactory = {
  /**
   * Creates a basic healthy player mock
   */
  healthy: (overrides: Partial<MockPlayer> = {}): MockPlayer => ({
    id: 'mock_player',
    name: 'Mock Player',
    playerSpecialization: {
      id: 'test_fighter',
      name: 'Fighter',
      variant: 'player',
      description: 'A test fighter class',
      stats: { maxHp: 100, baseArmor: 2, baseDamage: 15, movementRange: 3 },
      abilities: [],
      startingAbilities: [],
    },
    position: createTestHex(0, 0),
    maxHp: 100,
    currentHp: 100,
    isAlive: true,
    effectiveArmor: 2,
    baseArmor: 2,
    baseDamage: 15,
    movementRange: 3,
    activeStatusEffects: [],
    
    // Mock methods with default behaviors
    takeDamage: jest.fn().mockReturnValue({ damageDealt: 10, killed: false }),
    heal: jest.fn().mockReturnValue({ amountHealed: 15 }),
    addStatusEffect: jest.fn().mockReturnValue({ success: true }),
    removeStatusEffect: jest.fn().mockReturnValue(true),
    hasStatusEffect: jest.fn().mockReturnValue(false),
    canAct: jest.fn().mockReturnValue(true),
    canMove: jest.fn().mockReturnValue(true),
    moveTo: jest.fn().mockReturnValue({ success: true, newPosition: createTestHex(1, 0) }),
    submitAction: jest.fn().mockReturnValue({ success: true }),
    getAbility: jest.fn().mockReturnValue(null),
    useAbility: jest.fn().mockReturnValue({ success: false, reason: 'No ability' }),
    canUseAbility: jest.fn().mockReturnValue({ canUse: false, reason: 'No ability' }),
    getAvailableAbilities: jest.fn().mockReturnValue([]),
    calculateDamageOutput: jest.fn().mockReturnValue(15),
    setPosition: jest.fn(),
    
    ...overrides,
  }),

  /**
   * Creates a damaged player mock
   */
  damaged: (damage: number = 50, overrides: Partial<MockPlayer> = {}): MockPlayer => ({
    ...MockPlayerFactory.healthy(overrides),
    currentHp: Math.max(0, 100 - damage),
    isAlive: damage < 100,
    ...overrides,
  }),

  /**
   * Creates a dead player mock
   */
  dead: (overrides: Partial<MockPlayer> = {}): MockPlayer => ({
    ...MockPlayerFactory.healthy(overrides),
    currentHp: 0,
    isAlive: false,
    canAct: jest.fn().mockReturnValue(false),
    canMove: jest.fn().mockReturnValue(false),
    ...overrides,
  }),

  /**
   * Creates a player mock with status effects
   */
  withStatusEffects: (effects: Array<{ name: string; duration: number; value?: number }>, overrides: Partial<MockPlayer> = {}): MockPlayer => ({
    ...MockPlayerFactory.healthy(overrides),
    activeStatusEffects: effects,
    hasStatusEffect: (jest.fn() as any).mockImplementation((effectName: string) => 
      effects.some(e => e.name === effectName)
    ),
    ...overrides,
  }),

  /**
   * Creates a player mock that cannot act (stunned/paralyzed)
   */
  incapacitated: (overrides: Partial<MockPlayer> = {}): MockPlayer => ({
    ...MockPlayerFactory.healthy(overrides),
    canAct: jest.fn().mockReturnValue(false),
    canMove: jest.fn().mockReturnValue(false),
    activeStatusEffects: [{ name: 'stunned', duration: 2, value: 1 }],
    hasStatusEffect: (jest.fn() as any).mockImplementation((name: string) => name === 'stunned'),
    ...overrides,
  }),

  /**
   * Creates a player mock with abilities
   */
  withAbilities: (abilities: Array<{ id: string; name: string; damage?: number; healing?: number; range: number }>, overrides: Partial<MockPlayer> = {}): MockPlayer => {
    const mock = MockPlayerFactory.healthy(overrides);
    
    mock.getAbility = (jest.fn() as any).mockImplementation((abilityId: string) => 
      abilities.find(a => a.id === abilityId) || null
    );
    
    mock.getAvailableAbilities = jest.fn().mockReturnValue(abilities);
    
    mock.canUseAbility = (jest.fn() as any).mockImplementation((abilityId: string) => ({
      canUse: abilities.some(a => a.id === abilityId),
      reason: abilities.some(a => a.id === abilityId) ? undefined : 'Ability not found'
    }));
    
    mock.useAbility = (jest.fn() as any).mockImplementation((abilityId: string) => ({
      success: abilities.some(a => a.id === abilityId),
      reason: abilities.some(a => a.id === abilityId) ? undefined : 'Ability not found'
    }));

    return {
      ...mock,
      ...overrides,
    };
  },

  /**
   * Creates a healer player mock
   */
  healer: (overrides: Partial<MockPlayer> = {}): MockPlayer => {
    const healAbility = {
      id: 'heal_self',
      name: 'Heal Self',
      variant: 'healing' as const,
      healing: 25,
      range: 0,
      cooldown: 0,
      description: 'Heal yourself for 25 HP'
    };

    return MockPlayerFactory.withAbilities([healAbility], {
      ...overrides,
      playerSpecialization: {
        id: 'cleric',
        name: 'Cleric',
        variant: 'player',
        description: 'A mock healer',
        stats: { maxHp: 80, baseArmor: 1, baseDamage: 10, movementRange: 3 },
        abilities: [healAbility],
        startingAbilities: ['heal_self'],
      },
    });
  },

  /**
   * Creates an archer player mock
   */
  archer: (overrides: Partial<MockPlayer> = {}): MockPlayer => {
    const rangedAbility = {
      id: 'shortbow_shot',
      name: 'Shortbow Shot',
      variant: 'attack' as const,
      damage: 16,
      range: 4,
      cooldown: 0,
      description: 'A ranged attack with a shortbow'
    };

    return MockPlayerFactory.withAbilities([rangedAbility], {
      ...overrides,
      playerSpecialization: {
        id: 'ranger',
        name: 'Ranger',
        variant: 'player',
        description: 'A mock archer',
        stats: { maxHp: 90, baseArmor: 1, baseDamage: 14, movementRange: 4 },
        abilities: [rangedAbility],
        startingAbilities: ['shortbow_shot'],
      },
    });
  },
};

// === MONSTER MOCK FACTORIES ===

export const MockMonsterFactory = {
  /**
   * Creates a basic healthy monster mock
   */
  basic: (overrides: Partial<MockMonster> = {}): MockMonster => ({
    id: 'mock_monster',
    name: 'Mock Monster',
    variant: 'goblin_warrior',
    position: createTestHex(3, 0),
    maxHp: 50,
    currentHp: 50,
    isAlive: true,
    effectiveArmor: 1,
    baseArmor: 1,
    baseDamage: 12,
    movementRange: 3,
    activeStatusEffects: [],
    lastDecision: null,
    difficulty: 2,
    
    // Mock methods with default behaviors
    takeDamage: jest.fn().mockReturnValue({ damageDealt: 10, killed: false }),
    heal: jest.fn().mockReturnValue({ amountHealed: 15 }),
    addStatusEffect: jest.fn().mockReturnValue({ success: true }),
    removeStatusEffect: jest.fn().mockReturnValue(true),
    hasStatusEffect: jest.fn().mockReturnValue(false),
    canAct: jest.fn().mockReturnValue(true),
    canMove: jest.fn().mockReturnValue(true),
    moveTo: jest.fn().mockReturnValue({ success: true, newPosition: createTestHex(4, 0) }),
    makeDecision: jest.fn().mockReturnValue({ variant: 'wait', priority: 1, confidence: 0.5 }),
    recordPlayerAttack: jest.fn(),
    recordPlayerHealing: jest.fn(),
    recordPlayerAbility: jest.fn(),
    getThreat: jest.fn().mockReturnValue(0),
    getTopThreats: jest.fn().mockReturnValue([]),
    calculateDamageOutput: jest.fn().mockReturnValue(12),
    setPosition: jest.fn(),
    
    ...overrides,
  }),

  /**
   * Creates a damaged monster mock
   */
  damaged: (damage: number = 30, overrides: Partial<MockMonster> = {}): MockMonster => ({
    ...MockMonsterFactory.basic(overrides),
    currentHp: Math.max(0, 50 - damage),
    isAlive: damage < 50,
    ...overrides,
  }),

  /**
   * Creates a dead monster mock
   */
  dead: (overrides: Partial<MockMonster> = {}): MockMonster => ({
    ...MockMonsterFactory.basic(overrides),
    currentHp: 0,
    isAlive: false,
    canAct: jest.fn().mockReturnValue(false),
    canMove: jest.fn().mockReturnValue(false),
    ...overrides,
  }),

  /**
   * Creates a monster mock with status effects
   */
  withStatusEffects: (effects: Array<{ name: string; duration: number; value?: number }>, overrides: Partial<MockMonster> = {}): MockMonster => ({
    ...MockMonsterFactory.basic(overrides),
    activeStatusEffects: effects,
    hasStatusEffect: (jest.fn() as any).mockImplementation((effectName: string) => 
      effects.some(e => e.name === effectName)
    ),
    ...overrides,
  }),

  /**
   * Creates an aggressive monster mock that always attacks
   */
  aggressive: (overrides: Partial<MockMonster> = {}): MockMonster => ({
    ...MockMonsterFactory.basic(overrides),
    variant: 'aggressive_goblin',
    makeDecision: jest.fn().mockReturnValue({ 
      variant: 'attack' as const, 
      priority: 10, 
      confidence: 0.9,
      target: { id: 'player1' }
    }),
    ...overrides,
  }),

  /**
   * Creates a tactical monster mock that prioritizes positioning
   */
  tactical: (overrides: Partial<MockMonster> = {}): MockMonster => ({
    ...MockMonsterFactory.basic(overrides),
    variant: 'tactical_archer',
    makeDecision: jest.fn().mockReturnValue({ 
      variant: 'move', 
      priority: 7, 
      confidence: 0.8,
      targetPosition: createTestHex(5, -1)
    }),
    ...overrides,
  }),

  /**
   * Creates a monster mock with threat tracking
   */
  withThreat: (threatData: Record<string, number>, overrides: Partial<MockMonster> = {}): MockMonster => {
    const mock = MockMonsterFactory.basic(overrides);
    
    mock.getThreat = (jest.fn() as any).mockImplementation((playerId: string) => 
      threatData[playerId] || 0
    );
    
    mock.getTopThreats = jest.fn().mockReturnValue(
      Object.entries(threatData)
        .map(([playerId, threat]) => ({ playerId, threat, playerName: playerId }))
        .sort((a, b) => b.threat - a.threat)
    );

    return {
      ...mock,
      ...overrides,
    };
  },

  /**
   * Creates a boss monster mock
   */
  boss: (overrides: Partial<MockMonster> = {}): MockMonster => ({
    ...MockMonsterFactory.basic(overrides),
    id: 'boss_monster',
    name: 'Boss Monster',
    variant: 'dragon_boss',
    maxHp: 200,
    currentHp: 200,
    effectiveArmor: 5,
    baseArmor: 5,
    baseDamage: 35,
    difficulty: 10,
    ...overrides,
  }),

  /**
   * Creates a swarm of weak monster mocks
   */
  swarm: (count: number = 4, overrides: Partial<MockMonster> = {}): MockMonster[] => {
    return Array.from({ length: count }, (_, i) => ({
      ...MockMonsterFactory.basic(overrides),
      id: `swarm_${i}`,
      name: `Swarm ${i}`,
      maxHp: 15,
      currentHp: 15,
      baseDamage: 5,
      difficulty: 1,
      position: createTestHex(3 + i, 0),
    }));
  },
};

// === ENTITY COLLECTION MOCKS ===

export const MockEntityCollections = {
  /**
   * Creates a standard 2v2 mock scenario
   */
  standard2v2: () => ({
    players: [
      MockPlayerFactory.healthy({ id: 'player1', name: 'Warrior' }),
      MockPlayerFactory.healer({ id: 'player2', name: 'Healer' }),
    ],
    monsters: [
      MockMonsterFactory.basic({ id: 'monster1', name: 'Goblin Warrior' }),
      MockMonsterFactory.tactical({ id: 'monster2', name: 'Goblin Archer' }),
    ],
  }),

  /**
   * Creates a damaged scenario for healing tests
   */
  damagedScenario: () => ({
    players: [
      MockPlayerFactory.damaged(60, { id: 'damaged_player', name: 'Wounded Warrior' }),
      MockPlayerFactory.healer({ id: 'healer', name: 'Cleric' }),
    ],
    monsters: [
      MockMonsterFactory.basic({ id: 'monster1', name: 'Goblin' }),
    ],
  }),

  /**
   * Creates a status effect scenario
   */
  statusEffectScenario: () => ({
    players: [
      MockPlayerFactory.withStatusEffects(
        [{ name: 'poison', duration: 3, value: 5 }],
        { id: 'poisoned_player', name: 'Poisoned Rogue' }
      ),
    ],
    monsters: [
      MockMonsterFactory.withStatusEffects(
        [{ name: 'blessed', duration: 4, value: 3 }],
        { id: 'blessed_monster', name: 'Blessed Skeleton' }
      ),
    ],
  }),

  /**
   * Creates a threat testing scenario
   */
  threatScenario: () => ({
    players: [
      MockPlayerFactory.healthy({ id: 'high_threat', name: 'Tank' }),
      MockPlayerFactory.healer({ id: 'low_threat', name: 'Healer' }),
    ],
    monsters: [
      MockMonsterFactory.withThreat(
        { 'high_threat': 25, 'low_threat': 5 },
        { id: 'tactical_monster', name: 'Smart Goblin' }
      ),
    ],
  }),

  /**
   * Creates a performance testing scenario
   */
  performanceScenario: (playerCount: number = 6, monsterCount: number = 6) => ({
    players: Array.from({ length: playerCount }, (_, i) => 
      MockPlayerFactory.healthy({ 
        id: `perf_player_${i}`, 
        name: `Player ${i}`,
        position: createTestHex(i, 0)
      })
    ),
    monsters: Array.from({ length: monsterCount }, (_, i) => 
      MockMonsterFactory.basic({ 
        id: `perf_monster_${i}`, 
        name: `Monster ${i}`,
        position: createTestHex(i + 10, 0)
      })
    ),
  }),
};

// === MOCK LIFECYCLE UTILITIES ===

/**
 * Resets all mocks in an entity
 */
export function resetEntityMocks(entity: MockPlayer | MockMonster): void {
  Object.values(entity).forEach(value => {
    if (jest.isMockFunction(value)) {
      value.mockClear();
    }
  });
}

/**
 * Resets all mocks in a collection of entities
 */
export function resetEntityCollectionMocks(entities: (MockPlayer | MockMonster)[]): void {
  entities.forEach(resetEntityMocks);
}

/**
 * Validates that expected methods were called on an entity
 */
export function expectEntityMethodsCalled(
  entity: MockPlayer | MockMonster,
  expectedCalls: Record<string, number>
): void {
  Object.entries(expectedCalls).forEach(([methodName, expectedCount]) => {
    const method = (entity as any)[methodName];
    if (jest.isMockFunction(method)) {
      expect(method).toHaveBeenCalledTimes(expectedCount);
    }
  });
}

/**
 * Sets up entity mock chains for complex scenarios
 */
export function setupEntityMockChain(entity: MockPlayer | MockMonster, chain: Array<{
  method: string;
  returnValue?: any;
  implementation?: (...args: unknown[]) => unknown;
}>): void {
  chain.forEach(({ method, returnValue, implementation }) => {
    const mockMethod = (entity as any)[method];
    if (jest.isMockFunction(mockMethod)) {
      if (implementation) {
        mockMethod.mockImplementation(implementation);
      } else if (returnValue !== undefined) {
        mockMethod.mockReturnValue(returnValue);
      }
    }
  });
}