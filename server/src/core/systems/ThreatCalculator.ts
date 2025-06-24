/**
 * @fileoverview Threat calculation utilities
 * Utility class for calculating threat values from combat actions
 * Extracted from ThreatManager.ts to follow single responsibility principle
 *
 * @file server/src/core/systems/ThreatCalculator.ts
 */

import type { ThreatConfig, ThreatUpdate } from '@/core/types/entityTypes.js';

// === THREAT CALCULATOR UTILITY ===

/**
 * Utility class for calculating threat values from combat actions
 * Pure functions for threat calculation - no state management
 */
export class ThreatCalculator {
  /**
   * Creates a generic threat update with all parameters
   */
  public static createThreatUpdate(
    playerId: string,
    damageToMonster: number = 0,
    totalDamageDealt: number = 0,
    healingDone: number = 0,
    playerArmor: number = 0,
    source: string = 'unknown'
  ): ThreatUpdate {
    return {
      playerId,
      damageToSelf: damageToMonster,
      totalDamageDealt,
      healingDone,
      playerArmor,
      source,
    };
  }

  /**
   * Calculates raw threat value using threat configuration
   * Formula: ((armor × damage to self) + (total damage) + (healing)) × multipliers
   */
  public static calculateRawThreat(update: ThreatUpdate, config: ThreatConfig): number {
    const { armorMultiplier, damageMultiplier, healingMultiplier } = config;

    const armorThreat = update.playerArmor * update.damageToSelf * armorMultiplier;
    const damageThreat = update.totalDamageDealt * damageMultiplier;
    const healThreat = update.healingDone * healingMultiplier;

    return armorThreat + damageThreat + healThreat;
  }

  /**
   * Creates threat update for basic attack actions
   */
  public static createAttackThreat(
    playerId: string,
    damageDealt: number,
    playerArmor: number
  ): ThreatUpdate {
    return this.createThreatUpdate(
      playerId,
      damageDealt, // Damage to this monster
      damageDealt, // Total damage (same for single target)
      0, // No healing
      playerArmor,
      'attack'
    );
  }

  /**
   * Creates threat update for healing actions
   */
  public static createHealingThreat(
    playerId: string,
    healingAmount: number,
    playerArmor: number
  ): ThreatUpdate {
    return this.createThreatUpdate(
      playerId,
      0, // No damage to monster
      0, // No damage dealt
      healingAmount,
      playerArmor,
      'healing'
    );
  }

  /**
   * Creates threat update for ability usage with complex effects
   */
  public static createAbilityThreat(
    playerId: string,
    damageToMonster: number,
    totalDamage: number,
    healingDone: number,
    playerArmor: number,
    abilityName: string
  ): ThreatUpdate {
    return this.createThreatUpdate(
      playerId,
      damageToMonster,
      totalDamage,
      healingDone,
      playerArmor,
      `ability:${abilityName}`
    );
  }

  /**
   * Creates threat update for area of effect abilities
   */
  public static createAoEThreat(
    playerId: string,
    damageToThisMonster: number,
    totalDamageToAllTargets: number,
    targetsHit: number,
    playerArmor: number,
    abilityName: string
  ): ThreatUpdate {
    // AoE abilities generate extra threat based on number of targets
    const aoeMultiplier = Math.max(1, targetsHit * 0.5);
    const adjustedTotalDamage = totalDamageToAllTargets * aoeMultiplier;

    return this.createThreatUpdate(
      playerId,
      damageToThisMonster,
      adjustedTotalDamage,
      0,
      playerArmor,
      `aoe:${abilityName}`
    );
  }

  /**
   * Creates threat update for defensive abilities (taunts, shields, etc.)
   */
  public static createDefensiveThreat(
    playerId: string,
    defensiveValue: number, // Amount of damage prevented or armor gained
    playerArmor: number,
    abilityName: string
  ): ThreatUpdate {
    // Defensive abilities generate threat based on their protective value
    return this.createThreatUpdate(
      playerId,
      0, // No direct damage
      defensiveValue, // Threat equal to defensive value
      0, // No healing
      playerArmor,
      `defensive:${abilityName}`
    );
  }

