/**
 * @fileoverview Status effect system type definitions
 * Extracted from entityTypes.ts for better organization
 *
 * @file server/src/core/types/statusEffects.ts
 */

// === STATUS EFFECT CORE TYPES ===

export interface StatusEffect {
  readonly name: string;
  readonly duration: number;
  readonly value?: number;
  readonly description: string;
}

export type StatusEffectVariant = 
  | 'buff' 
  | 'debuff' 
  | 'damage_over_time' 
  | 'heal_over_time' 
  | 'movement_modifier' 
  | 'action_modifier';

// === STATUS EFFECT RESULTS ===

export interface StatusEffectResult {
  readonly expired: string[];
  readonly effects: Array<{
    readonly type: string;
    readonly value: number;
  }>;
}

// === STATUS EFFECT TARGET INTERFACE ===

export interface StatusEffectTarget {
  addStatusEffect(effectName: string, duration: number, value?: number): { success: boolean; reason?: string; stacks?: number };
  removeStatusEffect(effectName: string): boolean;
  hasStatusEffect(effectName: string): boolean;
  canAct(): boolean;
  canMove(): boolean;
  canBeTargeted(): boolean;
}