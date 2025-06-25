/**
 * @fileoverview Common test utilities and helper functions
 * Provides reusable test functionality across all test suites
 *
 * @file tests/helpers/testUtils.ts
 */

import type { HexCoordinate } from '@/utils/hex/index.js';
import type { PlayerClass } from '@/core/types/entityTypes.js';
import { Player } from '@/core/entities/Player.js';
import { Monster, MonsterFactory } from '@/core/entities/Monster.js';

// === COORDINATE UTILITIES ===

/**
 * Creates a valid hex coordinate for testing
 */
export function createTestHex(q: number, r: number): HexCoordinate {
  return { q, r, s: -q - r };
}

/**
 * Creates the origin hex coordinate
 */
export const ORIGIN_HEX: HexCoordinate = { q: 0, r: 0, s: 0 };

/**
 * Creates a set of hex coordinates for common test positions
 */
export const TEST_POSITIONS = {
  origin: createTestHex(0, 0),
  adjacent: [
    createTestHex(1, -1), createTestHex(1, 0), createTestHex(0, 1),
    createTestHex(-1, 1), createTestHex(-1, 0), createTestHex(0, -1)
  ],
  distant: createTestHex(5, -3),
  ring1: [
    createTestHex(1, -1), createTestHex(1, 0), createTestHex(0, 1),
    createTestHex(-1, 1), createTestHex(-1, 0), createTestHex(0, -1)
  ],
  ring2: [
    createTestHex(2, -2), createTestHex(2, -1), createTestHex(1, 1),
    createTestHex(-1, 2), createTestHex(-2, 2), createTestHex(-2, 1)
  ]
};

/**
 * Validates that a hex coordinate is properly formed
 */
export function expectValidHex(hex: HexCoordinate): void {
  expect(Math.abs(hex.q + hex.r + hex.s)).toBeLessThan(Number.EPSILON);
}

// === ENTITY FACTORIES ===

/**
 * Creates a basic test player class configuration
 */
export function createTestPlayerClass(overrides: Partial<PlayerClass> = {}): PlayerClass {
  return {
    id: 'test_fighter',
    name: 'Test Fighter',
    type: 'player',
    description: 'A basic fighter for testing',
    stats: {
      maxHp: 100,
      baseArmor: 2,
      baseDamage: 15,
      movementRange: 3,
      ...overrides.stats
    },
    abilities: [],
    startingAbilities: [],
    ...overrides
  };
}

/**
 * Creates a test player with default configuration
 */
export function createTestPlayer(
  id: string = 'test_player',
  name: string = 'Test Player',
  position: HexCoordinate = ORIGIN_HEX,
  classOverrides: Partial<PlayerClass> = {}
): Player {
  const playerClass = createTestPlayerClass(classOverrides);
  return new Player(id, name, playerClass, position);
}

/**
 * Creates a test monster with default configuration
 */
export function createTestMonster(
  id: string = 'test_monster',
  name: string = 'Test Monster',
  position: HexCoordinate = createTestHex(3, 0),
  configOverrides: any = {}
): Monster {
  const defaultConfig = {
    id: 'test_goblin',
    name: 'Test Goblin',
    type: 'monster' as const,
    stats: {
      maxHp: 50,
      baseArmor: 1,
      baseDamage: 12,
      movementRange: 4
    },
    abilities: [],
    aiType: 'aggressive' as const,
    difficulty: 1,
    ...configOverrides
  };

  return MonsterFactory.createFromConfig(id, defaultConfig, position);
}

// === COLLECTION UTILITIES ===

/**
 * Creates a set of test players for multi-player scenarios
 */
export function createTestPlayerSet(count: number = 2): Player[] {
  return Array.from({ length: count }, (_, i) => 
    createTestPlayer(
      `player${i}`,
      `Player${i}`,
      createTestHex(i, 0)
    )
  );
}

/**
 * Creates a set of test monsters for multi-monster scenarios
 */
export function createTestMonsterSet(count: number = 2): Monster[] {
  return Array.from({ length: count }, (_, i) => 
    createTestMonster(
      `monster${i}`,
      `Monster${i}`,
      createTestHex(i + 3, 0)
    )
  );
}

// === TIMING UTILITIES ===

/**
 * Waits for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Runs a function and measures its execution time
 */
export async function measureTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// === ASSERTION HELPERS ===

/**
 * Helper to check if two hex coordinates are equal
 */
