/**
 * @fileoverview Player test fixtures
 * Pre-configured players for consistent testing scenarios
 *
 * @file tests/fixtures/players.ts
 */

import type { PlayerSpecialization } from '@/core/types/entityTypes.js';
import { Player } from '@/core/entities/Player.js';
import { createTestHex } from '../helpers/testUtils.js';

// === PLAYER CLASS DEFINITIONS ===

export const PlayerClasses = {
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    variant: 'player' as const,
    description: 'A melee combat specialist with high health and armor',
    stats: {
      maxHp: 120,
      baseArmor: 3,
      baseDamage: 18,
      movementRange: 3,
    },
    abilities: [
      {
        id: 'power_strike',
        name: 'Power Strike',
        variant: 'attack' as const,
        damage: 25,
        range: 1,
        cooldown: 2,
        description: 'A powerful melee attack that deals extra damage',
        targetType: 'enemy' as const,
      },
      {
        id: 'defensive_stance',
        name: 'Defensive Stance',
        variant: 'support' as const,
        range: 0,
        cooldown: 3,
        description: 'Reduces incoming damage for 3 rounds',
        targetType: 'self' as const,
        statusEffects: [
          {
            effectName: 'shielded',
            duration: 3,
            value: 5,
            chance: 1.0,
          },
        ],
      },
      {
        id: 'whirlwind',
        name: 'Whirlwind',
        variant: 'attack' as const,
        damage: 15,
        range: 1,
        cooldown: 4,
        description: 'Attacks all adjacent enemies',
        targetType: 'area' as const,
      },
    ],
    startingAbilities: ['power_strike', 'defensive_stance'],
    progressionTable: [],
  } as unknown as PlayerSpecialization,

  ranger: {
    id: 'ranger',
    name: 'Ranger',
    variant: 'player' as const,
    description: 'A ranged combat specialist with high mobility',
    stats: {
      maxHp: 90,
      baseArmor: 1,
      baseDamage: 16,
      movementRange: 4,
    },
    abilities: [
      {
        id: 'shortbow_shot',
        name: 'Shortbow Shot',
        variant: 'attack' as const,
        damage: 20,
        range: 4,
        cooldown: 0,
        description: 'A ranged attack with a shortbow',
        targetType: 'enemy' as const,
      },
      {
        id: 'hunter_mark',
        name: "Hunter's Mark",
        variant: 'support' as const,
        range: 6,
        cooldown: 2,
        description: 'Marks a target, increasing damage against it',
        targetType: 'enemy' as const,
        statusEffects: [
          {
            effectName: 'vulnerable',
            duration: 4,
            value: 5,
            chance: 1.0,
          },
        ],
      },
      {
        id: 'rapid_shot',
        name: 'Rapid Shot',
        variant: 'attack' as const,
        damage: 12,
        range: 3,
        cooldown: 3,
        description: 'Fires multiple arrows in quick succession',
        targetType: 'enemy' as const,
      },
    ],
    startingAbilities: ['shortbow_shot', 'hunter_mark'],
    progressionTable: [],
  } as unknown as PlayerSpecialization,

  cleric: {
    id: 'cleric',
    name: 'Cleric',
    variant: 'player' as const,
    description: 'A support specialist focused on healing and buffs',
    stats: {
      maxHp: 100,
      baseArmor: 2,
      baseDamage: 12,
      movementRange: 3,
    },
    abilities: [
      {
        id: 'heal_self',
        name: 'Heal Self',
        variant: 'healing' as const,
        healing: 25,
        range: 0,
        cooldown: 1,
        description: 'Restores health to yourself',
        targetType: 'self' as const,
      },
      {
        id: 'heal_other',
        name: 'Heal Other',
        variant: 'healing' as const,
        healing: 30,
        range: 3,
        cooldown: 2,
        description: 'Restores health to an ally',
        targetType: 'ally' as const,
      },
      {
        id: 'bless',
        name: 'Bless',
        variant: 'support' as const,
        range: 2,
        cooldown: 3,
        description: 'Grants a blessing that improves combat effectiveness',
        targetType: 'ally' as const,
        statusEffects: [
          {
            effectName: 'blessed',
            duration: 4,
            value: 3,
            chance: 1.0,
          },
        ],
      },
      {
        id: 'holy_strike',
        name: 'Holy Strike',
        variant: 'attack' as const,
        damage: 16,
        range: 1,
        cooldown: 2,
        description: 'A divine attack that deals extra damage to undead',
        targetType: 'enemy' as const,
      },
    ],
    startingAbilities: ['heal_self', 'bless'],
    progressionTable: [],
  } as unknown as PlayerSpecialization,

  rogue: {
    id: 'rogue',
    name: 'Rogue',
    variant: 'player' as const,
    description: 'A stealth specialist with high damage and mobility',
    stats: {
      maxHp: 80,
      baseArmor: 1,
      baseDamage: 14,
      movementRange: 4,
    },
    abilities: [
      {
        id: 'sneak_attack',
        name: 'Sneak Attack',
        variant: 'attack' as const,
        damage: 28,
        range: 1,
        cooldown: 2,
        description: 'A surprise attack that deals massive damage',
        targetType: 'enemy' as const,
      },
      {
        id: 'stealth',
        name: 'Stealth',
        variant: 'support' as const,
        range: 0,
        cooldown: 4,
        description: 'Become invisible for a short time',
        targetType: 'self' as const,
        statusEffects: [
          {
            effectName: 'invisible',
            duration: 2,
            value: 1,
            chance: 1.0,
          },
        ],
      },
      {
        id: 'poison_blade',
        name: 'Poison Blade',
        variant: 'attack' as const,
        damage: 15,
        range: 1,
        cooldown: 3,
        description: 'An attack that applies poison',
        targetType: 'enemy' as const,
        statusEffects: [
          {
            effectName: 'poison',
            duration: 3,
            value: 5,
            chance: 0.8,
          },
        ],
      },
    ],
    startingAbilities: ['sneak_attack', 'stealth'],
    progressionTable: [],
  } as unknown as PlayerSpecialization,
};

