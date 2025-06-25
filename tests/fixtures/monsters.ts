/**
 * @fileoverview Monster test fixtures
 * Pre-configured monsters for consistent testing scenarios
 *
 * @file tests/fixtures/monsters.ts
 */

import { Monster, MonsterFactory } from '@/core/entities/Monster.js';
import { createTestHex } from '../helpers/testUtils.js';

// === MONSTER CONFIGURATIONS ===

export const MonsterConfigs = {
  goblinWarrior: {
    id: 'goblin_warrior',
    name: 'Goblin Warrior',
    type: 'monster' as const,
    stats: {
      maxHp: 45,
      baseArmor: 1,
      baseDamage: 14,
      movementRange: 3,
    },
    abilities: [
      {
        id: 'club_smash',
        name: 'Club Smash',
        type: 'attack' as const,
        damage: 18,
        range: 1,
        cooldown: 2,
        description: 'A powerful club attack',
        targetType: 'enemy' as const,
      },
      {
        id: 'battle_cry',
        name: 'Battle Cry',
        type: 'support' as const,
        range: 2,
        cooldown: 4,
        description: 'Enrages nearby allies',
        targetType: 'ally' as const,
        statusEffects: [
          {
            effectName: 'enraged',
            duration: 3,
            value: 5,
            chance: 1.0,
          },
        ],
      },
    ],
    aiType: 'aggressive' as const,
    difficulty: 2,
  },

  goblinArcher: {
    id: 'goblin_archer',
    name: 'Goblin Archer',
    type: 'monster' as const,
    stats: {
      maxHp: 35,
      baseArmor: 0,
      baseDamage: 10,
      movementRange: 4,
    },
    abilities: [
      {
        id: 'shortbow_shot',
        name: 'Shortbow Shot',
        type: 'attack' as const,
        damage: 14,
        range: 4,
        cooldown: 0,
        description: 'A ranged attack with a crude shortbow',
        targetType: 'enemy' as const,
      },
      {
        id: 'poison_arrow',
        name: 'Poison Arrow',
        type: 'attack' as const,
        damage: 12,
        range: 4,
        cooldown: 3,
        description: 'An arrow coated with poison',
        targetType: 'enemy' as const,
        statusEffects: [
          {
            effectName: 'poison',
            duration: 3,
            value: 4,
            chance: 0.7,
          },
        ],
      },
    ],
    aiType: 'tactical' as const,
    difficulty: 2,
  },

  skeletonWarrior: {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    type: 'monster' as const,
    stats: {
      maxHp: 50,
      baseArmor: 2,
      baseDamage: 16,
      movementRange: 3,
    },
    abilities: [
      {
        id: 'bone_sword',
        name: 'Bone Sword',
        type: 'attack' as const,
        damage: 20,
        range: 1,
        cooldown: 1,
        description: 'A strike with a weathered bone sword',
        targetType: 'enemy' as const,
      },
      {
        id: 'undead_resilience',
        name: 'Undead Resilience',
        type: 'support' as const,
        range: 0,
        cooldown: 5,
        description: 'Hardens bones against damage',
        targetType: 'self' as const,
        statusEffects: [
          {
            effectName: 'shielded',
            duration: 3,
            value: 8,
            chance: 1.0,
          },
        ],
      },
    ],
    aiType: 'defensive' as const,
    difficulty: 3,
  },

  direWolf: {
    id: 'dire_wolf',
    name: 'Dire Wolf',
    type: 'monster' as const,
    stats: {
      maxHp: 65,
      baseArmor: 1,
      baseDamage: 18,
      movementRange: 5,
    },
    abilities: [
      {
        id: 'bite',
        name: 'Savage Bite',
        type: 'attack' as const,
        damage: 22,
        range: 1,
        cooldown: 0,
        description: 'A powerful bite attack',
        targetType: 'enemy' as const,
      },
      {
        id: 'howl',
        name: 'Intimidating Howl',
        type: 'support' as const,
        range: 3,
        cooldown: 4,
        description: 'A howl that weakens enemies',
        targetType: 'enemy' as const,
        statusEffects: [
          {
            effectName: 'weakened',
            duration: 3,
            value: 5,
            chance: 0.8,
          },
        ],
      },
      {
        id: 'pounce',
        name: 'Pounce',
        type: 'attack' as const,
        damage: 16,
        range: 3,
        cooldown: 3,
        description: 'Leaps at a distant enemy',
        targetType: 'enemy' as const,
      },
    ],
    aiType: 'berserker' as const,
    difficulty: 4,
  },

  orcBrute: {
    id: 'orc_brute',
    name: 'Orc Brute',
    type: 'monster' as const,
    stats: {
      maxHp: 80,
      baseArmor: 3,
      baseDamage: 20,
      movementRange: 2,
    },
    abilities: [
      {
        id: 'hammer_slam',
        name: 'Hammer Slam',
        type: 'attack' as const,
        damage: 28,
        range: 1,
        cooldown: 2,
        description: 'A devastating hammer attack',
        targetType: 'enemy' as const,
      },
      {
        id: 'ground_pound',
        name: 'Ground Pound',
        type: 'attack' as const,
        damage: 15,
        range: 2,
        cooldown: 4,
        description: 'Damages all nearby enemies',
        targetType: 'area' as const,
        statusEffects: [
          {
            effectName: 'stunned',
            duration: 1,
            value: 1,
            chance: 0.6,
          },
        ],
      },
    ],
    aiType: 'aggressive' as const,
    difficulty: 5,
  },

  giantSpider: {
    id: 'giant_spider',
    name: 'Giant Spider',
    type: 'monster' as const,
    stats: {
      maxHp: 40,
      baseArmor: 0,
      baseDamage: 12,
      movementRange: 4,
    },
    abilities: [
      {
        id: 'web_spit',
        name: 'Web Spit',
        type: 'support' as const,
        range: 3,
        cooldown: 2,
        description: 'Immobilizes an enemy with webbing',
        targetType: 'enemy' as const,
        statusEffects: [
          {
            effectName: 'stunned',
            duration: 2,
            value: 1,
            chance: 0.9,
          },
        ],
      },
      {
        id: 'poison_bite',
        name: 'Poison Bite',
        type: 'attack' as const,
        damage: 10,
        range: 1,
        cooldown: 0,
        description: 'A venomous bite',
        targetType: 'enemy' as const,
        statusEffects: [
          {
            effectName: 'poison',
            duration: 4,
            value: 6,
            chance: 0.85,
          },
        ],
      },
    ],
    aiType: 'support' as const,
    difficulty: 3,
  },

  // Weak monsters for testing victory conditions
  weakGoblin: {
    id: 'weak_goblin',
    name: 'Weak Goblin',
    type: 'monster' as const,
    stats: {
      maxHp: 15,
      baseArmor: 0,
      baseDamage: 5,
      movementRange: 3,
    },
    abilities: [],
    aiType: 'passive' as const,
    difficulty: 1,
  },

  // Strong boss for testing defeat conditions
  dragonBoss: {
    id: 'dragon_boss',
    name: 'Ancient Dragon',
    type: 'monster' as const,
    stats: {
      maxHp: 200,
      baseArmor: 5,
      baseDamage: 35,
      movementRange: 6,
    },
    abilities: [
      {
        id: 'fire_breath',
        name: 'Fire Breath',
        type: 'attack' as const,
        damage: 40,
        range: 4,
        cooldown: 3,
        description: 'Breathes fire in a line',
        targetType: 'area' as const,
        statusEffects: [
          {
            effectName: 'burning',
            duration: 3,
            value: 8,
            chance: 0.9,
          },
        ],
      },
      {
        id: 'wing_buffet',
        name: 'Wing Buffet',
        type: 'attack' as const,
        damage: 25,
        range: 2,
        cooldown: 2,
        description: 'Pushes back all nearby enemies',
        targetType: 'area' as const,
      },
    ],
    aiType: 'tactical' as const,
    difficulty: 10,
  },
};

