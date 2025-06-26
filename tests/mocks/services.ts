/**
 * @fileoverview Service and system mock factories for unit testing
 * Provides mocked services and systems for isolated testing
 *
 * @file tests/mocks/services.ts
 */

import { jest } from '@jest/globals';
// import type { HexCoordinate } from '@/utils/hex/hexCoordinates.js'; // Unused
import { createTestHex } from '../helpers/testUtils.js';

// === GAME LOOP SERVICE MOCKS ===

export const MockGameLoopService = {
  /**
   * Mock game state service
   */
  gameState: () => ({
    getOccupiedPositions: jest.fn().mockReturnValue(new Set<string>()),
    getObstacles: jest.fn().mockReturnValue(new Set<string>()),
    updateEntityPosition: jest.fn().mockReturnValue(true),
    removeEntity: jest.fn().mockReturnValue(true),
    addEntity: jest.fn().mockReturnValue(true),
    isPositionOccupied: jest.fn().mockReturnValue(false),
    isPositionBlocked: jest.fn().mockReturnValue(false),
    getAllEntities: jest.fn().mockReturnValue([]),
    getAlivePlayers: jest.fn().mockReturnValue([]),
    getAliveMonsters: jest.fn().mockReturnValue([]),
  }),

  /**
   * Mock round processor
   */
  roundProcessor: () => ({
    processRound: (jest.fn() as any).mockResolvedValue({
      roundNumber: 1,
      actionResults: [],
      statusEffectResults: { entityUpdates: [] },
      gameEnded: false,
      winner: null,
      reason: null,
    }),
    processPlayerActions: (jest.fn() as any).mockResolvedValue([]),
    processMonsterActions: (jest.fn() as any).mockResolvedValue([]),
    processStatusEffects: jest.fn().mockReturnValue({ entityUpdates: [] }),
  }),

  /**
   * Mock win condition checker
   */
  winConditions: () => ({
    checkWinConditions: jest.fn().mockReturnValue({
      gameEnded: false,
      winner: null,
      reason: null,
    }),
    isVictoryConditionMet: jest.fn().mockReturnValue(false),
    isDefeatConditionMet: jest.fn().mockReturnValue(false),
    isDrawConditionMet: jest.fn().mockReturnValue(false),
  }),
};

// === THREAT SYSTEM MOCKS ===

export const MockThreatService = {
  /**
   * Basic threat manager mock
   */
  basic: () => ({
    isEnabled: true,
    initializeThreat: jest.fn(),
    addThreat: jest.fn(),
    getThreat: jest.fn().mockReturnValue(0),
    setThreat: jest.fn(),
    clearThreat: jest.fn(),
    clearAllThreat: jest.fn(),
    trackTarget: jest.fn(),
    wasRecentlyTargeted: jest.fn().mockReturnValue(false),
    selectTarget: jest.fn().mockReturnValue({ target: null, confidence: 0 }),
    processRound: jest.fn(),
    applyThreatDecay: jest.fn(),
    resetForEncounter: jest.fn(),
    getTopThreats: jest.fn().mockReturnValue([]),
    getThreatHistory: jest.fn().mockReturnValue([]),
    getDebugInfo: jest.fn().mockReturnValue({
      enabled: true,
      threatTable: {},
      lastTargets: [],
      roundsActive: 0,
      totalEntities: 0,
    }),
  }),

  /**
   * Threat manager with pre-configured threat values
   */
  withThreatData: (threatData: Record<string, number>) => ({
    ...MockThreatService.basic(),
    getThreat: ((jest.fn() as any).mockImplementation((entityId: string) => threatData[entityId] || 0)),
    getTopThreats: jest.fn().mockReturnValue(
      Object.entries(threatData)
        .map(([playerId, threat]) => ({ playerId, threat, playerName: playerId }))
        .sort((a, b) => b.threat - a.threat)
        .slice(0, 3)
    ),
  }),

  /**
   * Threat calculator mock
   */
  calculator: () => ({
    createThreatUpdate: jest.fn().mockReturnValue({
      playerId: 'test_player',
      damageReceived: 0,
      healingReceived: 0,
      playerArmor: 2,
      damageToSelf: 0,
      totalDamageDealt: 0,
      healingDone: 0,
      source: 'test',
    }),
    calculateRawThreat: jest.fn().mockReturnValue(10),
    createAttackThreat: jest.fn().mockReturnValue({
      playerId: 'attacker',
      damageReceived: 15,
      healingReceived: 0,
      playerArmor: 2,
      damageToSelf: 15,
      totalDamageDealt: 15,
      healingDone: 0,
      source: 'attack',
    }),
    createHealingThreat: jest.fn().mockReturnValue({
      playerId: 'healer',
      damageReceived: 0,
      healingReceived: 25,
      playerArmor: 1,
      damageToSelf: 0,
      totalDamageDealt: 0,
      healingDone: 25,
      source: 'healing',
    }),
  }),
};

