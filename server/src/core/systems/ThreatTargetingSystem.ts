/**
 * @fileoverview Threat-based target selection system
 * Extracted from ThreatManager.ts to handle complex targeting logic
 *
 * @file server/src/core/systems/ThreatTargetingSystem.ts
 */

import type {
    CombatEntity,
    TargetingResult,
    ThreatConfig,
} from '@/core/types/entityTypes.js';

// === CONSTANTS ===

const MINIMUM_THREAT_THRESHOLD = 0.1;

// === THREAT TARGETING SYSTEM ===

/**
 * Handles target selection logic based on threat values
 * Extracted from ThreatManager to reduce complexity
 */
export class ThreatTargetingSystem {
  constructor(private readonly config: ThreatConfig) {}

  /**
   * Selects best target from available entities based on threat values
   */
  public selectTarget(
    availableTargets: ReadonlyArray<CombatEntity>,
    threatGetter: (entityId: string) => number,
    recentTargetChecker: (entityId: string) => boolean,
    targetTracker: (entityId: string) => void
  ): TargetingResult {
    if (!this.config.enabled || availableTargets.length === 0) {
      return {
        target: null,
        reason: 'No threat system or no available targets',
        confidence: 0.0,
      };
    }

    // Filter targets that weren't recently targeted
    const nonRecentTargets = availableTargets.filter(
      target => !recentTargetChecker(target.id)
    );

    // Use all targets if everyone was recently targeted
    const targetPool = nonRecentTargets.length > 0 ? nonRecentTargets : availableTargets;

    // Get targets with threat
    const targetsWithThreat = targetPool
      .map(target => ({
        target,
        threat: threatGetter(target.id),
      }))
      .filter(entry => entry.threat > MINIMUM_THREAT_THRESHOLD);

    // If no one has significant threat, use fallback
    if (targetsWithThreat.length === 0) {
      return this.handleNoThreatFallback(targetPool, targetTracker);
    }

    // Find highest threat target(s)
    const maxThreat = Math.max(...targetsWithThreat.map(entry => entry.threat));
    const highestThreatTargets = targetsWithThreat.filter(
      entry => Math.abs(entry.threat - maxThreat) < 0.01 // Handle floating point comparison
    );

    // Handle tie-breaking
    const result = this.selectFromHighestThreatTargets(highestThreatTargets, maxThreat);
    if (!result.target) {
      return this.handleNoThreatFallback(targetPool, targetTracker);
    }

    // Track this selection
    targetTracker(result.target.id);

    return result;
  }

  /**
   * Selects target from tied highest-threat targets
   */
  private selectFromHighestThreatTargets(
    highestThreatTargets: Array<{ target: CombatEntity; threat: number }>,
    maxThreat: number
  ): TargetingResult {
    if (highestThreatTargets.length === 1) {
      const firstTarget = highestThreatTargets[0];
      if (!firstTarget) {
        return { target: null, reason: 'No valid target found', confidence: 0.0 };
      }
      return {
        target: firstTarget.target,
        reason: `Selected target with highest threat: ${maxThreat.toFixed(1)}`,
        confidence: 0.9,
      };
    }

    if (this.config.enableTiebreaker) {
      // Random selection among tied players
      const randomIndex = Math.floor(Math.random() * highestThreatTargets.length);
      const randomTarget = highestThreatTargets[randomIndex];
      if (!randomTarget) {
        return { target: null, reason: 'Failed to select random target from tied threats', confidence: 0.0 };
      }
      return {
        target: randomTarget.target,
        reason: `Random selection from ${highestThreatTargets.length} tied targets (threat: ${maxThreat.toFixed(1)})`,
        confidence: 0.7,
      };
    }

    // Deterministic selection (first in list)
    const firstTarget = highestThreatTargets[0];
    if (!firstTarget) {
      return { target: null, reason: 'No valid target in tied threats', confidence: 0.0 };
    }
    return {
      target: firstTarget.target,
      reason: `Deterministic selection from tied targets (threat: ${maxThreat.toFixed(1)})`,
      confidence: 0.8,
    };
  }