// === MONSTER FIXTURES ===

export const TestMonsters = {
  // Basic melee monsters
  goblinWarrior1: MonsterFactory.createFromConfig(
    'goblin1',
    MonsterConfigs.goblinWarrior,
    createTestHex(3, 0)
  ),
  goblinWarrior2: MonsterFactory.createFromConfig(
    'goblin2', 
    MonsterConfigs.goblinWarrior,
    createTestHex(4, -1)
  ),

  // Ranged monsters
  goblinArcher1: MonsterFactory.createFromConfig(
    'archer1',
    MonsterConfigs.goblinArcher,
    createTestHex(5, 0)
  ),
  goblinArcher2: MonsterFactory.createFromConfig(
    'archer2',
    MonsterConfigs.goblinArcher,
    createTestHex(3, 2)
  ),

  // Defensive monsters
  skeletonWarrior: MonsterFactory.createFromConfig(
    'skeleton1',
    MonsterConfigs.skeletonWarrior,
    createTestHex(4, 0)
  ),

  // High mobility monsters
  direWolf: MonsterFactory.createFromConfig(
    'wolf1',
    MonsterConfigs.direWolf,
    createTestHex(6, -2)
  ),

  // Tank monsters
  orcBrute: MonsterFactory.createFromConfig(
    'orc1',
    MonsterConfigs.orcBrute,
    createTestHex(3, 1)
  ),

  // Support monsters
  giantSpider: MonsterFactory.createFromConfig(
    'spider1',
    MonsterConfigs.giantSpider,
    createTestHex(5, -1)
  ),

  // Special test monsters
  weakGoblin: MonsterFactory.createFromConfig(
    'weak1',
    MonsterConfigs.weakGoblin,
    createTestHex(2, 1)
  ),

  dragonBoss: MonsterFactory.createFromConfig(
    'dragon1',
    MonsterConfigs.dragonBoss,
    createTestHex(7, -3)
  ),

  // Damaged variants
  damagedGoblin: (() => {
    const monster = MonsterFactory.createFromConfig(
      'damaged1',
      MonsterConfigs.goblinWarrior,
      createTestHex(3, 0)
    );
    monster.takeDamage(30, 'test setup');
    return monster;
  })(),

  criticallyDamagedArcher: (() => {
    const monster = MonsterFactory.createFromConfig(
      'critical1',
      MonsterConfigs.goblinArcher,
      createTestHex(5, 0)
    );
    monster.takeDamage(30, 'test setup'); // Bring to ~5 HP
    return monster;
  })(),

  // Status effect variants
  poisonedSkeleton: (() => {
    const monster = MonsterFactory.createFromConfig(
      'poisoned1',
      MonsterConfigs.skeletonWarrior,
      createTestHex(4, 0)
    );
    monster.addStatusEffect('poison', 3, 5);
    return monster;
  })(),

  enragedWolf: (() => {
    const monster = MonsterFactory.createFromConfig(
      'enraged1',
      MonsterConfigs.direWolf,
      createTestHex(6, -2)
    );
    monster.addStatusEffect('enraged', 4, 5);
    return monster;
  })(),
};

