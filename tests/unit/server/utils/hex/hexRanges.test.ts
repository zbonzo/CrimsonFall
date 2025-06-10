/**
 * Hex Dungeon Crawler - Hex Ranges Tests
 * 
 * Unit tests for hex range and area calculations
 * 
 * @file tests/unit/server/utils/hex/hexRanges.test.ts
 */

import {
  getHexesInRange,
  isHexInRing,
  getHexRing,
  getTacticalPositions,
} from '../../../../../server/src/utils/hex/hexRanges.js';

import {
  createHexCoordinate,
  calculateHexDistance,
} from '../../../../../server/src/utils/hex/hexCoordinates.js';

describe('hexRanges', () => {
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
      
      // All hexes should be within range 1
      hexes.forEach(hex => {
        expect(calculateHexDistance(center, hex)).toBeLessThanOrEqual(1);
      });
    });

    it('should return 19 hexes for range 2', () => {
      const hexes = getHexesInRange(center, 2);
      
      expect(hexes).toHaveLength(19); // 1 + 6 + 12
      
      // All hexes should be within range 2
      hexes.forEach(hex => {
        expect(calculateHexDistance(center, hex)).toBeLessThanOrEqual(2);
      });
    });

    it('should return 37 hexes for range 3', () => {
      const hexes = getHexesInRange(center, 3);
      
      expect(hexes).toHaveLength(37); // 1 + 6 + 12 + 18
    });

    it('should follow hex count formula: 1 + 3*n*(n+1)', () => {
      for (let range = 0; range <= 5; range++) {
        const hexes = getHexesInRange(center, range);
        const expectedCount = 1 + 3 * range * (range + 1);
        expect(hexes).toHaveLength(expectedCount);
      }
    });

    it('should throw error for negative range', () => {
      expect(() => getHexesInRange(center, -1))
        .toThrow('Range must be non-negative');
    });

    it('should work with non-origin centers', () => {
      const offsetCenter = createHexCoordinate(3, -2);
      const hexes = getHexesInRange(offsetCenter, 2);
      
      expect(hexes).toHaveLength(19);
      
      // All hexes should be within range 2 of the offset center
      hexes.forEach(hex => {
        expect(calculateHexDistance(offsetCenter, hex)).toBeLessThanOrEqual(2);
      });
    });

    it('should include edge hexes at exact range', () => {
      const hexes = getHexesInRange(center, 3);
      const edgeHex = createHexCoordinate(3, 0);
      
      expect(hexes).toContainEqual(edgeHex);
      expect(calculateHexDistance(center, edgeHex)).toBe(3);
    });

    it('should not include hexes outside range', () => {
      const hexes = getHexesInRange(center, 2);
      const outsideHex = createHexCoordinate(3, 0);
      
      expect(hexes).not.toContainEqual(outsideHex);
      expect(calculateHexDistance(center, outsideHex)).toBe(3);
    });
  });

  describe('isHexInRing', () => {
    const center = createHexCoordinate(0, 0);

    it('should identify center as ring 0', () => {
      expect(isHexInRing(center, center, 0)).toBe(true);
    });

    it('should identify neighbors as ring 1', () => {
      const neighbor = createHexCoordinate(1, 0);
      expect(isHexInRing(neighbor, center, 1)).toBe(true);
      expect(isHexInRing(neighbor, center, 0)).toBe(false);
      expect(isHexInRing(neighbor, center, 2)).toBe(false);
    });

    it('should identify distant hexes correctly', () => {
      const distantHex = createHexCoordinate(3, -2);
      expect(isHexInRing(distantHex, center, 3)).toBe(true);
      expect(isHexInRing(distantHex, center, 2)).toBe(false);
      expect(isHexInRing(distantHex, center, 4)).toBe(false);
    });

    it('should work with negative coordinates', () => {
      const negativeHex = createHexCoordinate(-2, -1); // q=-2, r=-1, s=3
      const center = createHexCoordinate(0, 0);
      
      // Calculate the actual distance: max(|-2-0|, |-1-0|, |3-0|) = max(2, 1, 3) = 3
      const distance = calculateHexDistance(negativeHex, center);
      expect(distance).toBe(3);
      
      // The hex is at distance 3, so it should be in ring 3, not ring 2
      expect(isHexInRing(negativeHex, center, 3)).toBe(true);
      expect(isHexInRing(negativeHex, center, 2)).toBe(false);
    });

    it('should work with offset centers', () => {
      const offsetCenter = createHexCoordinate(5, -3);
      const testHex = createHexCoordinate(7, -3);
      expect(isHexInRing(testHex, offsetCenter, 2)).toBe(true);
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
      
      // All hexes should be at distance 1
      ring.forEach(hex => {
        expect(calculateHexDistance(center, hex)).toBe(1);
      });
    });

    it('should return 12 hexes for radius 2', () => {
      const ring = getHexRing(center, 2);
      
      expect(ring).toHaveLength(12);
      
      // All hexes should be at distance 2
      ring.forEach(hex => {
        expect(calculateHexDistance(center, hex)).toBe(2);
      });
    });

    it('should follow ring size formula: 6*n for n > 0', () => {
      for (let radius = 1; radius <= 5; radius++) {
        const ring = getHexRing(center, radius);
        expect(ring).toHaveLength(6 * radius);
      }
    });

    it('should form complete ring without gaps', () => {
      const ring = getHexRing(center, 3);
      
      // Check that ring forms continuous path
      // Each hex should have at least one neighbor in the ring
      ring.forEach(hex => {
        const neighbors = [
          createHexCoordinate(hex.q + 1, hex.r - 1),
          createHexCoordinate(hex.q + 1, hex.r),
          createHexCoordinate(hex.q, hex.r + 1),
          createHexCoordinate(hex.q - 1, hex.r + 1),
          createHexCoordinate(hex.q - 1, hex.r),
          createHexCoordinate(hex.q, hex.r - 1),
        ];
        
        const hasRingNeighbor = neighbors.some(neighbor =>
          ring.some(ringHex => 
            ringHex.q === neighbor.q && ringHex.r === neighbor.r
          )
        );
        
        expect(hasRingNeighbor).toBe(true);
      });
    });

    it('should work with offset centers', () => {
      const offsetCenter = createHexCoordinate(-2, 3);
      const ring = getHexRing(offsetCenter, 2);
      
      expect(ring).toHaveLength(12);
      ring.forEach(hex => {
        expect(calculateHexDistance(offsetCenter, hex)).toBe(2);
      });
    });
  });

  describe('getTacticalPositions', () => {
    const currentPosition = createHexCoordinate(0, 0);
    const targetPosition = createHexCoordinate(6, 0);
    const movementRange = 3;

    it('should return objects with aggressive and defensive arrays', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, movementRange);
      
      expect(positions).toHaveProperty('aggressive');
      expect(positions).toHaveProperty('defensive');
      expect(Array.isArray(positions.aggressive)).toBe(true);
      expect(Array.isArray(positions.defensive)).toBe(true);
    });

    it('should only include reachable positions', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, movementRange);
      
      const allPositions = [...positions.aggressive, ...positions.defensive];
      allPositions.forEach(position => {
        expect(calculateHexDistance(currentPosition, position)).toBeLessThanOrEqual(movementRange);
      });
    });

    it('should classify aggressive positions correctly (close to target)', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, movementRange);
      
      positions.aggressive.forEach(position => {
        expect(calculateHexDistance(position, targetPosition)).toBeLessThanOrEqual(2);
      });
    });

    it('should classify defensive positions correctly (far from target)', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, movementRange);
      
      positions.defensive.forEach(position => {
        expect(calculateHexDistance(position, targetPosition)).toBeGreaterThanOrEqual(3);
      });
    });

    it('should sort aggressive positions by proximity to target', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, movementRange);
      
      for (let i = 1; i < positions.aggressive.length; i++) {
        const prevDistance = calculateHexDistance(positions.aggressive[i - 1]!, targetPosition);
        const currDistance = calculateHexDistance(positions.aggressive[i]!, targetPosition);
        expect(prevDistance).toBeLessThanOrEqual(currDistance);
      }
    });

    it('should sort defensive positions by distance from target', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, movementRange);
      
      for (let i = 1; i < positions.defensive.length; i++) {
        const prevDistance = calculateHexDistance(positions.defensive[i - 1]!, targetPosition);
        const currDistance = calculateHexDistance(positions.defensive[i]!, targetPosition);
        expect(prevDistance).toBeGreaterThanOrEqual(currDistance);
      }
    });

    it('should handle close targets correctly', () => {
      const closeTarget = createHexCoordinate(2, 0);
      const positions = getTacticalPositions(currentPosition, closeTarget, movementRange);
      
      expect(positions.aggressive.length).toBeGreaterThan(0);
      // Most positions should be aggressive when target is close
    });

    it('should handle distant targets correctly', () => {
      const distantTarget = createHexCoordinate(10, 0);
      const positions = getTacticalPositions(currentPosition, distantTarget, movementRange);
      
      expect(positions.defensive.length).toBeGreaterThan(0);
      // Most positions should be defensive when target is distant
    });

    it('should handle zero movement range', () => {
      const positions = getTacticalPositions(currentPosition, targetPosition, 0);
      
      const totalPositions = positions.aggressive.length + positions.defensive.length;
      expect(totalPositions).toBeLessThanOrEqual(1); // Only current position
    });

    it('should work with negative coordinates', () => {
      const negCurrent = createHexCoordinate(-3, -2);
      const negTarget = createHexCoordinate(-6, 1);
      
      const positions = getTacticalPositions(negCurrent, negTarget, 2);
      
      expect(positions.aggressive.length + positions.defensive.length).toBeGreaterThan(0);
    });
  });

  describe('performance and edge cases', () => {
    it('should handle large ranges efficiently', () => {
      const center = createHexCoordinate(0, 0);
      const startTime = Date.now();
      
      const hexes = getHexesInRange(center, 10);
      
      const endTime = Date.now();
      
      expect(hexes.length).toBe(331); // 1 + 3*10*11
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle ring calculations efficiently', () => {
      const center = createHexCoordinate(0, 0);
      const startTime = Date.now();
      
      const ring = getHexRing(center, 20);
      
      const endTime = Date.now();
      
      expect(ring.length).toBe(120); // 6*20
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should handle tactical calculations with large movement ranges', () => {
      const current = createHexCoordinate(0, 0);
      const target = createHexCoordinate(50, 0);
      const startTime = Date.now();
      
      const positions = getTacticalPositions(current, target, 15);
      
      const endTime = Date.now();
      
      expect(positions.aggressive.length + positions.defensive.length).toBeGreaterThan(100);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should not duplicate hexes in range calculations', () => {
      const center = createHexCoordinate(0, 0);
      const hexes = getHexesInRange(center, 5);
      
      const hexStrings = hexes.map(hex => `${hex.q},${hex.r}`);
      const uniqueHexStrings = new Set(hexStrings);
      
      expect(hexStrings.length).toBe(uniqueHexStrings.size);
    });

    it('should not duplicate hexes in ring calculations', () => {
      const center = createHexCoordinate(0, 0);
      const ring = getHexRing(center, 8);
      
      const hexStrings = ring.map(hex => `${hex.q},${hex.r}`);
      const uniqueHexStrings = new Set(hexStrings);
      
      expect(hexStrings.length).toBe(uniqueHexStrings.size);
    });

    it('should maintain consistency between range and ring calculations', () => {
      const center = createHexCoordinate(0, 0);
      const radius = 4;
      
      const allInRange = getHexesInRange(center, radius);
      const ring = getHexRing(center, radius);
      
      // All ring hexes should be in the range set
      const rangeSet = new Set(allInRange.map(hex => `${hex.q},${hex.r}`));
      ring.forEach(hex => {
        expect(rangeSet.has(`${hex.q},${hex.r}`)).toBe(true);
      });
      
      // All ring hexes should be at exactly the specified distance
      ring.forEach(hex => {
        expect(calculateHexDistance(center, hex)).toBe(radius);
      });
    });

    it('should handle extreme coordinates', () => {
      const extremeCenter = createHexCoordinate(1000, -500);
      const hexes = getHexesInRange(extremeCenter, 2);
      
      expect(hexes).toHaveLength(19);
      hexes.forEach(hex => {
        expect(calculateHexDistance(extremeCenter, hex)).toBeLessThanOrEqual(2);
      });
    });
  });
});