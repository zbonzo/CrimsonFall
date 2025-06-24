/**
 * @fileoverview Aggressive AI strategy implementation
 * Extracted from MonsterAI.ts to reduce complexity
 *
 * @file server/src/core/ai/strategies/AggressiveStrategy.ts
 */

import type { AIDecision, CombatEntity, TargetingContext } from '@/core/types/entityTypes.js';
import { ThreatManager } from '@/core/systems/ThreatManager.js';
import { AIStrategyBase } from './AIStrategyBase.js';

/**
 * Aggressive strategy - focuses on attacking enemies and closing distance
 */
export class AggressiveStrategy extends AIStrategyBase {
  protected readonly strategyName = 'aggressive';

  public makeDecision(
    self: CombatEntity,
    context: TargetingContext,
    threatManager?: ThreatManager
  ): AIDecision {
    const nearbyEnemies = this.findEnemiesInRange(self, context.enemies, 2);

    if (nearbyEnemies.length > 0) {
      // Attack nearest enemy
      const nearest = this.findNearestEnemy(self, nearbyEnemies);
      if (nearest) {
        return this.createAttackDecision(nearest, 0.9);
      }
    }

    // Use threat system if available for target selection
    if (threatManager) {
      const threatResult = threatManager.selectTarget(context.enemies);
      if (threatResult && threatResult.target) {
        const threatTarget = threatResult.target;
        const distance = this.calculateDistance(self.position, threatTarget.position);
        
        if (distance <= 1) {
          return this.createAttackDecision(threatTarget, 0.8);
        } else {
          // Move towards threat target
          const moveTarget = this.calculateMoveTowards(self.position, threatTarget.position);
          return this.createMoveDecision(moveTarget, 0.7);
        }
      }
    }

    // Fall back to attacking nearest enemy
    const nearestEnemy = this.findNearestEnemy(self, context.enemies);
    if (nearestEnemy) {
      const distance = this.calculateDistance(self.position, nearestEnemy.position);
      
      if (distance <= 1) {
        return this.createAttackDecision(nearestEnemy, 0.6);
      } else {
        // Move towards nearest enemy
        const moveTarget = this.calculateMoveTowards(self.position, nearestEnemy.position);
        return this.createMoveDecision(moveTarget, 0.5);
      }
    }

    return this.createWaitDecision();
  }

  private calculateDistance(pos1: { q: number; r: number; s: number }, pos2: { q: number; r: number; s: number }): number {
    return Math.max(
      Math.abs(pos1.q - pos2.q),
      Math.abs(pos1.r - pos2.r),
      Math.abs(pos1.s - pos2.s)
    );
  }

  private calculateMoveTowards(
    from: { q: number; r: number; s: number },
    to: { q: number; r: number; s: number }
  ): { q: number; r: number; s: number } {
    const dq = to.q - from.q;
    const dr = to.r - from.r;
    const ds = to.s - from.s;

    // Normalize to unit movement
    const stepQ = Math.sign(dq);
    const stepR = Math.sign(dr);
    const stepS = Math.sign(ds);

    return {
      q: from.q + stepQ,
      r: from.r + stepR,
      s: from.s + stepS,
    };
  }
}