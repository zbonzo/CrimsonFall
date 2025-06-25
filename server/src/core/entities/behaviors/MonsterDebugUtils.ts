/**
 * Handles debug information compilation
 */

import { MonsterAI } from '@/core/ai/MonsterAI.js';
import { EntityStatsManager } from '@/core/player/EntityStatsManager.js';
import { ThreatManager } from '@/core/systems/ThreatManager.js';
import { MonsterPrivateData, MonsterPublicData } from '@/core/types/entityTypes.js';
import type { Monster } from '../Monster.js';


export class MonsterDataExport {
  public toPublicData(monster: Monster): MonsterPublicData {
    return {
      id: monster.id,
      name: monster.name,
      variant: monster.variant,
      currentHp: monster.currentHp,
      maxHp: monster.maxHp,
      baseArmor: monster.baseArmor,
      effectiveArmor: monster.effectiveArmor,
      baseDamage: monster.baseDamage,
      position: monster.position,
      isAlive: monster.isAlive,
      movementRange: monster.movementRange,
      aiVariant: monster.aiVariant,
      abilities: monster.getAvailableAbilities(),
    };
  }

  public toPrivateData(monster: Monster, threat: ThreatManager): MonsterPrivateData {
    const publicData = this.toPublicData(monster);
    const privateData: MonsterPrivateData = {
      ...publicData,
      threatEntries: new Map(threat.threatEntries.map(entry => [entry.playerId, entry])),
      threatConfig: threat.config,
      behaviors: monster.getDefinition().behaviors || [],
    };
    
    // Only add lastDecision if it exists
    if (monster.lastDecision) {
      (privateData as any).lastDecision = monster.lastDecision;
    }
    
    return privateData;
  }
}


export class MonsterDebugUtils {
  private readonly dataExport = new MonsterDataExport();

  public getDebugInfo(
    monster: Monster,
    ai: MonsterAI,
    threat: ThreatManager,
    stats: EntityStatsManager,
    roundsActive: number
  ) {
    return {
      entity: this.dataExport.toPublicData(monster),
      ai: ai.getDebugInfo(),
      threat: threat.getDebugInfo(),
      stats: stats.getCombatReadiness(),
      roundsActive,
    };
  }
}
