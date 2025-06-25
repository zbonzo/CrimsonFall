/**
 * @fileoverview Runtime configuration validation system
 * Validates configuration files using JSON Schema with helpful error messages
 *
 * @file tests/config/validation.ts
 */

import Ajv, { type JSONSchemaType, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { abilityConfigSchema, type AbilityConfig } from './schemas/abilitySchema.js';
import { monsterConfigSchema, type MonsterConfig } from './schemas/monsterSchema.js';

// === VALIDATION RESULT TYPES ===

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ErrorObject[];
  readonly formatted: string | null;
  readonly summary: string;
}

export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly value: any;
  readonly constraint: string;
}

// === AJV SETUP ===

const ajv = new Ajv({ 
  allErrors: true,
  verbose: true,
  strict: false,
  removeAdditional: false
});

// Add format validators
addFormats(ajv);

// Compile schemas
const validateAbilityConfig = ajv.compile(abilityConfigSchema);
const validateMonsterConfig = ajv.compile(monsterConfigSchema);

// === VALIDATION FUNCTIONS ===

/**
 * Validates an ability configuration object
 */
export function validateAbilityConfiguration(config: unknown): ValidationResult {
  const valid = validateAbilityConfig(config);
  const errors = validateAbilityConfig.errors || [];
  
  return {
    valid,
    errors,
    formatted: valid ? null : formatValidationErrors(errors),
    summary: valid ? 
      'Ability configuration is valid' : 
      `Ability configuration has ${errors.length} error(s)`
  };
}

/**
 * Validates a monster configuration object
 */
export function validateMonsterConfiguration(config: unknown): ValidationResult {
  const valid = validateMonsterConfig(config);
  const errors = validateMonsterConfig.errors || [];
  
  return {
    valid,
    errors,
    formatted: valid ? null : formatValidationErrors(errors),
    summary: valid ? 
      'Monster configuration is valid' : 
      `Monster configuration has ${errors.length} error(s)`
  };
}

/**
 * Validates multiple ability configurations
 */
export function validateAbilityConfigurations(configs: unknown[]): ValidationResult[] {
  return configs.map((config, index) => {
    const result = validateAbilityConfiguration(config);
    return {
      ...result,
      summary: `Ability #${index + 1}: ${result.summary}`,
      formatted: result.formatted ? `Ability #${index + 1}:\n${result.formatted}` : null
    };
  });
}

/**
 * Validates multiple monster configurations
 */
export function validateMonsterConfigurations(configs: unknown[]): ValidationResult[] {
  return configs.map((config, index) => {
    const result = validateMonsterConfiguration(config);
    return {
      ...result,
      summary: `Monster #${index + 1}: ${result.summary}`,
      formatted: result.formatted ? `Monster #${index + 1}:\n${result.formatted}` : null
    };
  });
}

// === ERROR FORMATTING ===

/**
 * Formats validation errors into human-readable messages
 */
export function formatValidationErrors(errors: ErrorObject[]): string {
  if (errors.length === 0) return '';

  const formattedErrors = errors.map(formatSingleError);
  const groupedErrors = groupErrorsByPath(formattedErrors);
  
  return Object.entries(groupedErrors)
    .map(([path, pathErrors]) => {
      const pathDisplay = path || 'root';
      const errorList = pathErrors.map(err => `  • ${err.message}`).join('\n');
      return `${pathDisplay}:\n${errorList}`;
    })
    .join('\n\n');
}

/**
 * Formats a single validation error
 */