// === PLAYER FIXTURES ===

export const TestPlayers = {
  // Basic fighters for simple combat tests
  warrior: new Player('warrior1', 'Warrior', PlayerClasses.fighter, createTestHex(0, 0)),
  fighter: new Player('fighter1', 'Fighter', PlayerClasses.fighter, createTestHex(1, 0)),

  // Ranged combatants
  archer: new Player('archer1', 'Archer', PlayerClasses.ranger, createTestHex(-1, 0)),
  ranger: new Player('ranger1', 'Ranger', PlayerClasses.ranger, createTestHex(0, 1)),

  // Support characters
  healer: new Player('healer1', 'Healer', PlayerClasses.cleric, createTestHex(0, -1)),
  cleric: new Player('cleric1', 'Cleric', PlayerClasses.cleric, createTestHex(-1, 1)),

  // Stealth characters
  rogue: new Player('rogue1', 'Rogue', PlayerClasses.rogue, createTestHex(1, -1)),
  assassin: new Player('assassin1', 'Assassin', PlayerClasses.rogue, createTestHex(2, 0)),

  // Damaged variants for testing healing/death
  damagedWarrior: (() => {
    const player = new Player('wounded1', 'Wounded Warrior', PlayerClasses.fighter, createTestHex(0, 0));
    player.takeDamage(70, 'test setup'); // Bring to ~50 HP
    return player;
  })(),

  criticallyDamagedHealer: (() => {
    const player = new Player('critical1', 'Critical Healer', PlayerClasses.cleric, createTestHex(0, 0));
    player.takeDamage(90, 'test setup'); // Bring to ~10 HP
    return player;
  })(),

  // Status effect variants
  poisonedRogue: (() => {
    const player = new Player('poisoned1', 'Poisoned Rogue', PlayerClasses.rogue, createTestHex(0, 0));
    player.addStatusEffect('poison', 3, 5);
    return player;
  })(),

  blessedCleric: (() => {
    const player = new Player('blessed1', 'Blessed Cleric', PlayerClasses.cleric, createTestHex(0, 0));
    player.addStatusEffect('blessed', 4, 3);
    return player;
  })(),
};