  /**
   * Creates threat update for support abilities (buffs, debuffs on monster)
   */
  public static createSupportThreat(
    playerId: string,
    supportValue: number, // Estimated value of the support effect
    playerArmor: number,
    abilityName: string
  ): ThreatUpdate {
    return this.createThreatUpdate(
      playerId,
      0, // No direct damage
      0, // No damage dealt
      supportValue, // Support effects treated as "healing" threat
      playerArmor,
      `support:${abilityName}`
    );
  }

  /**
   * Calculates threat decay based on rounds passed
   */
  public static calculateThreatDecay(
    currentThreat: number,
    decayRate: number,
    roundsPassed: number = 1
  ): number {
    // Apply decay for multiple rounds if needed
    let decayedThreat = currentThreat;
    for (let i = 0; i < roundsPassed; i++) {
      decayedThreat *= 1 - decayRate;
    }
    return decayedThreat;
  }

  /**
   * Normalizes threat values to a 0-100 scale for AI decision making
   */
  public static normalizeThreatForAI(threatValue: number, maxObservedThreat: number = 100): number {
    if (maxObservedThreat <= 0) return 0;
    return Math.min(100, (threatValue / maxObservedThreat) * 100);
  }

  /**
   * Calculates combined threat from multiple sources
   */
  public static combineThreatUpdates(
    updates: ReadonlyArray<ThreatUpdate>,
    config: ThreatConfig
  ): number {
    return updates.reduce((total, update) => {
      return total + this.calculateRawThreat(update, config);
    }, 0);
  }

  /**
   * Estimates future threat based on current trend
   */
  public static estimateFutureThreat(
    recentUpdates: ReadonlyArray<ThreatUpdate>,
    config: ThreatConfig,
    roundsAhead: number = 1
  ): number {
    if (recentUpdates.length === 0) return 0;

    // Calculate average threat per round from recent history
    const totalRecentThreat = this.combineThreatUpdates(recentUpdates, config);
    const averageThreatPerRound = totalRecentThreat / recentUpdates.length;

    // Project forward with decay
    return this.calculateThreatDecay(
      averageThreatPerRound * roundsAhead,
      config.decayRate,
      roundsAhead
    );
  }

  /**
   * Determines threat level category for UI/AI purposes
   */
  public static getThreatLevel(
    threatValue: number
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (threatValue <= 0) return 'none';
    if (threatValue <= 10) return 'low';
    if (threatValue <= 25) return 'medium';
    if (threatValue <= 50) return 'high';
    return 'critical';
  }

  /**
   * Validates threat update data
   */
  public static validateThreatUpdate(update: ThreatUpdate): { valid: boolean; reason?: string } {
    if (!update.playerId?.trim()) {
      return { valid: false, reason: 'Player ID is required' };
    }

    if (update.damageToSelf < 0 || update.totalDamageDealt < 0 || update.healingDone < 0) {
      return { valid: false, reason: 'Threat values cannot be negative' };
    }

    if (update.playerArmor < 0) {
      return { valid: false, reason: 'Player armor cannot be negative' };
    }

    // Sanity check: total damage should be >= damage to self
    if (update.totalDamageDealt < update.damageToSelf) {
      return { valid: false, reason: 'Total damage cannot be less than damage to self' };
    }

    return { valid: true };
  }

  /**
   * Creates threat update with validation
   */
  public static createValidatedThreatUpdate(
    playerId: string,
    damageToMonster: number = 0,
    totalDamageDealt: number = 0,
    healingDone: number = 0,
    playerArmor: number = 0,
    source: string = 'unknown'
  ): { update: ThreatUpdate | null; error?: string } {
    const update = this.createThreatUpdate(
      playerId,
      damageToMonster,
      totalDamageDealt,
      healingDone,
      playerArmor,
      source
    );

    const validation = this.validateThreatUpdate(update);
    if (!validation.valid) {
      return { update: null, error: validation.reason || 'Invalid threat update data' };
    }

    return { update };
  }
}
