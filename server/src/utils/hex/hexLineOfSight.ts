/**
 * Hex Dungeon Crawler - Hex Line of Sight
 *
 * Line of sight calculations and hex line drawing
 *
 * @file server/src/utils/hex/hexLineOfSight.ts
 */

import { calculateHexDistance, roundHex, type HexCoordinate } from './hexCoordinates.js';

/**
 * Checks if there's a clear line of sight between two hexes
 */
export function hasLineOfSight(
  from: HexCoordinate,
  to: HexCoordinate,
  obstacles: ReadonlySet<string> = new Set()
): boolean {
  const distance = calculateHexDistance(from, to);

  if (distance <= 1) {
    return true;
  }

  const hexToString = (hex: HexCoordinate): string => `${hex.q},${hex.r},${hex.s}`;

  const lineHexes = getHexLine(from, to);

  for (let i = 1; i < lineHexes.length - 1; i++) {
    const currentHex = lineHexes[i];
    if (!currentHex) continue;

    const currentHexAsString = hexToString(currentHex);
    if (obstacles.has(currentHexAsString)) {
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
