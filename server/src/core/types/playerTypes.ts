/**
 * @fileoverview Player-related type definitions and interfaces
 * Core types for player entities, actions, and state management
 *
 * @file server/src/core/types/playerTypes.ts
 */

import type { HexCoordinate } from '@/utils/hex/index.js';

// === PLAYER IDENTITY ===

export interface PlayerId {
  readonly value: string;
}

export interface PlayerName {
  readonly value: string;
}

// === PLAYER ACTIONS ===

export type PlayerActionType = 'move' | 'attack' | 'ability' | 'wait';

export interface PlayerAction {
  readonly type: PlayerActionType;
  readonly targetId?: string;
  readonly targetPosition?: HexCoordinate;
  readonly abilityId?: string;
  readonly submissionTime: number;
}

export interface ActionSubmissionResult {
  readonly success: boolean;
  readonly reason?: string;
  readonly action?: PlayerAction;
}

// === PLAYER STATS ===

export interface PlayerStats {
  readonly maxHp: number;
  readonly baseArmor: number;
  readonly baseDamage: number;
  readonly movementRange: number;
}

export interface PlayerLevel {
  readonly current: number;
  readonly experience: number;
  readonly experienceToNext: number;
}

// === ABILITIES ===

export type AbilityType = 'attack' | 'defense' | 'utility' | 'healing';

export interface AbilityDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: AbilityType;
  readonly damage?: number;
  readonly healing?: number;
  readonly range: number;
  readonly cooldown: number;
  readonly description: string;
}

export interface AbilityCooldown {
  readonly abilityId: string;
  readonly turnsRemaining: number;
}

// === STATUS EFFECTS ===

export interface StatusEffect {
  readonly name: string;
  readonly duration: number;
  readonly value?: number;
  readonly description: string;
}

export interface StatusEffectResult {
  readonly expired: string[];
  readonly effects: Array<{
    readonly type: string;
    readonly value: number;
  }>;
}

// === PLAYER CLASS ===

export interface PlayerClass {
  readonly name: string;
  readonly stats: PlayerStats;
  readonly abilities: ReadonlyArray<AbilityDefinition>;
}

// === COMBAT ===

export interface DamageResult {
  readonly damageDealt: number;
  readonly blocked: number;
  readonly died: boolean;
}

export interface HealResult {
  readonly amountHealed: number;
  readonly newHp: number;
}

// === MOVEMENT ===

export interface MovementResult {
  readonly success: boolean;
  readonly reason?: string;
  readonly newPosition?: HexCoordinate;
}

// === PLAYER STATE ===

export interface PlayerState {
  readonly id: string;
  readonly name: string;
  readonly level: PlayerLevel;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly armor: number;
  readonly position: HexCoordinate;
  readonly isAlive: boolean;
  readonly hasSubmittedAction: boolean;
  readonly hasMovedThisRound: boolean;
}

// === CLIENT DATA ===

export interface PlayerPublicData {
  readonly id: string;
  readonly name: string;
  readonly className: string;
  readonly level: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly armor: number;
  readonly position: HexCoordinate;
  readonly isAlive: boolean;
  readonly hasSubmittedAction: boolean;
  readonly statusEffects: ReadonlyArray<StatusEffect>;
}

export interface PlayerPrivateData extends PlayerPublicData {
  readonly experience: number;
  readonly damageModifier: number;
  readonly submittedAction: PlayerAction | null;
  readonly actionSubmissionTime: number | null;
  readonly abilities: ReadonlyArray<AbilityDefinition>;
  readonly availableAbilities: ReadonlyArray<AbilityDefinition>;
  readonly abilityCooldowns: ReadonlyArray<AbilityCooldown>;
}
