/**
 * @fileoverview Monster factory for creating monster instances
 * Extracted from Monster.ts for better separation of concerns
 *
 * @file server/src/core/entities/MonsterFactory.ts
 */

import type { MonsterDefinition } from '@/core/types/entityTypes.js';
import type { HexCoordinate } from '@/utils/hex/hexCoordinates.js';

import { Monster } from './Monster.js';

/**
 * Factory for creating monsters from definitions
 */
export class MonsterFactory {
  public static createFromDefinition(
    id: string,
    definition: MonsterDefinition,
    position?: HexCoordinate
  ): Monster {
    return new Monster(id, definition, position);
  }

  public static createFromConfig(id: string, configData: any, position?: HexCoordinate): Monster {
    // Validate and transform config data into MonsterDefinition
    const definition: MonsterDefinition = {
      id: configData.id,
      name: configData.name,
      variant: 'monster',
      description: configData.description,
      stats: configData.stats,
      abilities: configData.abilities,
      aiVariant: configData.aiType, // Note: config uses 'aiType' but we use 'aiVariant'
      threatConfig: configData.threatConfig,
      spawnWeight: configData.spawnWeight,
      difficulty: configData.difficulty,
      behaviors: configData.behaviors || [],
      lootTable: configData.lootTable,
      tags: configData.tags,
    };

    return new Monster(id, definition, position);
  }

  public static createMultiple(
    definition: MonsterDefinition,
    count: number,
    positions?: HexCoordinate[]
  ): Monster[] {
    const monsters: Monster[] = [];

    for (let i = 0; i < count; i++) {
      const id = `${definition.id}_${i + 1}`;
      const position = positions?.[i];
      monsters.push(new Monster(id, definition, position));
    }

    return monsters;
  }

  // === SIMPLE MONSTER FACTORY FOR TESTING ===

  /**
   * Creates a basic monster for testing the game loop
   * Simplified AI that just attacks nearest player
   */
  public static createSimpleMonster(id: string, name: string, position?: HexCoordinate): Monster {
    const definition: MonsterDefinition = {
      id: 'simple_monster',
      name,
      variant: 'monster',
      description: 'A simple monster for testing',
      stats: {
        maxHp: 50,
        baseArmor: 1,
        baseDamage: 12,
        movementRange: 3,
      },
      abilities: [
        {
          id: 'basic_attack',
          name: 'Basic Attack',
          variant: 'attack',
          damage: 12,
          range: 1,
          cooldown: 0,
          description: 'A simple melee attack',
        },
      ],
      aiVariant: 'aggressive',
      threatConfig: {
        enabled: false, // Disable for simplicity
        decayRate: 0.1,
        healingMultiplier: 1.0,
        damageMultiplier: 1.0,
        armorMultiplier: 0.5,
        avoidLastTargetRounds: 0,
        fallbackToLowestHp: true,
        enableTiebreaker: true,
      },
      spawnWeight: 10,
      difficulty: 1,
      behaviors: [], // No complex behaviors for simple monster
    };

    return new Monster(id, definition, position);
  }

  // === FUTURE FACTORY METHODS ===

  /**
   * Creates a monster with level scaling
   */
  public static createScaledMonster(
    definition: MonsterDefinition,
    level: number,
    position?: HexCoordinate
  ): Monster {
    // Scale stats based on level
    const scaledDefinition: MonsterDefinition = {
      ...definition,
      stats: {
        ...definition.stats,
        maxHp: Math.floor(definition.stats.maxHp * (1 + level * 0.1)),
        baseDamage: Math.floor(definition.stats.baseDamage * (1 + level * 0.05)),
      },
    };

    const id = `${definition.id}_L${level}`;
    return new Monster(id, scaledDefinition, position);
  }

  /**
   * Creates a random monster from a pool of definitions
   */
  public static createRandomMonster(
    definitions: MonsterDefinition[],
    position?: HexCoordinate
  ): Monster {
    if (definitions.length === 0) {
      throw new Error('No monster definitions provided');
    }

    const randomDef = definitions[Math.floor(Math.random() * definitions.length)];
    if (!randomDef) {
      throw new Error('Failed to select random monster definition');
    }

    const id = `${randomDef.id}_${Date.now()}`;
    return new Monster(id, randomDef, position);
  }
}
