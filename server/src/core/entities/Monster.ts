/**
 * @fileoverview Streamlined Monster entity implementation
 * Reduced from 600+ lines to under 300 by extracting behavior-specific modules
 *
 * COMPLEXITY NOTE: This file remains at 407 lines due to:
 * - Complex entity interface implementation (CombatEntity, MovableEntity, etc.)
 * - Integrated AI decision-making and threat management
 * - Status effect processing and ability management
 * - Multiple data transformation methods (public/private views)
 * 
 * FUTURE REFACTORING OPPORTUNITIES:
 * - Extract MonsterCombat class for combat-specific logic
 * - Create MonsterAbilities class for ability management
 * - Separate MonsterAI integration into composition pattern
 * - Split data access methods to MonsterDataManager
 *
 * FIXED: Removed reserved keywords 'type' → 'variant', 'class' → 'specialization'
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
  StatusEffectTarget,
  TargetingContext,
  ThreatUpdate,
} from '@/core/types/entityTypes.js';
import { ORIGIN_HEX, type HexCoordinate } from '@/utils/hex/hexCoordinates.js';

import { MonsterAI } from '@/core/ai/MonsterAI.js';
import { EntityAbilitiesManager } from '@/core/player/EntityAbilitiesManager.js';
import { EntityMovementManager } from '@/core/player/EntityMovementManager.js';
import { EntityStatsManager } from '@/core/player/EntityStatsManager.js';
import { EntityStatusEffectsManager } from '@/core/player/EntityStatusEffectsManager.js';
import { ThreatCalculator } from '@/core/systems/ThreatCalculator.js';
import { ThreatManager } from '@/core/systems/ThreatManager.js';

import { MonsterAIBehavior } from './behaviors/MonsterAIBehavior.js';
import { MonsterCombatBehavior } from './behaviors/MonsterCombatBehavior.js';
import { MonsterDataExport, MonsterDebugUtils } from './behaviors/MonsterDebugUtils.js';
import { MonsterThreatBehavior } from './behaviors/MonsterThreatBehavior.js';

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

  // Behavior delegates
  private readonly _aiBehavior: MonsterAIBehavior;
  private readonly _combatBehavior: MonsterCombatBehavior;
  private readonly _threatBehavior: MonsterThreatBehavior;
  private readonly _dataExport: MonsterDataExport;
  private readonly _debugUtils: MonsterDebugUtils;

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
    this.difficulty = definition.difficulty ?? 1;
    this._definition = definition;

    // Initialize shared managers
    this._stats = new EntityStatsManager(definition.stats, false);
    this._movement = new EntityMovementManager(startingPosition, definition.stats.movementRange);
    this._abilities = new EntityAbilitiesManager(definition.abilities);
    this._statusEffects = new EntityStatusEffectsManager();

    // Initialize monster-specific systems
    this._ai = new MonsterAI(definition.aiVariant, definition.behaviors || []);
    this._threat = new ThreatManager(definition.threatConfig);

    // Initialize behavior delegates
    this._aiBehavior = new MonsterAIBehavior(this._ai, this._threat);
    this._combatBehavior = new MonsterCombatBehavior();
    this._threatBehavior = new MonsterThreatBehavior(this._threat);
    this._dataExport = new MonsterDataExport();
    this._debugUtils = new MonsterDebugUtils();
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
    return this._combatBehavior.calculateEffectiveArmor(
      this._stats.effectiveArmor,
      this._statusEffects
    );
  }

  public get baseArmor(): number {
    return this._stats.baseArmor;
  }

  public get baseDamage(): number {
    return this._stats.baseDamage;
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

  // === COMBAT INTERFACE (Delegated) ===

  public takeDamage(amount: number, source: string = 'unknown'): DamageResult {
    return this._combatBehavior.takeDamage(
      amount,
      source,
      this._stats,
      this._statusEffects,
      this.isAlive
    );
  }

  public heal(amount: number): HealResult {
    return this._combatBehavior.heal(amount, this._stats, this._statusEffects, this.isAlive);
  }

  public setHp(amount: number): void {
    this._stats.setCurrentHp(amount);
  }

  public calculateDamageOutput(baseDamage?: number): number {
    return this._combatBehavior.calculateDamageOutput(baseDamage, this._stats, this._statusEffects);
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

  // === MOVEMENT INTERFACE (Direct delegation) ===

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

  // === ABILITY INTERFACE (Direct delegation) ===

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

  // === STATUS EFFECTS INTERFACE (Direct delegation) ===

  public addStatusEffect(
    effectName: string,
    duration: number,
    value?: number
  ): { success: boolean; reason?: string; stacks?: number } {
    return this._statusEffects.addEffect(effectName as any, duration, value);
  }

  public hasStatusEffect(effectName: string): boolean {
    return this._statusEffects.hasEffect(effectName);
  }

  public removeStatusEffect(effectName: string): boolean {
    return this._statusEffects.removeEffect(effectName);
  }

  public get activeStatusEffects(): ReadonlyArray<import('@/core/types/statusEffects.js').StatusEffect> {
    return this._statusEffects.effects;
  }

  // === AI METHODS (Delegated) ===

  public makeDecision(context: TargetingContext): AIDecision {
    if (!this.canAct()) {
      return {
        variant: 'wait',
        priority: 0,
        confidence: 1.0,
      };
    }

    const decision = this._aiBehavior.makeDecision(this, context, this._actionHistory);
    this._lastDecision = decision;
    this._aiBehavior.recordDecision(decision, this._actionHistory);

    return decision;
  }

  public selectTarget(availableTargets: ReadonlyArray<CombatEntity>): CombatEntity | null {
    return this._aiBehavior.selectTarget(availableTargets);
  }

  public get lastDecision(): AIDecision | null {
    return this._lastDecision;
  }

  public get actionHistory(): ReadonlyArray<AIDecision> {
    return [...this._actionHistory];
  }

  // === THREAT MANAGEMENT (Delegated) ===

  public addThreat(update: ThreatUpdate): void {
    this._threatBehavior.addThreat(update);
  }

  public getThreat(entityId: string): number {
    return this._threatBehavior.getThreat(entityId);
  }

  public getTopThreats(count: number = 3): ReadonlyArray<{ playerId: string; threat: number }> {
    return this._threatBehavior.getTopThreats(count);
  }

  public trackTarget(entityId: string): void {
    this._threatBehavior.trackTarget(entityId);
  }

  public wasRecentlyTargeted(entityId: string): boolean {
    return this._threatBehavior.wasRecentlyTargeted(entityId);
  }

  // === CONVENIENCE THREAT METHODS (Delegated) ===

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
    const basicAttack =
      this.getAbility('basic_attack') ||
      this.getAvailableAbilities().find(ability => ability.variant === 'attack');

    if (basicAttack?.damage) {
      return this.calculateDamageOutput(basicAttack.damage);
    }

    return this.calculateDamageOutput();
  }

  public getDefinition(): MonsterDefinition {
    return { ...this._definition };
  }

  public get definition(): MonsterDefinition {
    return this.getDefinition();
  }

  public get tags(): readonly string[] | undefined {
    return this._definition.tags;
  }

  public get behaviors(): readonly import('@/core/types/ai.js').MonsterBehavior[] {
    return this._definition.behaviors || [];
  }

  public get threatConfig(): import('@/core/types/ai.js').ThreatConfig | undefined {
    return this._definition.threatConfig;
  }

  // === STATUS EFFECTS ALIASES ===

  public applyStatusEffect(
    effectName: string,
    duration: number,
    value?: number
  ): { applied: boolean; effectName: string; duration: number; value?: number } {
    const result = this.addStatusEffect(effectName, duration, value);
    const returnValue: { applied: boolean; effectName: string; duration: number; value?: number } = {
      applied: result.success,
      effectName,
      duration,
    };
    if (value !== undefined) {
      returnValue.value = value;
    }
    return returnValue;
  }

  public getActiveStatusEffects(): ReadonlyArray<import('@/core/types/statusEffects.js').StatusEffect> {
    return this.activeStatusEffects;
  }

  // === ROUND PROCESSING ===

  public processRound(): {
    expiredCooldowns: string[];
    statusEffectResults: import('@/core/types/statusEffects.js').StatusEffectResult;
  } {
    this._roundsActive++;

    // Process subsystems
    const expiredCooldowns = this._abilities.processRound();
    const statusEffectResults = this._statusEffects.processRound();

    // Apply status effect results
    this._combatBehavior.applyStatusEffectResults(statusEffectResults, this._stats);

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
    // AI doesn't have resetForEncounter method

    this._lastDecision = null;
    this._actionHistory = [];
    this._roundsActive = 0;
  }

  // === DATA EXPORT (Delegated) ===

  public toPublicData(): MonsterPublicData {
    return this._dataExport.toPublicData(this);
  }

  public toPrivateData(): MonsterPrivateData {
    return this._dataExport.toPrivateData(this, this._threat);
  }

  public getPublicData(): MonsterPublicData {
    return this.toPublicData();
  }

  public getPrivateData(): MonsterPrivateData {
    return this.toPrivateData();
  }

  // === DEBUG METHODS (Delegated) ===

  public getDebugInfo(): ReturnType<MonsterDebugUtils['getDebugInfo']> {
    return this._debugUtils.getDebugInfo(
      this,
      this._ai,
      this._threat,
      this._stats,
      this._roundsActive
    );
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
