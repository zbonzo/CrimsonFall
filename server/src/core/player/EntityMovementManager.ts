/**
 * @fileoverview Clean player movement management following naming conventions
 * Handles hex-based movement, position validation, and tactical positioning
 *
 * @file server/src/core/player/PlayerMovementManager.ts
 */

import {
  type HexCoordinate,
  type MovementRange,
  calculateHexDistance,
  createHexCoordinate,
  findHexPath,
  getHexesInRange,
} from '@/utils/hex/index.js';

import type { MovementResult } from '../types/playerTypes.js';

// === CONSTANTS ===

const DEFAULT_MOVEMENT_RANGE = 3;
const DEFAULT_POSITION: HexCoordinate = { q: 0, r: 0, s: 0 } as const;

// === MOVEMENT MANAGER ===

/**
 * Manages player position and movement with clean naming
 */
export class EntityMovementManager {
  private _currentPosition: HexCoordinate;
  private _startingPosition: HexCoordinate;
  private readonly _movementRange: MovementRange;
  private _hasMovedThisRound: boolean = false;
  private _movementHistory: HexCoordinate[] = [];

  constructor(
    startingPosition: HexCoordinate = DEFAULT_POSITION,
    movementRange: MovementRange = DEFAULT_MOVEMENT_RANGE
  ) {
    this._currentPosition = startingPosition;
    this._startingPosition = startingPosition;
    this._movementRange = movementRange;
    this._movementHistory = [startingPosition];
  }

  // === GETTERS ===

  public get currentPosition(): HexCoordinate {
    return this._currentPosition;
  }

  public get startingPosition(): HexCoordinate {
    return this._startingPosition;
  }

  public get movementRange(): MovementRange {
    return this._movementRange;
  }

  public get hasMovedThisRound(): boolean {
    return this._hasMovedThisRound;
  }

  public get movementHistory(): ReadonlyArray<HexCoordinate> {
    return [...this._movementHistory];
  }

  // === POSITION VALIDATION ===

  public isPositionReachable(targetPosition: HexCoordinate): boolean {
    const distance = calculateHexDistance(this._currentPosition, targetPosition);
    return distance <= this._movementRange;
  }

  public isPositionValid(
    targetPosition: HexCoordinate,
    occupiedPositions: ReadonlySet<string> = new Set(),
    obstacles: ReadonlySet<string> = new Set()
  ): { valid: boolean; reason?: string } {
    const positionString = this.positionToString(targetPosition);

    if (occupiedPositions.has(positionString)) {
      return { valid: false, reason: 'Position is occupied' };
    }

    if (obstacles.has(positionString)) {
      return { valid: false, reason: 'Position is blocked by obstacle' };
    }

    return { valid: true };
  }

  public canMove(): { allowed: boolean; reason?: string } {
    if (this._hasMovedThisRound) {
      return { allowed: false, reason: 'Already moved this round' };
    }

    return { allowed: true };
  }

  // === MOVEMENT EXECUTION ===

  public moveTo(
    targetPosition: HexCoordinate,
    occupiedPositions: ReadonlySet<string> = new Set(),
    obstacles: ReadonlySet<string> = new Set()
  ): MovementResult {
    const moveCheck = this.canMove();
    if (!moveCheck.allowed) {
      return { success: false, reason: moveCheck.reason ?? 'Movement not allowed' };
    }

    if (!this.isPositionReachable(targetPosition)) {
      const distance = calculateHexDistance(this._currentPosition, targetPosition);
      return {
        success: false,
        reason: `Position too far (distance: ${distance}, max: ${this._movementRange})`,
      };
    }

    const validityCheck = this.isPositionValid(targetPosition, occupiedPositions, obstacles);
    if (!validityCheck.valid) {
      return { success: false, reason: validityCheck.reason ?? 'Position invalid' };
    }

    this._currentPosition = targetPosition;
    this._hasMovedThisRound = true;
    this._movementHistory.push(targetPosition);

    return {
      success: true,
      newPosition: targetPosition,
    };
  }

