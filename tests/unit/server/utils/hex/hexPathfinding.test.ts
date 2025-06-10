/**
 * Hex Dungeon Crawler - Hex Pathfinding Tests
 * 
 * Unit tests for A* pathfinding on hex grids
 * 
 * @file tests/unit/server/utils/hex/hexPathfinding.test.ts
 */

import {
  findHexPath,
  reconstructPath,
} from '../../../../../server/src/utils/hex/hexPathfinding.js';

import {
  createHexCoordinate,
  HexCoordinate,
} from '../../../../../server/src/utils/hex/hexCoordinates.js';

describe('hexPathfinding', () => {
  describe('findHexPath', () => {
    it('should find direct path with no obstacles', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(3, 0);
      
      const path = findHexPath(start, goal);
      
      expect(path).not.toBeNull();
      expect(path).toHaveLength(4);
      expect(path![0]).toEqual(start);
      expect(path![path!.length - 1]).toEqual(goal);
    });

    it('should return single-element path for same start and goal', () => {
      const position = createHexCoordinate(2, -1);
      
      const path = findHexPath(position, position);
      
      expect(path).toEqual([position]);
    });

    it('should return null when goal is blocked', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(1, 0);
      const obstacles = new Set(['1,0']);
      
      const path = findHexPath(start, goal, obstacles);
      
      expect(path).toBeNull();
    });

    it('should find path around simple obstacle', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(2, 0);
      const obstacles = new Set(['1,0']); // Block direct path
      
      const path = findHexPath(start, goal, obstacles);
      
      expect(path).not.toBeNull();
      expect(path![0]).toEqual(start);
      expect(path![path!.length - 1]).toEqual(goal);
      expect(path!.length).toBeGreaterThan(3); // Longer than direct path
      
      // Verify path doesn't go through obstacle
      const pathStrings = path!.map(hex => `${hex.q},${hex.r}`);
      expect(pathStrings).not.toContain('1,0');
    });

    it('should return null when completely blocked', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(2, 0);
      
      // Create wall blocking all paths
      const obstacles = new Set([
        '1,0',   // Direct path
        '1,-1',  // North route
        '0,1',   // South route
        '0,-1',  // Far north
        '-1,1',  // Far south
        '-1,0'   // West route
      ]);
      
      const path = findHexPath(start, goal, obstacles);
      
      expect(path).toBeNull();
    });

    it('should return null for excessive distances', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(100, 0); // Beyond MAX_PATHFINDING_DISTANCE
      
      const path = findHexPath(start, goal);
      
      expect(path).toBeNull();
    });

    it('should handle complex maze', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(4, 0);
      
      // Create L-shaped obstacle forcing specific path
      const obstacles = new Set([
        '1,0', '2,0', '3,0',  // Horizontal wall
        '1,-1', '2,-1'        // Partial north wall
      ]);
      
      const path = findHexPath(start, goal, obstacles);
      
      expect(path).not.toBeNull();
      expect(path![0]).toEqual(start);
      expect(path![path!.length - 1]).toEqual(goal);
      
      // Verify no path goes through obstacles
      const pathStrings = path!.map(hex => `${hex.q},${hex.r}`);
      obstacles.forEach(obstacle => {
        expect(pathStrings).not.toContain(obstacle);
      });
    });

    it('should find optimal path length', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(0, 3);
      
      const path = findHexPath(start, goal);
      
      expect(path).not.toBeNull();
      expect(path).toHaveLength(4); // Direct path: 0,0 -> 0,1 -> 0,2 -> 0,3
    });
  });

  describe('reconstructPath', () => {
    it('should reconstruct simple path', () => {
      const cameFrom = new Map<string, HexCoordinate>();
      const hexToString = (hex: HexCoordinate) => `${hex.q},${hex.r}`;
      
      const start = createHexCoordinate(0, 0);
      const middle = createHexCoordinate(1, 0);
      const end = createHexCoordinate(2, 0);
      
      cameFrom.set(hexToString(middle), start);
      cameFrom.set(hexToString(end), middle);
      
      const path = reconstructPath(cameFrom, end, hexToString);
      
      expect(path).toEqual([start, middle, end]);
    });

    it('should handle single node path', () => {
      const cameFrom = new Map<string, HexCoordinate>();
      const hexToString = (hex: HexCoordinate) => `${hex.q},${hex.r}`;
      
      const singleNode = createHexCoordinate(1, 1);
      
      const path = reconstructPath(cameFrom, singleNode, hexToString);
      
      expect(path).toEqual([singleNode]);
    });

    it('should detect and break cycles', () => {
      const cameFrom = new Map<string, HexCoordinate>();
      const hexToString = (hex: HexCoordinate) => `${hex.q},${hex.r}`;
      
      const nodeA = createHexCoordinate(0, 0);
      const nodeB = createHexCoordinate(1, 0);
      
      // Create cycle: A -> B -> A
      cameFrom.set(hexToString(nodeA), nodeB);
      cameFrom.set(hexToString(nodeB), nodeA);
      
      const path = reconstructPath(cameFrom, nodeA, hexToString);
      
      // Should break cycle and return partial path
      expect(path.length).toBeGreaterThan(0);
      expect(path.length).toBeLessThan(1000); // Shouldn't run away
      
      // Should start with our target node
      expect(path[0]).toEqual(nodeA);
    });

    it('should handle missing parent gracefully', () => {
      const cameFrom = new Map<string, HexCoordinate>();
      const hexToString = (hex: HexCoordinate) => `${hex.q},${hex.r}`;
      
      const start = createHexCoordinate(0, 0);
      const end = createHexCoordinate(1, 0);
      
      // Missing parent entry for end node
      cameFrom.set('nonexistent', start);
      
      const path = reconstructPath(cameFrom, end, hexToString);
      
      expect(path).toEqual([end]);
    });
  });

  describe('pathfinding edge cases', () => {
    it('should handle adjacent start and goal', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(1, 0);
      
      const path = findHexPath(start, goal);
      
      expect(path).not.toBeNull();
      expect(path).toHaveLength(2);
      expect(path).toEqual([start, goal]);
    });

    it('should work with negative coordinates', () => {
      const start = createHexCoordinate(-2, -1);
      const goal = createHexCoordinate(-5, 2);
      
      const path = findHexPath(start, goal);
      
      expect(path).not.toBeNull();
      expect(path![0]).toEqual(start);
      expect(path![path!.length - 1]).toEqual(goal);
    });

    it('should handle obstacles at start neighbors', () => {
      const start = createHexCoordinate(0, 0);
      const goal = createHexCoordinate(3, 0);
      
      // Block most neighbors of start
      const obstacles = new Set([
        '1,0',   // East
        '0,1',   // Southeast
        '-1,1',  // Southwest
        '-1,0',  // West
        '0,-1'   // Northwest
        // Leave northeast (1,-1) open
      ]);
      
      const path = findHexPath(start, goal, obstacles);
      
      expect(path).not.toBeNull();
      expect(path![0]).toEqual(start);
      expect(path![path!.length - 1]).toEqual(goal);
    });
  });
});