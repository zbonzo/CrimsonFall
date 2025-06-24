/**
 * Handles combat calculations with status effect integration
 */

import { EntityStatsManager } from '@/core/player/EntityStatsManager.js';
import { EntityStatusEffectsManager } from '@/core/player/EntityStatusEffectsManager.js';
import type { DamageResult, HealResult, StatusEffectResult } from '@/core/types/entityTypes.js';

export class MonsterCombatBehavior {
  // Future use: status effects integration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-useless-constructor
  constructor(private readonly _statusEffects: EntityStatusEffectsManager) {}

  public calculateEffectiveArmor(
    baseArmor: number,
    statusEffects: EntityStatusEffectsManager
  ): number {
    let armor = baseArmor;
    if (statusEffects.hasEffect('shielded')) {
      const shieldEffect = statusEffects.getEffect('shielded');
      if (shieldEffect?.value) {
        armor += shieldEffect.value;
      }
    }
    return armor;
  }

  public takeDamage(
    amount: number,
    source: string,
    stats: EntityStatsManager,
    statusEffects: EntityStatusEffectsManager,
    isAlive: boolean
  ): DamageResult {
    if (!isAlive) {
      return { damageDealt: 0, blocked: 0, died: false };
    }

    const damageModifier = statusEffects.getDamageTakenModifier();
    const modifiedDamage = Math.floor(amount * damageModifier);
    return stats.takeDamage(modifiedDamage, source);
  }

  public heal(
    amount: number,
    stats: EntityStatsManager,
    statusEffects: EntityStatusEffectsManager,
    isAlive: boolean
  ): HealResult {
    if (!isAlive) {
      return { amountHealed: 0, newHp: stats.currentHp };
    }

    const healingModifier = statusEffects.getHealingModifier();
    const modifiedHealing = Math.floor(amount * healingModifier);
    return stats.heal(modifiedHealing);
  }

  public calculateDamageOutput(
    baseDamage: number | undefined,
    stats: EntityStatsManager,
    statusEffects: EntityStatusEffectsManager
  ): number {
    const damage = stats.calculateDamageOutput(baseDamage);
    const statusModifier = statusEffects.getDamageModifier();
    return Math.floor(damage * statusModifier);
  }

  public applyStatusEffectResults(
    statusEffectResults: StatusEffectResult,
    stats: EntityStatsManager
  ): void {
    for (const effect of statusEffectResults.effects) {
      switch (effect.type) {
        case 'poison_damage':
        case 'burning_damage':
          stats.takeDamage(effect.value, effect.type);
          break;
        case 'regeneration_heal':
          stats.heal(effect.value);
          break;
      }
    }
  }
}
