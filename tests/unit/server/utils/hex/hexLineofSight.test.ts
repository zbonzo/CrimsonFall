/**
 * Hex Dungeon Crawler - Hex Line of Sight Tests
 * 
 * Unit tests for line of sight and targeting calculations
 * 
 * @file tests/unit/server/utils/hex/hexLineOfSight.test.ts
 */

import {
  hasLineOfSight,
  getHexLine,
  isValidAbilityTarget,
} from '../../../../../server/src/utils/hex/hexLineOfSight.js';

import {
  createHexCoordinate,
} from '../../../../../server/src/utils/hex/hexCoordinates.js';

describe('hexLineOfSight', () => {
  describe('hasLineOfSight', () => {
    it('should allow line of sight for adjacent hexes', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(1, 0);
      
      expect(hasLineOfSight(from, to)).toBe(true);
    });

    it('should allow line of sight with no obstacles', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(3, 0);
      
      expect(hasLineOfSight(from, to)).toBe(true);
    });

    it('should block line of sight with obstacle', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(2, 0);
      const obstacles = new Set(['1,0']);
      
      expect(hasLineOfSight(from, to, obstacles)).toBe(false);
    });

    it('should allow line of sight around obstacle', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(2, 0);
      const obstacles = new Set(['1,-1']); // Off the direct path
      
      expect(hasLineOfSight(from, to, obstacles)).toBe(true);
    });

    it('should handle diagonal line of sight', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(2, -2);
      
      expect(hasLineOfSight(from, to)).toBe(true);
    });

    it('should block diagonal line of sight with obstacle', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(2, -2);
      const obstacles = new Set(['1,-1']);
      
      expect(hasLineOfSight(from, to, obstacles)).toBe(false);
    });

    it('should handle same position', () => {
      const position = createHexCoordinate(1, 1);
      
      expect(hasLineOfSight(position, position)).toBe(true);
    });

    it('should allow sight through empty obstacles set', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(5, 0);
      const emptyObstacles = new Set<string>();
      
      expect(hasLineOfSight(from, to, emptyObstacles)).toBe(true);
    });
  });

  describe('getHexLine', () => {
    it('should return straight horizontal line', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(3, 0);
      
      const line = getHexLine(from, to);
      
      expect(line).toHaveLength(4);
      expect(line[0]).toEqual(from);
      expect(line[3]).toEqual(to);
      expect(line[1]).toEqual(createHexCoordinate(1, 0));
      expect(line[2]).toEqual(createHexCoordinate(2, 0));
    });

    it('should return single hex for same start and end', () => {
      const position = createHexCoordinate(2, -1);
      
      const line = getHexLine(position, position);
      
      expect(line).toEqual([position]);
    });

    it('should handle diagonal lines', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(2, -2);
      
      const line = getHexLine(from, to);
      
      expect(line).toHaveLength(3);
      expect(line[0]).toEqual(from);
      expect(line[2]).toEqual(to);
    });

    it('should handle negative coordinates', () => {
      const from = createHexCoordinate(-1, -1);
      const to = createHexCoordinate(-3, 0);
      
      const line = getHexLine(from, to);
      
      expect(line[0]).toEqual(from);
      expect(line[line.length - 1]).toEqual(to);
      expect(line.length).toBeGreaterThan(1);
    });

    it('should create continuous path', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(4, -2);
      
      const line = getHexLine(from, to);
      
      // Each step should be adjacent to the next
      for (let i = 0; i < line.length - 1; i++) {
        const current = line[i]!;
        const next = line[i + 1]!;
        const distance = Math.max(
          Math.abs(current.q - next.q),
          Math.abs(current.r - next.r),
          Math.abs(current.s - next.s)
        );
        expect(distance).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('isValidAbilityTarget', () => {
    const caster = createHexCoordinate(0, 0);

    it('should allow targeting within range', () => {
      const target = createHexCoordinate(2, 0);
      const range = 3;
      
      expect(isValidAbilityTarget(caster, target, range)).toBe(true);
    });

    it('should reject targets outside range', () => {
      const target = createHexCoordinate(3, 0);
      const range = 2;
      
      expect(isValidAbilityTarget(caster, target, range)).toBe(false);
    });

    it('should allow adjacent targets regardless of obstacles', () => {
      const target = createHexCoordinate(1, 0);
      const range = 1;
      const obstacles = new Set(['1,0']); // Target itself blocked
      
      expect(isValidAbilityTarget(caster, target, range, obstacles)).toBe(true);
    });

    it('should block distant targets behind obstacles', () => {
      const target = createHexCoordinate(3, 0);
      const range = 5;
      const obstacles = new Set(['1,0', '2,0']); // Block path
      
      expect(isValidAbilityTarget(caster, target, range, obstacles)).toBe(false);
    });

    it('should allow targeting self', () => {
      const range = 0;
      
      expect(isValidAbilityTarget(caster, caster, range)).toBe(true);
    });

    it('should handle zero range correctly', () => {
      const target = createHexCoordinate(1, 0);
      const range = 0;
      
      expect(isValidAbilityTarget(caster, target, range)).toBe(false);
    });

    it('should work with diagonal targets', () => {
      const target = createHexCoordinate(2, -2);
      const range = 3;
      
      expect(isValidAbilityTarget(caster, target, range)).toBe(true);
    });

    it('should block diagonal targets behind obstacles', () => {
      const target = createHexCoordinate(2, -2);
      const range = 3;
      const obstacles = new Set(['1,-1']); // Block diagonal path
      
      expect(isValidAbilityTarget(caster, target, range, obstacles)).toBe(false);
    });

    it('should handle large ranges', () => {
      const target = createHexCoordinate(10, -5);
      const range = 15;
      
      expect(isValidAbilityTarget(caster, target, range)).toBe(true);
    });

    it('should work with negative coordinates', () => {
      const casterNeg = createHexCoordinate(-2, -1);
      const targetNeg = createHexCoordinate(-4, 0);
      const range = 3;
      
      expect(isValidAbilityTarget(casterNeg, targetNeg, range)).toBe(true);
    });
  });

  describe('edge cases and performance', () => {
    it('should handle very long lines efficiently', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(20, -10);
      
      const startTime = Date.now();
      const line = getHexLine(from, to);
      const endTime = Date.now();
      
      expect(line.length).toBeGreaterThan(10);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });

    it('should handle line of sight with many obstacles', () => {
      const from = createHexCoordinate(0, 0);
      const to = createHexCoordinate(5, 0);
      
      // Create obstacles that don't block the direct horizontal path
      const manyObstacles = new Set<string>();
      for (let i = -5; i <= 10; i++) {
        for (let j = -5; j <= 5; j++) {
          // Skip the horizontal line from (0,0) to (5,0) - these are at r=0
          if (j !== 0) {
            manyObstacles.add(`${i},${j}`);
          }
        }
      }
      
      // Verify we haven't blocked the path
      const pathHexes = ['0,0', '1,0', '2,0', '3,0', '4,0', '5,0'];
      pathHexes.forEach(hex => {
        expect(manyObstacles.has(hex)).toBe(false);
      });
      
      const startTime = Date.now();
      const result = hasLineOfSight(from, to, manyObstacles);
      const endTime = Date.now();
      
      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // More generous timing
    });
  });
});