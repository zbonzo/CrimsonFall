/**
 * @fileoverview Defensive AI strategy implementation
 * Extracted from MonsterAI.ts to reduce complexity
 *
 * @file server/src/core/ai/strategies/DefensiveStrategy.ts
 */

import type { AIDecision, CombatEntity, TargetingContext } from '@/core/types/entityTypes.js';
import { ThreatManager } from '@/core/systems/ThreatManager.js';
import { AIStrategyBase } from './AIStrategyBase.js';

/**
 * Defensive strategy - focuses on protection and cautious engagement
 */
export class DefensiveStrategy extends AIStrategyBase {
  protected readonly strategyName = 'defensive';

  public makeDecision(
    self: CombatEntity,
    context: TargetingContext,
    _threatManager?: ThreatManager
  ): AIDecision {
    // Check if we're in immediate danger (low health)
    const healthPercentage = self.currentHp / self.maxHp;
    
    if (healthPercentage < 0.3) {
      // Try to retreat
      const safePosition = this.findSafePosition(self, context);
      if (safePosition) {
        return this.createMoveDecision(safePosition, 0.9);
      }
    }

    // Look for adjacent enemies to defend against
    const adjacentEnemies = this.findEnemiesInRange(self, context.enemies, 1);
    
    if (adjacentEnemies.length > 0) {
      // Attack the weakest adjacent enemy
      const weakest = this.findWeakestEnemy(adjacentEnemies);
      if (weakest) {
        return this.createAttackDecision(weakest, 0.7);
      }
    }

    // Look for allies that need protection
    const threatenedAllies = this.findThreatenedAllies(self, context);
    if (threatenedAllies.length > 0) {
      // Move to protect the most threatened ally
      const mostThreatened = threatenedAllies[0];
      if (mostThreatened) {
        const protectivePosition = this.findProtectivePosition(self, mostThreatened, context);
        if (protectivePosition) {
          return this.createMoveDecision(protectivePosition, 0.8);
        }
      }
    }

    // If no immediate threats, maintain defensive position
    const defensivePosition = this.findDefensivePosition(self, context);
    if (defensivePosition) {
      return this.createMoveDecision(defensivePosition, 0.4);
    }

    return this.createWaitDecision();
  }

  private findSafePosition(
    self: CombatEntity,
    context: TargetingContext
  ): { q: number; r: number; s: number } {
    // Find position furthest from enemies
    const currentPos = self.position;
    const candidates = this.getAdjacentPositions(currentPos);
    
    let bestPosition: { q: number; r: number; s: number } = { q: 0, r: 0, s: 0 };
    let maxDistance = 0;

    for (const pos of candidates) {
      let minEnemyDistance = Infinity;
      
      for (const enemy of context.enemies) {
        const distance = this.calculateDistance(pos, enemy.position);
        minEnemyDistance = Math.min(minEnemyDistance, distance);
      }
      
      if (minEnemyDistance > maxDistance) {
        maxDistance = minEnemyDistance;
        bestPosition = pos;
      }
    }

    return bestPosition;
  }

  private findThreatenedAllies(
    self: CombatEntity,
    context: TargetingContext
  ): CombatEntity[] {
    return context.allies.filter(ally => {
      const nearbyEnemies = this.findEnemiesInRange(ally, context.enemies, 2);
      return nearbyEnemies.length > 0;
    });
  }

  private findProtectivePosition(
    self: CombatEntity,
    ally: CombatEntity,
    context: TargetingContext
  ): { q: number; r: number; s: number } | null {
    // Find position between ally and nearest enemy
    const nearestEnemy = this.findNearestEnemy(ally, context.enemies);
    if (!nearestEnemy) return null;

    const allyPos = ally.position;
    const enemyPos = nearestEnemy.position;
    
    // Calculate midpoint
    return {
      q: Math.round((allyPos.q + enemyPos.q) / 2),
      r: Math.round((allyPos.r + enemyPos.r) / 2),
      s: Math.round((allyPos.s + enemyPos.s) / 2),
    };
  }

  private findDefensivePosition(
    self: CombatEntity,
    context: TargetingContext
  ): { q: number; r: number; s: number } {
    // Find position that maximizes distance from enemies while staying near allies
    const candidates = this.getAdjacentPositions(self.position);
    
    let bestPosition: { q: number; r: number; s: number } = { q: 0, r: 0, s: 0 };
    let bestScore = -Infinity;

    for (const pos of candidates) {
      let score = 0;
      
      // Prefer positions away from enemies
      for (const enemy of context.enemies) {
        const distance = this.calculateDistance(pos, enemy.position);
        score += distance * 2;
      }
      
      // Prefer positions near allies
      for (const ally of context.allies) {
        const distance = this.calculateDistance(pos, ally.position);
        score -= distance;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestPosition = pos;
      }
    }

    return bestPosition;
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