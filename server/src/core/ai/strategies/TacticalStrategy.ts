/**
 * @fileoverview Tactical AI strategy implementation
 * Extracted from MonsterAI.ts to reduce complexity
 *
 * @file server/src/core/ai/strategies/TacticalStrategy.ts
 */

import type { AIDecision, CombatEntity, TargetingContext } from '@/core/types/entityTypes.js';
import { ThreatManager } from '@/core/systems/ThreatManager.js';
import { AIStrategyBase } from './AIStrategyBase.js';

/**
 * Tactical strategy - uses advanced positioning and threat analysis
 */
export class TacticalStrategy extends AIStrategyBase {
  protected readonly strategyName = 'tactical';

  public makeDecision(
    self: CombatEntity,
    context: TargetingContext,
    threatManager?: ThreatManager
  ): AIDecision {
    // Analyze tactical situation
    const situation = this.analyzeSituation(self, context);
    
    // Use threat manager for intelligent target selection
    if (threatManager) {
      const threatResult = threatManager.selectTarget(context.enemies);
      if (threatResult && threatResult.target) {
        return this.handleThreatTarget(self, threatResult.target, situation);
      }
    }

    // Tactical positioning based on situation
    if (situation.isOutnumbered) {
      return this.handleOutnumberedSituation(self, context);
    }

    if (situation.hasAdvantage) {
      return this.handleAdvantageSituation(self, context);
    }

    // Default tactical behavior
    return this.handleBalancedSituation(self, context);
  }

  private analyzeSituation(self: CombatEntity, context: TargetingContext): TacticalSituation {
    const allyCount = context.allies.length + 1; // +1 for self
    const enemyCount = context.enemies.length;
    const nearbyEnemies = this.findEnemiesInRange(self, context.enemies, 3);
    const healthPercentage = self.currentHp / self.maxHp;

    return {
      isOutnumbered: allyCount < enemyCount,
      hasAdvantage: allyCount > enemyCount,
      isLowHealth: healthPercentage < 0.4,
      isHealthy: healthPercentage > 0.7,
      nearbyEnemyCount: nearbyEnemies.length,
      totalEnemyCount: enemyCount,
      alliesNearby: this.countAlliesInRange(self, context.allies, 3),
    };
  }

  private handleThreatTarget(
    self: CombatEntity,
    target: CombatEntity,
    situation: TacticalSituation
  ): AIDecision {
    const distance = this.calculateDistance(self.position, target.position);

    // If we can attack and it's tactically sound
    if (distance <= 1) {
      const confidence = this.calculateAttackConfidence(situation);
      return this.createAttackDecision(target, confidence);
    }

    // Move tactically towards target
    if (situation.isLowHealth && situation.nearbyEnemyCount > 1) {
      // Kite - move away while maintaining threat
      const kitePosition = this.findKitePosition(self, target);
      if (kitePosition) {
        return this.createMoveDecision(kitePosition, 0.8);
      }
    }

    // Standard approach
    const moveTarget = this.calculateTacticalMove(self.position, target.position, situation);
    return this.createMoveDecision(moveTarget, 0.7);
  }

  private handleOutnumberedSituation(self: CombatEntity, context: TargetingContext): AIDecision {
    // Look for isolated enemies
    const isolatedEnemies = this.findIsolatedEnemies(context.enemies, context.allies);
    if (isolatedEnemies.length > 0) {
      const nearest = this.findNearestEnemy(self, isolatedEnemies);
      if (nearest) {
        return this.createAttackDecision(nearest, 0.8);
      }
    }

    // Fall back to defensive position
    const fallbackPosition = this.findFallbackPosition(self, context);
    if (fallbackPosition) {
      return this.createMoveDecision(fallbackPosition, 0.9);
    }

    return this.createWaitDecision();
  }

  private handleAdvantageSituation(self: CombatEntity, context: TargetingContext): AIDecision {
    // Focus fire on weakest enemy
    const weakest = this.findWeakestEnemy(context.enemies);
    if (weakest) {
      const distance = this.calculateDistance(self.position, weakest.position);
      if (distance <= 1) {
        return this.createAttackDecision(weakest, 0.9);
      } else {
        const moveTarget = this.calculateMoveTowards(self.position, weakest.position);
        return this.createMoveDecision(moveTarget, 0.8);
      }
    }

    return this.createWaitDecision();
  }

  private handleBalancedSituation(self: CombatEntity, context: TargetingContext): AIDecision {
    // Use standard tactical approach
    const nearestEnemy = this.findNearestEnemy(self, context.enemies);
    if (nearestEnemy) {
      const distance = this.calculateDistance(self.position, nearestEnemy.position);
      
      if (distance <= 1) {
        return this.createAttackDecision(nearestEnemy, 0.7);
      } else {
        const tacticalMove = this.calculateTacticalMove(self.position, nearestEnemy.position, {
          isOutnumbered: false,
          hasAdvantage: false,
          isLowHealth: false,
          isHealthy: true,
          nearbyEnemyCount: 1,
          totalEnemyCount: context.enemies.length,
          alliesNearby: 0,
        });
        return this.createMoveDecision(tacticalMove, 0.6);
      }
    }

    return this.createWaitDecision();
  }

