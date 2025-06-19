/**
 * @fileoverview Clean player stats management following naming conventions
 * Handles HP, armor, damage calculation, and level progression
 *
 * @file server/src/core/player/PlayerStatsManager.ts
 */

import type {
  PlayerStats,
  PlayerLevel,
  DamageResult,
  HealResult,
} from '@/core/types/playerTypes.js';

// === CONSTANTS ===

const DEFAULT_STATS: PlayerStats = {
  maxHp: 100,
  baseArmor: 0,
  baseDamage: 10,
  movementRange: 3,
} as const;

const ARMOR_REDUCTION_RATE = 0.1;
const MAX_ARMOR_REDUCTION = 0.9;
const LEVEL_XP_MULTIPLIER = 100;
const DAMAGE_MODIFIER_PER_LEVEL = 0.1;

// === STATS MANAGER ===

/**
 * Manages player combat stats with clean naming
 */
export class EntityStatsManager {
  private readonly _baseStats: PlayerStats;
  private _currentHp: number;
  private _temporaryArmor: number = 0;
  private _damageModifier: number = 1.0;
  private _level: number = 1;
  private _experience: number = 0;

  constructor(baseStats: PlayerStats = DEFAULT_STATS) {
    this._baseStats = { ...baseStats };
    this._currentHp = baseStats.maxHp;
  }

  // === GETTERS ===

  public get baseStats(): PlayerStats {
    return { ...this._baseStats };
  }

  public get currentHp(): number {
    return this._currentHp;
  }

  public get maxHp(): number {
    return this._baseStats.maxHp;
  }

  public get baseArmor(): number {
    return this._baseStats.baseArmor;
  }

  public get effectiveArmor(): number {
    return this._baseStats.baseArmor + this._temporaryArmor;
  }

  public get baseDamage(): number {
    return this._baseStats.baseDamage;
  }

  public get damageModifier(): number {
    return this._damageModifier;
  }

  public get movementRange(): number {
    return this._baseStats.movementRange;
  }

  public get level(): PlayerLevel {
    const experienceToNext = this.calculateExperienceToNextLevel();
    return {
      current: this._level,
      experience: this._experience,
      experienceToNext,
    };
  }

  public get isAlive(): boolean {
    return this._currentHp > 0;
  }

  public get hpPercentage(): number {
    return this._currentHp / this.maxHp;
  }

  // === HEALTH MANAGEMENT ===

  public takeDamage(amount: number, source: string = 'unknown'): DamageResult {
    if (!this.isAlive) {
      return { damageDealt: 0, blocked: 0, died: false };
    }

    const armorReduction = this.calculateArmorReduction(amount, this.effectiveArmor);
    const damageAfterArmor = Math.max(1, amount - armorReduction);

    const oldHp = this._currentHp;
    this._currentHp = Math.max(0, this._currentHp - damageAfterArmor);
    const actualDamage = oldHp - this._currentHp;
    const died = this._currentHp === 0;

    return {
      damageDealt: actualDamage,
      blocked: armorReduction,
      died,
    };
  }

  public heal(amount: number): HealResult {
    if (!this.isAlive) {
      return { amountHealed: 0, newHp: this._currentHp };
    }

    const oldHp = this._currentHp;

    this._currentHp = Math.min(this.maxHp, this._currentHp + amount);
    const actualHealing = this._currentHp - oldHp;
    return {
      amountHealed: actualHealing,
      newHp: this._currentHp,
    };
  }

  public setHp(newHp: number): void {
    this._currentHp = Math.max(0, Math.min(this.maxHp, newHp));
  }

  public isAtFullHealth(): boolean {
    return this._currentHp === this.maxHp;
  }

  public isCriticallyWounded(threshold: number = 0.25): boolean {
    return this.hpPercentage <= threshold;
  }

  // === ARMOR MANAGEMENT ===

  public addTemporaryArmor(amount: number): void {
    this._temporaryArmor += Math.max(0, amount);
  }