  /**
   * Handles target selection when no significant threat exists
   */
  private handleNoThreatFallback(
    targetPool: ReadonlyArray<CombatEntity>,
    targetTracker: (entityId: string) => void
  ): TargetingResult {
    if (this.config.fallbackToLowestHp) {
      return this.selectLowestHpTarget(targetPool, targetTracker);
    }

    return this.selectRandomTarget(targetPool, targetTracker);
  }

  /**
   * Selects target with lowest HP percentage
   */
  private selectLowestHpTarget(
    targetPool: ReadonlyArray<CombatEntity>,
    targetTracker: (entityId: string) => void
  ): TargetingResult {
    if (targetPool.length === 0) {
      return {
        target: null,
        reason: 'No targets available for lowest HP fallback',
        confidence: 0.0,
      };
    }

    const lowestHpTarget = targetPool.reduce((lowest, current) => {
      const currentHpPercent = current.currentHp / current.maxHp;
      const lowestHpPercent = lowest.currentHp / lowest.maxHp;
      return currentHpPercent < lowestHpPercent ? current : lowest;
    });

    targetTracker(lowestHpTarget.id);

    return {
      target: lowestHpTarget,
      reason: `No threat found, targeting lowest HP player (${(lowestHpTarget.currentHp / lowestHpTarget.maxHp * 100).toFixed(1)}% HP)`,
      confidence: 0.5,
    };
  }

  /**
   * Selects random target as final fallback
   */
  private selectRandomTarget(
    targetPool: ReadonlyArray<CombatEntity>,
    targetTracker: (entityId: string) => void
  ): TargetingResult {
    if (targetPool.length === 0) {
      return {
        target: null,
        reason: 'No targets available for random selection',
        confidence: 0.0,
      };
    }

    const randomIndex = Math.floor(Math.random() * targetPool.length);
    const randomTarget = targetPool[randomIndex];

    if (!randomTarget) {
      return {
        target: null,
        reason: 'Failed to select random target',
        confidence: 0.0,
      };
    }

    targetTracker(randomTarget.id);

    return {
      target: randomTarget,
      reason: `No threat found, random target selection (${targetPool.length} options)`,
      confidence: 0.3,
    };
  }

  /**
   * Validates targeting parameters
   */
  public validateTargetingInput(
    availableTargets: ReadonlyArray<CombatEntity>
  ): { valid: boolean; reason?: string } {
    if (!Array.isArray(availableTargets)) {
      return { valid: false, reason: 'Available targets must be an array' };
    }

    const invalidTargets = availableTargets.filter(target => 
      !target || typeof target.id !== 'string' || !target.hasOwnProperty('isAlive')
    );

    if (invalidTargets.length > 0) {
      return { valid: false, reason: `${invalidTargets.length} invalid target entities found` };
    }

    return { valid: true };
  }

  /**
   * Gets targeting statistics for debugging
   */
  public getTargetingStats(
    availableTargets: ReadonlyArray<CombatEntity>,
    threatGetter: (entityId: string) => number,
    recentTargetChecker: (entityId: string) => boolean
  ): {
    totalTargets: number;
    aliveTargets: number;
    recentlyTargeted: number;
    withThreat: number;
    avgThreat: number;
    maxThreat: number;
  } {
    const aliveTargets = availableTargets.filter(t => t.isAlive);
    const recentlyTargeted = aliveTargets.filter(t => recentTargetChecker(t.id));
    const threats = aliveTargets.map(t => threatGetter(t.id));
    const withThreat = threats.filter(t => t > MINIMUM_THREAT_THRESHOLD);

    return {
      totalTargets: availableTargets.length,
      aliveTargets: aliveTargets.length,
      recentlyTargeted: recentlyTargeted.length,
      withThreat: withThreat.length,
      avgThreat: threats.length > 0 ? threats.reduce((a, b) => a + b, 0) / threats.length : 0,
      maxThreat: threats.length > 0 ? Math.max(...threats) : 0,
    };
  }
}