/**
 * @fileoverview Complete game scenario fixtures
 * Pre-configured complete game setups for testing workflows
 *
 * @file tests/fixtures/scenarios.ts
 */

import type { HexCoordinate } from '@/utils/hex/index.js';
import { GameLoop } from '@/core/systems/GameLoop.js';
import { Player } from '@/core/entities/Player.js';
import { Monster } from '@/core/entities/Monster.js';
import { PlayerScenarios, createFreshPlayer } from './players.js';
import { MonsterScenarios, createFreshMonster } from './monsters.js';
import { createTestHex } from '../helpers/testUtils.js';

// === SCENARIO INTERFACE ===

export interface GameScenario {
  readonly name: string;
  readonly description: string;
  readonly players: Player[];
  readonly monsters: Monster[];
  readonly obstacles?: ReadonlySet<string>;
  readonly expectedDuration?: number; // rounds
  readonly expectedWinner?: 'players' | 'monsters' | 'draw';
  readonly tags: string[]; // for categorizing scenarios
}

// === BASIC SCENARIOS ===

export const BasicScenarios = {
  /**
   * Simplest possible combat scenario - 1v1
   */
  oneVsOne: (): GameScenario => ({
    name: 'One vs One',
    description: 'Single warrior vs single goblin warrior',
    players: PlayerScenarios.solo('warrior').players,
    monsters: MonsterScenarios.solo('goblinWarrior1').monsters,
    expectedDuration: 5,
    expectedWinner: 'players',
    tags: ['basic', 'combat', '1v1'],
  }),

  /**
   * Standard 2v2 balanced encounter
   */
  twoVsTwo: (): GameScenario => ({
    name: 'Two vs Two',
    description: 'Warrior + Healer vs Goblin Warrior + Goblin Archer',
    players: PlayerScenarios.standard2v2().players,
    monsters: MonsterScenarios.balanced().monsters,
    expectedDuration: 8,
    expectedWinner: 'players',
    tags: ['basic', 'combat', '2v2', 'balanced'],
  }),

  /**
   * Quick victory scenario with weak monsters
   */
  quickVictory: (): GameScenario => ({
    name: 'Quick Victory',
    description: 'Strong players vs weak monsters for fast win testing',
    players: PlayerScenarios.highDamage().players,
    monsters: MonsterScenarios.swarm().monsters,
    expectedDuration: 3,
    expectedWinner: 'players',
    tags: ['basic', 'victory', 'quick'],
  }),

  /**
   * Certain defeat scenario for testing loss conditions
   */
  certainDefeat: (): GameScenario => ({
    name: 'Certain Defeat',
    description: 'Weak damaged players vs powerful boss',
    players: [createFreshPlayer('criticallyDamagedHealer')],
    monsters: MonsterScenarios.boss().monsters,
    expectedDuration: 2,
    expectedWinner: 'monsters',
    tags: ['basic', 'defeat', 'quick'],
  }),
};

// === COMBAT SCENARIOS ===

