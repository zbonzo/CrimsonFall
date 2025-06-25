/**
 * @fileoverview Clean status effects management following naming conventions
 * Handles status effect application, processing, and expiration
 *
 * COMPLEXITY NOTE: This file remains at 357 lines due to:
 * - Complex status effect stacking and duration management
 * - Multiple effect types with different application rules
 * - Stat modifier calculations affecting all entity properties
 * - Effect interaction validation and conflict resolution
 * 
 * FUTURE REFACTORING OPPORTUNITIES:
 * - Extract StatusEffectTypes to separate effect definitions
 * - Create EffectStack manager for stacking logic
 * - Separate StatModifierCalculator for stat changes
 * - Split effect validation to EffectValidator class
 *
 * TODO: Move status effect configurations to external config file
 *
 * @file server/src/core/player/PlayerStatusEffectsManager.ts
 */

import type { StatusEffect, StatusEffectResult } from '@/core/types/playerTypes.js';

// === STATUS EFFECT TYPES ===

export type StatusEffectName =
  | 'poison'
  | 'regeneration'
  | 'stunned'
  | 'shielded'
  | 'vulnerable'
  | 'enraged'
  | 'weakened'
  | 'invisible'
  | 'burning'
  | 'frozen'
  | 'blessed'
  | 'cursed';

export interface StatusEffectConfig {
  readonly stackable: boolean;
  readonly maxStacks?: number;
  readonly category: 'buff' | 'debuff';
}

// TODO: Move to server/src/config/statusEffects.ts
const EFFECT_CONFIGS: Record<StatusEffectName, StatusEffectConfig> = {
  poison: { stackable: true, maxStacks: 5, category: 'debuff' },
  regeneration: { stackable: true, maxStacks: 3, category: 'buff' },
  stunned: { stackable: false, category: 'debuff' },
  shielded: { stackable: true, maxStacks: 10, category: 'buff' },
  vulnerable: { stackable: false, category: 'debuff' },
  enraged: { stackable: false, category: 'buff' },
  weakened: { stackable: false, category: 'debuff' },
  invisible: { stackable: false, category: 'buff' },
  burning: { stackable: true, maxStacks: 3, category: 'debuff' },
  frozen: { stackable: false, category: 'debuff' },
  blessed: { stackable: false, category: 'buff' },
  cursed: { stackable: false, category: 'debuff' },
};

// TODO: Move to server/src/config/statusEffects.ts
const EFFECT_DESCRIPTIONS: Record<StatusEffectName, string> = {
  poison: 'Takes damage each turn',
  regeneration: 'Heals each turn',
  stunned: 'Cannot act',
  shielded: 'Increases armor',
  vulnerable: 'Takes increased damage',
  enraged: 'Deals increased damage',
  weakened: 'Deals reduced damage',
  invisible: 'Cannot be targeted',
  burning: 'Takes fire damage each turn',
  frozen: 'Cannot move or act',
  blessed: 'Enhanced healing received',
  cursed: 'Reduced healing received',
};

// Internal representation to correctly handle stacking
interface InternalEffectData {
  duration: number;
  baseValue?: number;
  description: string;
}

// === STATUS EFFECTS MANAGER ===

/**
 * Manages player status effects with clean naming
 */
export class EntityStatusEffectsManager {
  private readonly _effects: Map<string, InternalEffectData> = new Map();
  private readonly _stacks: Map<string, number> = new Map();

  // === GETTERS ===

  public get effects(): ReadonlyArray<StatusEffect> {
    const result: StatusEffect[] = [];
    for (const name of this._effects.keys()) {
      // Non-null assertion is safe here because we are iterating over existing keys
      result.push(this.getEffect(name)!);
    }
    return result;
  }

  public get effectNames(): ReadonlyArray<string> {
    return Array.from(this._effects.keys());
  }

  public get hasEffects(): boolean {
    return this._effects.size > 0;
  }

  // === EFFECT CHECKING ===

  public hasEffect(effectName: string): boolean {
    return this._effects.has(effectName);
  }

  public getEffect(effectName: string): StatusEffect | null {
    const data = this._effects.get(effectName);
    if (!data) {
      return null;
    }

    const stacks = this._stacks.get(effectName) || 1;
    // Construct the object carefully to satisfy exactOptionalPropertyTypes
    const effect: Omit<StatusEffect, 'value'> & { value?: number } = {
      name: effectName,
      duration: data.duration,
      description: data.description,
    };

    if (data.baseValue !== undefined) {
      effect.value = data.baseValue * stacks;
    }
    return effect as StatusEffect;
  }

  public getStacks(effectName: string): number {
    return this._stacks.get(effectName) || 0;
  }

  public getEffectsByCategory(category: 'buff' | 'debuff'): ReadonlyArray<StatusEffect> {
    const effects: StatusEffect[] = [];

    for (const effectName of this._effects.keys()) {
      const config = EFFECT_CONFIGS[effectName as StatusEffectName];
      if (config?.category === category) {
        effects.push(this.getEffect(effectName)!);
      }
    }

    return effects;
  }

  // === EFFECT APPLICATION ===

