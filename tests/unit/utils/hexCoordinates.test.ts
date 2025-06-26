/**
 * @fileoverview Unit tests for hex coordinate utilities
 * Tests pure mathematical functions in isolation
 * 
 * @file tests/unit/utils/hexCoordinates.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  createHexCoordinate,
  calculateHexDistance,
  getHexNeighbors,
  isValidHexCoordinate,
  hexToDisplayString,
  roundHex,
  ORIGIN_HEX,
  HEX_DIRECTIONS,
} from '@/utils/hex/hexCoordinates';

describe('Hex Coordinate Utilities', () => {
  describe('createHexCoordinate', () => {
    it('should create valid hex coordinates', () => {
      const hex = createHexCoordinate(1, 2);
      
      expect(hex.q).toBe(1);
      expect(hex.r).toBe(2);
      expect(hex.s).toBe(-3); // q + r + s = 0
    });

    it('should handle zero coordinates', () => {
      const origin = createHexCoordinate(0, 0);
      
      expect(origin.q).toBe(0);
      expect(origin.r).toBe(0);
      expect(origin.s).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const hex = createHexCoordinate(-2, 3);
      
      expect(hex.q).toBe(-2);
      expect(hex.r).toBe(3);
      expect(hex.s).toBe(-1);
    });

    it('should always maintain q + r + s = 0 constraint', () => {
      const testCases: [number, number][] = [
        [0, 0], [1, 0], [0, 1], [-1, 1], [5, -3], [-10, 7]
      ];

      testCases.forEach(([q, r]) => {
        const hex = createHexCoordinate(q, r);
        expect(hex.q + hex.r + hex.s).toBe(0);
      });
    });
  });

  describe('calculateHexDistance', () => {
    it('should calculate distance between adjacent hexes', () => {
      const hex1 = createHexCoordinate(0, 0);
      const hex2 = createHexCoordinate(1, 0);
      
      const distance = calculateHexDistance(hex1, hex2);
      
      expect(distance).toBe(1);
    });

    it('should calculate distance between distant hexes', () => {
      const hex1 = createHexCoordinate(0, 0);
      const hex2 = createHexCoordinate(3, -2);
      
      const distance = calculateHexDistance(hex1, hex2);
      
      expect(distance).toBe(3);
    });

    it('should return zero for same hex', () => {
      const hex = createHexCoordinate(2, -1);
      
      const distance = calculateHexDistance(hex, hex);
      
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const hex1 = createHexCoordinate(-2, 3);
      const hex2 = createHexCoordinate(1, -1);
      
      const distance = calculateHexDistance(hex1, hex2);
      
      expect(distance).toBe(4);
    });

    it('should be symmetric', () => {
      const hex1 = createHexCoordinate(3, -1);
      const hex2 = createHexCoordinate(-2, 4);
      
      const dist1to2 = calculateHexDistance(hex1, hex2);
      const dist2to1 = calculateHexDistance(hex2, hex1);
      
      expect(dist1to2).toBe(dist2to1);
    });
  });

  describe('getHexNeighbors', () => {
    it('should return 6 neighbors for any hex', () => {
      const hex = createHexCoordinate(1, 1);
      
      const neighbors = getHexNeighbors(hex);
      
      expect(neighbors).toHaveLength(6);
    });

    it('should return valid hex coordinates as neighbors', () => {
      const hex = createHexCoordinate(0, 0);
      
      const neighbors = getHexNeighbors(hex);
      
      neighbors.forEach(neighbor => {
        expect(isValidHexCoordinate(neighbor)).toBe(true);
        expect(calculateHexDistance(hex, neighbor)).toBe(1);
      });
    });

    it('should include expected neighbor positions for origin', () => {
      const origin = createHexCoordinate(0, 0);
      
      const neighbors = getHexNeighbors(origin);
      
      const expectedNeighbors = [
        createHexCoordinate(1, -1), // Northeast
        createHexCoordinate(1, 0),  // East
        createHexCoordinate(0, 1),  // Southeast
        createHexCoordinate(-1, 1), // Southwest
        createHexCoordinate(-1, 0), // West
        createHexCoordinate(0, -1), // Northwest
      ];
      
      expect(neighbors).toHaveLength(expectedNeighbors.length);
      
      expectedNeighbors.forEach(expected => {
        const found = neighbors.some(neighbor => 
          neighbor.q === expected.q && 
          neighbor.r === expected.r && 
          neighbor.s === expected.s
        );
        expect(found).toBe(true);
      });
    });

    it('should work for non-origin hexes', () => {
      const hex = createHexCoordinate(2, -1);
      
      const neighbors = getHexNeighbors(hex);
      
      neighbors.forEach(neighbor => {
        expect(isValidHexCoordinate(neighbor)).toBe(true);
        expect(calculateHexDistance(hex, neighbor)).toBe(1);
      });
    });
  });

  describe('isValidHexCoordinate', () => {
    it('should return true for valid coordinates', () => {
      const validHex = createHexCoordinate(2, -1);
      
      const isValid = isValidHexCoordinate(validHex);
      
      expect(isValid).toBe(true);
    });

    it('should return true for origin', () => {
      const isValid = isValidHexCoordinate(ORIGIN_HEX);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      const invalidHex = { q: 1, r: 1, s: 1 }; // q + r + s ≠ 0
      
      const isValid = isValidHexCoordinate(invalidHex);
      
      expect(isValid).toBe(false);
    });

    it('should return false for coordinates with wrong sum', () => {
      const invalidHex = { q: 2, r: 2, s: -3 }; // q + r + s = 1 ≠ 0
      
      const isValid = isValidHexCoordinate(invalidHex);
      
      expect(isValid).toBe(false);
    });
  });

  describe('hexToDisplayString', () => {
    it('should format hex coordinates correctly', () => {
      const hex = createHexCoordinate(3, -1);
      
      const displayString = hexToDisplayString(hex);
      
      expect(displayString).toBe('(3, -1)');
    });

    it('should handle origin correctly', () => {
      const displayString = hexToDisplayString(ORIGIN_HEX);
      
      expect(displayString).toBe('(0, 0)');
    });

    it('should handle negative coordinates', () => {
      const hex = createHexCoordinate(-2, 3);
      
      const displayString = hexToDisplayString(hex);
      
      expect(displayString).toBe('(-2, 3)');
    });
  });

  describe('roundHex', () => {
    it('should round fractional coordinates to nearest hex', () => {
      const fractionalHex = { q: 1.2, r: -0.8, s: -0.4 };
      
      const rounded = roundHex(fractionalHex);
      
      expect(isValidHexCoordinate(rounded)).toBe(true);
      expect(rounded.q).toBe(1);
      expect(rounded.r).toBe(-1);
      expect(rounded.s).toBe(0);
    });

    it('should handle exact coordinates', () => {
      const exactHex = { q: 2, r: -1, s: -1 };
      
      const rounded = roundHex(exactHex);
      
      expect(rounded.q).toBe(2);
      expect(rounded.r).toBe(-1);
      expect(rounded.s).toBe(-1);
    });

    it('should handle origin-like fractional coordinates', () => {
      const nearOrigin = { q: 0.1, r: -0.1, s: 0.0 };
      
      const rounded = roundHex(nearOrigin);
      
      expect(isValidHexCoordinate(rounded)).toBe(true);
      expect(rounded.q).toBe(0);
      expect(rounded.r).toBe(0);
      expect(rounded.s).toBe(0);
    });
  });

  describe('Constants', () => {
    it('should have valid ORIGIN_HEX', () => {
      expect(ORIGIN_HEX.q).toBe(0);
      expect(ORIGIN_HEX.r).toBe(0);
      expect(ORIGIN_HEX.s).toBe(0);
      expect(isValidHexCoordinate(ORIGIN_HEX)).toBe(true);
    });

    it('should have 6 hex directions', () => {
      expect(HEX_DIRECTIONS).toHaveLength(6);
    });

    it('should have valid hex directions', () => {
      HEX_DIRECTIONS.forEach(direction => {
        expect(isValidHexCoordinate(direction)).toBe(true);
        expect(calculateHexDistance(ORIGIN_HEX, direction)).toBe(1);
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle large coordinate values', () => {
      const hex1 = createHexCoordinate(1000, -500);
      const hex2 = createHexCoordinate(-1000, 500);
      
      const distance = calculateHexDistance(hex1, hex2);
      
      expect(distance).toBe(2000);
      expect(isValidHexCoordinate(hex1)).toBe(true);
      expect(isValidHexCoordinate(hex2)).toBe(true);
    });

    it('should maintain coordinate invariants through neighbor operations', () => {
      const hex = createHexCoordinate(5, -3);
      
      const neighbors = getHexNeighbors(hex);
      
      neighbors.forEach(neighbor => {
        expect(isValidHexCoordinate(neighbor)).toBe(true);
        expect(calculateHexDistance(hex, neighbor)).toBe(1);
      });
    });

    it('should handle path calculations correctly', () => {
      // Test a simple path: origin -> (1,0) -> (2,-1)
      const start = ORIGIN_HEX;
      const middle = createHexCoordinate(1, 0);
      const end = createHexCoordinate(2, -1);
      
      const dist1 = calculateHexDistance(start, middle);
      const dist2 = calculateHexDistance(middle, end);
      const totalDist = calculateHexDistance(start, end);
      
      expect(dist1).toBe(1);
      expect(dist2).toBe(1);
      expect(totalDist).toBe(2);
      expect(dist1 + dist2).toBe(totalDist);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very close fractional values in rounding', () => {
      const almostExact = { q: 1.000001, r: -1.000001, s: 0.0 };
      
      const rounded = roundHex(almostExact);
      
      expect(isValidHexCoordinate(rounded)).toBe(true);
      expect(rounded.q).toBe(1);
      expect(rounded.r).toBe(-1);
      expect(rounded.s).toBe(0);
    });

    it('should work with boundary values', () => {
      // Test with large but safe values
      const hex1 = createHexCoordinate(1000000, -500000);
      const hex2 = createHexCoordinate(-1000000, 500000);
      
      expect(isValidHexCoordinate(hex1)).toBe(true);
      expect(isValidHexCoordinate(hex2)).toBe(true);
      
      const distance = calculateHexDistance(hex1, hex2);
      expect(distance).toBeGreaterThan(0);
      expect(Number.isFinite(distance)).toBe(true);
    });

    it('should maintain consistency across multiple operations', () => {
      const testHex = createHexCoordinate(3, -2);
      
      // Get neighbors, then get neighbors of neighbors
      const firstNeighbors = getHexNeighbors(testHex);
      firstNeighbors.forEach(neighbor => {
        const secondNeighbors = getHexNeighbors(neighbor);
        
        secondNeighbors.forEach(secondNeighbor => {
          expect(isValidHexCoordinate(secondNeighbor)).toBe(true);
        });
      });
    });
  });
});