export const CombatScenarios = {
  /**
   * Melee-focused combat with no ranged attacks
   */
  meleeOnly: (): GameScenario => ({
    name: 'Melee Only',
    description: 'All melee fighters in close combat',
    players: [
      createFreshPlayer('warrior'),
      createFreshPlayer('fighter'),
    ],
    monsters: [
      createFreshMonster('goblinWarrior1'),
      createFreshMonster('skeletonWarrior'),
    ],
    expectedDuration: 6,
    tags: ['combat', 'melee', 'positioning'],
  }),

  /**
   * Ranged-focused combat with distance management
   */
  rangedCombat: (): GameScenario => ({
    name: 'Ranged Combat',
    description: 'Archers vs archers with positioning tactics',
    players: [
      createFreshPlayer('archer'),
      createFreshPlayer('ranger'),
    ],
    monsters: [
      createFreshMonster('goblinArcher1'),
      createFreshMonster('goblinArcher2'),
    ],
    expectedDuration: 7,
    tags: ['combat', 'ranged', 'positioning'],
  }),

  /**
   * Mixed combat with melee and ranged
   */
  mixedCombat: (): GameScenario => {
    // Position entities for interesting tactical play
    const warrior = createFreshPlayer('warrior');
    warrior.setPosition(createTestHex(1, 0));
    
    const archer = createFreshPlayer('archer');
    archer.setPosition(createTestHex(0, 1));
    
    const goblinWarrior = createFreshMonster('goblinWarrior1');
    goblinWarrior.setPosition(createTestHex(3, 0));
    
    const goblinArcher = createFreshMonster('goblinArcher1');
    goblinArcher.setPosition(createTestHex(5, -1));

    return {
      name: 'Mixed Combat',
      description: 'Combination of melee and ranged fighters',
      players: [warrior, archer],
      monsters: [goblinWarrior, goblinArcher],
      expectedDuration: 8,
      tags: ['combat', 'mixed', 'tactical'],
    };
  },

  /**
   * High-damage burst combat scenario
   */
  burstDamage: (): GameScenario => ({
    name: 'Burst Damage',
    description: 'High damage dealers in quick decisive combat',
    players: PlayerScenarios.highDamage().players,
    monsters: MonsterScenarios.challenging().monsters,
    expectedDuration: 5,
    tags: ['combat', 'damage', 'burst'],
  }),

  /**
   * Tank vs tank scenario for testing sustained combat
   */
  tankFight: (): GameScenario => {
    const warrior = createFreshPlayer('warrior');
    const orcBrute = createFreshMonster('orcBrute');
    
    return {
      name: 'Tank Fight',
      description: 'High HP, high armor entities in prolonged combat',
      players: [warrior],
      monsters: [orcBrute],
      expectedDuration: 12,
      tags: ['combat', 'tank', 'sustained'],
    };
  },
};

// === HEALING & SUPPORT SCENARIOS ===

export const SupportScenarios = {
  /**
   * Healing-focused scenario
   */
  healingTest: (): GameScenario => {
    const damagedWarrior = createFreshPlayer('damagedWarrior');
    const healer = createFreshPlayer('healer');
    const goblin = createFreshMonster('goblinWarrior1');

    return {
      name: 'Healing Test',
      description: 'Testing healing mechanics with damaged ally',
      players: [damagedWarrior, healer],
      monsters: [goblin],
      expectedDuration: 8,
      tags: ['support', 'healing', 'cooperation'],
    };
  },

  /**
   * Support abilities and buffs scenario
   */
  buffTest: (): GameScenario => ({
    name: 'Buff Test',
    description: 'Testing support abilities and team buffs',
    players: [
      createFreshPlayer('cleric'),
      createFreshPlayer('warrior'),
    ],
    monsters: MonsterScenarios.balanced().monsters,
    expectedDuration: 8,
    tags: ['support', 'buffs', 'teamwork'],
  }),

  /**
   * Multiple healers scenario
   */
  multiHealer: (): GameScenario => ({
    name: 'Multi Healer',
    description: 'Multiple healers sustaining through tough fight',
    players: PlayerScenarios.healingFocus().players,
    monsters: MonsterScenarios.challenging().monsters,
    expectedDuration: 12,
    tags: ['support', 'healing', 'sustain'],
  }),
};

// === STATUS EFFECT SCENARIOS ===

export const StatusEffectScenarios = {
  /**
   * Poison damage over time scenario
   */
  poisonTest: (): GameScenario => ({
    name: 'Poison Test',
    description: 'Testing poison mechanics and damage over time',
    players: [createFreshPlayer('rogue')],
    monsters: [
      createFreshMonster('goblinWarrior1'),
      createFreshMonster('goblinArcher1'),
    ],
    expectedDuration: 6,
    tags: ['status', 'poison', 'dot'],
  }),

  /**
   * Stunning and immobilization scenario
   */
  stunTest: (): GameScenario => ({
    name: 'Stun Test',
    description: 'Testing stun effects and action denial',
    players: [createFreshPlayer('warrior')],
    monsters: [createFreshMonster('giantSpider')],
    expectedDuration: 8,
    tags: ['status', 'stun', 'control'],
  }),

  /**
   * Multiple status effects scenario
   */
  statusMix: (): GameScenario => ({
    name: 'Status Mix',
    description: 'Various status effects in complex interactions',
    players: PlayerScenarios.statusEffects().players,
    monsters: MonsterScenarios.statusEffects().monsters,
    expectedDuration: 10,
    tags: ['status', 'complex', 'interactions'],
  }),

  /**
   * Blessing and enhancement scenario
   */
  blessingsTest: (): GameScenario => ({
    name: 'Blessings Test',
    description: 'Testing positive status effects and buffs',
    players: [
      createFreshPlayer('cleric'),
      createFreshPlayer('warrior'),
    ],
    monsters: MonsterScenarios.challenging().monsters,
    expectedDuration: 9,
    tags: ['status', 'buffs', 'blessings'],
  }),
};

