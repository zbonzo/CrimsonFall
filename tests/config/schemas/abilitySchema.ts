/**
 * @fileoverview JSON Schema for ability configuration validation
 * Validates ability definition files for type safety and correctness
 *
 * @file tests/config/schemas/abilitySchema.ts
 */

export const abilityConfigSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://crimsonfall.com/schemas/ability.json",
  title: "Ability Configuration",
  description: "Schema for validating ability definition files",
  type: "object",
  required: ["id", "name", "type", "range"],
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
      pattern: "^[a-z][a-z0-9_]*$",
      minLength: 1,
      maxLength: 50,
      description: "Unique identifier for the ability (snake_case)"
    },
    name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Human-readable name of the ability"
    },
    type: {
      enum: ["attack", "healing", "support", "movement"],
      description: "The primary type/category of the ability"
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      description: "Detailed description of what the ability does"
    },
    damage: {
      type: "number",
      minimum: 0,
      maximum: 1000,
      description: "Base damage dealt by the ability (if applicable)"
    },
    healing: {
      type: "number",
      minimum: 0,
      maximum: 1000,
      description: "Base healing provided by the ability (if applicable)"
    },
    range: {
      type: "number",
      minimum: 0,
      maximum: 20,
      description: "Maximum range of the ability in hex tiles"
    },
    cooldown: {
      type: "number",
      minimum: 0,
      maximum: 10,
      description: "Number of rounds before ability can be used again"
    },
    targetType: {
      enum: ["self", "ally", "enemy", "any", "area", "position"],
      description: "What types of targets this ability can affect"
    },
    statusEffects: {
      type: "array",
      maxItems: 5,
      description: "Status effects applied by this ability",
      items: {
        type: "object",
        required: ["effectName", "duration"],
        additionalProperties: false,
        properties: {
          effectName: {
            type: "string",
            enum: [
              "poison", "burning", "frozen", "stunned", "weakened", 
              "vulnerable", "blessed", "shielded", "enraged", 
              "regeneration", "invisible"
            ],
            description: "Name of the status effect to apply"
          },
          duration: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "Number of rounds the effect lasts"
          },
          value: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Numeric value associated with the effect (damage, healing, etc.)"
          },
          chance: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Probability (0-1) that the effect will be applied"
          }
        }
      }
    },
    manaCost: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Mana or resource cost to use the ability"
    },
    usesPerEncounter: {
      type: "number",
      minimum: 1,
      maximum: 10,
      description: "Maximum number of times this ability can be used per encounter"
    },
    areaOfEffect: {
      type: "object",
      description: "Area of effect properties for abilities that affect multiple targets",
      additionalProperties: false,
      properties: {
        shape: {
          enum: ["circle", "line", "cone", "adjacent"],
          description: "Shape of the area of effect"
        },
        size: {
          type: "number",
          minimum: 1,
          maximum: 10,
          description: "Size/radius of the area of effect"
        },
        piercing: {
          type: "boolean",
          description: "Whether the effect passes through obstacles"
        }
      },
      required: ["shape", "size"]
    },
    requirements: {
      type: "object",
      description: "Requirements that must be met to use this ability",
      additionalProperties: false,
      properties: {
        minLevel: {
          type: "number",
          minimum: 1,
          maximum: 20,
          description: "Minimum character level required"
        },
        requiredClass: {
          type: "string",
          description: "Character class required to use this ability"
        },
        requiredStatusEffect: {
          type: "string",
          description: "Status effect that must be active to use this ability"
        },
        prohibitedStatusEffects: {
          type: "array",
          items: { type: "string" },
          description: "Status effects that prevent using this ability"
        }
      }
    },
    scaling: {
      type: "object",
      description: "How the ability scales with character attributes",
      additionalProperties: false,
      properties: {
        damageScaling: {
          type: "number",
          minimum: 0,
          maximum: 3,
          description: "Multiplier for damage based on character stats"
        },
        healingScaling: {
          type: "number", 
          minimum: 0,
          maximum: 3,
          description: "Multiplier for healing based on character stats"
        },
        rangeScaling: {
          type: "number",
          minimum: 0,
          maximum: 2,
          description: "Additional range per character level"
        }
      }
    },
    animation: {
      type: "object",
      description: "Visual and audio properties for the ability",
      additionalProperties: false,
      properties: {
        duration: {
          type: "number",
          minimum: 0,
          maximum: 5000,
          description: "Animation duration in milliseconds"
        },
        sound: {
          type: "string",
          description: "Sound effect to play when ability is used"
        },
        visual: {
          type: "string",
          description: "Visual effect identifier"
        }
      }
    },
    tags: {
      type: "array",
      maxItems: 10,
      items: {
        type: "string",
        enum: [
          "melee", "ranged", "magic", "physical", "elemental",
          "fire", "ice", "lightning", "poison", "holy",
          "dark", "buff", "debuff", "utility", "ultimate"
        ]
      },
      description: "Categorical tags for the ability"
    }
  },
  
  // Conditional validation rules
  allOf: [
    {
      // Damage abilities should have damage value
      if: {
        properties: { type: { const: "attack" } }
      },
      then: {
        anyOf: [
          { required: ["damage"] },
          { required: ["statusEffects"] }
        ]
      }
    },
    {
      // Healing abilities should have healing value
      if: {
        properties: { type: { const: "healing" } }
      },
      then: {
        required: ["healing"]
      }
    },
    {
      // Area abilities should have area of effect definition
      if: {
        properties: { targetType: { const: "area" } }
      },
      then: {
        required: ["areaOfEffect"]
      }
    },
    {
      // Status effect abilities should have status effects
      if: {
        properties: { type: { const: "support" } }
      },
      then: {
        anyOf: [
          { required: ["statusEffects"] },
          { required: ["healing"] }
        ]
      }
    }
  ]
};

