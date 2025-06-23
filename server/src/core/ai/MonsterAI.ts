/**
 * @fileoverview AI system for monster behavior and decision making
 * Handles different AI types, behavior evaluation, and action selection
 *
 * FIXED: Removed reserved keywords 'type' → 'variant', 'class' → 'specialization'
 *
 * @file server/src/core/ai/MonsterAI.ts
 */

import { ThreatManager } from '@/core/systems/ThreatManager';
import type {
  AIDecision,
  BehaviorCondition,
  CombatEntity,
  MonsterAIVariant,
  MonsterBehavior,
  TargetingContext,
} from '@/core/types/entityTypes';
import type { HexCoordinate } from '@/utils/hex/index';
import { calculateHexDistance } from '@/utils/hexMath';

// === CONSTANTS ===

const AI_PRIORITIES = {
  EMERGENCY: 10,
  HIGH: 8,
  MEDIUM: 5,
  LOW: 3,
  MINIMAL: 1,
} as const;

// === MONSTER AI ===

/**
 * Handles AI behavior for monsters including target selection and action decisions
 */
export class MonsterAI {
  private readonly _aiVariant: MonsterAIVariant;
  private readonly _behaviors: MonsterBehavior[];
  private _lastDecision: AIDecision | null = null;
  private _decisionHistory: AIDecision[] = [];

  constructor(aiVariant: MonsterAIVariant, behaviors: MonsterBehavior[] = []) {
    this._aiVariant = aiVariant;
    this._behaviors = [...behaviors].sort((a, b) => b.priority - a.priority);
  }

  // === GETTERS ===

  public get aiVariant(): MonsterAIVariant {
    return this._aiVariant;
  }

  public get behaviors(): ReadonlyArray<MonsterBehavior> {
    return this._behaviors;
  }

  public get lastDecision(): AIDecision | null {
    return this._lastDecision;
  }

  // === MAIN AI DECISION MAKING ===

  public makeDecision(
    self: CombatEntity,
    context: TargetingContext,
    threatManager: ThreatManager
  ): AIDecision {
    // Evaluate behaviors first (specific rules)
    const behaviorDecision = this.evaluateBehaviors(self, context);
    if (behaviorDecision) {
      this._lastDecision = behaviorDecision;
      this.recordDecision(behaviorDecision);
      return behaviorDecision;
    }

    // Fall back to AI type-based decision making
    const aiDecision = this.makeAIVariantDecision(self, context, threatManager);
    this._lastDecision = aiDecision;
    this.recordDecision(aiDecision);
    return aiDecision;
  }

  public selectTarget(
    availableTargets: ReadonlyArray<CombatEntity>,
    threatManager: ThreatManager
  ): CombatEntity | null {
    if (availableTargets.length === 0) return null;

    // Use threat system if available and enabled
    if (threatManager.isEnabled) {
      const result = threatManager.selectTarget(availableTargets);
      return result.target;
    }

    // Fall back to AI type-based targeting
    return this.selectTargetByAIVariant(availableTargets);
  }

  // === BEHAVIOR EVALUATION ===

  private evaluateBehaviors(self: CombatEntity, context: TargetingContext): AIDecision | null {
    for (const behavior of this._behaviors) {
      if (this.evaluateCondition(behavior.condition, self, context)) {
        const decision = this.executeBehaviorAction(behavior, self, context);
        if (decision) {
          return {
            ...decision,
            reasoning: `Behavior: ${behavior.name}`,
          };
        }
      }
    }
    return null;
  }

  private evaluateCondition(
    condition: BehaviorCondition,
    self: CombatEntity,
    context: TargetingContext
  ): boolean {
    switch (condition.variant) {
      case 'hp_below':
        return self.currentHp / self.maxHp < (condition.value || 0.5);

      case 'hp_above':
        return self.currentHp / self.maxHp > (condition.value || 0.5);

      case 'enemy_in_range':
        return context.enemies.some(
          enemy => calculateHexDistance(self.position, enemy.position) <= (condition.value || 1)
        );

      case 'ally_in_danger':
        const dangerThreshold = condition.value || 0.3;
        return context.allies.some(ally => ally.currentHp / ally.maxHp < dangerThreshold);

      case 'cooldown_ready':
        if (!condition.abilityId) return false;
        // This would need to be checked against the entity's ability system
        // For now, assume it's ready
        return true;

      default:
        return false;
    }
  }

