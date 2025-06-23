/**
 * Hex Dungeon Crawler - Hex Grid Mathematics Utility
 *
 * Core mathematical functions for hexagonal grid calculations
 * Used throughout the game for movement, range, and positioning
 *
 * @file server/src/utils/hexMath.ts
 */

// === TYPE DEFINITIONS ===
export interface HexCoordinate {
  readonly q: number; // Column coordinate
  readonly r: number; // Row coordinate
  readonly s: number; // Diagonal coordinate (q + r + s = 0)
}

export interface HexDirection {
  readonly q: number;
  readonly r: number;
  readonly s: number;
}

export type HexDistance = number;
export type MovementRange = number;

// === CONSTANTS ===
const HEX_DIRECTIONS: readonly HexDirection[] = [
  { q: 1, r: -1, s: 0 }, // Northeast
  { q: 1, r: 0, s: -1 }, // East
  { q: 0, r: 1, s: -1 }, // Southeast
  { q: -1, r: 1, s: 0 }, // Southwest
  { q: -1, r: 0, s: 1 }, // West
  { q: 0, r: -1, s: 1 }, // Northwest
] as const;

const MAX_PATHFINDING_DISTANCE = 50;

// === CORE HEX MATH FUNCTIONS ===

/**
 * Creates a valid hex coordinate, ensuring q + r + s = 0
 */
export function createHexCoordinate(q: number, r: number): HexCoordinate {
  const s = -q - r;
  // Handle JavaScript's -0 vs 0 issue
  return {
    q: q === 0 ? 0 : q,
    r: r === 0 ? 0 : r,
    s: s === 0 ? 0 : s,
  };
}

/**
 * Validates that a hex coordinate follows the cube coordinate constraint
 */
export function isValidHexCoordinate(hex: HexCoordinate): boolean {
  return Math.abs(hex.q + hex.r + hex.s) < Number.EPSILON;
}

/**
 * Calculates Manhattan distance between two hex coordinates
 */
export function calculateHexDistance(hexA: HexCoordinate, hexB: HexCoordinate): HexDistance {
  return Math.max(Math.abs(hexA.q - hexB.q), Math.abs(hexA.r - hexB.r), Math.abs(hexA.s - hexB.s));
}

/**
 * Gets all hex coordinates within specified range of origin
 */
export function getHexesInRange(origin: HexCoordinate, range: MovementRange): HexCoordinate[] {
  if (range < 0) {
    throw new Error('Range must be non-negative');
  }

  const hexesInRange: HexCoordinate[] = [];

  for (let q = -range; q <= range; q++) {
    const minR = Math.max(-range, -q - range);
    const maxR = Math.min(range, -q + range);

    for (let r = minR; r <= maxR; r++) {
      const hex = createHexCoordinate(origin.q + q, origin.r + r);
      hexesInRange.push(hex);
    }
  }

  return hexesInRange;
}

/**
 * Gets all neighboring hex coordinates
 */
export function getHexNeighbors(hex: HexCoordinate): HexCoordinate[] {
  return HEX_DIRECTIONS.map(direction =>
    createHexCoordinate(hex.q + direction.q, hex.r + direction.r)
  );
}

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
  const closedSet = new Set<string>(); // Track processed nodes
  const cameFrom = new Map<string, HexCoordinate>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(hexToString(start), 0);
  fScore.set(hexToString(start), calculateHexDistance(start, goal));

  let iterations = 0;
  const maxIterations = 1000; // Safety limit

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
    closedSet.add(current); // Mark as processed

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

  return null; // No path found or exceeded max iterations
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
  const visited = new Set<string>(); // Track visited nodes to detect cycles

  while (cameFrom.has(currentString)) {
    // Cycle detection: if we've seen this node before, break to prevent infinite loop
    if (visited.has(currentString)) {
      console.warn('Cycle detected in path reconstruction, breaking');
      break;
    }

    visited.add(currentString);

    const previous = cameFrom.get(currentString);
    if (!previous) break;

    path.unshift(previous);
    currentString = hexToString(previous);

    // Additional safety: limit path length to prevent runaway reconstruction
    if (path.length > 1000) {
      console.warn('Path reconstruction exceeded maximum length, breaking');
      break;
    }
  }

  return path;
}

/**
 * Checks if hex coordinate is within a specific hex ring
 */
export function isHexInRing(
  hex: HexCoordinate,
  center: HexCoordinate,
  ringRadius: number
): boolean {
  return calculateHexDistance(hex, center) === ringRadius;
}

/**
 * Gets all hex coordinates forming a ring at specified distance
 */