// === AI SYSTEM MOCKS ===

export const MockAIService = {
  /**
   * Basic monster AI mock
   */
  basic: () => ({
    makeDecision: jest.fn().mockReturnValue({
      variant: 'wait',
      priority: 1,
      confidence: 0.5,
    }),
    evaluateTargets: jest.fn().mockReturnValue([]),
    evaluatePositions: jest.fn().mockReturnValue([]),
    evaluateAbilities: jest.fn().mockReturnValue([]),
    getAIType: jest.fn().mockReturnValue('aggressive'),
    getDifficulty: jest.fn().mockReturnValue(2),
  }),

  /**
   * Aggressive AI that always attacks
   */
  aggressive: () => ({
    ...MockAIService.basic(),
    makeDecision: jest.fn().mockReturnValue({
      variant: 'attack',
      target: { id: 'player1' },
      priority: 10,
      confidence: 0.9,
    }),
    getAIType: jest.fn().mockReturnValue('aggressive'),
  }),

  /**
   * Tactical AI that prioritizes positioning
   */
  tactical: () => ({
    ...MockAIService.basic(),
    makeDecision: jest.fn().mockReturnValue({
      variant: 'move',
      targetPosition: createTestHex(4, -1),
      priority: 7,
      confidence: 0.8,
    }),
    getAIType: jest.fn().mockReturnValue('tactical'),
  }),

  /**
   * Support AI that uses abilities
   */
  support: () => ({
    ...MockAIService.basic(),
    makeDecision: jest.fn().mockReturnValue({
      variant: 'ability',
      abilityId: 'heal_ally',
      target: { id: 'ally1' },
      priority: 8,
      confidence: 0.7,
    }),
    getAIType: jest.fn().mockReturnValue('support'),
  }),

  /**
   * Behavior strategy mocks
   */
  behaviors: () => ({
    evaluateBehavior: jest.fn().mockReturnValue({
      id: 'attack_nearest',
      priority: 5,
      conditions: [],
      action: { variant: 'attack_nearest' },
    }),
    getActiveBehaviors: jest.fn().mockReturnValue([]),
    addBehavior: jest.fn(),
    removeBehavior: jest.fn(),
  }),
};

// === ACTION SYSTEM MOCKS ===

export const MockActionService = {
  /**
   * Action processor mock
   */
  processor: () => ({
    processAllActions: (jest.fn() as any).mockResolvedValue([]),
    processPlayerAction: (jest.fn() as any).mockResolvedValue({
      entityId: 'player1',
      entityName: 'Player',
      actionVariant: 'move',
      success: true,
    }),
    processMonsterAction: (jest.fn() as any).mockResolvedValue({
      entityId: 'monster1',
      entityName: 'Monster',
      actionVariant: 'ai_decision',
      success: true,
    }),
    validateAction: jest.fn().mockReturnValue({ valid: true }),
    getProcessingStats: jest.fn().mockReturnValue({
      playersWithActions: 2,
      monstersWithDecisions: 2,
      totalActionsToProcess: 4,
      actionTypes: { move: 2, attack: 2 },
    }),
  }),

  /**
   * Action validator mock
   */
  validator: () => ({
    validateMove: jest.fn().mockReturnValue({ valid: true }),
    validateAttack: jest.fn().mockReturnValue({ valid: true }),
    validateAbility: jest.fn().mockReturnValue({ valid: true }),
    validateTargeting: jest.fn().mockReturnValue({ valid: true }),
    validateRange: jest.fn().mockReturnValue({ valid: true }),
  }),

  /**
   * Action executor mock
   */
  executor: () => ({
    executeMove: jest.fn().mockReturnValue({
      success: true,
      newPosition: createTestHex(1, 0),
    }),
    executeAttack: jest.fn().mockReturnValue({
      success: true,
      damageDealt: 15,
      targetId: 'target1',
    }),
    executeAbility: jest.fn().mockReturnValue({
      success: true,
      abilityUsed: 'power_strike',
      damageDealt: 20,
    }),
    executeWait: jest.fn().mockReturnValue({ success: true }),
  }),
};