// Type definitions derived from schema
export interface AbilityConfig {
  readonly id: string;
  readonly name: string;
  readonly type: 'attack' | 'healing' | 'support' | 'movement';
  readonly description?: string;
  readonly damage?: number;
  readonly healing?: number;
  readonly range: number;
  readonly cooldown?: number;
  readonly targetType?: 'self' | 'ally' | 'enemy' | 'any' | 'area' | 'position';
  readonly statusEffects?: ReadonlyArray<{
    readonly effectName: string;
    readonly duration: number;
    readonly value?: number;
    readonly chance?: number;
  }>;
  readonly manaCost?: number;
  readonly usesPerEncounter?: number;
  readonly areaOfEffect?: {
    readonly shape: 'circle' | 'line' | 'cone' | 'adjacent';
    readonly size: number;
    readonly piercing?: boolean;
  };
  readonly requirements?: {
    readonly minLevel?: number;
    readonly requiredClass?: string;
    readonly requiredStatusEffect?: string;
    readonly prohibitedStatusEffects?: ReadonlyArray<string>;
  };
  readonly scaling?: {
    readonly damageScaling?: number;
    readonly healingScaling?: number;
    readonly rangeScaling?: number;
  };
  readonly animation?: {
    readonly duration?: number;
    readonly sound?: string;
    readonly visual?: string;
  };
  readonly tags?: ReadonlyArray<string>;
}

// Example valid ability configurations for testing
export const exampleAbilityConfigs: AbilityConfig[] = [
  {
    id: "power_strike",
    name: "Power Strike",
    type: "attack",
    description: "A powerful melee attack that deals extra damage",
    damage: 25,
    range: 1,
    cooldown: 2,
    targetType: "enemy",
    tags: ["melee", "physical"]
  },
  {
    id: "heal_self",
    name: "Heal Self",
    type: "healing",
    description: "Restores health to the caster",
    healing: 25,
    range: 0,
    cooldown: 1,
    targetType: "self",
    tags: ["healing", "utility"]
  },
  {
    id: "poison_dart",
    name: "Poison Dart",
    type: "attack",
    description: "A ranged attack that applies poison",
    damage: 12,
    range: 4,
    cooldown: 0,
    targetType: "enemy",
    statusEffects: [
      {
        effectName: "poison",
        duration: 3,
        value: 5,
        chance: 0.8
      }
    ],
    tags: ["ranged", "poison"]
  },
  {
    id: "fireball",
    name: "Fireball",
    type: "attack",
    description: "An explosive fire attack that damages nearby enemies",
    damage: 30,
    range: 5,
    cooldown: 3,
    targetType: "area",
    areaOfEffect: {
      shape: "circle",
      size: 2,
      piercing: false
    },
    statusEffects: [
      {
        effectName: "burning",
        duration: 2,
        value: 8,
        chance: 0.6
      }
    ],
    manaCost: 15,
    tags: ["ranged", "magic", "fire", "elemental"]
  }
];