export function getHexRing(center: HexCoordinate, radius: number): HexCoordinate[] {
  if (radius === 0) {
    return [center];
  }

  const ring: HexCoordinate[] = [];

  // Start from the west direction (index 4)
  const westDirection = HEX_DIRECTIONS[4];
  if (!westDirection) {
    throw new Error('HEX_DIRECTIONS missing west direction');
  }

  let currentHex = createHexCoordinate(
    center.q + westDirection.q * radius,
    center.r + westDirection.r * radius
  );

  for (let direction = 0; direction < 6; direction++) {
    for (let step = 0; step < radius; step++) {
      ring.push(currentHex);
      const dir = HEX_DIRECTIONS[direction];
      if (!dir) {
        throw new Error(`HEX_DIRECTIONS missing direction ${direction}`);
      }
      currentHex = createHexCoordinate(currentHex.q + dir.q, currentHex.r + dir.r);
    }
  }

  return ring;
}

/**
 * Converts hex coordinate to human-readable string
 */
export function hexToDisplayString(hex: HexCoordinate): string {
  return `(${hex.q}, ${hex.r})`;
}

// === GAME-SPECIFIC UTILITY FUNCTIONS ===

/**
 * Checks if there's a clear line of sight between two hexes
 */
export function hasLineOfSight(
  from: HexCoordinate,
  to: HexCoordinate,
  obstacles: ReadonlySet<string> = new Set()
): boolean {
  const distance = calculateHexDistance(from, to);

  // Adjacent hexes always have line of sight
  if (distance <= 1) {
    return true;
  }

  const hexToString = (hex: HexCoordinate): string => `${hex.q},${hex.r},${hex.s}`;

  // Get all hexes in a straight line between from and to
  const lineHexes = getHexLine(from, to);

  // Check if any hex in the line (except start and end) is blocked
  for (let i = 1; i < lineHexes.length - 1; i++) {
    const currentHex = lineHexes[i];
    if (!currentHex) continue;

    if (obstacles.has(hexToString(currentHex))) {
      return false;
    }
  }

  return true;
}

/**
 * Gets all hexes in a straight line between two hexes using hex line drawing
 */
export function getHexLine(from: HexCoordinate, to: HexCoordinate): HexCoordinate[] {
  const distance = calculateHexDistance(from, to);
  const line: HexCoordinate[] = [];

  for (let i = 0; i <= distance; i++) {
    const t = distance === 0 ? 0 : i / distance;

    // Linear interpolation in cube coordinates
    const q = from.q + t * (to.q - from.q);
    const r = from.r + t * (to.r - from.r);
    const s = from.s + t * (to.s - from.s);

    // Round to nearest hex
    const roundedHex = roundHex({ q, r, s });
    line.push(roundedHex);
  }

  return line;
}

/**
 * Rounds fractional hex coordinates to the nearest hex
 */
export function roundHex(hex: { q: number; r: number; s: number }): HexCoordinate {
  let q = Math.round(hex.q);
  let r = Math.round(hex.r);
  let s = Math.round(hex.s);

  const qDiff = Math.abs(q - hex.q);
  const rDiff = Math.abs(r - hex.r);
  const sDiff = Math.abs(s - hex.s);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return createHexCoordinate(q, r);
}

/**
 * Determines if a hex position is within ability range and line of sight
 */
export function isValidAbilityTarget(
  casterPosition: HexCoordinate,
  targetPosition: HexCoordinate,
  abilityRange: number,
  obstacles: ReadonlySet<string> = new Set()
): boolean {
  const distance = calculateHexDistance(casterPosition, targetPosition);

  if (distance > abilityRange) {
    return false;
  }

  // Check line of sight - must have clear line between caster and target
  return hasLineOfSight(casterPosition, targetPosition, obstacles);
}

/**
 * Gets optimal positioning hexes for tactical advantage
 */
export function getTacticalPositions(
  currentPosition: HexCoordinate,
  targetPosition: HexCoordinate,
  movementRange: number
): { aggressive: HexCoordinate[]; defensive: HexCoordinate[] } {
  const reachableHexes = getHexesInRange(currentPosition, movementRange);

  const aggressive = reachableHexes
    .filter(hex => calculateHexDistance(hex, targetPosition) <= 2)
    .sort(
      (a, b) => calculateHexDistance(a, targetPosition) - calculateHexDistance(b, targetPosition)
    );

  const defensive = reachableHexes
    .filter(hex => calculateHexDistance(hex, targetPosition) >= 3)
    .sort(
      (a, b) => calculateHexDistance(b, targetPosition) - calculateHexDistance(a, targetPosition)
    );

  return { aggressive, defensive };
}
