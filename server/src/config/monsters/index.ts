/**
 * @fileoverview Monster configuration loader and manager
 * Loads, validates, and provides access to monster definitions from JSON files
 * Integrates with the new validation system and supports hot reloading
 *
 * @file server/src/config/monsters/index.ts
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { MonsterDefinition } from '@/core/types/entityTypes.js';

// Import validation from tests for comprehensive validation
type MonsterConfig = {
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
  }>;
  readonly aiType: 'aggressive' | 'defensive' | 'tactical' | 'berserker' | 'support' | 'passive';
  readonly difficulty: number;
  readonly tags?: ReadonlyArray<string>;
};

type ValidationResult = {
  readonly valid: boolean;
  readonly errors: any[];
  readonly formatted: string | null;
  readonly summary: string;
};

export interface LoadedMonsterConfig extends MonsterConfig {
  readonly sourceFile: string;
  readonly loadedAt: Date;
}

export interface MonsterConfigLoadResult {
  readonly success: boolean;
  readonly config?: LoadedMonsterConfig;
  readonly validation?: ValidationResult;
  readonly error?: string;
}

// Legacy interface for backward compatibility
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

// === ENHANCED MONSTER CONFIG LOADER ===

export class MonsterConfigLoader {
  private static loadedConfigs: Map<string, LoadedMonsterConfig> = new Map();
  private static loadResults: Map<string, MonsterConfigLoadResult> = new Map();
  private static lastLoadTime: Date = new Date(0);
  private static configsPath: string = __dirname;

  /**
   * Sets the configuration directory path
   */
  public static setConfigPath(path: string): void {
    this.configsPath = path;
    this.clearCache();
  }

  /**
   * Loads all monster configurations from JSON files
   */
  public static async loadAllConfigs(forceReload: boolean = false): Promise<Map<string, LoadedMonsterConfig>> {
    if (!forceReload && this.isRecentlyLoaded()) {
      return this.loadedConfigs;
    }

    try {
      const files = await this.findConfigFiles();
      this.loadedConfigs.clear();
      this.loadResults.clear();

      // Load each configuration file
      for (const file of files) {
        const result = await this.loadConfigFile(file);
        this.loadResults.set(file, result);

        if (result.success && result.config) {
          this.loadedConfigs.set(result.config.id, result.config);
        }
      }

      this.lastLoadTime = new Date();
      return this.loadedConfigs;

    } catch (error) {
      console.error('Failed to load monster configurations:', error);
      throw new Error(`Failed to load monster configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads a monster configuration by ID (enhanced version)
   */
  public static async loadMonsterConfig(monsterId: string): Promise<LoadedMonsterConfig> {
    await this.loadAllConfigs();
    
    const config = this.loadedConfigs.get(monsterId);
    if (config) {
      return config;
    }

    // Fallback to hardcoded config for backward compatibility
    try {
      const legacyConfig = await this.getHardcodedConfig(monsterId);
      const convertedConfig = this.convertLegacyConfig(legacyConfig);
      this.loadedConfigs.set(monsterId, convertedConfig);
      return convertedConfig;
    } catch (error) {
      throw new Error(`Monster configuration not found: ${monsterId}`);
    }
  }

  /**
   * Gets all valid monster configurations
   */
  public static async getValidConfigs(): Promise<ReadonlyArray<LoadedMonsterConfig>> {
    await this.loadAllConfigs();
    return Array.from(this.loadedConfigs.values());
  }

  /**
   * Gets monster configurations by difficulty range
   */
  public static async getConfigsByDifficulty(
    minDifficulty: number = 1,
    maxDifficulty: number = 10
  ): Promise<ReadonlyArray<LoadedMonsterConfig>> {
    const configs = await this.getValidConfigs();
    return configs.filter(config => 
      config.difficulty >= minDifficulty && config.difficulty <= maxDifficulty
    );
  }

  /**
   * Gets monster configurations by AI type
   */
  public static async getConfigsByAIType(
    aiType: MonsterConfig['aiType']
  ): Promise<ReadonlyArray<LoadedMonsterConfig>> {
    const configs = await this.getValidConfigs();
    return configs.filter(config => config.aiType === aiType);
  }

  /**
   * Gets monster configurations by tags
   */
  public static async getConfigsByTags(
    tags: string[],
    matchAll: boolean = false
  ): Promise<ReadonlyArray<LoadedMonsterConfig>> {
    const configs = await this.getValidConfigs();
    return configs.filter(config => {
      if (!config.tags) return false;
      
      if (matchAll) {
        return tags.every(tag => config.tags!.includes(tag));
      } else {
        return tags.some(tag => config.tags!.includes(tag));
      }
    });
  }

  /**
   * Validates a monster configuration (basic validation)
   */
  public static validateMonsterConfig(config: any): config is MonsterConfig {
    if (!config || typeof config !== 'object') return false;
    
    const requiredFields = ['id', 'name', 'type', 'stats', 'aiType', 'difficulty'];
    const hasRequiredFields = requiredFields.every(field => config[field] !== undefined);
    
    if (!hasRequiredFields) return false;
    
    // Validate stats structure
    const stats = config.stats;
    if (!stats || typeof stats !== 'object') return false;
    
    const requiredStats = ['maxHp', 'baseArmor', 'baseDamage', 'movementRange'];
    const hasRequiredStats = requiredStats.every(stat => 
      typeof stats[stat] === 'number' && stats[stat] >= 0
    );
    
    return hasRequiredStats;
  }

  /**
   * Converts new config format to legacy MonsterDefinition
   */
  public static convertToDefinition(config: LoadedMonsterConfig): MonsterDefinition {
    return {
      id: config.id,
      name: config.name,
      variant: 'monster',
      description: config.description || '',
      stats: {
        maxHp: config.stats.maxHp,
        baseArmor: config.stats.baseArmor,
        baseDamage: config.stats.baseDamage,
        movementRange: config.stats.movementRange,
      },
      abilities: config.abilities?.map(ability => ({
        id: ability.id,
        name: ability.name,
        variant: ability.type as any,
        damage: ability.damage,
        healing: ability.healing,
        range: ability.range,
        cooldown: ability.cooldown || 0,
        description: ability.description || '',
        targetType: ability.targetType as any,
        statusEffects: ability.statusEffects?.map(effect => ({
          effectName: effect.effectName,
          duration: effect.duration,
          value: effect.value,
          chance: effect.chance || 1.0,
        })) || [],
      })) || [],
      aiVariant: config.aiType as any,
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
      difficulty: config.difficulty,
      behaviors: [],
      lootTable: [],
      tags: config.tags ? Array.from(config.tags) : [],
    };
  }

  /**
   * Gets load statistics and results
   */
  public static getLoadStatistics(): {
    totalConfigs: number;
    validConfigs: number;
    failedLoads: number;
    lastLoadTime: Date;
    byDifficulty: Record<number, number>;
    byAIType: Record<string, number>;
  } {
    const validConfigs = Array.from(this.loadedConfigs.values());
    const failedLoads = Array.from(this.loadResults.values()).filter(r => !r.success).length;
    
    const byDifficulty: Record<number, number> = {};
    const byAIType: Record<string, number> = {};
    
    for (const config of validConfigs) {
      byDifficulty[config.difficulty] = (byDifficulty[config.difficulty] || 0) + 1;
      byAIType[config.aiType] = (byAIType[config.aiType] || 0) + 1;
    }
    
    return {
      totalConfigs: this.loadResults.size,
      validConfigs: validConfigs.length,
      failedLoads,
      lastLoadTime: this.lastLoadTime,
      byDifficulty,
      byAIType,
    };
  }

  /**
   * Clears the configuration cache
   */
  public static clearCache(): void {
    this.loadedConfigs.clear();
    this.loadResults.clear();
    this.lastLoadTime = new Date(0);
  }

  // === PRIVATE METHODS ===

  private static async findConfigFiles(): Promise<string[]> {
    try {
      const allFiles: string[] = [];
      
      // Check all subdirectories (common, rare, legendary)
      const directories = ['common', 'rare', 'legendary'];
      
      for (const dir of directories) {
        try {
          const dirPath = join(this.configsPath, dir);
          const entries = await readdir(dirPath, { withFileTypes: true });
          const jsonFiles = entries
            .filter(entry => entry.isFile() && extname(entry.name) === '.json')
            .map(entry => join(dir, entry.name));
          allFiles.push(...jsonFiles);
        } catch (error) {
          // Directory might not exist, continue
          console.warn(`Directory ${dir} not found or inaccessible`);
        }
      }
      
      return allFiles.sort();
    } catch (error) {
      throw new Error(`Failed to read config directories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async loadConfigFile(filename: string): Promise<MonsterConfigLoadResult> {
    try {
      const filePath = join(this.configsPath, filename);
      const fileContent = await readFile(filePath, 'utf-8');
      
      let parsedConfig: unknown;
      try {
        parsedConfig = JSON.parse(fileContent);
      } catch (parseError) {
        return {
          success: false,
          error: `JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`
        };
      }

      // Basic validation
      if (!this.validateMonsterConfig(parsedConfig)) {
        return {
          success: false,
          error: 'Configuration does not match required schema'
        };
      }

      const loadedConfig: LoadedMonsterConfig = {
        ...(parsedConfig as MonsterConfig),
        sourceFile: filename,
        loadedAt: new Date()
      };

      return {
        success: true,
        config: loadedConfig
      };

    } catch (error) {
      return {
        success: false,
        error: `File loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static isRecentlyLoaded(): boolean {
    const timeSinceLoad = Date.now() - this.lastLoadTime.getTime();
    return timeSinceLoad < 30000; // 30 seconds cache
  }

  private static convertLegacyConfig(legacy: MonsterConfigData): LoadedMonsterConfig {
    return {
      id: legacy.id,
      name: legacy.name,
      type: 'monster',
      description: legacy.description,
      stats: legacy.stats,
      abilities: legacy.abilities?.map(ability => ({
        id: ability.id,
        name: ability.name,
        type: ability.variant === 'attack' ? 'attack' : 'support',
        damage: ability.damage,
        healing: ability.healing,
        range: ability.range,
        cooldown: ability.cooldown,
        description: ability.description,
        targetType: ability.targetType || 'enemy',
      })) || [],
      aiType: legacy.aiType as MonsterConfig['aiType'],
      difficulty: legacy.difficulty,
      tags: legacy.tags || [],
      sourceFile: 'hardcoded',
      loadedAt: new Date(),
    };
  }

  private static async getHardcodedConfig(monsterId: string): Promise<MonsterConfigData> {
    const configs: Record<string, MonsterConfigData> = {
      'goblin_warrior': {
        id: 'goblin_warrior',
        name: 'Goblin Warrior',
        type: 'monster',
        description: 'A fierce goblin warrior with crude weapons',
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
            description: 'A basic melee attack with a rusty weapon',
            targetType: 'enemy',
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
        difficulty: 2,
      },
    };

    const config = configs[monsterId];
    if (!config) {
      throw new Error(`No hardcoded configuration found for monster: ${monsterId}`);
    }

    return config;
  }
}

// === CONVENIENCE FUNCTIONS ===

/**
 * Loads a monster configuration by ID (convenience function)
 */
export async function loadMonsterConfig(monsterId: string): Promise<LoadedMonsterConfig> {
  return MonsterConfigLoader.loadMonsterConfig(monsterId);
}

/**
 * Loads all valid monster configurations (convenience function)
 */
export async function loadAllMonsterConfigs(): Promise<ReadonlyArray<LoadedMonsterConfig>> {
  return MonsterConfigLoader.getValidConfigs();
}

/**
 * Loads monster configurations for an encounter (convenience function)
 */
export async function loadEncounterMonsters(criteria: {
  difficulty?: { min: number; max: number };
  aiTypes?: MonsterConfig['aiType'][];
  tags?: string[];
  count?: number;
}): Promise<ReadonlyArray<LoadedMonsterConfig>> {
  let configs = await MonsterConfigLoader.getValidConfigs();

  if (criteria.difficulty) {
    configs = configs.filter(config => 
      config.difficulty >= criteria.difficulty!.min && 
      config.difficulty <= criteria.difficulty!.max
    );
  }

  if (criteria.aiTypes) {
    configs = configs.filter(config => 
      criteria.aiTypes!.includes(config.aiType)
    );
  }

  if (criteria.tags) {
    configs = configs.filter(config => 
      config.tags && criteria.tags!.some(tag => config.tags!.includes(tag))
    );
  }

  if (criteria.count && criteria.count > 0) {
    configs = configs.slice(0, criteria.count);
  }

  return configs;
}

// Export types and default
export { MonsterConfigLoader as default, type MonsterConfig, type ValidationResult };
export type { LoadedMonsterConfig, MonsterConfigLoadResult };