// === AI TESTING SCENARIOS ===

export const AIScenarios = {
  /**
   * Threat system testing scenario
   */
  threatTest: (): GameScenario => {
    // Position entities for specific threat interactions
    const warrior = createFreshPlayer('warrior');
    warrior.setPosition(createTestHex(1, 0));
    
    const healer = createFreshPlayer('healer');
    healer.setPosition(createTestHex(0, 1));
    
    const tacticalGoblin = createFreshMonster('goblinArcher1');
    tacticalGoblin.setPosition(createTestHex(3, 0));

    return {
      name: 'Threat Test',
      description: 'Testing AI threat calculation and target prioritization',
      players: [warrior, healer],
      monsters: [tacticalGoblin],
      expectedDuration: 8,
      tags: ['ai', 'threat', 'targeting'],
    };
  },

  /**
   * Different AI behavior types scenario
   */
  aiBehaviors: (): GameScenario => ({
    name: 'AI Behaviors',
    description: 'Testing different AI behavior types in one encounter',
    players: PlayerScenarios.standard2v2().players,
    monsters: MonsterScenarios.aiTest().monsters,
    expectedDuration: 10,
    tags: ['ai', 'behaviors', 'variety'],
  }),

  /**
   * AI positioning and movement scenario
   */
  aiPositioning: (): GameScenario => {
    // Create wide spacing to test AI movement
    const players = PlayerScenarios.standard2v2().players;
    const monsters = MonsterScenarios.balanced().monsters;
    
    // Spread out positions
    players[0]!.setPosition(createTestHex(0, 0));
    players[1]!.setPosition(createTestHex(1, 1));
    monsters[0]!.setPosition(createTestHex(5, 0));
    monsters[1]!.setPosition(createTestHex(6, -1));

    return {
      name: 'AI Positioning',
      description: 'Testing AI movement and positioning decisions',
      players,
      monsters,
      expectedDuration: 10,
      tags: ['ai', 'movement', 'positioning'],
    };
  },
};

// === PERFORMANCE SCENARIOS ===

export const PerformanceScenarios = {
  /**
   * Large battle scenario for performance testing
   */
  largeBattle: (): GameScenario => {
    const players = [];
    const monsters = [];

    // Create 6 players
    for (let i = 0; i < 6; i++) {
      const player = createFreshPlayer(['warrior', 'archer', 'healer', 'rogue'][i % 4] as any);
      player.setPosition(createTestHex(i, 0));
      players.push(player);
    }

    // Create 6 monsters
    for (let i = 0; i < 6; i++) {
      const monster = createFreshMonster(['goblinWarrior1', 'goblinArcher1', 'skeletonWarrior'][i % 3] as any);
      monster.setPosition(createTestHex(i + 8, 0));
      monsters.push(monster);
    }

    return {
      name: 'Large Battle',
      description: '6v6 battle for performance testing',
      players,
      monsters,
      expectedDuration: 15,
      tags: ['performance', 'large', 'stress'],
    };
  },

  /**
   * Quick succession scenarios for stress testing
   */
  rapidRounds: (): GameScenario => ({
    name: 'Rapid Rounds',
    description: 'Quick scenario for rapid execution testing',
    players: PlayerScenarios.highDamage().players,
    monsters: MonsterScenarios.swarm().monsters,
    expectedDuration: 3,
    expectedWinner: 'players',
    tags: ['performance', 'quick', 'stress'],
  }),
};

// === EDGE CASE SCENARIOS ===

