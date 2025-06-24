/**
 * @fileoverview Combat system type definitions
 * Extracted from entityTypes.ts for better organization
 *
 * @file server/src/core/types/combat.ts
 */

import type { HexCoordinate } from '@/utils/hex/index.js';

// === COMBAT RESULT TYPES ===

export interface DamageResult {
  readonly damageDealt: number;
  readonly blocked: number;
  readonly died: boolean;
}

export interface HealResult {
  readonly amountHealed: number;
  readonly newHp: number;
}

export interface MovementResult {
  readonly success: boolean;
  readonly newPosition?: HexCoordinate;
  readonly reason?: string;
  readonly distanceMoved?: number;
}

// === COMBAT ENTITY INTERFACE ===

export interface CombatEntity {
  readonly id: string;
  readonly name: string;
  readonly variant: EntityVariant;
  readonly position: HexCoordinate;
  readonly maxHp: number;
  readonly currentHp: number;
  readonly effectiveArmor: number;
  readonly isAlive: boolean;

  takeDamage(amount: number, source?: string): DamageResult;
  heal(amount: number): HealResult;
  calculateDamageOutput(baseAmount?: number): number;
  canAct(): boolean;
  canMove(): boolean;
}

// === MOVABLE ENTITY INTERFACE ===

export interface MovableEntity {
  readonly movementRange: number;

  moveTo(
    target: HexCoordinate,
    occupiedPositions: ReadonlySet<string>,
    obstacles: ReadonlySet<string>
  ): MovementResult;
  
  canMove(): boolean;
}

// === BASIC ENTITY TYPES ===

export interface EntityId {
  readonly value: string;
}

export interface EntityName {
  readonly value: string;
}

export type EntityVariant = 'player' | 'monster' | 'npc';

export interface EntityStats {
  readonly maxHp: number;
  readonly baseArmor: number;
  readonly baseDamage: number;
  readonly movementRange: number;
}

export interface EntityLevel {
  readonly current: number;
  readonly experience: number;
  readonly experienceToNext: number;
}