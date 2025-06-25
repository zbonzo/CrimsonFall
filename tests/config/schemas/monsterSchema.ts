/**
 * @fileoverview JSON Schema for monster configuration validation
 * Validates monster definition files for type safety and correctness
 *
 * @file tests/config/schemas/monsterSchema.ts
 */

export const monsterConfigSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://crimsonfall.com/schemas/monster.json",
  title: "Monster Configuration",
  description: "Schema for validating monster definition files",
  type: "object",
  required: ["id", "name", "type", "stats", "aiType"],
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
      pattern: "^[a-z][a-z0-9_]*$",
      minLength: 1,
      maxLength: 50,
      description: "Unique identifier for the monster type (snake_case)"
    },
    name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Human-readable name of the monster"
    },
    type: {
      const: "monster",
      description: "Entity type identifier"
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 1000,
      description: "Lore and tactical description of the monster"
    },
    stats: {
      type: "object",
      required: ["maxHp", "baseArmor", "baseDamage", "movementRange"],
      additionalProperties: false,
      properties: {
        maxHp: {
          type: "number",
          minimum: 1,
          maximum: 1000,
          description: "Maximum health points"
        },
        baseArmor: {
          type: "number",
          minimum: 0,
          maximum: 50,
          description: "Base armor value for damage reduction"
        },
        baseDamage: {
          type: "number",
          minimum: 0,
          maximum: 200,
          description: "Base damage for basic attacks"
        },
        movementRange: {
          type: "number",
          minimum: 1,
          maximum: 10,
          description: "Number of hex tiles the monster can move per turn"
        },
        criticalChance: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Probability of critical hits (0-1)"
        },
        criticalMultiplier: {
          type: "number",
          minimum: 1,
          maximum: 5,
          description: "Damage multiplier for critical hits"
        },
        resistances: {
          type: "object",
          additionalProperties: false,
          patternProperties: {
            "^(fire|ice|lightning|poison|physical|magic)$": {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Damage resistance (0 = no resistance, 1 = immunity)"
            }
          },
          description: "Damage type resistances"
        },
        vulnerabilities: {
          type: "object",
          additionalProperties: false,
          patternProperties: {
            "^(fire|ice|lightning|poison|physical|magic)$": {
              type: "number",
              minimum: 1,
              maximum: 3,
              description: "Damage type vulnerabilities (multipliers)"
            }
          },
          description: "Damage type vulnerabilities"
        }
      }
    },
    abilities: {
      type: "array",
      maxItems: 10,
      description: "List of abilities this monster can use",
      items: {
        type: "object",
        required: ["id", "name", "type", "range"],
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            pattern: "^[a-z][a-z0-9_]*$",
            description: "Unique identifier for the ability"
          },
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            description: "Human-readable name of the ability"
          },
          type: {
            enum: ["attack", "healing", "support", "movement"],
            description: "Type of ability"
          },
          description: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description: "Description of what the ability does"
          },
          damage: {
            type: "number",
            minimum: 0,
            maximum: 500,
            description: "Base damage dealt by the ability"
          },
          healing: {
            type: "number",
            minimum: 0,
            maximum: 500,
            description: "Base healing provided by the ability"
          },
          range: {
            type: "number",
            minimum: 0,
            maximum: 15,
            description: "Maximum range in hex tiles"
          },
          cooldown: {
            type: "number",
            minimum: 0,
            maximum: 10,
            description: "Cooldown in rounds"
          },
          targetType: {
            enum: ["enemy", "ally", "self", "area", "any"],
            description: "Valid targets for this ability"
          },
          statusEffects: {
            type: "array",
            maxItems: 3,
            items: {
              type: "object",
              required: ["effectName", "duration"],
              properties: {
                effectName: {
                  type: "string",
                  enum: [
                    "poison", "burning", "frozen", "stunned", "weakened",
                    "vulnerable", "blessed", "shielded", "enraged", 
                    "regeneration", "invisible"
                  ]
                },
                duration: {
                  type: "number",
                  minimum: 1,
                  maximum: 8
                },
                value: {
                  type: "number",
                  minimum: 0,
                  maximum: 50
                },
                chance: {
                  type: "number",
                  minimum: 0,
                  maximum: 1
                }
              }
            }
          },
          aiPriority: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "AI priority for using this ability (higher = more likely)"
          },
          usageConditions: {
            type: "object",
            description: "Conditions that must be met to use this ability",
            additionalProperties: false,
            properties: {
              minHpPercent: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Minimum HP percentage required"
              },
              maxHpPercent: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Maximum HP percentage allowed"
              },
              enemyCountMin: {
                type: "number",
                minimum: 0,
                maximum: 10,
                description: "Minimum number of enemies required"
              },
              allyCountMin: {
                type: "number",
                minimum: 0,
                maximum: 10,
                description: "Minimum number of allies required"
              },
              requiredStatusEffect: {
                type: "string",
                description: "Status effect that must be active"
              }
            }
          }
        }
      }
    },
    aiType: {
      enum: ["aggressive", "defensive", "tactical", "berserker", "support", "passive"],
      description: "AI behavior pattern for this monster type"
    },
    aiConfig: {
      type: "object",
      description: "Advanced AI configuration options",
      additionalProperties: false,
      properties: {
        aggressionLevel: {
          type: "number",
          minimum: 0,
          maximum: 10,
          description: "How aggressive the AI is (0 = passive, 10 = berserker)"
        },
        intelligenceLevel: {
          type: "number",
          minimum: 1,
          maximum: 10,
          description: "How smart the AI is in tactical decisions"
        },
        selfPreservation: {
          type: "number",
          minimum: 0,
          maximum: 10,
          description: "How much the AI prioritizes its own survival"
        },
        teamwork: {
          type: "number",
          minimum: 0,
          maximum: 10,
          description: "How well the AI coordinates with allies"
        },
        rangePreference: {
          enum: ["melee", "ranged", "balanced"],
          description: "Preferred combat range"
        },
        targetPriority: {
          enum: ["lowest_hp", "highest_threat", "nearest", "weakest", "strongest", "healer_first"],
          description: "Primary target selection strategy"
        }
      }
    },
    difficulty: {
      type: "number",
      minimum: 1,
      maximum: 10,
      description: "Overall difficulty rating (1 = trivial, 10 = boss)"
    },
    encounterWeight: {
      type: "number",
      minimum: 0.1,
      maximum: 10,
      description: "Relative weight for random encounter generation"
    },
    loot: {
      type: "object",
      description: "Loot drops and rewards",
      additionalProperties: false,
      properties: {
        experience: {
          type: "number",
          minimum: 0,
          maximum: 1000,
          description: "Experience points awarded for defeating this monster"
        },
        gold: {
          type: "object",
          properties: {
            min: { type: "number", minimum: 0 },
            max: { type: "number", minimum: 0 }
          },
          required: ["min", "max"],
          description: "Gold drop range"
        },
        items: {
          type: "array",
          maxItems: 5,
          items: {
            type: "object",
            required: ["itemId", "chance"],
            properties: {
              itemId: { type: "string" },
              chance: { type: "number", minimum: 0, maximum: 1 },
              quantity: { type: "number", minimum: 1, maximum: 10 }
            }
          },
          description: "Possible item drops"
        }
      }
    },
    spawning: {
      type: "object",
      description: "Spawning and encounter configuration",
      additionalProperties: false,
      properties: {
        minLevel: {
          type: "number",
          minimum: 1,
          maximum: 20,
          description: "Minimum encounter level for this monster"
        },
        maxLevel: {
          type: "number",
          minimum: 1,
          maximum: 20,
          description: "Maximum encounter level for this monster"
        },
        groupSizeMin: {
          type: "number",
          minimum: 1,
          maximum: 10,
          description: "Minimum group size when spawning"
        },
        groupSizeMax: {
          type: "number",
          minimum: 1,
          maximum: 10,
          description: "Maximum group size when spawning"
        },
        biomes: {
          type: "array",
          items: {
            type: "string",
            enum: ["forest", "cave", "dungeon", "swamp", "mountain", "desert", "ruins"]
          },
          description: "Biomes where this monster can appear"
        }
      }
    },
    appearance: {
      type: "object",
      description: "Visual and audio properties",
      additionalProperties: false,
      properties: {
        sprite: {
          type: "string",
          description: "Sprite/image identifier"
        },
        scale: {
          type: "number",
          minimum: 0.1,
          maximum: 5,
          description: "Visual scale multiplier"
        },
        sounds: {
          type: "object",
          properties: {
            spawn: { type: "string" },
            attack: { type: "string" },
            hurt: { type: "string" },
            death: { type: "string" }
          },
          description: "Sound effect identifiers"
        },
        animations: {
          type: "object",
          properties: {
            idle: { type: "string" },
            move: { type: "string" },
            attack: { type: "string" },
            death: { type: "string" }
          },
          description: "Animation identifiers"
        }
      }
    },
    tags: {
      type: "array",
      maxItems: 10,
      items: {
        type: "string",
        enum: [
          "undead", "beast", "humanoid", "elemental", "construct",
          "boss", "elite", "swarm", "flying", "aquatic",
          "fire", "ice", "poison", "magic", "physical"
        ]
      },
      description: "Categorical tags for the monster"
    }
  },

  // Conditional validation
  allOf: [
    {
      // Bosses should have high difficulty
      if: {
        properties: { tags: { contains: { const: "boss" } } }
      },
      then: {
        properties: { difficulty: { minimum: 7 } }
      }
    },
    {
      // Elite monsters should have moderate to high difficulty
      if: {
        properties: { tags: { contains: { const: "elite" } } }
      },
      then: {
        properties: { difficulty: { minimum: 4 } }
      }
    },
    {
      // Swarm monsters should have low individual difficulty
      if: {
        properties: { tags: { contains: { const: "swarm" } } }
      },
      then: {
        properties: { difficulty: { maximum: 3 } }
      }
    }
  ]
};