function formatSingleError(error: ErrorObject): ValidationError {
  const path = error.instancePath || error.schemaPath;
  const value = error.data;
  
  let message = '';
  let constraint = '';
  
  switch (error.keyword) {
    case 'required':
      message = `Missing required property: ${error.params?.missingProperty}`;
      constraint = 'required';
      break;
      
    case 'type':
      message = `Expected ${error.params?.type}, got ${typeof value}`;
      constraint = 'type';
      break;
      
    case 'enum':
      message = `Value must be one of: ${error.params?.allowedValues?.join(', ')}`;
      constraint = 'enum';
      break;
      
    case 'minimum':
      message = `Value ${value} is below minimum ${error.params?.limit}`;
      constraint = 'minimum';
      break;
      
    case 'maximum':
      message = `Value ${value} exceeds maximum ${error.params?.limit}`;
      constraint = 'maximum';
      break;
      
    case 'minLength':
      message = `String is too short (${(value as string)?.length || 0} < ${error.params?.limit})`;
      constraint = 'minLength';
      break;
      
    case 'maxLength':
      message = `String is too long (${(value as string)?.length || 0} > ${error.params?.limit})`;
      constraint = 'maxLength';
      break;
      
    case 'pattern':
      message = `String does not match required pattern: ${error.params?.pattern}`;
      constraint = 'pattern';
      break;
      
    case 'additionalProperties':
      message = `Unexpected property: ${error.params?.additionalProperty}`;
      constraint = 'additionalProperties';
      break;
      
    case 'const':
      message = `Value must be exactly: ${error.params?.allowedValue}`;
      constraint = 'const';
      break;
      
    case 'maxItems':
      message = `Array has too many items (${(value as any[])?.length || 0} > ${error.params?.limit})`;
      constraint = 'maxItems';
      break;
      
    case 'minItems':
      message = `Array has too few items (${(value as any[])?.length || 0} < ${error.params?.limit})`;
      constraint = 'minItems';
      break;
      
    default:
      message = error.message || 'Validation failed';
      constraint = error.keyword;
  }
  
  return {
    path,
    message,
    value,
    constraint
  };
}

/**
 * Groups errors by their path for better organization
 */
function groupErrorsByPath(errors: ValidationError[]): Record<string, ValidationError[]> {
  const grouped: Record<string, ValidationError[]> = {};
  
  for (const error of errors) {
    const path = error.path || 'root';
    if (!grouped[path]) {
      grouped[path] = [];
    }
    grouped[path]!.push(error);
  }
  
  return grouped;
}

// === SPECIFIC VALIDATION HELPERS ===

/**
 * Validates ability configuration with game-specific rules
 */
