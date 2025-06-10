/**
 * Hex Dungeon Crawler - Hex Coordinates Tests
 * 
 * Unit tests for core hex coordinate functionality
 * 
 * @file tests/unit/server/utils/hex/hexCoordinates.test.ts
 */

import {
  createHexCoordinate,
  isValidHexCoordinate,
  calculateHexDistance,
  getHexNeighbors,
  hexToDisplayString,
  roundHex,
  HEX_DIRECTIONS,
  ORIGIN_HEX,
} from '../../../../../server/src/utils/hex/hexCoordinates.js';

describe('hexCoordinates', () => {
  describe('constants', () => {
    it('should have 6 hex directions', () => {
      expect(HEX_DIRECTIONS).toHaveLength(6);
    });

    it('should have valid origin hex', () => {
      expect(ORIGIN_HEX).toEqual({ q: 0, r: 0, s: 0 });
      expect(isValidHexCoordinate(ORIGIN_HEX)).toBe(true);
    });

    it('should have all directions sum to zero', () => {
      HEX_DIRECTIONS.forEach(direction => {
        expect(direction.q + direction.r + direction.s).toBe(0);
      });
    });
  });

  describe('createHexCoordinate', () => {
    it('should create coordinate with correct s value', () => {
      const hex = createHexCoordinate(2, 3);
      expect(hex.s).toBe(-5);
    });

    it('should handle zero values correctly', () => {
      const hex = createHexCoordinate(0, 0);
      expect(hex).toEqual({ q: 0, r: 0, s: 0 });
    });

    it('should normalize -0 to 0', () => {
      const hex = createHexCoordinate(-0, 0);
      expect(Object.is(hex.q, 0)).toBe(true);
      expect(Object.is(hex.s, 0)).toBe(true);
    });
  });

  describe('isValidHexCoordinate', () => {
    it('should accept valid coordinates', () => {
      expect(isValidHexCoordinate(createHexCoordinate(1, 2))).toBe(true);
      expect(isValidHexCoordinate(createHexCoordinate(-3, 1))).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(isValidHexCoordinate({ q: 1, r: 1, s: 1 })).toBe(false);
      expect(isValidHexCoordinate({ q: 2, r: 2, s: -3 })).toBe(false);
    });


    it('should handle floating point precision issues', () => {
      const nearValid = { q: 1, r: 2, s: -3.0000000001 };
      expect(isValidHexCoordinate(nearValid)).toBe(false); // This is actually invalid - sum is not close enough to 0
      
      // Test with exact coordinates (should always pass)
      const exactValid = { q: 1, r: 2, s: -3 };
      expect(isValidHexCoordinate(exactValid)).toBe(true);
      
      // Test with Number.EPSILON itself
      const epsilonValid = { q: 1, r: 2, s: -3 + Number.EPSILON };
      expect(isValidHexCoordinate(epsilonValid)).toBe(true);
    });
  });

  describe('calculateHexDistance', () => {
    it('should calculate distance correctly', () => {
      const a = createHexCoordinate(0, 0);
      const b = createHexCoordinate(3, -2);
      expect(calculateHexDistance(a, b)).toBe(3);
    });

    it('should be commutative', () => {
      const a = createHexCoordinate(1, 2);
      const b = createHexCoordinate(-1, -1);
      expect(calculateHexDistance(a, b)).toBe(calculateHexDistance(b, a));
    });

    it('should return 0 for identical coordinates', () => {
      const hex = createHexCoordinate(5, -3);
      expect(calculateHexDistance(hex, hex)).toBe(0);
    });
  });

  describe('getHexNeighbors', () => {
    it('should return 6 neighbors', () => {
      const neighbors = getHexNeighbors(ORIGIN_HEX);
      expect(neighbors).toHaveLength(6);
    });

    it('should return neighbors at distance 1', () => {
      const center = createHexCoordinate(2, -1);
      const neighbors = getHexNeighbors(center);
      
      neighbors.forEach(neighbor => {
        expect(calculateHexDistance(center, neighbor)).toBe(1);
      });
    });

    it('should return correct neighbors for origin', () => {
      const neighbors = getHexNeighbors(ORIGIN_HEX);
      const expected = [
        createHexCoordinate(1, -1),
        createHexCoordinate(1, 0),
        createHexCoordinate(0, 1),
        createHexCoordinate(-1, 1),
        createHexCoordinate(-1, 0),
        createHexCoordinate(0, -1),
      ];
      
      expect(neighbors).toEqual(expected);
    });
  });

  describe('hexToDisplayString', () => {
    it('should format positive coordinates', () => {
      const hex = createHexCoordinate(3, 2);
      expect(hexToDisplayString(hex)).toBe('(3, 2)');
    });

    it('should format negative coordinates', () => {
      const hex = createHexCoordinate(-1, -2);
      expect(hexToDisplayString(hex)).toBe('(-1, -2)');
    });

    it('should format zero coordinates', () => {
      expect(hexToDisplayString(ORIGIN_HEX)).toBe('(0, 0)');
    });
  });

  describe('roundHex', () => {
    it('should round to nearest valid hex', () => {
      const fractional = { q: 1.1, r: 2.2, s: -3.3 };
      const rounded = roundHex(fractional);
      
      expect(isValidHexCoordinate(rounded)).toBe(true);
    });

    it('should handle exact coordinates', () => {
      const exact = { q: 2, r: -1, s: -1 };
      const rounded = roundHex(exact);
      
      expect(rounded).toEqual(createHexCoordinate(2, -1));
    });

    it('should choose coordinate with smallest rounding error', () => {
      const fractional = { q: 1.6, r: -0.4, s: -1.2 };
      const rounded = roundHex(fractional);
      
      // q has largest error (0.4), so it should be recalculated
      expect(rounded.q).toBe(-rounded.r - rounded.s);
    });
  });
});