// === MONSTER FACTORIES ===

/**
 * Creates a fresh copy of a test monster (for tests that modify state)
 */
export function createFreshMonster(template: keyof typeof TestMonsters): Monster {
  const original = TestMonsters[template];
  const config = Object.values(MonsterConfigs).find(c => c.id === original.variant);
  
  if (!config) {
    throw new Error(`Could not find config for monster template: ${template}`);
  }

  const fresh = MonsterFactory.createFromConfig(
    `${original.id}_fresh_${Date.now()}`,
    config,
    original.position
  );

  // Apply any status effects from the template
  for (const effect of original.activeStatusEffects) {
    fresh.addStatusEffect(effect.name, effect.duration, effect.value);
  }

  // Apply any damage from the template  
  if (original.currentHp < original.maxHp) {
    const damage = original.maxHp - original.currentHp;
    fresh.takeDamage(damage, 'template setup');
  }

  return fresh;
}

/**
 * Creates a group of monsters for encounter scenarios
 */
export function createMonsterGroup(composition: (keyof typeof TestMonsters)[]): Monster[] {
  return composition.map((template, index) => {
    const fresh = createFreshMonster(template);
    // Adjust positions to avoid overlaps
    fresh.setPosition(createTestHex(3 + index, 0));
    return fresh;
  });
}