export function validateAbilityGameRules(config: AbilityConfig): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Damage abilities should have reasonable damage values
  if (config.type === 'attack' && config.damage) {
    if (config.damage > config.range * 20) {
      errors.push({
        path: 'damage',
        message: 'Damage seems too high for the ability range (may be overpowered)',
        value: config.damage,
        constraint: 'game_balance'
      });
    }
  }
  
  // Healing abilities should not be too powerful
  if (config.type === 'healing' && config.healing) {
    if (config.healing > 50 && config.cooldown === 0) {
      errors.push({
        path: 'healing',
        message: 'High healing with no cooldown may be overpowered',
        value: config.healing,
        constraint: 'game_balance'
      });
    }
  }
  
  // Area abilities should have limited range
  if (config.targetType === 'area' && config.range > 5) {
    errors.push({
      path: 'range',
      message: 'Area abilities with long range may be overpowered',
      value: config.range,
      constraint: 'game_balance'
    });
  }
  
  // Status effects should have reasonable durations
  if (config.statusEffects) {
    for (const effect of config.statusEffects) {
      if (effect.duration > 5 && effect.value && effect.value > 10) {
        errors.push({
          path: `statusEffects[${effect.effectName}]`,
          message: 'Long duration with high value may be overpowered',
          value: effect,
          constraint: 'game_balance'
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors as any[], // Type conversion for compatibility
    formatted: errors.length > 0 ? formatValidationErrors(errors as any[]) : null,
    summary: errors.length === 0 ? 
      'Ability passes game balance checks' : 
      `Ability has ${errors.length} balance concern(s)`
  };
}

/**
 * Validates monster configuration with game-specific rules
 */
export function validateMonsterGameRules(config: MonsterConfig): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Difficulty should match stats
  const expectedDifficulty = estimateMonsterDifficulty(config);
  if (Math.abs(config.difficulty - expectedDifficulty) > 2) {
    errors.push({
      path: 'difficulty',
      message: `Difficulty rating ${config.difficulty} doesn't match estimated difficulty ${expectedDifficulty}`,
      value: config.difficulty,
      constraint: 'game_balance'
    });
  }
  
  // Boss monsters should have sufficient HP
  if (config.tags?.includes('boss') && config.stats.maxHp < 150) {
    errors.push({
      path: 'stats.maxHp',
      message: 'Boss monsters should have at least 150 HP',
      value: config.stats.maxHp,
      constraint: 'game_balance'
    });
  }
  
  // Swarm monsters should have low individual power
  if (config.tags?.includes('swarm')) {
    if (config.stats.maxHp > 30 || config.stats.baseDamage > 10) {
      errors.push({
        path: 'stats',
        message: 'Swarm monsters should have low individual stats',
        value: config.stats,
        constraint: 'game_balance'
      });
    }
  }
  
  // AI type should match abilities
  if (config.aiType === 'support' && !config.abilities?.some(a => a.type === 'healing' || a.type === 'support')) {
    errors.push({
      path: 'aiType',
      message: 'Support AI type should have support or healing abilities',
      value: config.aiType,
      constraint: 'game_logic'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors as any[],
    formatted: errors.length > 0 ? formatValidationErrors(errors as any[]) : null,
    summary: errors.length === 0 ? 
      'Monster passes game balance checks' : 
      `Monster has ${errors.length} balance concern(s)`
  };
}

/**
 * Estimates monster difficulty based on stats
 */
function estimateMonsterDifficulty(config: MonsterConfig): number {
  const { maxHp, baseArmor, baseDamage, movementRange } = config.stats;
  
  // Simple difficulty estimation formula
  const hpFactor = maxHp / 50; // 50 HP = 1 point
  const armorFactor = baseArmor * 0.5; // 2 armor = 1 point
  const damageFactor = baseDamage / 15; // 15 damage = 1 point
  const mobilityFactor = movementRange * 0.2; // 5 movement = 1 point
  const abilityFactor = (config.abilities?.length || 0) * 0.5; // 2 abilities = 1 point
  
  const estimatedDifficulty = hpFactor + armorFactor + damageFactor + mobilityFactor + abilityFactor;
  
  return Math.max(1, Math.min(10, Math.round(estimatedDifficulty)));
}

// === BATCH VALIDATION ===

/**
 * Validates an entire configuration directory
 */
export interface BatchValidationResult {
  readonly totalFiles: number;
  readonly validFiles: number;
  readonly invalidFiles: number;
  readonly results: Array<{
    readonly filename: string;
    readonly type: 'ability' | 'monster';
    readonly validation: ValidationResult;
    readonly gameRules?: ValidationResult;
  }>;
  readonly summary: string;
}

/**
 * Validates multiple configuration files
 */
export function validateConfigurationBatch(
  files: Array<{ filename: string; type: 'ability' | 'monster'; content: unknown }>
): BatchValidationResult {
  const results = files.map(file => {
    const validation = file.type === 'ability' ? 
      validateAbilityConfiguration(file.content) :
      validateMonsterConfiguration(file.content);
      
    let gameRules: ValidationResult | undefined;
    
    if (validation.valid) {
      gameRules = file.type === 'ability' ?
        validateAbilityGameRules(file.content as AbilityConfig) :
        validateMonsterGameRules(file.content as MonsterConfig);
    }
    
    return {
      filename: file.filename,
      type: file.type,
      validation,
      gameRules
    };
  });
  
  const validFiles = results.filter(r => r.validation.valid && (!r.gameRules || r.gameRules.valid)).length;
  const invalidFiles = results.length - validFiles;
  
  return {
    totalFiles: results.length,
    validFiles,
    invalidFiles,
    results,
    summary: `Validated ${results.length} files: ${validFiles} valid, ${invalidFiles} invalid`
  };
}

// === TEST UTILITIES ===

/**
 * Creates a validation result for testing
 */
export function createTestValidationResult(
  valid: boolean,
  errorMessages: string[] = []
): ValidationResult {
  const errors: ErrorObject[] = errorMessages.map((message, index) => ({
    instancePath: `/test/${index}`,
    schemaPath: '#/test',
    keyword: 'test',
    params: {},
    message,
    data: null,
    parentSchema: {},
    schema: {}
  }));
  
  return {
    valid,
    errors,
    formatted: valid ? null : errorMessages.join('\n'),
    summary: valid ? 'Valid' : `${errorMessages.length} error(s)`
  };
}

/**
 * Validates that a configuration object matches expected type structure
 */
export function validateConfigurationStructure(
  config: unknown,
  expectedType: 'ability' | 'monster'
): boolean {
  if (!config || typeof config !== 'object') return false;
  
  const obj = config as Record<string, any>;
  
  // Check common required fields
  if (!obj.id || !obj.name || !obj.type) return false;
  
  if (expectedType === 'ability') {
    return obj.type !== 'monster' && typeof obj.range === 'number';
  } else {
    return obj.type === 'monster' && obj.stats && typeof obj.stats.maxHp === 'number';
  }
}