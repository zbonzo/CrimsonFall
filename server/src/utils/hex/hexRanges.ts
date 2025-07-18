/**
 * Hex Dungeon Crawler - Hex Range Calculations
 *
 * Functions for calculating hex areas, rings, and ranges
 *
 * @file server/src/utils/hex/hexRanges.ts
 */

import {
  calculateHexDistance,
  createHexCoordinate,
  HEX_DIRECTIONS,
  type HexCoordinate,
  type MovementRange,
} from './hexCoordinates.js';

// Re-export for convenience
export type { MovementRange };

/**
 * Gets all hex coordinates within specified range of origin
 */
export function getHexesInRange(origin: HexCoordinate, range: MovementRange): HexCoordinate[] {
  if (!Number.isInteger(range)) {
    throw new Error('Range must be an integer');
  }
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
  if (!Number.isInteger(radius)) {
    throw new Error('Radius must be an integer');
  }
  if (radius === 0) {
    return [center];
  }

  const ring: HexCoordinate[] = [];

  // Start from the west direction
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
