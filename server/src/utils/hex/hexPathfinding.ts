/**
 * Hex Dungeon Crawler - Hex Pathfinding
 *
 * A* pathfinding and related algorithms for hex grids
 *
 * @file server/src/utils/hex/hexPathfinding.ts
 */

import {
  calculateHexDistance,
  createHexCoordinate,
  getHexNeighbors,
  type HexCoordinate,
} from './hexCoordinates.js';

// === CONSTANTS ===
const MAX_PATHFINDING_DISTANCE = 50;

/**
 * Finds shortest path between two hex coordinates using A* algorithm
 */
export function findHexPath(
  start: HexCoordinate,
  goal: HexCoordinate,
  obstacles: ReadonlySet<string> = new Set()
): HexCoordinate[] | null {
  if (calculateHexDistance(start, goal) > MAX_PATHFINDING_DISTANCE) {
    return null; // Too far for pathfinding
  }

  const hexToString = (hex: HexCoordinate): string => `${hex.q},${hex.r},${hex.s}`;

  // If the goal itself is an obstacle, no path is possible
  if (obstacles.has(hexToString(goal))) {
    return null;
  }

  const openSet = new Set([hexToString(start)]);
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, HexCoordinate>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(hexToString(start), 0);
  fScore.set(hexToString(start), calculateHexDistance(start, goal));

  let iterations = 0;
  const maxIterations = 1000;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    // Find hex in openSet with lowest fScore
    let current: string | null = null;
    let lowestFScore = Infinity;

    for (const hexString of openSet) {
      const score = fScore.get(hexString) ?? Infinity;
      if (score < lowestFScore) {
        lowestFScore = score;
        current = hexString;
      }
    }

    if (!current) break;

    const [qStr, rStr, sStr] = current.split(',');
    const currentHex = createHexCoordinate(parseInt(qStr || '0', 10), parseInt(rStr || '0', 10));

    // Check if we reached the goal
    if (calculateHexDistance(currentHex, goal) === 0) {
      return reconstructPath(cameFrom, currentHex, hexToString);
    }

    openSet.delete(current);
    closedSet.add(current);

    // Check all neighbors
    for (const neighbor of getHexNeighbors(currentHex)) {
      const neighborString = hexToString(neighbor);

      // Skip if already processed or is an obstacle
      if (closedSet.has(neighborString) || obstacles.has(neighborString)) {
        continue;
      }

      const tentativeGScore = (gScore.get(current) ?? Infinity) + 1;

      // Only update if this path to neighbor is better
      if (tentativeGScore < (gScore.get(neighborString) ?? Infinity)) {
        // Record the best path to this neighbor
        cameFrom.set(neighborString, currentHex);
        gScore.set(neighborString, tentativeGScore);
        fScore.set(neighborString, tentativeGScore + calculateHexDistance(neighbor, goal));

        // Add to open set if not already there
        if (!openSet.has(neighborString)) {
          openSet.add(neighborString);
        }
      }
    }
  }

  return null; // No path found
}

/**
 * Reconstructs path from A* pathfinding result with cycle detection
 */
export function reconstructPath(
  cameFrom: Map<string, HexCoordinate>,
  current: HexCoordinate,
  hexToString: (hex: HexCoordinate) => string
): HexCoordinate[] {
  const path = [current];
  let currentString = hexToString(current);
  const visited = new Set<string>();

  while (cameFrom.has(currentString)) {
    // Cycle detection
    if (visited.has(currentString)) {
      console.warn('Cycle detected in path reconstruction, breaking');
      break;
    }

    visited.add(currentString);

    const previous = cameFrom.get(currentString);
    if (!previous) break;

    path.unshift(previous);
    currentString = hexToString(previous);

    // Safety limit
    if (path.length > 1000) {
      console.warn('Path reconstruction exceeded maximum length, breaking');
      break;
    }
  }

  return path;
}