  private executeBehaviorAction(
    behavior: MonsterBehavior,
    self: CombatEntity,
    context: TargetingContext
  ): AIDecision | null {
    const action = behavior.action;

    switch (action.variant) {
      case 'use_ability':
        if (!action.abilityId) return null;
        const target = this.selectTargetByType(action.targetType, self, context);
        if (!target) return null; // Early return if no target found
        return {
          variant: 'ability',
          target: target,
          abilityId: action.abilityId,
          priority: behavior.priority,
          reasoning: `Using ability ${action.abilityId}`,
        };

      case 'move_to':
        if (action.position) {
          return {
            variant: 'move',
            targetPosition: action.position,
            priority: behavior.priority,
            reasoning: 'Moving to specific position',
          };
        }

        const moveTarget = this.selectTargetByType(action.targetType, self, context);
        if (moveTarget) {
          return {
            variant: 'move',
            targetPosition: this.getPositionNear(moveTarget.position, self),
            priority: behavior.priority,
            reasoning: `Moving toward ${action.targetType}`,
          };
        }
        return null;

      case 'flee':
        const fleeFrom = this.selectTargetByType(action.targetType, self, context);
        if (fleeFrom) {
          return {
            variant: 'move',
            targetPosition: this.getFleePosition(self.position, fleeFrom.position),
            priority: behavior.priority,
            reasoning: `Fleeing from ${action.targetType}`,
          };
        }
        return null;

      case 'focus_target':
        const focusTarget = this.selectTargetByType(action.targetType, self, context);
        if (!focusTarget) return null; // Early return if no target found
        return {
          variant: 'attack',
          target: focusTarget,
          priority: behavior.priority,
          reasoning: `Focusing on ${action.targetType}`,
        };

      case 'call_for_help':
        return {
          variant: 'ability',
          abilityId: 'call_for_help',
          priority: behavior.priority,
          reasoning: 'Calling for reinforcements',
        };

      default:
        return null;
    }
  }

  // === AI VARIANT DECISIONS ===

  private makeAIVariantDecision(
    self: CombatEntity,
    context: TargetingContext,
    threatManager: ThreatManager
  ): AIDecision {
    switch (this._aiVariant) {
      case 'aggressive':
        return this.makeAggressiveDecision(self, context, threatManager);

      case 'defensive':
        return this.makeDefensiveDecision(self, context);

      case 'tactical':
        return this.makeTacticalDecision(self, context, threatManager);

      case 'berserker':
        return this.makeBerserkerDecision(self, context);

      case 'support':
        return this.makeSupportDecision(self, context);

      case 'passive':
      default:
        return this.makePassiveDecision(self, context);
    }
  }

  private makeAggressiveDecision(
    self: CombatEntity,
    context: TargetingContext,
    threatManager: ThreatManager
  ): AIDecision {
    const nearbyEnemies = context.enemies.filter(
      enemy => calculateHexDistance(self.position, enemy.position) <= 2
    );

    if (nearbyEnemies.length > 0) {
      // Attack nearest enemy
      const nearest = nearbyEnemies.reduce((closest, current) =>
        calculateHexDistance(self.position, current.position) <
        calculateHexDistance(self.position, closest.position)
          ? current
          : closest
      );

      return {
        variant: 'attack',
        target: nearest,
        priority: AI_PRIORITIES.HIGH,
        reasoning: 'Aggressive AI attacking nearest enemy',
      };
    }

    // Move toward highest threat target
    const target = threatManager.selectTarget(context.enemies).target;
    if (target) {
      return {
        variant: 'move',
        targetPosition: this.getPositionNear(target.position, self),
        priority: AI_PRIORITIES.MEDIUM,
        reasoning: 'Moving toward highest threat target',
      };
    }

    return {
      variant: 'wait',
      priority: AI_PRIORITIES.LOW,
      reasoning: 'No targets available',
    };
  }