export function expectHexEqual(actual: HexCoordinate, expected: HexCoordinate): void {
  expect(actual.q).toBe(expected.q);
  expect(actual.r).toBe(expected.r);
  expect(actual.s).toBe(expected.s);
}

/**
 * Helper to check if a coordinate is in a list of coordinates
 */
export function expectHexInList(coordinate: HexCoordinate, list: HexCoordinate[]): void {
  const found = list.some(hex => 
    hex.q === coordinate.q && hex.r === coordinate.r && hex.s === coordinate.s
  );
  expect(found).toBe(true);
}

/**
 * Helper to check entity health ranges
 */
export function expectHealthInRange(entity: { currentHp: number; maxHp: number }, min: number, max: number): void {
  expect(entity.currentHp).toBeGreaterThanOrEqual(min);
  expect(entity.currentHp).toBeLessThanOrEqual(max);
  expect(entity.currentHp).toBeLessThanOrEqual(entity.maxHp);
}

// === RANDOM DATA GENERATORS ===

/**
 * Generates a random hex coordinate within a given range
 */
export function randomHexInRange(maxDistance: number): HexCoordinate {
  const q = Math.floor(Math.random() * (maxDistance * 2 + 1)) - maxDistance;
  const r = Math.floor(Math.random() * (maxDistance * 2 + 1)) - maxDistance;
  const s = -q - r;
  
  // Ensure it's within the distance limit
  if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= maxDistance) {
    return { q, r, s };
  }
  return randomHexInRange(maxDistance); // Try again if outside range
}

/**
 * Generates random test data for stress testing
 */
export function generateRandomTestData(entityCount: number): {
  players: Player[];
  monsters: Monster[];
  positions: HexCoordinate[];
} {
  const positions: HexCoordinate[] = [];
  const players: Player[] = [];
  const monsters: Monster[] = [];

  // Generate unique positions
  for (let i = 0; i < entityCount * 2; i++) {
    let position: HexCoordinate;
    let attempts = 0;
    do {
      position = randomHexInRange(10);
      attempts++;
    } while (
      attempts < 100 && 
      positions.some(p => p.q === position.q && p.r === position.r)
    );
    positions.push(position);
  }

  // Create players
  for (let i = 0; i < entityCount; i++) {
    players.push(createTestPlayer(`player${i}`, `Player${i}`, positions[i]!));
  }

  // Create monsters
  for (let i = 0; i < entityCount; i++) {
    monsters.push(createTestMonster(`monster${i}`, `Monster${i}`, positions[i + entityCount]!));
  }

  return { players, monsters, positions };
}

// === DEBUG UTILITIES ===

/**
 * Pretty prints entity state for debugging
 */
export function debugEntityState(entity: Player | Monster): void {
  console.log(`\n=== ${entity.name} (${entity.id}) ===`);
  console.log(`HP: ${entity.currentHp}/${entity.maxHp}`);
  console.log(`Position: (${entity.position.q}, ${entity.position.r}, ${entity.position.s})`);
  console.log(`Alive: ${entity.isAlive}`);
  console.log(`Can Act: ${entity.canAct()}`);
  console.log(`Can Move: ${entity.canMove()}`);
  
  if (entity.activeStatusEffects.length > 0) {
    console.log(`Status Effects: ${entity.activeStatusEffects.map(e => `${e.name}(${e.duration})`).join(', ')}`);
  }
}

/**
 * Pretty prints game state for debugging
 */
export function debugGameState(players: Player[], monsters: Monster[]): void {
  console.log('\n=== GAME STATE DEBUG ===');
  console.log('Players:');
  players.forEach(debugEntityState);
  console.log('\nMonsters:');
  monsters.forEach(debugEntityState);
  console.log('\n========================\n');
}

// === PERFORMANCE TESTING UTILITIES ===

/**
 * Benchmarks a function execution multiple times
 */
export async function benchmark(
  name: string,
  fn: () => Promise<any> | any,
  iterations: number = 100
): Promise<{ 
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}> {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureTime(fn);
    times.push(duration);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    name,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime
  };
}

/**
 * Runs performance assertions
 */
export function expectPerformance(
  benchmarkResult: Awaited<ReturnType<typeof benchmark>>,
  maxAverageMs: number
): void {
  expect(benchmarkResult.averageTime).toBeLessThan(maxAverageMs);
  console.log(`✓ ${benchmarkResult.name}: ${benchmarkResult.averageTime.toFixed(2)}ms avg (${benchmarkResult.iterations} iterations)`);
}