// === STATUS EFFECT SYSTEM MOCKS ===

export const MockStatusEffectService = {
  /**
   * Status effect manager mock
   */
  manager: () => ({
    addStatusEffect: jest.fn().mockReturnValue({ success: true }),
    removeStatusEffect: jest.fn().mockReturnValue(true),
    hasStatusEffect: jest.fn().mockReturnValue(false),
    getActiveEffects: jest.fn().mockReturnValue([]),
    processStatusEffects: jest.fn().mockReturnValue([]),
    clearAllEffects: jest.fn(),
    getEffectValue: jest.fn().mockReturnValue(0),
    getEffectDuration: jest.fn().mockReturnValue(0),
  }),

  /**
   * Status effect processor mock
   */
  processor: () => ({
    processAllEffects: jest.fn().mockReturnValue({
      entityUpdates: [],
      effectsApplied: 0,
      effectsRemoved: 0,
    }),
    processEntityEffects: jest.fn().mockReturnValue([]),
    applyEffectDamage: jest.fn().mockReturnValue(5),
    applyEffectHealing: jest.fn().mockReturnValue(10),
    applyEffectModifiers: jest.fn(),
  }),

  /**
   * Status effect with specific effects applied
   */
  withEffects: (effects: Array<{ name: string; duration: number; value?: number }>) => ({
    ...MockStatusEffectService.manager(),
    hasStatusEffect: ((jest.fn() as any).mockImplementation((name: string) =>
      effects.some(e => e.name === name)
    )),
    getActiveEffects: jest.fn().mockReturnValue(effects),
    getEffectValue: ((jest.fn() as any).mockImplementation((name: string) =>
      effects.find(e => e.name === name)?.value || 0
    )),
    getEffectDuration: ((jest.fn() as any).mockImplementation((name: string) =>
      effects.find(e => e.name === name)?.duration || 0
    )),
  }),
};

// === COMBAT SYSTEM MOCKS ===

export const MockCombatService = {
  /**
   * Damage calculator mock
   */
  damageCalculator: () => ({
    calculateDamage: jest.fn().mockReturnValue(15),
    calculateArmorReduction: jest.fn().mockReturnValue(2),
    calculateCriticalHit: jest.fn().mockReturnValue({ isCritical: false, multiplier: 1 }),
    calculateResistance: jest.fn().mockReturnValue(1),
    applyStatusModifiers: jest.fn().mockReturnValue(15),
  }),

  /**
   * Range calculator mock
   */
  rangeCalculator: () => ({
    calculateDistance: jest.fn().mockReturnValue(1),
    isInRange: jest.fn().mockReturnValue(true),
    getTargetsInRange: jest.fn().mockReturnValue([]),
    getValidMovePositions: jest.fn().mockReturnValue([]),
    canReachTarget: jest.fn().mockReturnValue(true),
  }),

  /**
   * Combat resolver mock
   */
  resolver: () => ({
    resolveCombat: jest.fn().mockReturnValue({
      attacker: 'player1',
      target: 'monster1',
      damageDealt: 15,
      killed: false,
    }),
    resolveHealing: jest.fn().mockReturnValue({
      healer: 'player2',
      target: 'player1',
      amountHealed: 20,
    }),
    resolveAbility: jest.fn().mockReturnValue({
      caster: 'player1',
      abilityUsed: 'power_strike',
      success: true,
      effects: [],
    }),
  }),
};

// === CONFIGURATION SERVICE MOCKS ===

