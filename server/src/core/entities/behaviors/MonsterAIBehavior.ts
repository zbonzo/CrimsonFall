/**
 * Handles AI decision making and action history
 */

import { MonsterAI } from '@/core/ai/MonsterAI.js';
import { ThreatManager } from '@/core/systems/ThreatManager.js';
import type { AIDecision, CombatEntity, TargetingContext } from '@/core/types/entityTypes.js';

export class MonsterAIBehavior {
  constructor(
    private readonly ai: MonsterAI,
    private readonly threat: ThreatManager
  ) {}

  public makeDecision(
    monster: CombatEntity,
    context: TargetingContext,
    _actionHistory: AIDecision[]
  ): AIDecision {
    return this.ai.makeDecision(monster, context, this.threat);
  }

  public selectTarget(availableTargets: ReadonlyArray<CombatEntity>): CombatEntity | null {
    return this.ai.selectTarget(availableTargets, this.threat);
  }

  public recordDecision(decision: AIDecision, actionHistory: AIDecision[]): void {
    actionHistory.push(decision);
    if (actionHistory.length > 20) {
      actionHistory.shift();
    }
  }
}
