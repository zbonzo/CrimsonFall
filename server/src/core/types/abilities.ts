/**
 * @fileoverview Ability system type definitions
 * Extracted from entityTypes.ts for better organization
 *
 * @file server/src/core/types/abilities.ts
 */

// === ABILITY CORE TYPES ===

export type AbilityVariant = 'attack' | 'defense' | 'utility' | 'healing';

export interface AbilityDefinition {
  readonly id: string;
  readonly name: string;
  readonly variant: AbilityVariant;
  readonly damage?: number;
  readonly healing?: number;
  readonly range: number;
  readonly cooldown: number;
  readonly description: string;
  readonly areaOfEffect?: number;
  readonly manaCost?: number;
  readonly statusEffects?: StatusEffectApplication[];
}

export interface StatusEffectApplication {
  readonly effectName: string;
  readonly duration: number;
  readonly value?: number;
  readonly chance?: number; // 0.0 to 1.0, defaults to 1.0
}

// === ABILITY USAGE TYPES ===

export interface AbilityUsageResult {
  readonly success: boolean;
  readonly reason?: string;
  readonly cooldownRemaining?: number;
}

export interface AbilityAvailabilityCheck {
  readonly canUse: boolean;
  readonly reason?: string;
  readonly cooldownRemaining?: number;
  readonly resourcesRequired?: Record<string, number>;
}

// === ABILITY USER INTERFACE ===

export interface AbilityUser {
  getAbility(abilityId: string): AbilityDefinition | null;
  useAbility(abilityId: string): { success: boolean; reason?: string };
  canUseAbility(abilityId: string): { canUse: boolean; reason?: string };
  getAvailableAbilities(): ReadonlyArray<AbilityDefinition>;
}