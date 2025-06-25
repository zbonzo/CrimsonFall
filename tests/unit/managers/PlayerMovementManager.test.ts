/**
 * Hex Dungeon Crawler - PlayerMovementManager Tests
 *
 * Unit tests for player movement and positioning system
 * Tests hex-based movement, position validation, and tactical positioning
 *
 * @file tests/unit/server/core/player/PlayerMovementManager.test.ts
 */

import { PlayerMovementManager } from '../../../../../server/src/core/player/PlayerMovementManager.js';
import type { HexCoordinate } from '../../../../../server/src/utils/hexMath.js';

// === TEST FIXTURES ===

const ORIGIN: HexCoordinate = { q: 0, r: 0, s: 0 };
const ADJACENT_POSITIONS: HexCoordinate[] = [
  { q: 1, r: 0, s: -1 },
  { q: 0, r: 1, s: -1 },
  { q: -1, r: 1, s: 0 },
  { q: -1, r: 0, s: 1 },
  { q: 0, r: -1, s: 1 },
  { q: 1, r: -1, s: 0 },
];

const FAR_POSITION: HexCoordinate = { q: 5, r: 5, s: -10 };
const NEAR_POSITION: HexCoordinate = { q: 2, r: 1, s: -3 };

// === HELPER FUNCTIONS ===

function createMovementManager(
  startingPosition: HexCoordinate = ORIGIN,
  movementRange: number = 3
): PlayerMovementManager {
  return new PlayerMovementManager(startingPosition, movementRange);
}

function createObstacleSet(positions: HexCoordinate[]): ReadonlySet<string> {
  return new Set(positions.map(pos => `${pos.q},${pos.r},${pos.s}`));
}

function createOccupiedSet(positions: HexCoordinate[]): ReadonlySet<string> {
  return new Set(positions.map(pos => `${pos.q},${pos.r},${pos.s}`));
}

// === TESTS ===

describe('PlayerMovementManager', () => {
  describe('initialization', () => {
    test('should initialize with default position and range', () => {
      const manager = createMovementManager();

      expect(manager.currentPosition).toEqual(ORIGIN);
      expect(manager.startingPosition).toEqual(ORIGIN);
      expect(manager.movementRange).toBe(3);
      expect(manager.hasMovedThisRound).toBe(false);
      expect(manager.movementHistory).toHaveLength(1);
      expect(manager.movementHistory[0]).toEqual(ORIGIN);
    });

    test('should initialize with custom position and range', () => {
      const customPos = { q: 2, r: -1, s: -1 };
      const manager = createMovementManager(customPos, 5);

      expect(manager.currentPosition).toEqual(customPos);
      expect(manager.startingPosition).toEqual(customPos);
      expect(manager.movementRange).toBe(5);
      expect(manager.movementHistory[0]).toEqual(customPos);
    });
  });

  describe('position validation', () => {
    test('should validate reachable positions correctly', () => {
      const manager = createMovementManager();

      // Adjacent positions should be reachable
      ADJACENT_POSITIONS.forEach(pos => {
        expect(manager.isPositionReachable(pos)).toBe(true);
      });

      // Near position within range should be reachable
      expect(manager.isPositionReachable(NEAR_POSITION)).toBe(true);

      // Far position should not be reachable
      expect(manager.isPositionReachable(FAR_POSITION)).toBe(false);
    });

    test('should validate position availability correctly', () => {
      const manager = createMovementManager();
      const obstacles = createObstacleSet([ADJACENT_POSITIONS[0]]);
      const occupied = createOccupiedSet([ADJACENT_POSITIONS[1]]);

      // Free position should be valid
      const result1 = manager.isPositionValid(ADJACENT_POSITIONS[2]);
      expect(result1.valid).toBe(true);

      // Obstacle position should be invalid
      const result2 = manager.isPositionValid(ADJACENT_POSITIONS[0], new Set(), obstacles);
      expect(result2.valid).toBe(false);
      expect(result2.reason).toBe('Position is blocked by obstacle');

      // Occupied position should be invalid
      const result3 = manager.isPositionValid(ADJACENT_POSITIONS[1], occupied);
      expect(result3.valid).toBe(false);
      expect(result3.reason).toBe('Position is occupied');
    });

    test('should check movement availability correctly', () => {
      const manager = createMovementManager();

      // Initially should be able to move
      expect(manager.canMove().allowed).toBe(true);

      // After moving, should not be able to move again
      manager.moveTo(ADJACENT_POSITIONS[0]);
      expect(manager.canMove().allowed).toBe(false);
      expect(manager.canMove().reason).toBe('Already moved this round');
    });
  });

  describe('movement execution', () => {
    test('should execute valid movement correctly', () => {
      const manager = createMovementManager();
      const targetPos = ADJACENT_POSITIONS[0];

      const result = manager.moveTo(targetPos);

      expect(result.success).toBe(true);
      expect(result.newPosition).toEqual(targetPos);
      expect(manager.currentPosition).toEqual(targetPos);
      expect(manager.hasMovedThisRound).toBe(true);
      expect(manager.movementHistory).toHaveLength(2);
      expect(manager.movementHistory[1]).toEqual(targetPos);
    });

    test('should reject movement when already moved', () => {
      const manager = createMovementManager();
      manager.moveTo(ADJACENT_POSITIONS[0]);

      const result = manager.moveTo(ADJACENT_POSITIONS[1]);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Already moved this round');
      expect(manager.currentPosition).toEqual(ADJACENT_POSITIONS[0]);
    });

    test('should reject movement outside range', () => {
      const manager = createMovementManager();

      const result = manager.moveTo(FAR_POSITION);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Position too far');
      expect(manager.currentPosition).toEqual(ORIGIN);
      expect(manager.hasMovedThisRound).toBe(false);
    });

    test('should reject movement to occupied position', () => {
      const manager = createMovementManager();
      const occupied = createOccupiedSet([ADJACENT_POSITIONS[0]]);

      const result = manager.moveTo(ADJACENT_POSITIONS[0], occupied);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Position is occupied');
      expect(manager.currentPosition).toEqual(ORIGIN);
      expect(manager.hasMovedThisRound).toBe(false);
    });
  });

  describe('basic functionality', () => {
    test('should calculate distance correctly', () => {
      const manager = createMovementManager();

      // Distance to adjacent should be 1
      const distanceToAdjacent = manager.getDistanceTo(ADJACENT_POSITIONS[0]);
      expect(distanceToAdjacent).toBe(1);

      // Distance to near position should be 3
      const distanceToNear = manager.getDistanceTo(NEAR_POSITION);
      expect(distanceToNear).toBe(3);
    });

    test('should check position equality correctly', () => {
      const manager = createMovementManager();

      expect(manager.isAtPosition(ORIGIN)).toBe(true);
      expect(manager.isAtPosition(ADJACENT_POSITIONS[0])).toBe(false);

      // After moving
      manager.moveTo(ADJACENT_POSITIONS[0]);
      expect(manager.isAtPosition(ORIGIN)).toBe(false);
      expect(manager.isAtPosition(ADJACENT_POSITIONS[0])).toBe(true);
    });

    test('should reset movement state for new round', () => {
      const manager = createMovementManager();
      manager.moveTo(ADJACENT_POSITIONS[0]);

      expect(manager.hasMovedThisRound).toBe(true);

      manager.resetForNewRound();

      expect(manager.hasMovedThisRound).toBe(false);
      expect(manager.currentPosition).toEqual(ADJACENT_POSITIONS[0]); // Position preserved
    });
  });
});
