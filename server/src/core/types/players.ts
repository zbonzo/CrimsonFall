/**
 * @fileoverview Player system type definitions
 * Extracted from entityTypes.ts for better organization
 *
 * @file server/src/core/types/players.ts
 */

import type { AbilityDefinition } from './abilities.js';
import type { EntityStats, EntityVariant } from './combat.js';

// === PLAYER DEFINITION TYPES ===

export interface PlayerSpecialization {
  readonly id: string;
  readonly name: string;
  readonly variant: EntityVariant;
  readonly description: string;
  readonly stats: EntityStats;
  readonly abilities: AbilityDefinition[];
  readonly startingAbilities: string[];
  readonly progressionTable?: ProgressionEntry[];
}

export interface ProgressionEntry {
  readonly level: number;
  readonly experienceRequired: number;
  readonly abilities?: string[];
  readonly statBoosts?: Partial<EntityStats>;
}

// === PLAYER DATA TYPES ===

export interface PlayerPublicData {
  readonly id: string;
  readonly name: string;
  readonly variant: EntityVariant;
  readonly specialization: PlayerSpecialization;
  readonly level: number;
  readonly experience: number;
  readonly maxHp: number;
  readonly currentHp: number;
  readonly baseArmor: number;
  readonly effectiveArmor: number;
  readonly baseDamage: number;
  readonly position: { q: number; r: number; s: number };
  readonly isAlive: boolean;
  readonly movementRange: number;
  readonly abilities: ReadonlyArray<AbilityDefinition>;
}

export interface PlayerPrivateData extends PlayerPublicData {
  readonly hasSubmittedAction: boolean;
  readonly submittedAction?: import('./actions.js').PlayerAction;
  readonly abilityCooldowns: ReadonlyMap<string, number>;
  readonly statusEffects: ReadonlyArray<import('./statusEffects.js').StatusEffect>;
}