// Type definition derived from schema
export interface MonsterConfig {
  readonly id: string;
  readonly name: string;
  readonly type: 'monster';
  readonly description?: string;
  readonly stats: {
    readonly maxHp: number;
    readonly baseArmor: number;
    readonly baseDamage: number;
    readonly movementRange: number;
    readonly criticalChance?: number;
    readonly criticalMultiplier?: number;
    readonly resistances?: Record<string, number>;
    readonly vulnerabilities?: Record<string, number>;
  };
  readonly abilities?: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly type: 'attack' | 'healing' | 'support' | 'movement';
    readonly description?: string;
    readonly damage?: number;
    readonly healing?: number;
    readonly range: number;
    readonly cooldown?: number;
    readonly targetType?: 'enemy' | 'ally' | 'self' | 'area' | 'any';
    readonly statusEffects?: ReadonlyArray<{
      readonly effectName: string;
      readonly duration: number;
      readonly value?: number;
      readonly chance?: number;
    }>;
    readonly aiPriority?: number;
    readonly usageConditions?: {
      readonly minHpPercent?: number;
      readonly maxHpPercent?: number;
      readonly enemyCountMin?: number;
      readonly allyCountMin?: number;
      readonly requiredStatusEffect?: string;
    };
  }>;
  readonly aiType: 'aggressive' | 'defensive' | 'tactical' | 'berserker' | 'support' | 'passive';
  readonly aiConfig?: {
    readonly aggressionLevel?: number;
    readonly intelligenceLevel?: number;
    readonly selfPreservation?: number;
    readonly teamwork?: number;
    readonly rangePreference?: 'melee' | 'ranged' | 'balanced';
    readonly targetPriority?: 'lowest_hp' | 'highest_threat' | 'nearest' | 'weakest' | 'strongest' | 'healer_first';
  };
  readonly difficulty: number;
  readonly encounterWeight?: number;
  readonly loot?: {
    readonly experience?: number;
    readonly gold?: {
      readonly min: number;
      readonly max: number;
    };
    readonly items?: ReadonlyArray<{
      readonly itemId: string;
      readonly chance: number;
      readonly quantity?: number;
    }>;
  };
  readonly spawning?: {
    readonly minLevel?: number;
    readonly maxLevel?: number;
    readonly groupSizeMin?: number;
    readonly groupSizeMax?: number;
    readonly biomes?: ReadonlyArray<string>;
  };
  readonly appearance?: {
    readonly sprite?: string;
    readonly scale?: number;
    readonly sounds?: {
      readonly spawn?: string;
      readonly attack?: string;
      readonly hurt?: string;
      readonly death?: string;
    };
    readonly animations?: {
      readonly idle?: string;
      readonly move?: string;
      readonly attack?: string;
      readonly death?: string;
    };
  };
  readonly tags?: ReadonlyArray<string>;
}

