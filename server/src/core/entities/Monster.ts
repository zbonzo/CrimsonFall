/**
 * @fileoverview Complete Monster entity implementation
 * Fixed import paths, integrated shared managers, simplified AI integration
 *
 * FIXED: Removed reserved keywords 'type' → 'variant', 'class' → 'specialization'
 * FIXED: Corrected import paths and manager aliases
 *
 * @file server/src/core/entities/Monster.ts
 */

import type {
  AbilityDefinition,
  AbilityUser,
  AIDecision,
  CombatEntity,
  DamageResult,
  HealResult,
  MonsterAIVariant,
  MonsterDefinition,
  MonsterPrivateData,
  MonsterPublicData,
  MovableEntity,
  MovementResult,
  StatusEffect,
  StatusEffectTarget,
  TargetingContext,
  ThreatUpdate,
} from '@/core/types/entityTypes';
import { ORIGIN_HEX, type HexCoordinate } from '@/utils/hex/index.js';

import { MonsterAI } from '@/core/ai/MonsterAI';
// FIXED: Corrected import paths - these managers are shared across entities
import { EntityAbilitiesManager } from '@/core/player/EntityAbilitiesManager';
import { EntityMovementManager } from '@/core/player/EntityMovementManager';
import { EntityStatsManager } from '@/core/player/EntityStatsManager';
import { EntityStatusEffectsManager } from '@/core/player/EntityStatusEffectsManager';
import { ThreatCalculator, ThreatManager } from '@/core/systems/ThreatManager';

export class Monster implements CombatEntity, MovableEntity, AbilityUser, StatusEffectTarget {
  public readonly id: string;
  public readonly name: string;
  public readonly variant: 'monster' = 'monster';
  public readonly aiVariant: MonsterAIVariant;
  public readonly difficulty: number;

  private readonly _definition: MonsterDefinition;
  private readonly _stats: EntityStatsManager;
  private readonly _movement: EntityMovementManager;
  private readonly _abilities: EntityAbilitiesManager;
  private readonly _statusEffects: EntityStatusEffectsManager;
  private readonly _ai: MonsterAI;
  private readonly _threat: ThreatManager;

  private _lastDecision: AIDecision | null = null;
  private _actionHistory: AIDecision[] = [];
  private _roundsActive: number = 0;

  constructor(
    id: string,
    definition: MonsterDefinition,
    startingPosition: HexCoordinate = ORIGIN_HEX
  ) {
    if (!id?.trim()) throw new Error('Monster ID cannot be empty');
    if (!definition) throw new Error('Monster definition is required');

    this.id = id;
    this.name = definition.name;
    this.aiVariant = definition.aiVariant;
    this.difficulty = definition.difficulty;
    this._definition = definition;

    // Initialize shared managers
    this._stats = new EntityStatsManager(definition.stats, false); // Monsters don't level up by default
    this._movement = new EntityMovementManager(startingPosition, definition.stats.movementRange);
    this._abilities = new EntityAbilitiesManager(definition.abilities);
    this._statusEffects = new EntityStatusEffectsManager();

    // Initialize monster-specific systems
    this._ai = new MonsterAI(definition.aiVariant, definition.behaviors || []);
    this._threat = new ThreatManager(definition.threatConfig);
  }

  // === CORE ENTITY INTERFACE ===

  public get position(): HexCoordinate {
    return this._movement.currentPosition;
  }

  public get isAlive(): boolean {
    return this._stats.isAlive;
  }

  public get currentHp(): number {
    return this._stats.currentHp;
  }

  public get maxHp(): number {
    return this._stats.maxHp;
  }

  public get effectiveArmor(): number {
    let armor = this._stats.effectiveArmor;

    // Apply shield status effect
    if (this._statusEffects.hasEffect('shielded')) {
      const shieldEffect = this._statusEffects.getEffect('shielded');
      if (shieldEffect?.value) {
        armor += shieldEffect.value;
      }
    }

    return armor;
  }

  public get level(): number {
    return this._stats.level.current;
  }

  public get movementRange(): number {
    return this._movement.movementRange;
  }

  public get hasMovedThisRound(): boolean {
    return this._movement.hasMovedThisRound;
  }

  // === COMBAT INTERFACE ===

  public takeDamage(amount: number, source: string = 'unknown'): DamageResult {
    if (!this.isAlive) {
      return { damageDealt: 0, blocked: 0, died: false };
    }

    // Apply status effect modifiers to incoming damage
    const damageModifier = this._statusEffects.getDamageTakenModifier();
    const modifiedDamage = Math.floor(amount * damageModifier);

    return this._stats.takeDamage(modifiedDamage, source);
  }

