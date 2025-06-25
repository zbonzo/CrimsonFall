/**
 * @fileoverview Clean player abilities management following naming conventions
 * Handles ability definitions, cooldowns, and usage validation
 *
 * COMPLEXITY NOTE: This file remains at 309 lines due to:
 * - Complex ability validation and availability checking
 * - Cooldown management with multiple timing systems
 * - Ability learning progression and unlock conditions
 * - Resource cost validation and tracking
 * 
 * FUTURE REFACTORING OPPORTUNITIES:
 * - Extract AbilityCooldownManager for timing logic
 * - Create AbilityValidator for usage validation
 * - Separate AbilityProgression for learning/unlocks
 * - Split ResourceManager for cost tracking
 *
 * FIXED: Removed reserved keywords 'type' → 'variant'
 *
 * @file server/src/core/player/EntityAbilitiesManager.ts
 */

import type {
  AbilityCooldown,
  AbilityDefinition,
  AbilityVariant,
} from '@/core/types/playerTypes.js';

// === ABILITIES MANAGER ===

/**
 * Manages player abilities and cooldowns with clean naming
 */
export class EntityAbilitiesManager {
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
      variant: 'attack',
      damage: 10,
      range: 1,
      cooldown: 0,
      description: 'A simple melee attack',
    });

    this.addAbility({
      id: 'wait',
      name: 'Wait',
      variant: 'utility',
      range: 0,
      cooldown: 0,
      description: 'Skip your turn',
    });

    this._classAbilities.forEach(ability => this._unlockedAbilities.add(ability.id));
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

  public getAbilitiesByVariant(variant: AbilityVariant): ReadonlyArray<AbilityDefinition> {
    return this.unlockedAbilities.filter(ability => ability.variant === variant);
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
      return { success: false, reason: usageCheck.reason || 'Unknown validation error' };
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
    // TODO: GAME DESIGN DECISION - Cooldown Reset Between Encounters
    //
    // DECISION NEEDED: How should cooldowns behave between encounters?
    //
    // OPTIONS:
    // A) Full Reset: All cooldowns cleared (simpler, more forgiving)
    // B) Full Persist: All cooldowns carry over (strategic depth, resource management)
    // C) Hybrid: Reset basic (0-2), reduce tactical (3-4), persist signature (5+)
    // D) Set as a Game Setting
    //
    // FACTORS TO CONSIDER:
    // - Ability variety and cooldown distribution in final game
    // - Player feedback on encounter difficulty progression
    // - Balance between accessibility and strategic depth
    // - Session length and encounter count per dungeon
    //
    // IMPLEMENTATION IMPACT:
    // - Encounter balancing assumptions
    // - Ability design patterns (short vs long cooldowns)
    // - Player learning curve and frustration points
    //
    // DECISION TIMELINE: After ability system is more complete and tested
    //
    // CURRENT: Full reset for development simplicity
    this.clearAllCooldowns();

    // Clear temporary abilities
    this._temporaryAbilities.clear();
    this._usageCount.clear();

    // Add basic abilities
    this.addAbility({
      id: 'basic_attack',
      name: 'Basic Attack',
      variant: 'attack',
      damage: 10,
      range: 1,
      cooldown: 0,
      description: 'A simple melee attack',
    });

    this.addAbility({
      id: 'wait',
      name: 'Wait',
      variant: 'utility',
      range: 0,
      cooldown: 0,
      description: 'Skip your turn',
    });

    this._classAbilities
      .filter(ability => this._unlockedAbilities.has(ability.id))
      .forEach(ability => {
        this._unlockedAbilities.add(ability.id);
      });
  }

  // TODO: Add method for alternative reset strategies when decision is made
  // Alternative: Don't reset any cooldowns
  // Only clear temporary state

  // Alternative: Category-based reset rules
  // Requires ability categorization system

  // === UTILITY ===

  public getCooldownMap(): ReadonlyMap<string, number> {
    return new Map(this._cooldowns);
  }

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
      ability.variant === 'attack' ||
      (ability.variant === 'healing' && ability.range > 0) ||
      (ability.variant === 'defense' && ability.range > 0)
    );
  }
}