// Example valid monster configurations for testing
export const exampleMonsterConfigs: MonsterConfig[] = [
  {
    id: "goblin_warrior",
    name: "Goblin Warrior",
    type: "monster",
    description: "A scrappy melee fighter with crude weapons but fierce determination",
    stats: {
      maxHp: 45,
      baseArmor: 1,
      baseDamage: 14,
      movementRange: 3
    },
    abilities: [
      {
        id: "club_smash",
        name: "Club Smash",
        type: "attack",
        description: "A powerful overhead swing with a crude club",
        damage: 18,
        range: 1,
        cooldown: 2,
        targetType: "enemy",
        aiPriority: 7
      }
    ],
    aiType: "aggressive",
    difficulty: 2,
    tags: ["humanoid"]
  },
  {
    id: "ancient_dragon",
    name: "Ancient Dragon",
    type: "monster",
    description: "A legendary wyrm of immense power and cunning",
    stats: {
      maxHp: 400,
      baseArmor: 8,
      baseDamage: 50,
      movementRange: 6,
      criticalChance: 0.25,
      criticalMultiplier: 2.5,
      resistances: {
        fire: 1.0,
        ice: 0.5
      },
      vulnerabilities: {
        lightning: 1.5
      }
    },
    abilities: [
      {
        id: "fire_breath",
        name: "Fire Breath",
        type: "attack",
        description: "Devastating breath weapon that incinerates multiple foes",
        damage: 60,
        range: 5,
        cooldown: 3,
        targetType: "area",
        statusEffects: [
          {
            effectName: "burning",
            duration: 3,
            value: 15,
            chance: 0.8
          }
        ],
        aiPriority: 9
      }
    ],
    aiType: "tactical",
    aiConfig: {
      aggressionLevel: 8,
      intelligenceLevel: 9,
      selfPreservation: 6,
      teamwork: 3,
      rangePreference: "ranged",
      targetPriority: "highest_threat"
    },
    difficulty: 10,
    loot: {
      experience: 500,
      gold: { min: 100, max: 200 }
    },
    tags: ["boss", "elemental", "fire", "flying"]
  }
];