export const EdgeCaseScenarios = {
  /**
   * Empty encounter scenario
   */
  noMonsters: (): GameScenario => ({
    name: 'No Monsters',
    description: 'Players with no monsters - immediate victory',
    players: PlayerScenarios.solo().players,
    monsters: [],
    expectedDuration: 1,
    expectedWinner: 'players',
    tags: ['edge', 'victory', 'empty'],
  }),

  /**
   * No players scenario
   */
  noPlayers: (): GameScenario => ({
    name: 'No Players',
    description: 'Monsters with no players - immediate victory',
    players: [],
    monsters: MonsterScenarios.solo().monsters,
    expectedDuration: 1,
    expectedWinner: 'monsters',
    tags: ['edge', 'defeat', 'empty'],
  }),

  /**
   * All dead scenario
   */
  allDead: (): GameScenario => {
    const deadPlayer = createFreshPlayer('warrior');
    deadPlayer.takeDamage(1000, 'test setup');
    
    const deadMonster = createFreshMonster('goblinWarrior1');
    deadMonster.takeDamage(1000, 'test setup');

    return {
      name: 'All Dead',
      description: 'All entities start dead - draw condition',
      players: [deadPlayer],
      monsters: [deadMonster],
      expectedDuration: 1,
      expectedWinner: 'draw',
      tags: ['edge', 'draw', 'dead'],
    };
  },

  /**
   * Maximum rounds scenario
   */
  maxRounds: (): GameScenario => {
    // Create very tanky entities to ensure max rounds is hit
    const tankPlayer = createFreshPlayer('warrior');
    const tankMonster = createFreshMonster('orcBrute');

    return {
      name: 'Max Rounds',
      description: 'Tanky entities designed to hit round limit',
      players: [tankPlayer],
      monsters: [tankMonster],
      expectedDuration: 50, // Configured max in game
      expectedWinner: 'draw',
      tags: ['edge', 'timeout', 'draw'],
    };
  },
};

// === SCENARIO FACTORY ===

export class ScenarioBuilder {
  private name: string = 'Custom Scenario';
  private description: string = 'A custom test scenario';
  private players: Player[] = [];
  private monsters: Monster[] = [];
  private obstacles: Set<string> = new Set();
  private tags: string[] = [];

  public withName(name: string): this {
    this.name = name;
    return this;
  }

  public withDescription(description: string): this {
    this.description = description;
    return this;
  }

  public withPlayers(players: Player[]): this {
    this.players = [...players];
    return this;
  }

  public withMonsters(monsters: Monster[]): this {
    this.monsters = [...monsters];
    return this;
  }

  public withObstacles(obstacles: HexCoordinate[]): this {
    this.obstacles = new Set(obstacles.map(pos => `${pos.q},${pos.r},${pos.s}`));
    return this;
  }

  public withTags(tags: string[]): this {
    this.tags = [...tags];
    return this;
  }

  public build(): GameScenario {
    return {
      name: this.name,
      description: this.description,
      players: this.players,
      monsters: this.monsters,
      obstacles: this.obstacles,
      tags: this.tags,
    };
  }
}

// === SCENARIO UTILITIES ===

/**
 * Creates a GameLoop from a scenario
 */
export function createGameLoopFromScenario(scenario: GameScenario, config?: any): GameLoop {
  return new GameLoop(scenario.players, scenario.monsters, config);
}

/**
 * Gets all scenarios by tag
 */
export function getScenariosByTag(tag: string): GameScenario[] {
  const allScenarios = [
    ...Object.values(BasicScenarios).map(fn => fn()),
    ...Object.values(CombatScenarios).map(fn => fn()),
    ...Object.values(SupportScenarios).map(fn => fn()),
    ...Object.values(StatusEffectScenarios).map(fn => fn()),
    ...Object.values(AIScenarios).map(fn => fn()),
    ...Object.values(PerformanceScenarios).map(fn => fn()),
    ...Object.values(EdgeCaseScenarios).map(fn => fn()),
  ];

  return allScenarios.filter(scenario => scenario.tags.includes(tag));
}

/**
 * Gets a random scenario for fuzz testing
 */
export function getRandomScenario(): GameScenario {
  const allScenarios = [
    ...Object.values(BasicScenarios),
    ...Object.values(CombatScenarios),
    ...Object.values(SupportScenarios),
    ...Object.values(StatusEffectScenarios),
    ...Object.values(AIScenarios),
  ];

  const randomFn = allScenarios[Math.floor(Math.random() * allScenarios.length)];
  return randomFn!();
}

// === EXPORT ALL SCENARIOS ===

export const AllScenarios = {
  ...BasicScenarios,
  ...CombatScenarios,
  ...SupportScenarios,
  ...StatusEffectScenarios,
  ...AIScenarios,
  ...PerformanceScenarios,
  ...EdgeCaseScenarios,
};