  private makeDefensiveDecision(self: CombatEntity, context: TargetingContext): AIDecision {
    const hpPercent = self.currentHp / self.maxHp;

    // If wounded, prioritize defensive abilities or retreat
    if (hpPercent < 0.4) {
      // Look for defensive abilities
      // This would need integration with ability system
      return {
        variant: 'move',
        targetPosition: this.getDefensivePosition(self, context),
        priority: AI_PRIORITIES.HIGH,
        reasoning: 'Defensive retreat when wounded',
      };
    }

    // Attack if enemy is adjacent
    const adjacentEnemies = context.enemies.filter(
      enemy => calculateHexDistance(self.position, enemy.position) === 1
    );

    if (adjacentEnemies.length > 0) {
      const firstEnemy = adjacentEnemies[0];
      if (!firstEnemy) {
        return {
          variant: 'wait',
          priority: AI_PRIORITIES.LOW,
          reasoning: 'No valid adjacent enemies',
        };
      }

      return {
        variant: 'attack',
        target: firstEnemy,
        priority: AI_PRIORITIES.MEDIUM,
        reasoning: 'Defensive counterattack',
      };
    }

    return {
      variant: 'wait',
      priority: AI_PRIORITIES.LOW,
      reasoning: 'Defensive stance',
    };
  }

  private makeTacticalDecision(
    self: CombatEntity,
    context: TargetingContext,
    _threatManager: ThreatManager // Underscore prefix to indicate intentionally unused
  ): AIDecision {
    // Prioritize positioning and target selection
    const optimalPosition = this.findOptimalPosition(self, context);

    if (optimalPosition && calculateHexDistance(self.position, optimalPosition) > 0) {
      return {
        variant: 'move',
        targetPosition: optimalPosition,
        priority: AI_PRIORITIES.MEDIUM,
        reasoning: 'Tactical positioning',
      };
    }

    // Target selection based on tactical value
    const tacticalTarget = this.selectTacticalTarget(context.enemies);
    if (tacticalTarget) {
      return {
        variant: 'attack',
        target: tacticalTarget,
        priority: AI_PRIORITIES.HIGH,
        reasoning: 'Tactical target selection',
      };
    }

    return {
      variant: 'wait',
      priority: AI_PRIORITIES.LOW,
      reasoning: 'Waiting for tactical opportunity',
    };
  }

  private makeBerserkerDecision(self: CombatEntity, context: TargetingContext): AIDecision {
    const hpPercent = self.currentHp / self.maxHp;

    // More aggressive when wounded
    const priority = hpPercent < 0.5 ? AI_PRIORITIES.EMERGENCY : AI_PRIORITIES.HIGH;

    // Always attack if possible
    if (context.enemies.length > 0) {
      // Target with lowest HP for quick kills
      const weakestEnemy = context.enemies.reduce((weakest, current) =>
        current.currentHp < weakest.currentHp ? current : weakest
      );

      if (calculateHexDistance(self.position, weakestEnemy.position) <= 1) {
        return {
          variant: 'attack',
          target: weakestEnemy,
          priority,
          reasoning: 'Berserker attacking weakest enemy',
        };
      }

      return {
        variant: 'move',
        targetPosition: this.getPositionNear(weakestEnemy.position, self),
        priority,
        reasoning: 'Berserker charging toward weakest enemy',
      };
    }

    return {
      variant: 'wait',
      priority: AI_PRIORITIES.LOW,
      reasoning: 'Berserker waiting for targets',
    };
  }

  private makeSupportDecision(self: CombatEntity, context: TargetingContext): AIDecision {
    // Look for allies in need of support
    const woundedAllies = context.allies.filter(ally => ally.currentHp / ally.maxHp < 0.6);

    if (woundedAllies.length > 0) {
      const mostWounded = woundedAllies.reduce((most, current) =>
        current.currentHp / current.maxHp < most.currentHp / most.maxHp ? current : most
      );

      return {
        variant: 'ability',
        target: mostWounded,
        abilityId: 'heal', // Would need proper ability lookup
        priority: AI_PRIORITIES.HIGH,
        reasoning: 'Supporting wounded ally',
      };
    }

    // Fall back to defensive behavior
    return this.makeDefensiveDecision(self, context);
  }

  private makePassiveDecision(self: CombatEntity, context: TargetingContext): AIDecision {
    // Only act if directly threatened
    const threateningEnemies = context.enemies.filter(
      enemy => calculateHexDistance(self.position, enemy.position) <= 1
    );

    if (threateningEnemies.length > 0) {
      const firstThreat = threateningEnemies[0];
      if (!firstThreat) {
        return {
          variant: 'wait',
          priority: AI_PRIORITIES.MINIMAL,
          reasoning: 'No valid threats found',
        };
      }

      return {
        variant: 'attack',
        target: firstThreat,
        priority: AI_PRIORITIES.MEDIUM,
        reasoning: 'Passive defense when threatened',
      };
    }

    return {
      variant: 'wait',
      priority: AI_PRIORITIES.MINIMAL,
      reasoning: 'Passive waiting',
    };
  }

