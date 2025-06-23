/**
 * @fileoverview Threat management system for monsters
 * Tracks threat values and manages target selection based on player actions
 *
 * @file server/src/core/systems/ThreatManager.ts
 */

import type {
  ThreatConfig,
  ThreatEntry,
  ThreatUpdate,
  CombatEntity,
  TargetingResult,
} from '@/core/types/entityTypes.js';

// === CONSTANTS ===

const DEFAULT_THREAT_CONFIG: ThreatConfig = {
  enabled: true,
  decayRate: 0.1,
  healingMultiplier: 1.5,
  damageMultiplier: 1.0,
  armorMultiplier: 0.5,
  avoidLastTargetRounds: 1,
  fallbackToLowestHp: true,
  enableTiebreaker: true,
} as const;

const MINIMUM_THREAT_THRESHOLD = 0.1;

// === THREAT MANAGER ===

/**
 * Manages threat values for monster AI targeting
 * Implements threat-based target selection with decay and history tracking
 */
export class ThreatManager {
  private readonly _config: ThreatConfig;
  private readonly _threatTable: Map<string, number> = new Map();
  private readonly _lastTargets: string[] = [];
  private readonly _threatHistory: Map<string, ThreatUpdate[]> = new Map();
  private _roundsActive: number = 0;

  constructor(config: Partial<ThreatConfig> = {}) {
    this._config = { ...DEFAULT_THREAT_CONFIG, ...config };
  }

  // === GETTERS ===

  public get isEnabled(): boolean {
    return this._config.enabled;
  }

  public get config(): ThreatConfig {
    return { ...this._config };
  }

  public get threatEntries(): ReadonlyArray<ThreatEntry> {
    return Array.from(this._threatTable.entries()).map(([playerId, threat]) => ({
      playerId,
      playerName: playerId, // This would be resolved from entity manager
      threat,
      roundsTracked: this._roundsActive,
    }));
  }

  public get lastTargets(): ReadonlyArray<string> {
    return [...this._lastTargets];
  }

  // === THREAT MANIPULATION ===

  public initializeThreat(entityId: string): void {
    if (!this._config.enabled) return;

    if (!this._threatTable.has(entityId)) {
      this._threatTable.set(entityId, 0);
      this._threatHistory.set(entityId, []);
    }
  }

  public addThreat(update: ThreatUpdate): void {
    if (!this._config.enabled) return;

    this.initializeThreat(update.playerId);

    const { armorMultiplier, damageMultiplier, healingMultiplier } = this._config;

    // Calculate threat using formula: ((armor × damage to self) + (total damage) + (healing))
    const armorThreat = update.playerArmor * update.damageToSelf * armorMultiplier;
    const damageThreat = update.totalDamageDealt * damageMultiplier;
    const healThreat = update.healingDone * healingMultiplier;

    const totalThreat = armorThreat + damageThreat + healThreat;

    if (totalThreat > 0) {
      const currentThreat = this._threatTable.get(update.playerId) || 0;
      this._threatTable.set(update.playerId, currentThreat + totalThreat);

      // Store threat history
      const history = this._threatHistory.get(update.playerId) || [];
      history.push(update);

      // Keep only last 10 updates per player
      if (history.length > 10) {
        history.shift();
      }
      this._threatHistory.set(update.playerId, history);
    }
  }

  public getThreat(entityId: string): number {
    return this._threatTable.get(entityId) || 0;
  }

  public setThreat(entityId: string, value: number): void {
    if (!this._config.enabled) return;

    if (value <= MINIMUM_THREAT_THRESHOLD) {
      this._threatTable.delete(entityId);
      this._threatHistory.delete(entityId);
    } else {
      this._threatTable.set(entityId, value);
    }
  }

  public clearThreat(entityId: string): void {
    this._threatTable.delete(entityId);
    this._threatHistory.delete(entityId);
  }

  public clearAllThreat(): void {
    this._threatTable.clear();
    this._threatHistory.clear();
    this._lastTargets.length = 0;
  }

  // === TARGET TRACKING ===