  public heal(amount: number): HealResult {
    if (!this.isAlive) {
      return { amountHealed: 0, newHp: this.currentHp };
    }

    // Apply status effect modifiers to healing
    const healingModifier = this._statusEffects.getHealingModifier();
    const modifiedHealing = Math.floor(amount * healingModifier);

    return this._stats.heal(modifiedHealing);
  }

  public calculateDamageOutput(baseDamage?: number): number {
    // Get base damage from stats
    const damage = this._stats.calculateDamageOutput(baseDamage);

    // Apply status effect modifiers to damage output
    const statusModifier = this._statusEffects.getDamageModifier();

    return Math.floor(damage * statusModifier);
  }

  public canAct(): boolean {
    return this.isAlive && this._statusEffects.canAct();
  }

  public canMove(): boolean {
    return this.isAlive && this._statusEffects.canMove();
  }

  public canBeTargeted(): boolean {
    return this.isAlive && this._statusEffects.canBeTargeted();
  }

  // === MOVEMENT INTERFACE ===

  public moveTo(
    targetPosition: HexCoordinate,
    occupiedPositions: ReadonlySet<string> = new Set(),
    obstacles: ReadonlySet<string> = new Set()
  ): MovementResult {
    if (!this._statusEffects.canMove()) {
      return { success: false, reason: 'Cannot move due to status effects' };
    }
    return this._movement.moveTo(targetPosition, occupiedPositions, obstacles);
  }

  public getReachablePositions(): HexCoordinate[] {
    return this._movement.getReachablePositions();
  }

  public getDistanceTo(targetPosition: HexCoordinate): number {
    return this._movement.getDistanceTo(targetPosition);
  }

  // === ABILITY INTERFACE ===

  public getAbility(abilityId: string): AbilityDefinition | null {
    return this._abilities.getAbility(abilityId);
  }

  public canUseAbility(abilityId: string): { canUse: boolean; reason?: string } {
    return this._abilities.canUseAbility(abilityId);
  }

  public useAbility(abilityId: string): { success: boolean; reason?: string } {
    return this._abilities.useAbility(abilityId);
  }

  public getAvailableAbilities(): ReadonlyArray<AbilityDefinition> {
    return this._abilities.availableAbilities;
  }

  // === STATUS EFFECTS INTERFACE ===

  public addStatusEffect(
    effectName: string,
    duration: number,
    value?: number
  ): { success: boolean; reason?: string } {
    const result = this._statusEffects.addEffect(effectName as any, duration, value);
    return { success: result.success, reason: result.reason };
  }

  public hasStatusEffect(effectName: string): boolean {
    return this._statusEffects.hasEffect(effectName);
  }

  public removeStatusEffect(effectName: string): boolean {
    return this._statusEffects.removeEffect(effectName);
  }

  public get activeStatusEffects(): ReadonlyArray<StatusEffect> {
    return this._statusEffects.effects;
  }

  // === MONSTER-SPECIFIC AI METHODS ===

  public makeDecision(context: TargetingContext): AIDecision {
    if (!this.canAct()) {
      return {
        variant: 'wait',
        priority: 0,
        reasoning: 'Cannot act due to status effects',
      };
    }

    const decision = this._ai.makeDecision(this, context, this._threat);
    this._lastDecision = decision;
    this._actionHistory.push(decision);

    // Keep only last 20 decisions
    if (this._actionHistory.length > 20) {
      this._actionHistory.shift();
    }

    return decision;
  }

  public selectTarget(availableTargets: ReadonlyArray<CombatEntity>): CombatEntity | null {
    return this._ai.selectTarget(availableTargets, this._threat);
  }

  public get lastDecision(): AIDecision | null {
    return this._lastDecision;
  }

  public get actionHistory(): ReadonlyArray<AIDecision> {
    return [...this._actionHistory];
  }

  // === THREAT MANAGEMENT ===

  public addThreat(update: ThreatUpdate): void {
    this._threat.addThreat(update);
  }

  public getThreat(entityId: string): number {
    return this._threat.getThreat(entityId);
  }

  public getTopThreats(count: number = 3): ReadonlyArray<{ playerId: string; threat: number }> {
    return this._threat.getTopThreats(count).map(entry => ({
      playerId: entry.playerId,
      threat: entry.threat,
    }));
  }

  public trackTarget(entityId: string): void {
    this._threat.trackTarget(entityId);
  }

  public wasRecentlyTargeted(entityId: string): boolean {
    return this._threat.wasRecentlyTargeted(entityId);
  }

  // === CONVENIENCE METHODS FOR COMMON THREAT SCENARIOS ===

  public recordPlayerAttack(playerId: string, damageReceived: number, playerArmor: number): void {
    const threatUpdate = ThreatCalculator.createAttackThreat(playerId, damageReceived, playerArmor);
    this.addThreat(threatUpdate);
  }