  // === TARGET SELECTION HELPERS ===

  private selectTargetByAIVariant(
    availableTargets: ReadonlyArray<CombatEntity>
  ): CombatEntity | null {
    if (availableTargets.length === 0) return null;

    switch (this._aiVariant) {
      case 'aggressive':
      case 'berserker':
        // Target with lowest HP for quick elimination
        return availableTargets.reduce((weakest, current) =>
          current.currentHp < weakest.currentHp ? current : weakest
        );

      case 'tactical':
        return this.selectTacticalTarget(availableTargets);

      case 'defensive':
      case 'support':
        // Target nearest threat
        return availableTargets[0] || null;

      case 'passive':
      default:
        // Random selection
        const randomIndex = Math.floor(Math.random() * availableTargets.length);
        return availableTargets[randomIndex] || null;
    }
  }

  private selectTargetByType(
    targetType: string | undefined,
    self: CombatEntity,
    context: TargetingContext
  ): CombatEntity | null {
    switch (targetType) {
      case 'nearest_enemy':
        return this.findNearestEntity(self.position, context.enemies);

      case 'weakest_enemy':
        if (context.enemies.length === 0) return null;
        return context.enemies.reduce((weakest, current) =>
          current.currentHp < weakest.currentHp ? current : weakest
        );

      case 'strongest_enemy':
        if (context.enemies.length === 0) return null;
        return context.enemies.reduce((strongest, current) =>
          current.currentHp > strongest.currentHp ? current : strongest
        );

      case 'nearest_ally':
        return this.findNearestEntity(self.position, context.allies);

      case 'self':
        return self;

      default:
        return context.enemies.length > 0 ? context.enemies[0] : null; // Default to first enemy
    }
  }

  private selectTacticalTarget(enemies: ReadonlyArray<CombatEntity>): CombatEntity | null {
    if (enemies.length === 0) return null;

    // Score enemies based on tactical value
    const scoredEnemies = enemies.map(enemy => ({
      enemy,
      score: this.calculateTacticalScore(enemy),
    }));

    // Return highest scoring enemy
    const bestEnemy = scoredEnemies.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return bestEnemy.enemy;
  }

  private calculateTacticalScore(enemy: CombatEntity): number {
    const hpPercent = enemy.currentHp / enemy.maxHp;
    const lowHpBonus = (1 - hpPercent) * 50; // Bonus for low HP enemies

    // Simplified scoring - could be much more sophisticated
    return lowHpBonus + enemy.maxHp * 0.1;
  }

  // === UTILITY HELPERS ===

  private findNearestEntity(
    position: HexCoordinate,
    entities: ReadonlyArray<CombatEntity>
  ): CombatEntity | null {
    if (entities.length === 0) return null;

    return entities.reduce((nearest, current) => {
      const nearestDistance = calculateHexDistance(position, nearest.position);
      const currentDistance = calculateHexDistance(position, current.position);
      return currentDistance < nearestDistance ? current : nearest;
    });
  }

  private getPositionNear(targetPosition: HexCoordinate, self: CombatEntity): HexCoordinate {
    // Simple implementation - move toward target
    // In a real implementation, this would use pathfinding
    const dx = Math.sign(targetPosition.q - self.position.q);
    const dy = Math.sign(targetPosition.r - self.position.r);

    return {
      q: self.position.q + dx,
      r: self.position.r + dy,
      s: self.position.s - dx - dy,
    };
  }

  private getFleePosition(
    currentPosition: HexCoordinate,
    threatPosition: HexCoordinate
  ): HexCoordinate {
    // Move away from threat
    const dx = currentPosition.q - threatPosition.q;
    const dy = currentPosition.r - threatPosition.r;

    return {
      q: currentPosition.q + Math.sign(dx),
      r: currentPosition.r + Math.sign(dy),
      s: currentPosition.s - Math.sign(dx) - Math.sign(dy),
    };
  }

  private getDefensivePosition(self: CombatEntity, context: TargetingContext): HexCoordinate {
    // Move away from enemies toward allies
    if (context.enemies.length === 0) return self.position;

    const averageEnemyPosition = this.calculateAveragePosition(
      context.enemies.map(e => e.position)
    );

    return this.getFleePosition(self.position, averageEnemyPosition);
  }

