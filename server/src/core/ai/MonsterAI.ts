/**
 * @fileoverview Refactored AI system for monster behavior and decision making
 * Major complexity reduction: Extracted strategy patterns to separate files
 * 
 * ARCHITECTURAL CHANGES:
 * - Strategy Pattern: AI variants moved to dedicated strategy classes
 * - Behavior Evaluation: Complex behaviors remain here for now (future extraction)
 * - Simplified Decision Flow: Main logic focuses on orchestration
 * 
 * FROM: 894 lines of mixed concerns
 * TO: ~250 lines of focused orchestration
 *
 * @file server/src/core/ai/MonsterAI.ts
 */

import { ThreatManager } from '@/core/systems/ThreatManager.js';
import type {
  AIDecision,
  BehaviorCondition,
  CombatEntity,
  MonsterAIVariant,
  MonsterBehavior,
  TargetingContext,
} from '@/core/types/entityTypes.js';
import { calculateHexDistance } from '@/utils/hex/index.js';
import { 
  AIStrategyBase,
  AggressiveStrategy,
  DefensiveStrategy,
  TacticalStrategy 
} from './strategies/index.js';

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
 * Orchestrates AI behavior for monsters using strategy pattern
 * Delegates complex decision making to specialized strategy classes
 */
export class MonsterAI {
  private readonly _aiVariant: MonsterAIVariant;
  private readonly _behaviors: MonsterBehavior[];
  private readonly _strategy: AIStrategyBase;
  private _lastDecision: AIDecision | null = null;
  private _decisionHistory: AIDecision[] = [];

  constructor(aiVariant: MonsterAIVariant, behaviors: MonsterBehavior[] = []) {
    this._aiVariant = aiVariant;
    this._behaviors = [...behaviors].sort((a, b) => b.priority - a.priority);
    this._strategy = this.createStrategy(aiVariant);
  }

  // === GETTERS ===

  public get aiVariant(): MonsterAIVariant {
    return this._aiVariant;
  }

  public get lastDecision(): AIDecision | null {
    return this._lastDecision;
  }

  public get decisionHistory(): ReadonlyArray<AIDecision> {
    return [...this._decisionHistory];
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

    // Delegate to strategy for AI variant decision
    const aiDecision = this._strategy.makeDecision(self, context, threatManager);
    this._lastDecision = aiDecision;
    this.recordDecision(aiDecision);
    return aiDecision;
  }

  public selectTarget(
    availableTargets: ReadonlyArray<CombatEntity>,
    threatManager: ThreatManager
  ): CombatEntity | null {
    if (availableTargets.length === 0) return null;

    // Use threat system if available
    const threatResult = threatManager.selectTarget(availableTargets);
    if (threatResult && threatResult.target) return threatResult.target;

    // Fallback to nearest enemy
    return this.findNearestEntity(availableTargets, { q: 0, r: 0, s: 0 });
  }

  // === BEHAVIOR EVALUATION ===
  // NOTE: This section remains complex and could be extracted in future iterations

  private evaluateBehaviors(self: CombatEntity, context: TargetingContext): AIDecision | null {
    for (const behavior of this._behaviors) {
      if (this.evaluateBehaviorConditions(behavior.conditions, self, context)) {
        return this.executeBehaviorAction(behavior, self, context);
      }
    }
    return null;
  }

