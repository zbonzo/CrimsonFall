/**
 * Hex Dungeon Crawler - Hex Math Utility Tests
 * 
 * Comprehensive test suite for hexagonal grid mathematics
 * Tests the modular hex utility system
 * 
 * @file tests/unit/server/utils/hexMath.test.ts
 */

import {
  calculateHexDistance,
  createHexCoordinate,
  findHexPath,
  getHexNeighbors,
  getHexRing,
  getHexesInRange,
  getTacticalPositions,
  hexToDisplayString,
  isValidAbilityTarget,
  isValidHexCoordinate,
  isHexInRing,
  hasLineOfSight,
  getHexLine,
  roundHex,
  HexCoordinate,
} from '../../../../server/src/utils/hex/index.js';

describe('hexMath utilities', () => {
  // === COORDINATE CREATION & VALIDATION ===
  describe('createHexCoordinate', () => {
    it('should create valid hex coordinates', () => {
      const hex = createHexCoordinate(1, 2);
      
      expect(hex.q).toBe(1);
      expect(hex.r).toBe(2);
      expect(hex.s).toBe(-3);
      expect(hex.q + hex.r + hex.s).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const hex = createHexCoordinate(-2, -1);
      
      expect(hex.q).toBe(-2);
      expect(hex.r).toBe(-1);
      expect(hex.s).toBe(3);
      expect(hex.q + hex.r + hex.s).toBe(0);
    });

    it('should handle zero coordinates', () => {
      const hex = createHexCoordinate(0, 0);
      
      expect(hex.q).toBe(0);
      expect(hex.r).toBe(0);
      expect(hex.s).toBe(0);
    });
  });

  describe('isValidHexCoordinate', () => {
    it('should validate correct hex coordinates', () => {
      const validHex = createHexCoordinate(1, -1);
      expect(isValidHexCoordinate(validHex)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      const invalidHex = { q: 1, r: 1, s: 1 };
      expect(isValidHexCoordinate(invalidHex)).toBe(false);
    });
  });

  // === DISTANCE CALCULATIONS ===
  describe('calculateHexDistance', () => {
    const origin = createHexCoordinate(0, 0);

    it('should calculate distance to adjacent hexes', () => {
      const adjacent = createHexCoordinate(1, 0);
      expect(calculateHexDistance(origin, adjacent)).toBe(1);
    });

    it('should calculate distance to diagonal hexes', () => {
      const diagonal = createHexCoordinate(1, -1);
      expect(calculateHexDistance(origin, diagonal)).toBe(1);
    });

    it('should calculate longer distances correctly', () => {
      const distant = createHexCoordinate(3, -2);
      expect(calculateHexDistance(origin, distant)).toBe(3);
    });

    it('should be symmetric', () => {
      const hexA = createHexCoordinate(2, 1);
      const hexB = createHexCoordinate(-1, 3);
      
      expect(calculateHexDistance(hexA, hexB))
        .toBe(calculateHexDistance(hexB, hexA));
    });

    it('should return 0 for same coordinate', () => {
      const hex = createHexCoordinate(5, -2);
      expect(calculateHexDistance(hex, hex)).toBe(0);
    });
  });

  // === RANGE AND AREA CALCULATIONS ===
  describe('getHexesInRange', () => {
    const center = createHexCoordinate(0, 0);

    it('should return only center for range 0', () => {
      const hexes = getHexesInRange(center, 0);
      
      expect(hexes).toHaveLength(1);
      expect(hexes[0]).toEqual(center);
    });

    it('should return 7 hexes for range 1', () => {
      const hexes = getHexesInRange(center, 1);
      
      expect(hexes).toHaveLength(7); // center + 6 neighbors
    });

    it('should return 19 hexes for range 2', () => {
      const hexes = getHexesInRange(center, 2);
      
      expect(hexes).toHaveLength(19); // 1 + 6 + 12
    });

    it('should throw error for negative range', () => {
      expect(() => getHexesInRange(center, -1))
        .toThrow('Range must be non-negative');
    });

    it('should include hexes at exact range distance', () => {
      const hexes = getHexesInRange(center, 2);
      const edgeHex = createHexCoordinate(2, 0);
      
      expect(hexes).toContainEqual(edgeHex);
      expect(calculateHexDistance(center, edgeHex)).toBe(2);
    });
  });

  describe('getHexNeighbors', () => {
    it('should return 6 neighbors for any hex', () => {
      const hex = createHexCoordinate(3, -1);
      const neighbors = getHexNeighbors(hex);
      
      expect(neighbors).toHaveLength(6);
    });

    it('should return neighbors at distance 1', () => {
      const center = createHexCoordinate(0, 0);
      const neighbors = getHexNeighbors(center);
      
      neighbors.forEach((neighbor: HexCoordinate) => {
        expect(calculateHexDistance(center, neighbor)).toBe(1);
      });
    });

    it('should return expected neighbors for origin', () => {
      const origin = createHexCoordinate(0, 0);
      const neighbors = getHexNeighbors(origin);
      
      const expectedNeighbors = [
        createHexCoordinate(1, -1),  // NE
        createHexCoordinate(1, 0),   // E
        createHexCoordinate(0, 1),   // SE
        createHexCoordinate(-1, 1),  // SW
        createHexCoordinate(-1, 0),  // W
        createHexCoordinate(0, -1)   // NW
      ];
      
      expect(neighbors).toEqual(expectedNeighbors);
    });
  });

  describe('getHexRing', () => {
    const center = createHexCoordinate(0, 0);

    it('should return center for radius 0', () => {
      const ring = getHexRing(center, 0);
      
      expect(ring).toHaveLength(1);
      expect(ring[0]).toEqual(center);
    });

    it('should return 6 hexes for radius 1', () => {
      const ring = getHexRing(center, 1);
      
      expect(ring).toHaveLength(6);
      ring.forEach((hex: HexCoordinate) => {
        expect(calculateHexDistance(center, hex)).toBe(1);
      });
    });

    it('should return 12 hexes for radius 2', () => {
      const ring = getHexRing(center, 2);
      
      expect(ring).toHaveLength(12);
      ring.forEach((hex: HexCoordinate) => {
        expect(calculateHexDistance(center, hex)).toBe(2);
      });
    });
  });

  // === PATHFINDING ===
  describe('findHexPath', () => {
    it('should find direct path with no obstacles', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(2, 0);
      
      const path = findHexPath(start, goal);
      
      expect(path).not.toBeNull();
      if (path) {
        expect(path[0]).toEqual(start);
        expect(path[path.length - 1]).toEqual(goal);
        expect(path.length).toBe(3); // start, middle, goal
      }
    });

    it('should return null when no path exists', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(1, 0);
      
      // Goal itself is blocked
      const obstacles = new Set(['1,0']);
      
      const path = findHexPath(start, goal, obstacles);
      
      expect(path).toBeNull();
    });

    it('should find path around obstacles', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(2, 0);
      
      // Block direct path
      const obstacles = new Set(['1,0']);
      
      const path = findHexPath(start, goal, obstacles);
      
      expect(path).not.toBeNull();
      if (path) {
        expect(path[0]).toEqual(start);
        expect(path[path.length - 1]).toEqual(goal);
        expect(path.length).toBeGreaterThan(3);
      }
    });

    it('should return single hex path for same start and goal', () => {
      const position = createHexCoordinate(1, 1);
      
      const path = findHexPath(position, position);
      
      expect(path).toEqual([position]);
    });
  });

  // === LINE OF SIGHT ===
  describe('hasLineOfSight', () => {
    it('should allow adjacent hexes', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(1, 0);
      
      expect(hasLineOfSight(from, to)).toBe(true);
    });

    it('should block sight through obstacles', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(2, 0);
      const obstacles = new Set(['1,0']);
      
      expect(hasLineOfSight(from, to, obstacles)).toBe(false);
    });

    it('should allow sight with no obstacles', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(3, 0);
      
      expect(hasLineOfSight(from, to)).toBe(true);
    });
  });

  describe('getHexLine', () => {
    it('should return straight line between hexes', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(2, 0);
      
      const line = getHexLine(from, to);
      
      expect(line).toHaveLength(3);
      expect(line[0]).toEqual(from);
      expect(line[2]).toEqual(to);
    });

    it('should handle same start and end', () => {
      const hex = createHexCoordinate(1, 1);
      
      const line = getHexLine(hex, hex);
      
      expect(line).toEqual([hex]);
    });
  });

  // === GAME-SPECIFIC FUNCTIONS ===
  describe('isValidAbilityTarget', () => {
    const casterPosition = createHexCoordinate(0, 0);

    it('should allow targeting within range', () => {
      const targetPosition = createHexCoordinate(2, 0);
      
      const isValid = isValidAbilityTarget(casterPosition, targetPosition, 3);
      
      expect(isValid).toBe(true);
    });

    it('should reject targets outside range', () => {
      const targetPosition = createHexCoordinate(3, 0);
      
      const isValid = isValidAbilityTarget(casterPosition, targetPosition, 2);
      
      expect(isValid).toBe(false);
    });

    it('should allow adjacent targets regardless of obstacles', () => {
      const targetPosition = createHexCoordinate(1, 0);
      const obstacles = new Set(['1,0']); // Target position blocked
      
      const isValid = isValidAbilityTarget(casterPosition, targetPosition, 1, obstacles);
      
      expect(isValid).toBe(true);
    });

    it('should block targets behind obstacles', () => {
      const casterPosition = createHexCoordinate(0, 0);
      const targetPosition = createHexCoordinate(2, 0);
      
      // Block the direct path at (1,0)
      const obstacles = new Set(['1,0']);
      
      const isValid = isValidAbilityTarget(casterPosition, targetPosition, 3, obstacles);
      
      expect(isValid).toBe(false);
    });
  });

  describe('getTacticalPositions', () => {
    const currentPosition = createHexCoordinate(0, 0);
    const targetPosition = createHexCoordinate(5, 0);

    it('should return aggressive and defensive positions', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, 3);
      
      expect(positions).toHaveProperty('aggressive');
      expect(positions).toHaveProperty('defensive');
      expect(Array.isArray(positions.aggressive)).toBe(true);
      expect(Array.isArray(positions.defensive)).toBe(true);
    });

    it('should sort aggressive positions by proximity to target', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, 3);
      
      for (let i = 1; i < positions.aggressive.length; i++) {
        const prevDistance = calculateHexDistance(positions.aggressive[i - 1]!, targetPosition);
        const currDistance = calculateHexDistance(positions.aggressive[i]!, targetPosition);
        expect(prevDistance).toBeLessThanOrEqual(currDistance);
      }
    });

    it('should sort defensive positions by distance from target', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, 3);
      
      for (let i = 1; i < positions.defensive.length; i++) {
        const prevDistance = calculateHexDistance(positions.defensive[i - 1]!, targetPosition);
        const currDistance = calculateHexDistance(positions.defensive[i]!, targetPosition);
        expect(prevDistance).toBeGreaterThanOrEqual(currDistance);
      }
    });
  });

  // === UTILITY FUNCTIONS ===
  describe('hexToDisplayString', () => {
    it('should format coordinates correctly', () => {
      const hex = createHexCoordinate(3, -2);
      
      expect(hexToDisplayString(hex)).toBe('(3, -2)');
    });

    it('should handle negative coordinates', () => {
      const hex = createHexCoordinate(-1, -1);
      
      expect(hexToDisplayString(hex)).toBe('(-1, -1)');
    });

    it('should handle zero coordinates', () => {
      const hex = createHexCoordinate(0, 0);
      
      expect(hexToDisplayString(hex)).toBe('(0, 0)');
    });
  });

  describe('roundHex', () => {
    it('should round fractional coordinates correctly', () => {
      const fractional = { q: 1.2, r: -0.7, s: -0.5 };
      const rounded = roundHex(fractional);
      
      expect(rounded.q + rounded.r + rounded.s).toBe(0);
      expect(isValidHexCoordinate(rounded)).toBe(true);
    });
  });

  describe('isHexInRing', () => {
    it('should identify hexes in specific ring', () => {
      const center = createHexCoordinate(0, 0);
      const ringHex = createHexCoordinate(2, 0);
      
      expect(isHexInRing(ringHex, center, 2)).toBe(true);
      expect(isHexInRing(ringHex, center, 1)).toBe(false);
    });
  });

  // === EDGE CASES AND ERROR CONDITIONS ===
  describe('edge cases', () => {
    it('should handle large coordinates', () => {
      const hex1 = createHexCoordinate(1000, -500);
      const hex2 = createHexCoordinate(-1000, 500);
      
      expect(isValidHexCoordinate(hex1)).toBe(true);
      expect(isValidHexCoordinate(hex2)).toBe(true);
      expect(calculateHexDistance(hex1, hex2)).toBe(2000);
    });

    it('should handle floating point precision', () => {
      const hex = createHexCoordinate(0.1, -0.1);
      
      // Should still be valid due to epsilon comparison
      expect(isValidHexCoordinate(hex)).toBe(true);
    });
  });

  // === PERFORMANCE TESTS ===
  describe('performance', () => {
    it('should handle range calculations efficiently', () => {
      const center = createHexCoordinate(0, 0);
      const startTime = Date.now();
      
      getHexesInRange(center, 5); // 91 hexes
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should reject pathfinding for excessive distances', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(100, 0);
      
      const path = findHexPath(start, goal);
      
      expect(path).toBeNull(); // Should reject due to MAX_PATHFINDING_DISTANCE
    });
  });
});