  public removeTemporaryArmor(amount: number): void {
    this._temporaryArmor = Math.max(0, this._temporaryArmor - amount);
  }

  public clearTemporaryArmor(): void {
    this._temporaryArmor = 0;
  }

  // === DAMAGE CALCULATION ===

  public calculateDamageOutput(baseDamage: number = this.baseDamage): number {
    return Math.floor(baseDamage * this._damageModifier);
  }

  public setDamageModifier(modifier: number): void {
    this._damageModifier = Math.max(0.1, modifier);
  }

  // === LEVEL PROGRESSION ===

  public addExperience(amount: number): {
    leveledUp: boolean;
    newLevel?: number;
    benefitsGained?: string[];
  } {
    if (amount <= 0) {
      return { leveledUp: false };
    }

    this._experience += amount;
    const requiredXp = this.calculateExperienceToNextLevel();

    if (this._experience >= requiredXp) {
      return this.processLevelUp();
    }

    return { leveledUp: false };
  }

  // === UTILITY ===

  public resetToStartingStats(): void {
    this._currentHp = this.maxHp;
    this._temporaryArmor = 0;
    this._damageModifier = 1.0;
    this._level = 1;
    this._experience = 0;
  }

  public getCombatReadiness(): {
    healthStatus: 'critical' | 'wounded' | 'healthy';
    armorStatus: 'none' | 'light' | 'heavy';
    damageStatus: 'weak' | 'normal' | 'enhanced';
  } {
    // Health status
    let healthStatus: 'critical' | 'wounded' | 'healthy';
    if (this.hpPercentage <= 0.25) {
      healthStatus = 'critical';
    } else if (this.hpPercentage <= 0.6) {
      healthStatus = 'wounded';
    } else {
      healthStatus = 'healthy';
    }

    // Armor status
    let armorStatus: 'none' | 'light' | 'heavy';
    const armor = this.effectiveArmor;
    if (armor === 0) {
      armorStatus = 'none';
    } else if (armor <= 3) {
      armorStatus = 'light';
    } else {
      armorStatus = 'heavy';
    }

    // Damage status
    let damageStatus: 'weak' | 'normal' | 'enhanced';
    if (this._damageModifier < 1.0) {
      damageStatus = 'weak';
    } else if (this._damageModifier > 1.2) {
      damageStatus = 'enhanced';
    } else {
      damageStatus = 'normal';
    }

    return { healthStatus, armorStatus, damageStatus };
  }

  // === PRIVATE HELPERS ===

  private calculateArmorReduction(damage: number, armor: number): number {
    if (armor <= 0) {
      return 0;
    }

    const reductionPercent = Math.min(MAX_ARMOR_REDUCTION, armor * ARMOR_REDUCTION_RATE);
    return Math.floor(damage * reductionPercent);
  }

  private processLevelUp(): { leveledUp: true; newLevel: number; benefitsGained: string[] } {
    const oldLevel = this._level;
    this._level++;

    const requiredXp = this.calculateExperienceForLevel(oldLevel);
    this._experience -= requiredXp;

    const benefitsGained = this.applyLevelBenefits();

    return {
      leveledUp: true,
      newLevel: this._level,
      benefitsGained,
    };
  }

  private applyLevelBenefits(): string[] {
    const benefits: string[] = [];

    this._damageModifier += DAMAGE_MODIFIER_PER_LEVEL;
    benefits.push(`Damage increased to ${(this._damageModifier * 100).toFixed(0)}%`);

    if (!this.isAtFullHealth()) {
      this._currentHp = this.maxHp;
      benefits.push('Fully healed');
    }

    return benefits;
  }

  private calculateExperienceToNextLevel(): number {
    return this.calculateExperienceForLevel(this._level);
  }

  private calculateExperienceForLevel(level: number): number {
    return level * LEVEL_XP_MULTIPLIER;
  }
}