  private findOptimalPosition(self: CombatEntity, context: TargetingContext): HexCoordinate | null {
    // Simplified tactical positioning
    // Real implementation would evaluate multiple positions
    return this.getDefensivePosition(self, context);
  }

  private calculateAveragePosition(positions: HexCoordinate[]): HexCoordinate {
    if (positions.length === 0) return { q: 0, r: 0, s: 0 };

    const sum = positions.reduce(
      (acc, pos) => ({
        q: acc.q + pos.q,
        r: acc.r + pos.r,
        s: acc.s + pos.s,
      }),
      { q: 0, r: 0, s: 0 }
    );

    return {
      q: Math.round(sum.q / positions.length),
      r: Math.round(sum.r / positions.length),
      s: Math.round(sum.s / positions.length),
    };
  }

  private recordDecision(decision: AIDecision): void {
    this._decisionHistory.push(decision);

    // Keep only last 10 decisions
    if (this._decisionHistory.length > 10) {
      this._decisionHistory.shift();
    }
  }

  // === PUBLIC UTILITY METHODS ===

  public getDecisionHistory(): ReadonlyArray<AIDecision> {
    return [...this._decisionHistory];
  }

  public getDecisionStats(): {
    totalDecisions: number;
    decisionsByVariant: Record<string, number>;
    averagePriority: number;
  } {
    const decisionsByVariant: Record<string, number> = {
      attack: 0,
      ability: 0,
      move: 0,
      wait: 0,
      flee: 0,
    };

    let totalPriority = 0;

    for (const decision of this._decisionHistory) {
      decisionsByVariant[decision.variant]++;
      totalPriority += decision.priority;
    }

    return {
      totalDecisions: this._decisionHistory.length,
      decisionsByVariant,
      averagePriority:
        this._decisionHistory.length > 0 ? totalPriority / this._decisionHistory.length : 0,
    };
  }

  public resetForEncounter(): void {
    this._lastDecision = null;
    this._decisionHistory = [];
  }

  // === DEBUG METHODS ===

  public getDebugInfo(): {
    aiVariant: MonsterAIVariant;
    behaviorsCount: number;
    lastDecision: AIDecision | null;
    decisionHistory: ReadonlyArray<AIDecision>;
    stats: ReturnType<MonsterAI['getDecisionStats']>;
  } {
    return {
      aiVariant: this._aiVariant,
      behaviorsCount: this._behaviors.length,
      lastDecision: this._lastDecision,
      decisionHistory: this.getDecisionHistory(),
      stats: this.getDecisionStats(),
    };
  }
}

// === AI UTILITY FUNCTIONS ===

/**
 * Factory for creating pre-configured AI instances
 */
export class MonsterAIFactory {
  public static createAI(
    aiVariant: MonsterAIVariant,
    behaviors: MonsterBehavior[] = []
  ): MonsterAI {
    return new MonsterAI(aiVariant, behaviors);
  }

  public static createAggressiveAI(behaviors: MonsterBehavior[] = []): MonsterAI {
    return new MonsterAI('aggressive', behaviors);
  }

  public static createDefensiveAI(behaviors: MonsterBehavior[] = []): MonsterAI {
    return new MonsterAI('defensive', behaviors);
  }

  public static createTacticalAI(behaviors: MonsterBehavior[] = []): MonsterAI {
    return new MonsterAI('tactical', behaviors);
  }

  public static createBerserkerAI(behaviors: MonsterBehavior[] = []): MonsterAI {
    return new MonsterAI('berserker', behaviors);
  }

  public static createSupportAI(behaviors: MonsterBehavior[] = []): MonsterAI {
    return new MonsterAI('support', behaviors);
  }

  public static createPassiveAI(behaviors: MonsterBehavior[] = []): MonsterAI {
    return new MonsterAI('passive', behaviors);
  }
}

/**
 * Behavior condition evaluator utilities
 */
export class BehaviorEvaluator {
  public static evaluateHpCondition(
    entity: CombatEntity,
    conditionVariant: 'hp_below' | 'hp_above',
    threshold: number
  ): boolean {
    const hpPercent = entity.currentHp / entity.maxHp;

    switch (conditionVariant) {
      case 'hp_below':
        return hpPercent < threshold;
      case 'hp_above':
        return hpPercent > threshold;
      default:
        return false;
    }
  }

  public static evaluateRangeCondition(
    self: CombatEntity,
    targets: ReadonlyArray<CombatEntity>,
    range: number
  ): boolean {
    return targets.some(target => calculateHexDistance(self.position, target.position) <= range);
  }

