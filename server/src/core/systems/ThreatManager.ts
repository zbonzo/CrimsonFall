/**
 * @fileoverview Threat management system for monsters
 * Tracks threat values and manages target selection based on player actions
 * Calculation utilities extracted to ThreatCalculator.ts
 * Target selection logic extracted to ThreatTargetingSystem.ts
 *
 * @file server/src/core/systems/ThreatManager.ts
 */

import type {
  CombatEntity,
  TargetingResult,
  ThreatConfig,
  ThreatEntry,
  ThreatUpdate,
} from '@/core/types/entityTypes.js';
import { ThreatTargetingSystem } from './ThreatTargetingSystem.js';

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
  private readonly _targetingSystem: ThreatTargetingSystem;
  private _roundsActive: number = 0;

  constructor(config: Partial<ThreatConfig> = {}) {
    this._config = { ...DEFAULT_THREAT_CONFIG, ...config };
    this._targetingSystem = new ThreatTargetingSystem(this._config);
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

  // === TARGET SELECTION (Delegated) ===

  public selectTarget(availableTargets: ReadonlyArray<CombatEntity>): TargetingResult {
    // Clean up dead entities first
    this.cleanupDeadEntities(availableTargets);

    // Delegate to targeting system
    return this._targetingSystem.selectTarget(
      availableTargets,
      (entityId: string) => this.getThreat(entityId),
      (entityId: string) => this.wasRecentlyTargeted(entityId),
      (entityId: string) => this.trackTarget(entityId)
    );
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
      const targetId = this._lastTargets[i];
      if (targetId && !availableIds.has(targetId)) {
        this._lastTargets.splice(i, 1);
      }
    }
  }
}