  public trackTarget(entityId: string): void {
    if (!this._config.enabled || !entityId) return;

    // Remove from current position if exists
    const existingIndex = this._lastTargets.indexOf(entityId);
    if (existingIndex !== -1) {
      this._lastTargets.splice(existingIndex, 1);
    }

    // Add to front
    this._lastTargets.unshift(entityId);

    // Keep only the configured number of recent targets
    const maxTracked = this._config.avoidLastTargetRounds || 1;
    if (this._lastTargets.length > maxTracked) {
      this._lastTargets.length = maxTracked;
    }
  }

  public wasRecentlyTargeted(entityId: string): boolean {
    if (!this._config.enabled) return false;
    return this._lastTargets.includes(entityId);
  }

  // === TARGET SELECTION ===

  public selectTarget(availableTargets: ReadonlyArray<CombatEntity>): TargetingResult {
    if (!this._config.enabled || availableTargets.length === 0) {
      return {
        target: null,
        reason: 'No threat system or no available targets',
        confidence: 0.0,
      };
    }

    // Clean up dead entities
    this.cleanupDeadEntities(availableTargets);

    // Filter targets that weren't recently targeted
    const nonRecentTargets = availableTargets.filter(
      target => !this.wasRecentlyTargeted(target.id)
    );

    // Use all targets if everyone was recently targeted
    const targetPool = nonRecentTargets.length > 0 ? nonRecentTargets : availableTargets;

    // Get targets with threat
    const targetsWithThreat = targetPool
      .map(target => ({
        target,
        threat: this.getThreat(target.id),
      }))
      .filter(entry => entry.threat > MINIMUM_THREAT_THRESHOLD);

    // If no one has significant threat, use fallback
    if (targetsWithThreat.length === 0) {
      return this.handleNoThreatFallback(targetPool);
    }

    // Find highest threat target(s)
    const maxThreat = Math.max(...targetsWithThreat.map(entry => entry.threat));
    const highestThreatTargets = targetsWithThreat.filter(
      entry => Math.abs(entry.threat - maxThreat) < 0.01 // Handle floating point comparison
    );

    // Handle tie-breaking
    let selectedTarget: CombatEntity;
    let confidence: number;

    if (highestThreatTargets.length === 1) {
      selectedTarget = highestThreatTargets[0].target;
      confidence = 0.9;
    } else if (this._config.enableTiebreaker) {
      // Random selection among tied players
      const randomIndex = Math.floor(Math.random() * highestThreatTargets.length);
      selectedTarget = highestThreatTargets[randomIndex].target;
      confidence = 0.7;
    } else {
      // Deterministic selection (first in list)
      selectedTarget = highestThreatTargets[0].target;
      confidence = 0.8;
    }

    // Track this selection
    this.trackTarget(selectedTarget.id);

    return {
      target: selectedTarget,
      reason: `Selected target with highest threat: ${maxThreat.toFixed(1)}`,
      confidence,
    };
  }

  // === ROUND PROCESSING ===

  public processRound(): void {
    if (!this._config.enabled) return;

    this._roundsActive++;
    this.applyThreatDecay();
  }

  public applyThreatDecay(): void {
    if (!this._config.enabled) return;

    const decayRate = this._config.decayRate;

    for (const [entityId, threat] of this._threatTable.entries()) {
      const newThreat = threat * (1 - decayRate);

      if (newThreat < MINIMUM_THREAT_THRESHOLD) {
        this._threatTable.delete(entityId);
        this._threatHistory.delete(entityId);
      } else {
        this._threatTable.set(entityId, newThreat);
      }
    }
  }

  public applyThreatReduction(reductionRate: number): void {
    if (!this._config.enabled) return;

    for (const [entityId, threat] of this._threatTable.entries()) {
      const newThreat = threat * (1 - reductionRate);

      if (newThreat < MINIMUM_THREAT_THRESHOLD) {
        this._threatTable.delete(entityId);
        this._threatHistory.delete(entityId);
      } else {
        this._threatTable.set(entityId, newThreat);
      }
    }
  }