  public recordPlayerHealing(playerId: string, healingAmount: number, playerArmor: number): void {
    const threatUpdate = ThreatCalculator.createHealingThreat(playerId, healingAmount, playerArmor);
    this.addThreat(threatUpdate);
  }

  public recordPlayerAbility(
    playerId: string,
    damageToSelf: number,
    totalDamage: number,
    healingDone: number,
    playerArmor: number,
    abilityName: string
  ): void {
    const threatUpdate = ThreatCalculator.createAbilityThreat(
      playerId,
      damageToSelf,
      totalDamage,
      healingDone,
      playerArmor,
      abilityName
    );
    this.addThreat(threatUpdate);
  }

  // === MONSTER-SPECIFIC ABILITIES ===

  public calculateNextAttackDamage(): number {
    // Try to find basic attack ability first
    const basicAttack =
      this.getAbility('basic_attack') ||
      this.getAvailableAbilities().find(ability => ability.variant === 'attack');

    if (basicAttack?.damage) {
      return this.calculateDamageOutput(basicAttack.damage);
    }

    // Fallback to base damage
    return this.calculateDamageOutput();
  }

  public getDefinition(): MonsterDefinition {
    return { ...this._definition };
  }

  // === ROUND PROCESSING ===

  public processRound(): {
    expiredCooldowns: string[];
    statusEffectResults: import('@/core/types/entityTypes.js').StatusEffectResult;
  } {
    this._roundsActive++;

    // Process subsystems
    const expiredCooldowns = this._abilities.processRound();
    const statusEffectResults = this._statusEffects.processRound();

    // Apply status effect results
    for (const effect of statusEffectResults.effects) {
      switch (effect.type) {
        case 'poison_damage':
        case 'burning_damage':
          // Use raw damage to avoid double-applying status modifiers
          this._stats.takeDamage(effect.value, effect.type);
          break;
        case 'regeneration_heal':
          // Use raw healing to avoid double-applying status modifiers
          this._stats.heal(effect.value);
          break;
      }
    }

    // Process threat system
    this._threat.processRound();

    // Reset movement for new round
    this._movement.resetForNewRound();

    return { expiredCooldowns, statusEffectResults };
  }

  public resetForEncounter(startingPosition?: HexCoordinate): void {
    if (startingPosition) {
      this._movement.setStartingPosition(startingPosition);
    }

    this._abilities.resetForEncounter();
    this._statusEffects.resetForEncounter();
    this._stats.resetToFullHealth();
    this._threat.resetForEncounter();
    this._ai.resetForEncounter();

    this._lastDecision = null;
    this._actionHistory = [];
    this._roundsActive = 0;
  }

  // === DATA EXPORT ===

  public toPublicData(): MonsterPublicData {
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      level: this.level,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      armor: this.effectiveArmor,
      position: this.position,
      isAlive: this.isAlive,
      hasMovedThisRound: this.hasMovedThisRound,
      statusEffects: this.activeStatusEffects,
      availableAbilities: this.getAvailableAbilities(),
      aiVariant: this.aiVariant,
      difficulty: this.difficulty,
      nextDamage: this.calculateNextAttackDamage(),
    };
  }

  public toPrivateData(): MonsterPrivateData {
    const publicData = this.toPublicData();

    return {
      ...publicData,
      threatTable: this._threat.getDebugInfo().threatTable,
      lastTargets: [...this._threat.lastTargets],
      behaviors: this._definition.behaviors || [],
    };
  }

  // === DEBUG METHODS ===

  public getDebugInfo(): {
    entity: MonsterPublicData;
    ai: ReturnType<MonsterAI['getDebugInfo']>;
    threat: ReturnType<ThreatManager['getDebugInfo']>;
    stats: ReturnType<EntityStatsManager['getCombatReadiness']>;
    roundsActive: number;
  } {
    return {
      entity: this.toPublicData(),
      ai: this._ai.getDebugInfo(),
      threat: this._threat.getDebugInfo(),
      stats: this._stats.getCombatReadiness(),
      roundsActive: this._roundsActive,
    };
  }

  // === UTILITY ===

  public toString(): string {
    const status = this.isAlive ? `${this.currentHp}/${this.maxHp} HP` : 'DEAD';
    const pos = `(${this.position.q},${this.position.r})`;
    const ai = `AI: ${this.aiVariant}`;
    const action = this._lastDecision ? `Last: ${this._lastDecision.variant}` : 'No action';

    return `Monster[${this.name}] L${this.level} ${ai} ${status} ${pos} ${action}`;
  }
}

// === MONSTER FACTORY ===

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
}