/**
 * Creates a balanced monster encounter
 */
export function createBalancedEncounter(): Monster[] {
  return createMonsterGroup(['goblinWarrior1', 'goblinArcher1']);
}

/**
 * Creates a challenging monster encounter
 */
export function createChallengingEncounter(): Monster[] {
  return createMonsterGroup(['orcBrute', 'goblinArcher1', 'giantSpider']);
}

/**
 * Creates a swarm of weak monsters
 */
export function createSwarmEncounter(): Monster[] {
  return createMonsterGroup(['weakGoblin', 'weakGoblin', 'weakGoblin', 'weakGoblin']);
}

/**
 * Creates a boss encounter
 */
export function createBossEncounter(): Monster[] {
  return createMonsterGroup(['dragonBoss']);
}

/**
 * Creates monsters with various AI types for AI testing
 */
export function createAITestEncounter(): Monster[] {
  return createMonsterGroup(['goblinWarrior1', 'goblinArcher1', 'skeletonWarrior', 'direWolf']);
}

// === MONSTER BUILDERS ===

export class MonsterBuilder {
  private config: any = MonsterConfigs.goblinWarrior;
  private id: string = 'test_monster';
  private position: ReturnType<typeof createTestHex> = createTestHex(3, 0);
  private statusEffects: Array<{ effect: string; duration: number; value?: number }> = [];
  private damage: number = 0;

  public withConfig(configKey: keyof typeof MonsterConfigs): this {
    this.config = MonsterConfigs[configKey];
    return this;
  }

  public withCustomConfig(config: any): this {
    this.config = config;
    return this;
  }

  public withId(id: string): this {
    this.id = id;
    return this;
  }

  public withPosition(q: number, r: number): this {
    this.position = createTestHex(q, r);
    return this;
  }

  public withStatusEffect(effect: string, duration: number, value?: number): this {
    this.statusEffects.push({ effect, duration, value });
    return this;
  }

  public withDamage(damage: number): this {
    this.damage = damage;
    return this;
  }

  public build(): Monster {
    const monster = MonsterFactory.createFromConfig(this.id, this.config, this.position);

    // Apply status effects
    for (const effect of this.statusEffects) {
      monster.addStatusEffect(effect.effect, effect.duration, effect.value);
    }

    // Apply damage
    if (this.damage > 0) {
      monster.takeDamage(this.damage, 'builder setup');
    }

    return monster;
  }
}

// === MONSTER SCENARIOS ===

export const MonsterScenarios = {
  /**
   * A standard balanced encounter
   */
  balanced: () => ({
    monsters: createBalancedEncounter(),
    description: 'Balanced encounter with melee and ranged monsters',
  }),

  /**
   * A challenging high-level encounter
   */
  challenging: () => ({
    monsters: createChallengingEncounter(), 
    description: 'Challenging encounter with tank, ranged, and support',
  }),

  /**
   * Many weak monsters for testing AoE and swarm tactics
   */
  swarm: () => ({
    monsters: createSwarmEncounter(),
    description: 'Swarm of weak monsters',
  }),

  /**
   * Single powerful boss monster
   */
  boss: () => ({
    monsters: createBossEncounter(),
    description: 'Single powerful boss encounter',
  }),

  /**
   * Monsters with different AI behaviors for AI testing
   */
  aiTest: () => ({
    monsters: createAITestEncounter(),
    description: 'Monsters with various AI behaviors for testing',
  }),

  /**
   * Monsters with various status effects
   */
  statusEffects: () => ({
    monsters: [
      createFreshMonster('poisonedSkeleton'),
      createFreshMonster('enragedWolf'),
      createFreshMonster('damagedGoblin'),
    ],
    description: 'Monsters with various status effects applied',
  }),

  /**
   * Solo monster scenarios for unit testing
   */
  solo: (monsterType: keyof typeof TestMonsters = 'goblinWarrior1') => ({
    monsters: [createFreshMonster(monsterType)],
    description: `Single ${monsterType} for isolated testing`,
  }),
};