/**
 * @fileoverview Base class for AI strategy implementations
 * Extracted from MonsterAI.ts to reduce complexity
 *
 * @file server/src/core/ai/strategies/AIStrategyBase.ts
 */

import type { AIDecision, CombatEntity, TargetingContext } from '@/core/types/entityTypes.js';
import { ThreatManager } from '@/core/systems/ThreatManager.js';
import { calculateHexDistance } from '@/utils/hex/index.js';

/**
 * Base class for AI strategy implementations
 */
export abstract class AIStrategyBase {
  protected abstract readonly strategyName: string;

  /**
   * Makes a decision for the given entity based on the context
   */
  public abstract makeDecision(
    self: CombatEntity,
    context: TargetingContext,
    threatManager?: ThreatManager
  ): AIDecision;

  /**
   * Finds the nearest enemy to the given entity
   */
  protected findNearestEnemy(self: CombatEntity, enemies: readonly CombatEntity[]): CombatEntity | null {
    if (enemies.length === 0) return null;

    return enemies.reduce((closest, current) =>
      calculateHexDistance(self.position, current.position) <
      calculateHexDistance(self.position, closest.position)
        ? current
        : closest
    );
  }

  /**
   * Finds enemies within a specific range
   */
  protected findEnemiesInRange(
    self: CombatEntity,
    enemies: readonly CombatEntity[],
    range: number
  ): CombatEntity[] {
    return enemies.filter(
      enemy => calculateHexDistance(self.position, enemy.position) <= range
    );
  }

  /**
   * Finds the weakest enemy (lowest HP)
   */
  protected findWeakestEnemy(enemies: readonly CombatEntity[]): CombatEntity | null {
    if (enemies.length === 0) return null;

    return enemies.reduce((weakest, current) =>
      current.currentHp < weakest.currentHp ? current : weakest
    );
  }

  /**
   * Creates a wait decision
   */
  protected createWaitDecision(): AIDecision {
    return {
      variant: 'wait',
      priority: 0,
      confidence: 0.1,
    };
  }

  /**
   * Creates an attack decision
   */
  protected createAttackDecision(target: CombatEntity, confidence = 0.8): AIDecision {
    return {
      variant: 'attack',
      target,
      priority: 1,
      confidence,
    };
  }

  /**
   * Creates a move decision
   */
  protected createMoveDecision(targetPosition: { q: number; r: number; s: number }, confidence = 0.6): AIDecision {
    return {
      variant: 'move',
      targetPosition,
      priority: 1,
      confidence,
    };
  }
}