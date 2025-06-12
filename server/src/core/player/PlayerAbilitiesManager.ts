/**
 * @fileoverview Clean player abilities management following naming conventions
 * Handles ability definitions, cooldowns, and usage validation
 *
 * @file server/src/core/player/PlayerAbilitiesManager.ts
 */

import type { AbilityDefinition, AbilityType, AbilityCooldown } from '@/core/types/playerTypes.js';

// === ABILITIES MANAGER ===

/**
 * Manages player abilities and cooldowns with clean naming
 */
export class PlayerAbilitiesManager {
  private readonly _classAbilities: ReadonlyArray<AbilityDefinition>;
  private readonly _unlockedAbilities: Set<string> = new Set();
  private readonly _cooldowns: Map<string, number> = new Map();
  private readonly _usageCount: Map<string, number> = new Map();
  private _temporaryAbilities: Map<string, AbilityDefinition> = new Map();

  constructor(classAbilities: ReadonlyArray<AbilityDefinition> = []) {
    this._classAbilities = [...classAbilities];

    // Add basic abilities
    this.addAbility({
      id: 'basic_attack',
      name: 'Basic Attack',
      type: 'attack',
      damage: 10,
      range: 1,
      cooldown: 0,
      description: 'A simple melee attack',
    });

    this.addAbility({
      id: 'wait',
      name: 'Wait',
      type: 'utility',
      range: 0,
      cooldown: 0,
      description: 'Skip your turn',
    });
  }

  // === GETTERS ===

  public get abilities(): ReadonlyArray<AbilityDefinition> {
    const temporaryAbilities = Array.from(this._temporaryAbilities.values());
    return [...this._classAbilities, ...temporaryAbilities];
  }

  public get unlockedAbilities(): ReadonlyArray<AbilityDefinition> {
    return this.abilities.filter(ability => this.hasAbility(ability.id));
  }

  public get availableAbilities(): ReadonlyArray<AbilityDefinition> {
    return this.unlockedAbilities.filter(ability => !this.isOnCooldown(ability.id));
  }

  public get cooldowns(): ReadonlyArray<AbilityCooldown> {
    return Array.from(this._cooldowns.entries()).map(([abilityId, turnsRemaining]) => ({
      abilityId,
      turnsRemaining,
    }));
  }

  // === ABILITY ACCESS ===

  public getAbility(abilityId: string): AbilityDefinition | null {
    return this.abilities.find(ability => ability.id === abilityId) || null;
  }

  public getAbilitiesByType(type: AbilityType): ReadonlyArray<AbilityDefinition> {
    return this.unlockedAbilities.filter(ability => ability.type === type);
  }

  public hasAbility(abilityId: string): boolean {
    return this._unlockedAbilities.has(abilityId);
  }

  public getCooldown(abilityId: string): number {
    return this._cooldowns.get(abilityId) || 0;
  }

  public isOnCooldown(abilityId: string): boolean {
    return this.getCooldown(abilityId) > 0;
  }

  public canUseAbility(abilityId: string): { canUse: boolean; reason?: string } {
    const ability = this.getAbility(abilityId);
    if (!ability) {
      return { canUse: false, reason: `Ability '${abilityId}' does not exist` };
    }

    if (!this.hasAbility(abilityId)) {
      return { canUse: false, reason: `Ability '${ability.name}' is not unlocked` };
    }

    if (this.isOnCooldown(abilityId)) {
      const cooldown = this.getCooldown(abilityId);
      return {
        canUse: false,
        reason: `Ability '${ability.name}' is on cooldown (${cooldown} rounds remaining)`,
      };
    }

    return { canUse: true };
  }

  // === ABILITY MANAGEMENT ===

  public addAbility(ability: AbilityDefinition): void {
    this._temporaryAbilities.set(ability.id, ability);
    this._unlockedAbilities.add(ability.id);
  }

  public removeAbility(abilityId: string): boolean {
    const removed = this._temporaryAbilities.delete(abilityId);
    if (removed) {
      this._unlockedAbilities.delete(abilityId);
      this._cooldowns.delete(abilityId);
    }
    return removed;
  }

  public addUnlock(abilityId: string): { success: boolean; reason?: string } {
    const ability = this.getAbility(abilityId);
    if (!ability) {
      return { success: false, reason: `Ability '${abilityId}' does not exist` };
    }

    if (this.hasAbility(abilityId)) {
      return { success: false, reason: `Ability '${abilityId}' already unlocked` };
    }

    this._unlockedAbilities.add(abilityId);
    return { success: true };
  }

  public removeUnlock(abilityId: string): boolean {
    return this._unlockedAbilities.delete(abilityId);
  }

  // === COOLDOWN MANAGEMENT ===

  public setCooldown(abilityId: string, turns: number): void {
    if (turns > 0) {
      this._cooldowns.set(abilityId, turns);
    } else {
      this._cooldowns.delete(abilityId);
    }
  }

  public clearCooldown(abilityId: string): boolean {
    return this._cooldowns.delete(abilityId);
  }

  public clearAllCooldowns(): void {
    this._cooldowns.clear();
  }

  // === ABILITY USAGE ===

  public useAbility(abilityId: string): { success: boolean; reason?: string } {
    const usageCheck = this.canUseAbility(abilityId);
    if (!usageCheck.canUse) {
      return { success: false, reason: usageCheck.reason };
    }

    const ability = this.getAbility(abilityId)!;

    // Set cooldown
    if (ability.cooldown > 0) {
      this.setCooldown(abilityId, ability.cooldown);
    }

    // Update usage count
    const currentUsage = this._usageCount.get(abilityId) || 0;
    this._usageCount.set(abilityId, currentUsage + 1);

    return { success: true };
  }

  public getUsageCount(abilityId: string): number {
    return this._usageCount.get(abilityId) || 0;
  }

  // === ROUND PROCESSING ===

  public processRound(): string[] {
    const expiredAbilities: string[] = [];

    for (const [abilityId, cooldown] of this._cooldowns.entries()) {
      if (cooldown <= 1) {
        this._cooldowns.delete(abilityId);
        expiredAbilities.push(abilityId);
      } else {
        this._cooldowns.set(abilityId, cooldown - 1);
      }
    }

    return expiredAbilities;
  }

  public resetForEncounter(): void {
    this.clearAllCooldowns();
    this._temporaryAbilities.clear();
    this._usageCount.clear();

    // Re-add basic abilities
    this._unlockedAbilities.clear();
    this._unlockedAbilities.add('basic_attack');
    this._unlockedAbilities.add('wait');
  }

  // === UTILITY ===

  public calculateDamage(abilityId: string, damageModifier: number = 1.0): number {
    const ability = this.getAbility(abilityId);
    if (!ability || !ability.damage) {
      return 0;
    }
    return Math.floor(ability.damage * damageModifier);
  }

  public calculateHealing(abilityId: string, healingModifier: number = 1.0): number {
    const ability = this.getAbility(abilityId);
    if (!ability || !ability.healing) {
      return 0;
    }
    return Math.floor(ability.healing * healingModifier);
  }

  public isTargetRequired(abilityId: string): boolean {
    const ability = this.getAbility(abilityId);
    if (!ability) {
      return false;
    }

    return (
      ability.type === 'attack' ||
      (ability.type === 'healing' && ability.range > 0) ||
      (ability.type === 'defense' && ability.range > 0)
    );
  }
}
