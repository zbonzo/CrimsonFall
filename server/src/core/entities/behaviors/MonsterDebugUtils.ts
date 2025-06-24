/**
 * Handles debug information compilation
 */

import { MonsterAI } from '@/core/ai/MonsterAI.js';
import { EntityStatsManager } from '@/core/player/EntityStatsManager.js';
import { ThreatManager } from '@/core/systems/ThreatManager.js';
import { MonsterPrivateData, MonsterPublicData } from '@/core/types/entityTypes.js';

interface Monster {
  readonly id: string;
  readonly name: string;
  readonly variant: 'monster';
  readonly level: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly effectiveArmor: number;
  readonly position: import('@/utils/hex/index.js').HexCoordinate;
  readonly isAlive: boolean;
  readonly hasMovedThisRound: boolean;
  readonly activeStatusEffects: ReadonlyArray<import('@/core/types/entityTypes.js').StatusEffect>;
  readonly aiVariant: import('@/core/types/entityTypes.js').MonsterAIVariant;
  readonly difficulty: number;
  getAvailableAbilities(): ReadonlyArray<import('@/core/types/entityTypes.js').AbilityDefinition>;
  calculateNextAttackDamage(): number;
  getDefinition(): import('@/core/types/entityTypes.js').MonsterDefinition;
}

export class MonsterDataExport {
  public toPublicData(monster: Monster): MonsterPublicData {
    return {
      id: monster.id,
      name: monster.name,
      variant: monster.variant,
      level: monster.level,
      currentHp: monster.currentHp,
      maxHp: monster.maxHp,
      armor: monster.effectiveArmor,
      position: monster.position,
      isAlive: monster.isAlive,
      hasMovedThisRound: monster.hasMovedThisRound,
      statusEffects: monster.activeStatusEffects,
      availableAbilities: monster.getAvailableAbilities(),
      aiVariant: monster.aiVariant,
      difficulty: monster.difficulty,
      nextDamage: monster.calculateNextAttackDamage(),
    };
  }

  public toPrivateData(monster: Monster, threat: ThreatManager): MonsterPrivateData {
    const publicData = this.toPublicData(monster);
    return {
      ...publicData,
      threatTable: threat.getDebugInfo().threatTable,
      lastTargets: [...threat.lastTargets],
      behaviors: monster.getDefinition().behaviors || [],
    };
  }
}

interface Monster {
  toPublicData(): import('@/core/types/entityTypes.js').MonsterPublicData;
}

export class MonsterDebugUtils {
  public getDebugInfo(
    monster: Monster,
    ai: MonsterAI,
    threat: ThreatManager,
    stats: EntityStatsManager,
    roundsActive: number
  ) {
    return {
      entity: monster.toPublicData(),
      ai: ai.getDebugInfo(),
      threat: threat.getDebugInfo(),
      stats: stats.getCombatReadiness(),
      roundsActive,
    };
  }
}