  // === UTILITY METHODS ===

  public resetForEncounter(): void {
    this.clearAllThreat();
    this._roundsActive = 0;
  }

  public getTopThreats(count: number = 3): ReadonlyArray<ThreatEntry> {
    return [...this.threatEntries].sort((a, b) => b.threat - a.threat).slice(0, count);
  }

  public getThreatHistory(entityId: string): ReadonlyArray<ThreatUpdate> {
    return this._threatHistory.get(entityId) || [];
  }

  public getTotalThreatGenerated(entityId: string): number {
    const history = this.getThreatHistory(entityId);
    return history.reduce((total, update) => {
      const { armorMultiplier, damageMultiplier, healingMultiplier } = this._config;
      const armorThreat = update.playerArmor * update.damageToSelf * armorMultiplier;
      const damageThreat = update.totalDamageDealt * damageMultiplier;
      const healThreat = update.healingDone * healingMultiplier;
      return total + armorThreat + damageThreat + healThreat;
    }, 0);
  }

  // === DEBUG METHODS ===

  public getDebugInfo(): {
    enabled: boolean;
    config: ThreatConfig;
    threatTable: Record<string, number>;
    lastTargets: string[];
    roundsActive: number;
    totalEntities: number;
  } {
    const threatTable: Record<string, number> = {};
    for (const [entityId, threat] of this._threatTable.entries()) {
      threatTable[entityId] = Math.round(threat * 10) / 10; // Round to 1 decimal
    }

    return {
      enabled: this._config.enabled,
      config: this._config,
      threatTable,
      lastTargets: [...this._lastTargets],
      roundsActive: this._roundsActive,
      totalEntities: this._threatTable.size,
    };
  }

  // === PRIVATE HELPERS ===

  private handleNoThreatFallback(targetPool: ReadonlyArray<CombatEntity>): TargetingResult {
    if (this._config.fallbackToLowestHp) {
      // Find target with lowest HP percentage
      const lowestHpTarget = targetPool.reduce((lowest, current) => {
        const currentHpPercent = current.currentHp / current.maxHp;
        const lowestHpPercent = lowest.currentHp / lowest.maxHp;
        return currentHpPercent < lowestHpPercent ? current : lowest;
      });

      this.trackTarget(lowestHpTarget.id);

      return {
        target: lowestHpTarget,
        reason: 'No threat found, targeting lowest HP player',
        confidence: 0.5,
      };
    }

    // Random selection fallback
    const randomIndex = Math.floor(Math.random() * targetPool.length);
    const randomTarget = targetPool[randomIndex];

    this.trackTarget(randomTarget.id);

    return {
      target: randomTarget || null,
      reason: 'No threat found, random target selection',
      confidence: 0.3,
    };
  }

  private cleanupDeadEntities(availableTargets: ReadonlyArray<CombatEntity>): void {
    const availableIds = new Set(availableTargets.map(target => target.id));

    // Remove dead entities from threat table
    for (const entityId of this._threatTable.keys()) {
      if (!availableIds.has(entityId)) {
        this._threatTable.delete(entityId);
        this._threatHistory.delete(entityId);
      }
    }

    // Remove dead entities from last targets
    for (let i = this._lastTargets.length - 1; i >= 0; i--) {
      if (!availableIds.has(this._lastTargets[i])) {
        this._lastTargets.splice(i, 1);
      }
    }
  }
}

// === THREAT CALCULATOR UTILITY ===

/**
 * Utility class for calculating threat values from combat actions
 */
export class ThreatCalculator {
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

  public static calculateRawThreat(update: ThreatUpdate, config: ThreatConfig): number {
    const { armorMultiplier, damageMultiplier, healingMultiplier } = config;

    const armorThreat = update.playerArmor * update.damageToSelf * armorMultiplier;
    const damageThreat = update.totalDamageDealt * damageMultiplier;
    const healThreat = update.healingDone * healingMultiplier;

    return armorThreat + damageThreat + healThreat;
  }

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
}
