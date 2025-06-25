/**
 * @fileoverview AI system type definitions
 * Extracted from entityTypes.ts for better organization
 *
 * @file server/src/core/types/ai.ts
 */

import type { HexCoordinate } from '@/utils/hex/hexCoordinates.js';
import type { CombatEntity } from './combat.js';

// === AI DECISION TYPES ===

export interface AIDecision {
  readonly variant: 'move' | 'attack' | 'ability' | 'wait';
  readonly target?: CombatEntity;
  readonly targetPosition?: HexCoordinate;
  readonly abilityId?: string;
  readonly priority: number;
  readonly confidence: number;
}

export type MonsterAIVariant = 'aggressive' | 'defensive' | 'tactical' | 'berserker' | 'support' | 'passive';

// === BEHAVIOR SYSTEM TYPES ===

export interface MonsterBehavior {
  readonly id: string;
  readonly name: string;
  readonly priority: number;
  readonly conditions: BehaviorCondition[];
  readonly action: BehaviorAction;
}

export interface BehaviorCondition {
  readonly variant: 'health_below' | 'enemy_count' | 'ally_count' | 'enemy_nearby' | 'round_number';
  readonly value: number | boolean | string;
}

export interface BehaviorAction {
  readonly variant: 'attack_nearest' | 'retreat' | 'ability' | 'move_to' | 'wait';
  readonly abilityId?: string;
  readonly targetPosition?: HexCoordinate;
}

// === TARGETING CONTEXT ===

export interface TargetingContext {
  readonly self: CombatEntity;
  readonly allies: ReadonlyArray<CombatEntity>;
  readonly enemies: ReadonlyArray<CombatEntity>;
  readonly obstacles: ReadonlySet<string>;
  readonly currentRound: number;
}

// === THREAT SYSTEM TYPES ===

export interface ThreatUpdate {
  readonly playerId: string;
  readonly damageReceived: number;
  readonly healingReceived: number;
  readonly playerArmor: number;
  readonly damageToSelf: number;
  readonly totalDamageDealt: number;
  readonly healingDone: number;
  readonly source?: string;
}

export interface ThreatEntry {
  readonly playerId: string;
  readonly playerName: string;
  readonly threat: number;
  readonly roundsTracked: number;
  readonly threatValue: number;
  readonly lastUpdate: number;
  readonly damageHistory: number[];
  readonly healingHistory: number[];
}

export interface ThreatConfig {
  readonly enabled: boolean;
  readonly decayRate: number;
  readonly healingMultiplier: number;
  readonly damageMultiplier: number;
  readonly armorMultiplier: number;
  readonly avoidLastTargetRounds: number;
  readonly fallbackToLowestHp: boolean;
  readonly enableTiebreaker: boolean;
}

// === TARGETING RESULT ===

export interface TargetingResult {
  readonly target: CombatEntity | null;
  readonly reason?: string;
  readonly confidence: number;
}