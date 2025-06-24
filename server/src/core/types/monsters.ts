/**
 * @fileoverview Monster system type definitions
 * Extracted from entityTypes.ts for better organization
 *
 * @file server/src/core/types/monsters.ts
 */

import type { AbilityDefinition } from './abilities.js';
import type { MonsterAIVariant, MonsterBehavior, ThreatConfig } from './ai.js';
import type { EntityStats, EntityVariant } from './combat.js';

// === MONSTER DEFINITION TYPES ===

export interface MonsterDefinition {
  readonly id: string;
  readonly name: string;
  readonly variant: EntityVariant;
  readonly description: string;
  readonly stats: EntityStats;
  readonly abilities: AbilityDefinition[];
  readonly aiVariant: MonsterAIVariant;
  readonly threatConfig?: ThreatConfig;
  readonly spawnWeight?: number;
  readonly difficulty?: number;
  readonly behaviors?: MonsterBehavior[];
  readonly lootTable?: LootEntry[];
  readonly tags?: string[];
}

export interface LootEntry {
  readonly itemId: string;
  readonly chance: number;
  readonly quantity: { min: number; max: number };
}

// === MONSTER DATA TYPES ===

export interface MonsterPublicData {
  readonly id: string;
  readonly name: string;
  readonly variant: EntityVariant;
  readonly maxHp: number;
  readonly currentHp: number;
  readonly baseArmor: number;
  readonly effectiveArmor: number;
  readonly baseDamage: number;
  readonly position: { q: number; r: number; s: number };
  readonly isAlive: boolean;
  readonly movementRange: number;
  readonly aiVariant: MonsterAIVariant;
  readonly abilities: ReadonlyArray<AbilityDefinition>;
}

export interface MonsterPrivateData extends MonsterPublicData {
  readonly threatEntries: Map<string, import('./ai.js').ThreatEntry>;
  readonly threatConfig: ThreatConfig;
  readonly lastTargetId?: string;
  readonly lastDecision?: import('./ai.js').AIDecision;
  readonly behaviors: ReadonlyArray<MonsterBehavior>;
}