  private calculateAttackConfidence(situation: TacticalSituation): number {
    let confidence = 0.7;
    
    if (situation.hasAdvantage) confidence += 0.2;
    if (situation.isOutnumbered) confidence -= 0.2;
    if (situation.isLowHealth) confidence -= 0.1;
    if (situation.alliesNearby > 0) confidence += 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private findKitePosition(
    self: CombatEntity,
    target: CombatEntity
  ): { q: number; r: number; s: number } | null {
    // Move away from target while maintaining some distance
    const selfPos = self.position;
    const targetPos = target.position;
    
    const awayQ = selfPos.q + Math.sign(selfPos.q - targetPos.q);
    const awayR = selfPos.r + Math.sign(selfPos.r - targetPos.r);
    const awayS = selfPos.s + Math.sign(selfPos.s - targetPos.s);
    
    return { q: awayQ, r: awayR, s: awayS };
  }

  private findIsolatedEnemies(enemies: readonly CombatEntity[], allies: readonly CombatEntity[]): CombatEntity[] {
    return enemies.filter(enemy => {
      const nearbyAllies = allies.filter(ally => 
        this.calculateDistance(enemy.position, ally.position) <= 2
      );
      return nearbyAllies.length === 0;
    });
  }

  private findFallbackPosition(
    self: CombatEntity,
    context: TargetingContext
  ): { q: number; r: number; s: number } {
    // Find position near allies but away from enemies
    let bestPosition: { q: number; r: number; s: number } = { q: 0, r: 0, s: 0 };
    let bestScore = -Infinity;

    const candidates = this.getAdjacentPositions(self.position);
    
    for (const pos of candidates) {
      let score = 0;
      
      // Prefer positions near allies
      for (const ally of context.allies) {
        const distance = this.calculateDistance(pos, ally.position);
        score += (4 - distance) * 2; // Closer to allies is better
      }
      
      // Avoid positions near enemies
      for (const enemy of context.enemies) {
        const distance = this.calculateDistance(pos, enemy.position);
        score += distance; // Further from enemies is better
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestPosition = pos;
      }
    }

    return bestPosition;
  }

  private calculateTacticalMove(
    from: { q: number; r: number; s: number },
    to: { q: number; r: number; s: number },
    situation: TacticalSituation
  ): { q: number; r: number; s: number } {
    // If low health, move more cautiously
    if (situation.isLowHealth) {
      const dq = Math.sign(to.q - from.q) * 0.5;
      const dr = Math.sign(to.r - from.r) * 0.5;
      const ds = Math.sign(to.s - from.s) * 0.5;
      
      return {
        q: from.q + Math.round(dq),
        r: from.r + Math.round(dr),
        s: from.s + Math.round(ds),
      };
    }

    // Standard movement
    return this.calculateMoveTowards(from, to);
  }

  private calculateMoveTowards(
    from: { q: number; r: number; s: number },
    to: { q: number; r: number; s: number }
  ): { q: number; r: number; s: number } {
    const dq = to.q - from.q;
    const dr = to.r - from.r;
    const ds = to.s - from.s;

    return {
      q: from.q + Math.sign(dq),
      r: from.r + Math.sign(dr),
      s: from.s + Math.sign(ds),
    };
  }

  private countAlliesInRange(
    self: CombatEntity,
    allies: readonly CombatEntity[],
    range: number
  ): number {
    return allies.filter(ally => 
      this.calculateDistance(self.position, ally.position) <= range
    ).length;
  }

  private getAdjacentPositions(pos: { q: number; r: number; s: number }): Array<{ q: number; r: number; s: number }> {
    return [
      { q: pos.q + 1, r: pos.r - 1, s: pos.s },
      { q: pos.q + 1, r: pos.r, s: pos.s - 1 },
      { q: pos.q, r: pos.r + 1, s: pos.s - 1 },
      { q: pos.q - 1, r: pos.r + 1, s: pos.s },
      { q: pos.q - 1, r: pos.r, s: pos.s + 1 },
      { q: pos.q, r: pos.r - 1, s: pos.s + 1 },
    ];
  }

  private calculateDistance(pos1: { q: number; r: number; s: number }, pos2: { q: number; r: number; s: number }): number {
    return Math.max(
      Math.abs(pos1.q - pos2.q),
      Math.abs(pos1.r - pos2.r),
      Math.abs(pos1.s - pos2.s)
    );
  }
}

interface TacticalSituation {
  isOutnumbered: boolean;
  hasAdvantage: boolean;
  isLowHealth: boolean;
  isHealthy: boolean;
  nearbyEnemyCount: number;
  totalEnemyCount: number;
  alliesNearby: number;
}