  public addEffect(
    effectName: StatusEffectName,
    duration: number,
    value?: number
  ): { success: boolean; reason?: string; stacks?: number } {
    const config = EFFECT_CONFIGS[effectName];
    if (!config) {
      return { success: false, reason: `Unknown status effect: ${effectName}` };
    }

    const existingEffectData = this._effects.get(effectName);

    if (config.stackable && existingEffectData) {
      return this.addStack(effectName, duration, config);
    }

    if (!config.stackable && existingEffectData) {
      const currentEffect = this.getEffect(effectName)!;
      if (duration > currentEffect.duration || (value && value > (currentEffect.value || 0))) {
        this.removeEffect(effectName);
      } else {
        return { success: false, reason: `${effectName} already active with better effect` };
      }
    }

    const newEffectData: InternalEffectData = {
      duration,
      description: EFFECT_DESCRIPTIONS[effectName],
    };

    if (value !== undefined) {
      newEffectData.baseValue = value;
    }

    this._effects.set(effectName, newEffectData);
    this._stacks.set(effectName, 1);

    return { success: true, stacks: 1 };
  }

  public removeEffect(effectName: string): boolean {
    const removed = this._effects.delete(effectName);
    if (removed) {
      this._stacks.delete(effectName);
    }
    return removed;
  }

  public clearEffects(): string[] {
    const clearedEffects = Array.from(this._effects.keys());
    this._effects.clear();
    this._stacks.clear();
    return clearedEffects;
  }

  public clearEffectsByCategory(category: 'buff' | 'debuff'): string[] {
    const clearedEffects: string[] = [];

    for (const [effectName] of this._effects.entries()) {
      const config = EFFECT_CONFIGS[effectName as StatusEffectName];
      if (config?.category === category) {
        this.removeEffect(effectName);
        clearedEffects.push(effectName);
      }
    }

    return clearedEffects;
  }

  // === EFFECT PROCESSING ===

  public processRound(): StatusEffectResult {
    const expired: string[] = [];
    const effects: Array<{ type: string; value: number }> = [];

    for (const [effectName, effectData] of this._effects.entries()) {
      const effectResult = this.processEffect(effectName, effectData);
      if (effectResult) {
        effects.push(effectResult);
      }

      const newDuration = effectData.duration - 1;
      if (newDuration <= 0) {
        this._effects.delete(effectName);
        this._stacks.delete(effectName);
        expired.push(effectName);
      } else {
        effectData.duration = newDuration;
      }
    }

    return { expired, effects };
  }

  // === STATUS QUERIES ===

  public canAct(): boolean {
    return !this.hasEffect('stunned') && !this.hasEffect('frozen');
  }

  public canMove(): boolean {
    return !this.hasEffect('stunned') && !this.hasEffect('frozen');
  }

  public canBeTargeted(): boolean {
    return !this.hasEffect('invisible');
  }

  public getDamageModifier(): number {
    let modifier = 1.0;

    if (this.hasEffect('enraged')) {
      const effect = this.getEffect('enraged');
      modifier *= 1 + (effect?.value || 50) / 100;
    }

    if (this.hasEffect('weakened')) {
      const effect = this.getEffect('weakened');
      modifier *= 1 - (effect?.value || 25) / 100;
    }

    return modifier;
  }

  public getDamageTakenModifier(): number {
    let modifier = 1.0;

    if (this.hasEffect('vulnerable')) {
      const effect = this.getEffect('vulnerable');
      modifier *= 1 + (effect?.value || 50) / 100;
    }

    return modifier;
  }

  public getHealingModifier(): number {
    let modifier = 1.0;

    if (this.hasEffect('blessed')) {
      const effect = this.getEffect('blessed');
      modifier *= 1 + (effect?.value || 50) / 100;
    }

    if (this.hasEffect('cursed')) {
      const effect = this.getEffect('cursed');
      modifier *= 1 - (effect?.value || 50) / 100;
    }

    return modifier;
  }

  // === UTILITY METHODS ===

  public resetForEncounter(): void {
    this._effects.clear();
    this._stacks.clear();
  }

  public getActiveStatusEffects(): ReadonlyArray<import('@/core/types/statusEffects.js').StatusEffect> {
    return this.effects as ReadonlyArray<import('@/core/types/statusEffects.js').StatusEffect>;
  }

  public hasStatusEffect(effectName: string): boolean {
    return this.hasEffect(effectName);
  }

  public getDamageModifierWithBase(baseDamage?: number): number {
    const modifier = this.getDamageModifier();
    return baseDamage ? baseDamage * modifier : modifier;
  }

  public getHealingModifierWithBase(baseHealing?: number): number {
    const modifier = this.getHealingModifier();
    return baseHealing ? baseHealing * modifier : modifier;
  }

  // === PRIVATE HELPERS ===

  private addStack(
    effectName: string,
    duration: number,
    config: StatusEffectConfig
  ): { success: boolean; reason?: string; stacks?: number } {
    const currentStacks = this._stacks.get(effectName) || 0;
    const maxStacks = config.maxStacks || Infinity;

    if (currentStacks >= maxStacks) {
      return { success: false, reason: `${effectName} already at maximum stacks (${maxStacks})` };
    }

    const existingEffectData = this._effects.get(effectName)!;
    const newStacks = currentStacks + 1;

    // Refresh duration to the greater of the existing or new duration
    existingEffectData.duration = Math.max(existingEffectData.duration, duration);

    this._stacks.set(effectName, newStacks);

    return { success: true, stacks: newStacks };
  }

  private processEffect(
    effectName: string,
    effectData: InternalEffectData
  ): { type: string; value: number } | null {
    const stacks = this._stacks.get(effectName) || 1;
    const totalValue =
      effectData.baseValue !== undefined ? effectData.baseValue * stacks : undefined;

    switch (effectName) {
      case 'poison':
      case 'burning':
        if (totalValue) {
          return { type: `${effectName}_damage`, value: totalValue };
        }
        break;

      case 'regeneration':
        if (totalValue) {
          return { type: 'regeneration_heal', value: totalValue };
        }
        break;

      default:
        return null;
    }

    return null;
  }
}