export const MockConfigService = {
  /**
   * Monster configuration loader mock
   */
  monsterLoader: () => ({
    loadMonsterConfig: jest.fn().mockReturnValue({
      id: 'goblin_warrior',
      name: 'Goblin Warrior',
      type: 'monster',
      stats: { maxHp: 50, baseArmor: 1, baseDamage: 12, movementRange: 3 },
      abilities: [],
      aiType: 'aggressive',
      difficulty: 2,
    }),
    loadAllMonsterConfigs: jest.fn().mockReturnValue([]),
    validateMonsterConfig: jest.fn().mockReturnValue({ valid: true }),
    getMonsterById: jest.fn().mockReturnValue(null),
  }),

  /**
   * Ability configuration loader mock
   */
  abilityLoader: () => ({
    loadAbilityConfig: jest.fn().mockReturnValue({
      id: 'power_strike',
      name: 'Power Strike',
      type: 'attack',
      damage: 20,
      range: 1,
      cooldown: 2,
      description: 'A powerful melee attack',
      targetType: 'enemy',
    }),
    loadAllAbilityConfigs: jest.fn().mockReturnValue([]),
    validateAbilityConfig: jest.fn().mockReturnValue({ valid: true }),
    getAbilityById: jest.fn().mockReturnValue(null),
  }),

  /**
   * Status effect configuration loader mock
   */
  statusEffectLoader: () => ({
    loadStatusEffectConfig: jest.fn().mockReturnValue({
      id: 'poison',
      name: 'Poison',
      type: 'damage',
      damagePerRound: 5,
      duration: 3,
      description: 'Deals damage each round',
    }),
    loadAllStatusEffectConfigs: jest.fn().mockReturnValue([]),
    validateStatusEffectConfig: jest.fn().mockReturnValue({ valid: true }),
    getStatusEffectById: jest.fn().mockReturnValue(null),
  }),
};

// === UTILITY SERVICE MOCKS ===

export const MockUtilityService = {
  /**
   * Hex coordinate utilities mock
   */
  hexUtils: () => ({
    createHexCoordinate: ((jest.fn() as any).mockImplementation((q: number, r: number) => ({ q, r, s: -q - r }))),
    isValidHexCoordinate: jest.fn().mockReturnValue(true),
    calculateHexDistance: jest.fn().mockReturnValue(1),
    getHexNeighbors: jest.fn().mockReturnValue([]),
    hexToDisplayString: jest.fn().mockReturnValue('(0, 0)'),
    roundHex: ((jest.fn() as any).mockImplementation((hex: any) => hex)),
  }),

  /**
   * Random number generator mock
   */
  rng: () => ({
    random: jest.fn().mockReturnValue(0.5),
    randomInt: jest.fn().mockReturnValue(5),
    randomFloat: jest.fn().mockReturnValue(0.5),
    randomChoice: ((jest.fn() as any).mockImplementation((array: any[]) => array[0])),
    setSeed: jest.fn(),
  }),

  /**
   * Logger mock
   */
  logger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setLevel: jest.fn(),
  }),
};

// === MOCK SERVICE FACTORY ===

export class MockServiceFactory {
  private services: Map<string, any> = new Map();

  public register<T>(name: string, mockService: T): this {
    this.services.set(name, mockService);
    return this;
  }

  public get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Mock service '${name}' not found`);
    }
    return service as T;
  }

  public reset(): void {
    this.services.clear();
  }

  public resetMocks(): void {
    for (const service of this.services.values()) {
      if (typeof service === 'object') {
        Object.values(service).forEach(method => {
          if (jest.isMockFunction(method)) {
            method.mockReset();
          }
        });
      }
    }
  }

  public static createStandardMocks(): MockServiceFactory {
    return new MockServiceFactory()
      .register('gameState', MockGameLoopService.gameState())
      .register('threatManager', MockThreatService.basic())
      .register('aiService', MockAIService.basic())
      .register('actionProcessor', MockActionService.processor())
      .register('statusEffectManager', MockStatusEffectService.manager())
      .register('combatResolver', MockCombatService.resolver())
      .register('configLoader', MockConfigService.monsterLoader())
      .register('hexUtils', MockUtilityService.hexUtils())
      .register('logger', MockUtilityService.logger());
  }
}

// === MOCK LIFECYCLE UTILITIES ===

/**
 * Resets all mocks in a service
 */
export function resetServiceMocks(service: any): void {
  if (typeof service === 'object') {
    Object.values(service).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReset();
      }
    });
  }
}

/**
 * Sets up service mock return values in bulk
 */
export function setupServiceMockReturns(
  service: any,
  returns: Record<string, any>
): void {
  Object.entries(returns).forEach(([methodName, returnValue]) => {
    const method = service[methodName];
    if (jest.isMockFunction(method)) {
      method.mockReturnValue(returnValue);
    }
  });
}

/**
 * Validates expected service method calls
 */
export function expectServiceMethodsCalled(
  service: any,
  expectedCalls: Record<string, number>
): void {
  Object.entries(expectedCalls).forEach(([methodName, expectedCount]) => {
    const method = service[methodName];
    if (jest.isMockFunction(method)) {
      expect(method).toHaveBeenCalledTimes(expectedCount);
    }
  });
}