  public findPath(
    targetPosition: HexCoordinate,
    obstacles: ReadonlySet<string> = new Set()
  ): HexCoordinate[] | null {
    return findHexPath(this._currentPosition, targetPosition, obstacles);
  }

  // === TACTICAL POSITIONING ===

  public getReachablePositions(): HexCoordinate[] {
    return getHexesInRange(this._currentPosition, this._movementRange);
  }

  public getTacticalPositions(targetPosition: HexCoordinate): {
    adjacent: HexCoordinate[];
    nearbyOffensive: HexCoordinate[];
    defensive: HexCoordinate[];
  } {
    const reachablePositions = this.getReachablePositions();

    const adjacent = reachablePositions.filter(
      pos => calculateHexDistance(pos, targetPosition) === 1
    );

    const nearbyOffensive = reachablePositions.filter(pos => {
      const distance = calculateHexDistance(pos, targetPosition);
      return distance >= 2 && distance <= 3;
    });

    const defensive = reachablePositions.filter(
      pos => calculateHexDistance(pos, targetPosition) >= 4
    );

    return { adjacent, nearbyOffensive, defensive };
  }

  public findClosestSafePosition(
    targetPosition: HexCoordinate,
    dangerZones: ReadonlyArray<HexCoordinate>,
    dangerRadius: number = 2
  ): HexCoordinate | null {
    const reachablePositions = this.getReachablePositions();

    const safePositions = reachablePositions.filter(pos => {
      return dangerZones.every(danger => calculateHexDistance(pos, danger) > dangerRadius);
    });

    if (safePositions.length === 0) {
      return null;
    }

    safePositions.sort(
      (a, b) => calculateHexDistance(a, targetPosition) - calculateHexDistance(b, targetPosition)
    );

    return safePositions[0] ?? null;
  }

  // === ROUND MANAGEMENT ===

  public resetForNewRound(): void {
    this._hasMovedThisRound = false;
  }

  public setStartingPosition(position: HexCoordinate): void {
    this._startingPosition = position;
    this._currentPosition = position;
    this._hasMovedThisRound = false;
    this._movementHistory = [position];
  }

  // === UTILITY METHODS ===

  public getDistanceTo(targetPosition: HexCoordinate): number {
    return calculateHexDistance(this._currentPosition, targetPosition);
  }

  public isAtPosition(position: HexCoordinate): boolean {
    return (
      this._currentPosition.q === position.q &&
      this._currentPosition.r === position.r &&
      this._currentPosition.s === position.s
    );
  }

  public positionToString(position: HexCoordinate): string {
    return `${position.q},${position.r},${position.s}`;
  }

  public stringToPosition(positionString: string): HexCoordinate {
    const [qStr, rStr] = positionString.split(',');
    const q = parseInt(qStr || '0', 10);
    const r = parseInt(rStr || '0', 10);
    return createHexCoordinate(q, r);
  }
  public getMovementStats(): {
    totalMoves: number;
    currentRoundMoved: boolean;
    positionsVisited: number;
    averageDistancePerMove: number;
  } {
    const totalMoves = this._movementHistory.length - 1;

    let totalDistance = 0;
    for (let i = 1; i < this._movementHistory.length; i++) {
      const prevPos = this._movementHistory[i - 1];
      const currentPos = this._movementHistory[i];
      if (prevPos && currentPos) {
        totalDistance += calculateHexDistance(prevPos, currentPos);
      }
    }

    const uniquePositions = new Set(this._movementHistory.map(pos => this.positionToString(pos)));

    return {
      totalMoves,
      currentRoundMoved: this._hasMovedThisRound,
      positionsVisited: uniquePositions.size,
      averageDistancePerMove: totalMoves > 0 ? totalDistance / totalMoves : 0,
    };
  }
}
