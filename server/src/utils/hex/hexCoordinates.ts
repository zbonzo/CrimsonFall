/**
 * Hex Dungeon Crawler - Hex Coordinate System
 * 
 * Core coordinate creation, validation, and basic operations
 * 
 * @file server/src/utils/hex/hexCoordinates.ts
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
export const HEX_DIRECTIONS: readonly HexDirection[] = [
  { q: 1, r: -1, s: 0 },  // Northeast
  { q: 1, r: 0, s: -1 },  // East  
  { q: 0, r: 1, s: -1 },  // Southeast
  { q: -1, r: 1, s: 0 },  // Southwest
  { q: -1, r: 0, s: 1 },  // West
  { q: 0, r: -1, s: 1 }   // Northwest
] as const;

export const ORIGIN_HEX: HexCoordinate = { q: 0, r: 0, s: 0 } as const;

// === CORE COORDINATE FUNCTIONS ===

/**
 * Creates a valid hex coordinate, ensuring q + r + s = 0
 */
export function createHexCoordinate(q: number, r: number): HexCoordinate {
  const s = -q - r;
  // Handle JavaScript's -0 vs 0 issue
  return { 
    q: q === 0 ? 0 : q, 
    r: r === 0 ? 0 : r, 
    s: s === 0 ? 0 : s 
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
  return Math.max(
    Math.abs(hexA.q - hexB.q),
    Math.abs(hexA.r - hexB.r), 
    Math.abs(hexA.s - hexB.s)
  );
}

/**
 * Gets all neighboring hex coordinates
 */
export function getHexNeighbors(hex: HexCoordinate): HexCoordinate[] {
  return HEX_DIRECTIONS.map(direction => 
    createHexCoordinate(
      hex.q + direction.q, 
      hex.r + direction.r
    )
  );
}

/**
 * Converts hex coordinate to human-readable string
 */
export function hexToDisplayString(hex: HexCoordinate): string {
  return `(${hex.q}, ${hex.r})`;
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