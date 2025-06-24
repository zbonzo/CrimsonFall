/**
 * @fileoverview Monster configuration loader and validation
 * Loads monster definitions from JSON files and validates them
 *
 * @file server/src/config/monsters/index.ts
 */

import type { MonsterDefinition } from '@/core/types/entityTypes.js';

export interface MonsterConfigData {
  id: string;
  name: string;
  type: 'monster';
  description: string;
  stats: {
    maxHp: number;
    baseArmor: number;
    baseDamage: number;
    movementRange: number;
  };
  abilities: any[];
  aiType: string;
  threatConfig: any;
  spawnWeight: number;
  difficulty: number;
  behaviors?: any[];
  tags?: string[];
}

export class MonsterConfigLoader {
  private static loadedConfigs: Map<string, MonsterConfigData> = new Map();

  public static async loadMonsterConfig(monsterId: string): Promise<MonsterConfigData> {
    if (this.loadedConfigs.has(monsterId)) {
      return this.loadedConfigs.get(monsterId)!;
    }

    try {
      const config = await this.getHardcodedConfig(monsterId);
      
      if (!this.validateMonsterConfig(config)) {
        throw new Error(`Invalid monster configuration: ${monsterId}`);
      }

      this.loadedConfigs.set(monsterId, config);
      return config;
    } catch (error) {
      console.error(`Failed to load monster config for ${monsterId}:`, error);
      throw new Error(`Monster configuration not found: ${monsterId}`);
    }
  }

  public static validateMonsterConfig(config: any): config is MonsterConfigData {
    const requiredFields = ['id', 'name', 'type', 'stats', 'abilities', 'aiType', 'difficulty'];
    return requiredFields.every(field => config && typeof config[field] !== 'undefined');
  }

  public static convertToDefinition(config: MonsterConfigData): MonsterDefinition {
    return {
      id: config.id,
      name: config.name,
      variant: 'monster',
      description: config.description,
      stats: config.stats,
      abilities: config.abilities,
      aiVariant: config.aiType as any,
      threatConfig: config.threatConfig,
      spawnWeight: config.spawnWeight,
      difficulty: config.difficulty,
      behaviors: config.behaviors || [],
      lootTable: [],
      tags: config.tags || [],
    };
  }

  private static async getHardcodedConfig(monsterId: string): Promise<MonsterConfigData> {
    const configs: Record<string, MonsterConfigData> = {
      'goblin_warrior': {
        id: 'goblin_warrior',
        name: 'Goblin Warrior',
        type: 'monster',
        description: 'A fierce goblin warrior',
        stats: {
          maxHp: 45,
          baseArmor: 1,
          baseDamage: 12,
          movementRange: 3,
        },
        abilities: [
          {
            id: 'rusty_slash',
            name: 'Rusty Slash',
            variant: 'attack',
            damage: 12,
            range: 1,
            cooldown: 0,
            description: 'A basic attack',
          },
        ],
        aiType: 'aggressive',
        threatConfig: {
          enabled: true,
          decayRate: 0.1,
          healingMultiplier: 1.5,
          damageMultiplier: 1.0,
          armorMultiplier: 0.5,
          avoidLastTargetRounds: 1,
          fallbackToLowestHp: true,
          enableTiebreaker: true,
        },
        spawnWeight: 10,
        difficulty: 1,
      },
    };

    const config = configs[monsterId];
    if (!config) {
      throw new Error(`No configuration found for monster: ${monsterId}`);
    }

    return config;
  }
}

export { MonsterConfigLoader as default };