  public static findEntitiesInRange(
    center: HexCoordinate,
    entities: ReadonlyArray<CombatEntity>,
    range: number
  ): ReadonlyArray<CombatEntity> {
    return entities.filter(entity => calculateHexDistance(center, entity.position) <= range);
  }

  public static findWoundedAllies(
    allies: ReadonlyArray<CombatEntity>,
    threshold: number = 0.5
  ): ReadonlyArray<CombatEntity> {
    return allies.filter(ally => ally.currentHp / ally.maxHp < threshold);
  }

  public static getMostWoundedEntity(entities: ReadonlyArray<CombatEntity>): CombatEntity | null {
    if (entities.length === 0) return null;

    return entities.reduce((mostWounded, current) => {
      const currentHpPercent = current.currentHp / current.maxHp;
      const mostWoundedPercent = mostWounded.currentHp / mostWounded.maxHp;
      return currentHpPercent < mostWoundedPercent ? current : mostWounded;
    });
  }

  public static getStrongestEntity(entities: ReadonlyArray<CombatEntity>): CombatEntity | null {
    if (entities.length === 0) return null;

    return entities.reduce((strongest, current) =>
      current.maxHp > strongest.maxHp ? current : strongest
    );
  }
}

/**
 * Position evaluation utilities for tactical AI
 */
export class PositionEvaluator {
  public static evaluatePosition(
    position: HexCoordinate,
    _self: CombatEntity, // Underscore prefix to indicate intentionally unused
    allies: ReadonlyArray<CombatEntity>,
    enemies: ReadonlyArray<CombatEntity>
  ): number {
    let score = 0;

    // Distance to enemies (farther = better for ranged, closer = better for melee)
    const avgEnemyDistance = this.calculateAverageDistance(position, enemies);
    score += avgEnemyDistance * 2; // Favor distance

    // Distance to allies (closer = better for support)
    const avgAllyDistance = this.calculateAverageDistance(position, allies);
    score -= avgAllyDistance; // Favor proximity to allies

    // Number of adjacent enemies (fewer = better)
    const adjacentEnemies = enemies.filter(
      enemy => calculateHexDistance(position, enemy.position) === 1
    ).length;
    score -= adjacentEnemies * 5; // Heavy penalty for being surrounded

    return score;
  }

  public static findBestPosition(
    currentPosition: HexCoordinate,
    movementRange: number,
    _self: CombatEntity, // Underscore prefix to indicate intentionally unused
    allies: ReadonlyArray<CombatEntity>,
    enemies: ReadonlyArray<CombatEntity>,
    obstacles: ReadonlySet<string>
  ): HexCoordinate {
    let bestPosition = currentPosition;
    let bestScore = this.evaluatePosition(currentPosition, _self, allies, enemies);

    // Evaluate positions within movement range
    // This is a simplified implementation - real version would use proper hex range calculation
    for (let q = -movementRange; q <= movementRange; q++) {
      for (let r = -movementRange; r <= movementRange; r++) {
        const s = -q - r;
        const candidatePosition = {
          q: currentPosition.q + q,
          r: currentPosition.r + r,
          s: currentPosition.s + s,
        };

        // Check if position is within movement range
        if (calculateHexDistance(currentPosition, candidatePosition) > movementRange) {
          continue;
        }

        // Check if position is blocked
        const positionString = `${candidatePosition.q},${candidatePosition.r},${candidatePosition.s}`;
        if (obstacles.has(positionString)) {
          continue;
        }

        // Check if position is occupied by another entity
        const isOccupied = [...allies, ...enemies].some(
          entity =>
            entity.position.q === candidatePosition.q &&
            entity.position.r === candidatePosition.r &&
            entity.position.s === candidatePosition.s
        );
        if (isOccupied) {
          continue;
        }

        const score = this.evaluatePosition(candidatePosition, _self, allies, enemies);
        if (score > bestScore) {
          bestScore = score;
          bestPosition = candidatePosition;
        }
      }
    }

    return bestPosition;
  }

  private static calculateAverageDistance(
    position: HexCoordinate,
    entities: ReadonlyArray<CombatEntity>
  ): number {
    if (entities.length === 0) return 0;

    const totalDistance = entities.reduce(
      (sum, entity) => sum + calculateHexDistance(position, entity.position),
      0
    );

    return totalDistance / entities.length;
  }
}