// === PLAYER FACTORIES ===

/**
 * Creates a fresh copy of a test player (for tests that modify state)
 */
export function createFreshPlayer(template: keyof typeof TestPlayers): Player {
  const original = TestPlayers[template];
  const fresh = new Player(
    `${original.id}_fresh_${Date.now()}`,
    original.name,
    original.specialization,
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
 * Creates a team of players for multiplayer scenarios
 */
export function createPlayerTeam(composition: (keyof typeof TestPlayers)[]): Player[] {
  return composition.map((template) => {
    const fresh = createFreshPlayer(template);
    return fresh;
  });
}

/**
 * Creates a balanced 2v2 team composition
 */
export function createBalanced2v2Team(): Player[] {
  return createPlayerTeam(['warrior', 'healer']);
}

/**
 * Creates a balanced 4v4 team composition
 */
export function createBalanced4v4Team(): Player[] {
  return createPlayerTeam(['warrior', 'archer', 'healer', 'rogue']);
}

/**
 * Creates a damage-focused team
 */
export function createDamageTeam(): Player[] {
  return createPlayerTeam(['warrior', 'archer', 'rogue']);
}

/**
 * Creates a support-focused team
 */
export function createSupportTeam(): Player[] {
  return createPlayerTeam(['cleric', 'healer']);
}

// === PLAYER BUILDERS ===

export class PlayerBuilder {
  private playerClass: PlayerSpecialization = PlayerClasses.fighter;
  private name: string = 'Test Player';
  private id: string = 'test_player';
  private position: ReturnType<typeof createTestHex> = createTestHex(0, 0);
  private statusEffects: Array<{ effect: string; duration: number; value?: number }> = [];
  private damage: number = 0;

  public withClass(playerClass: keyof typeof PlayerClasses): this {
    this.playerClass = PlayerClasses[playerClass];
    return this;
  }

  public withCustomClass(playerClass: PlayerSpecialization): this {
    this.playerClass = playerClass;
    return this;
  }

  public withName(name: string): this {
    this.name = name;
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
    this.statusEffects.push(value !== undefined ? { effect, duration, value } : { effect, duration });
    return this;
  }

  public withDamage(damage: number): this {
    this.damage = damage;
    return this;
  }

  public build(): Player {
    const player = new Player(this.id, this.name, this.playerClass, this.position);

    // Apply status effects
    for (const effect of this.statusEffects) {
      player.addStatusEffect(effect.effect, effect.duration, effect.value);
    }

    // Apply damage
    if (this.damage > 0) {
      player.takeDamage(this.damage, 'builder setup');
    }

    return player;
  }
}

// === PLAYER SCENARIOS ===

export const PlayerScenarios = {
  /**
   * A standard 2v2 balanced scenario
   */
  standard2v2: () => ({
    players: createBalanced2v2Team(),
    description: 'Standard 2 player team with warrior and healer',
  }),

  /**
   * A damage-heavy scenario for testing burst damage
   */
  highDamage: () => ({
    players: createDamageTeam(),
    description: 'High damage team composition',
  }),

  /**
   * A support-heavy scenario for testing healing mechanics
   */
  healingFocus: () => ({
    players: createSupportTeam(),
    description: 'Support-focused team for healing tests',
  }),

  /**
   * Players with various status effects for testing status systems
   */
  statusEffects: () => ({
    players: [
      createFreshPlayer('poisonedRogue'),
      createFreshPlayer('blessedCleric'),
      createFreshPlayer('damagedWarrior'),
    ],
    description: 'Players with various status effects applied',
  }),

  /**
   * Solo player scenarios for unit testing
   */
  solo: (playerType: keyof typeof TestPlayers = 'warrior') => ({
    players: [createFreshPlayer(playerType)],
    description: `Single ${playerType} for isolated testing`,
  }),
};