/**
 * @fileoverview Clean status effects management following naming conventions
 * Handles status effect application, processing, and expiration
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

// === STATUS EFFECTS MANAGER ===

/**
 * Manages player status effects with clean naming
 */
export class EntityStatusEffectsManager {
  private readonly _effects: Map<string, StatusEffect> = new Map();
  private readonly _stacks: Map<string, number> = new Map();

  // === GETTERS ===

  public get effects(): ReadonlyArray<StatusEffect> {
    return Array.from(this._effects.values());
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
    return this._effects.get(effectName) || null;
  }

  public getStacks(effectName: string): number {
    return this._stacks.get(effectName) || 0;
  }

  public getEffectsByCategory(category: 'buff' | 'debuff'): ReadonlyArray<StatusEffect> {
    const effects: StatusEffect[] = [];

    for (const [effectName, effect] of this._effects.entries()) {
      const config = EFFECT_CONFIGS[effectName as StatusEffectName];
      if (config && config.category === category) {
        effects.push(effect);
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

    const existingEffect = this._effects.get(effectName);

    if (config.stackable && existingEffect) {
      return this.addStack(effectName, duration, value, config);
    }

    if (!config.stackable && existingEffect) {
      if (duration > existingEffect.duration || (value && value > (existingEffect.value || 0))) {
        this.removeEffect(effectName);
      } else {
        return { success: false, reason: `${effectName} already active with better effect` };
      }
    }

    const newEffect: StatusEffect = {
      name: effectName,
      duration,
      value,
      description: EFFECT_DESCRIPTIONS[effectName],
    };

    this._effects.set(effectName, newEffect);
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
      if (config && config.category === category) {
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

    for (const [effectName, effect] of this._effects.entries()) {
      const effectResult = this.processEffect(effectName, effect);
      if (effectResult) {
        effects.push(effectResult);
      }

      const newDuration = effect.duration - 1;
      if (newDuration <= 0) {
        this._effects.delete(effectName);
        this._stacks.delete(effectName);
        expired.push(effectName);
      } else {
        this._effects.set(effectName, { ...effect, duration: newDuration });
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

  // === PRIVATE HELPERS ===

  private addStack(
    effectName: string,
    duration: number,
    value: number | undefined,
    config: StatusEffectConfig
  ): { success: boolean; reason?: string; stacks?: number } {
    const currentStacks = this._stacks.get(effectName) || 0;
    const maxStacks = config.maxStacks || Infinity;

    if (currentStacks >= maxStacks) {
      return { success: false, reason: `${effectName} already at maximum stacks (${maxStacks})` };
    }

    const existingEffect = this._effects.get(effectName)!;
    const newStacks = currentStacks + 1;

    // TODO: CRITICAL - Redesign stacking system
    // Current implementation has exponential growth bug and unclear design decisions:
    //
    // ISSUES:
    // 1. calculateStackedValue uses currentValue (already accumulated) instead of baseValue
    // 2. No clear rules for handling different values in stacks
    // 3. Duration handling is unclear (max vs refresh vs individual timers)
    // 4. No consideration for different sources (multiple monsters applying poison)
    //
    // DESIGN DECISIONS NEEDED:
    // - Should stacks be individual effects with separate timers?
    // - How should different damage values combine?
    // - Should there be per-source limits vs total limits?
    // - Should stacks refresh duration or maintain individual timers?
    //
    // PROPOSED SOLUTIONS:
    // A) Individual Effect Tracking: Map<effectName, EffectInstance[]>
    // B) Aggregate with Stack History: { totalValue, stacks: StackInstance[] }
    // C) Source-Based Stacking: Map<effectName, Map<sourceId, EffectInstance>>

    const updatedEffect: StatusEffect = {
      ...existingEffect,
      duration: Math.max(existingEffect.duration, duration),
      value: this.calculateStackedValue(existingEffect.value, value, newStacks),
    };

    this._effects.set(effectName, updatedEffect);
    this._stacks.set(effectName, newStacks);

    return { success: true, stacks: newStacks };
  }

  private calculateStackedValue(
    currentValue: number | undefined,
    newValue: number | undefined,
    stacks: number
  ): number | undefined {
    if (!currentValue && !newValue) {
      return undefined;
    }

    // TODO: BROKEN - This causes exponential growth!
    // currentValue is already the accumulated value from previous stacks
    // Should store and use baseValue instead
    //
    // Current: accumulated_value * new_stack_count = exponential growth
    // Should: base_value * total_stack_count = linear growth
    const base = currentValue || newValue || 0;
    return base * stacks;
  }

  private processEffect(
    effectName: string,
    effect: StatusEffect
  ): { type: string; value: number } | null {
    switch (effectName) {
      case 'poison':
      case 'burning':
        if (effect.value) {
          return { type: `${effectName}_damage`, value: effect.value };
        }
        break;

      case 'regeneration':
        if (effect.value) {
          return { type: 'regeneration_heal', value: effect.value };
        }
        break;

      default:
        return null;
    }

    return null;
  }
}