  private evaluateBehaviorConditions(
    conditions: BehaviorCondition[],
    self: CombatEntity,
    context: TargetingContext
  ): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, self, context));
  }

  private evaluateCondition(
    condition: BehaviorCondition,
    self: CombatEntity,
    context: TargetingContext
  ): boolean {
    switch (condition.variant) {
      case 'health_below':
        return (self.currentHp / self.maxHp) < (condition.value as number);
      
      case 'enemy_count':
        return context.enemies.length >= (condition.value as number);
      
      case 'enemy_nearby':
        const range = condition.value as number;
        return context.enemies.some(enemy => 
          calculateHexDistance(self.position, enemy.position) <= range
        );
      
      case 'ally_count':
        return context.allies.length >= (condition.value as number);
      
      case 'round_number':
        return context.currentRound >= (condition.value as number);
      
      default:
        return false;
    }
  }

  private executeBehaviorAction(
    behavior: MonsterBehavior,
    self: CombatEntity,
    context: TargetingContext
  ): AIDecision {
    switch (behavior.action.variant) {
      case 'attack_nearest':
        const nearest = this.findNearestEntity(context.enemies, self.position);
        return nearest ? { variant: 'attack', target: nearest, priority: 1, confidence: 0.8 } 
                      : { variant: 'wait', priority: 0, confidence: 0.1 };
      
      case 'retreat':
        const safePosition = this.findSafePosition(self, context);
        return safePosition ? { variant: 'move', targetPosition: safePosition, priority: 1, confidence: 0.9 }
                            : { variant: 'wait', priority: 0, confidence: 0.1 };
      
      case 'ability':
        const abilityId = behavior.action.abilityId;
        const target = this.findNearestEntity(context.enemies, self.position);
        return abilityId && target ? { variant: 'ability', abilityId, target, priority: 1, confidence: 0.7 }
                                   : { variant: 'wait', priority: 0, confidence: 0.1 };
      
      default:
        return { variant: 'wait', priority: 0, confidence: 0.1 };
    }
  }

  // === STRATEGY CREATION ===

  private createStrategy(aiVariant: MonsterAIVariant): AIStrategyBase {
    switch (aiVariant) {
      case 'aggressive':
        return new AggressiveStrategy();
      case 'defensive':
        return new DefensiveStrategy();
      case 'tactical':
        return new TacticalStrategy();
      case 'berserker':
        return new AggressiveStrategy(); // Use aggressive for now
      case 'support':
        return new DefensiveStrategy(); // Use defensive for now
      case 'passive':
      default:
        return new DefensiveStrategy(); // Use defensive as default
    }
  }

  // === UTILITY HELPERS ===

  private findNearestEntity(
    entities: ReadonlyArray<CombatEntity>,
    position: { q: number; r: number; s: number }
  ): CombatEntity | null {
    if (entities.length === 0) return null;

    return entities.reduce((closest, current) =>
      calculateHexDistance(position, current.position) <
      calculateHexDistance(position, closest.position)
        ? current
        : closest
    );
  }

  private findSafePosition(
    self: CombatEntity,
    context: TargetingContext
  ): { q: number; r: number; s: number } | null {
    const currentPos = self.position;
    const candidates = this.getAdjacentPositions(currentPos);
    
    let bestPosition: { q: number; r: number; s: number } = { q: 0, r: 0, s: 0 };
    let maxDistance = 0;

    for (const pos of candidates) {
      let minEnemyDistance = Infinity;
      
      for (const enemy of context.enemies) {
        const distance = calculateHexDistance(pos, enemy.position);
        minEnemyDistance = Math.min(minEnemyDistance, distance);
      }
      
      if (minEnemyDistance > maxDistance) {
        maxDistance = minEnemyDistance;
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

  // === DECISION TRACKING ===

  private recordDecision(decision: AIDecision): void {
    this._decisionHistory.push(decision);
    if (this._decisionHistory.length > 20) {
      this._decisionHistory.shift();
    }
  }

  // === DEBUG METHODS ===

  public getDebugInfo(): {
    aiVariant: MonsterAIVariant;
    lastDecision: AIDecision | null;
    decisionHistoryLength: number;
    behaviorCount: number;
    strategyName: string;
  } {
    return {
      aiVariant: this._aiVariant,
      lastDecision: this._lastDecision,
      decisionHistoryLength: this._decisionHistory.length,
      behaviorCount: this._behaviors.length,
      strategyName: this._strategy.constructor.name,
    };
  }
}

// === AI UTILITY FUNCTIONS ===

/**
 * Factory for creating AI instances with common configurations
 */
export class MonsterAIFactory {
  public static createAggressive(): MonsterAI {
    return new MonsterAI('aggressive', [
      {
        id: 'low_health_aggressive',
        name: 'Desperate Attack',
        priority: AI_PRIORITIES.HIGH,
        conditions: [{ variant: 'health_below', value: 0.3 }],
        action: { variant: 'attack_nearest' },
      },
    ]);
  }

  public static createDefensive(): MonsterAI {
    return new MonsterAI('defensive', [
      {
        id: 'low_health_retreat',
        name: 'Tactical Retreat',
        priority: AI_PRIORITIES.EMERGENCY,
        conditions: [{ variant: 'health_below', value: 0.2 }],
        action: { variant: 'retreat' },
      },
    ]);
  }

  public static createTactical(): MonsterAI {
    return new MonsterAI('tactical', [
      {
        id: 'outnumbered_retreat',
        name: 'Strategic Withdrawal',
        priority: AI_PRIORITIES.HIGH,
        conditions: [
          { variant: 'enemy_count', value: 3 },
          { variant: 'ally_count', value: 1 },
        ],
        action: { variant: 'retreat' },
      },
    ]);
  }
}