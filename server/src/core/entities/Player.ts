/**
 * @fileoverview Fixed Player entity with proper status effects integration
 * Now correctly applies status effect modifiers to damage, healing, and armor
 *
 * @file server/src/core/entities/Player.ts
 */

import type { HexCoordinate } from '@/utils/hex/index';
import type {
  PlayerClass,
  PlayerPublicData,
  PlayerPrivateData,
  PlayerAction,
  ActionSubmissionResult,
  MovementResult,
  DamageResult,
  HealResult,
  AbilityDefinition,
  StatusEffectResult,
} from '@/core/types/playerTypes';

import { PlayerStatsManager } from '../player/PlayerStatsManager';
import { PlayerMovementManager } from '@/core/player/EntityMovementManager';
import {
  PlayerActionManager,
  type ActionGameStateValidator,
} from '@/core/player/EntityActionManager';
import { PlayerAbilitiesManager } from '@/core/player/EntityAbilitiesManager';
import {
  PlayerStatusEffectsManager,
  type StatusEffectName,
} from '@/core/player/EntityStatusEffectsManager';

// === CONSTANTS ===

const DEFAULT_POSITION: HexCoordinate = { q: 0, r: 0, s: 0 } as const;

// === MAIN PLAYER ENTITY ===

/**
 * Main Player entity with proper status effects integration
 */
export class Player {
  public readonly id: string;
  public readonly name: string;
  public readonly playerClass: PlayerClass;

  private readonly _stats: PlayerStatsManager;
  private readonly _movement: PlayerMovementManager;
  private readonly _actions: PlayerActionManager;
  private readonly _abilities: PlayerAbilitiesManager;
  private readonly _statusEffects: PlayerStatusEffectsManager;

  constructor(
    id: string,
    name: string,
    playerClass: PlayerClass,
    startingPosition: HexCoordinate = DEFAULT_POSITION
  ) {
    if (!id?.trim()) throw new Error('Player ID cannot be empty');
    if (!name?.trim()) throw new Error('Player name cannot be empty');
    if (!playerClass) throw new Error('Player class is required');

    this.id = id;
    this.name = name;
    this.playerClass = playerClass;

    this._stats = new PlayerStatsManager(playerClass.stats);
    this._movement = new PlayerMovementManager(startingPosition, playerClass.stats.movementRange);
    this._actions = new PlayerActionManager();
    this._abilities = new PlayerAbilitiesManager(playerClass.abilities);
    this._statusEffects = new PlayerStatusEffectsManager();
  }

  // === CORE GETTERS ===

  public get isAlive(): boolean {
    return this._stats.isAlive;
  }

  public get currentHp(): number {
    return this._stats.currentHp;
  }

  public get maxHp(): number {
    return this._stats.maxHp;
  }

  public get position(): HexCoordinate {
    return this._movement.currentPosition;
  }

  public get level(): number {
    return this._stats.level.current;
  }

  public get hasSubmittedAction(): boolean {
    return this._actions.hasSubmittedAction;
  }

  public get submittedAction(): PlayerAction | null {
    return this._actions.submittedAction;
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

  // === DAMAGE AND HEALING WITH STATUS EFFECTS ===

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

  // === DELEGATION METHODS (UNCHANGED) ===

  public addExperience(amount: number): {
    leveledUp: boolean;
    newLevel?: number;
    benefitsGained?: string[];
  } {
    return this._stats.addExperience(amount);
  }

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

  public submitAction(
    actionType: PlayerAction['type'],
    params: {
      targetId?: string;
      targetPosition?: HexCoordinate;
      abilityId?: string;
    } = {}
  ): ActionSubmissionResult {
    if (!this.isAlive) {
      return { success: false, reason: 'Dead players cannot act' };
    }
    if (!this._statusEffects.canAct()) {
      return { success: false, reason: 'Cannot act due to status effects' };
    }
    return this._actions.submitAction(actionType, params);
  }

  public getAbility(abilityId: string): AbilityDefinition | null {
    return this._abilities.getAbility(abilityId);
  }

  public canUseAbility(abilityId: string): { canUse: boolean; reason?: string } {
    return this._abilities.canUseAbility(abilityId);
  }

  public useAbility(abilityId: string): { success: boolean; reason?: string } {
    return this._abilities.useAbility(abilityId);
  }

  public addStatusEffect(
    effectName: StatusEffectName,
    duration: number,
    value?: number
  ): { success: boolean; reason?: string; stacks?: number } {
    const result = this._statusEffects.addEffect(effectName, duration, value);
    return { success: result.success, reason: result.reason, stacks: result.stacks };
  }

  public hasStatusEffect(effectName: string): boolean {
    return this._statusEffects.hasEffect(effectName);
  }

  public removeStatusEffect(effectName: string): boolean {
    return this._statusEffects.removeEffect(effectName);
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

  // === SIMPLE ACCESSORS ===

  public getReachablePositions(): HexCoordinate[] {
    return this._movement.getReachablePositions();
  }

  public getAvailableAbilities(): ReadonlyArray<AbilityDefinition> {
    return this._abilities.availableAbilities;
  }

  public get activeStatusEffects(): ReadonlyArray<
    import('@/core/types/playerTypes.js').StatusEffect
  > {
    return this._statusEffects.effects;
  }

  public get hasMovedThisRound(): boolean {
    return this._movement.hasMovedThisRound;
  }

  public get movementRange(): number {
    return this._movement.movementRange;
  }

  public getDistanceTo(targetPosition: HexCoordinate): number {
    return this._movement.getDistanceTo(targetPosition);
  }

  // === ROUND PROCESSING ===

  public processRound(): {
    expiredCooldowns: string[];
    statusEffectResults: StatusEffectResult;
  } {
    const expiredCooldowns = this._abilities.processRound();
    const statusEffectResults = this._statusEffects.processRound();

    // Apply status effect results
    for (const effect of statusEffectResults.effects) {
      switch (effect.type) {
        case 'poison_damage':
        case 'burning_damage':
          // Use raw damage here to avoid double-applying status modifiers
          this._stats.takeDamage(effect.value, effect.type);
          break;
        case 'regeneration_heal':
          // Use raw healing here to avoid double-applying status modifiers
          this._stats.heal(effect.value);
          break;
      }
    }

    this._actions.clearAction();
    this._movement.resetForNewRound();

    return { expiredCooldowns, statusEffectResults };
  }

  public resetForEncounter(startingPosition?: HexCoordinate): void {
    if (startingPosition) {
      this._movement.setStartingPosition(startingPosition);
    }
    console.log('reset for Encounter');
    this._actions.resetForEncounter();
    this._abilities.resetForEncounter();
    this._statusEffects.resetForEncounter();
    this._stats.resetToStartingStats();
  }

  // === DATA EXPORT ===

  public toPublicData(): PlayerPublicData {
    return {
      id: this.id,
      name: this.name,
      className: this.playerClass.name,
      level: this.level,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      armor: this.effectiveArmor,
      position: this.position,
      isAlive: this.isAlive,
      hasSubmittedAction: this.hasSubmittedAction,
      statusEffects: this.activeStatusEffects,
    };
  }

  public toPrivateData(): PlayerPrivateData {
    const publicData = this.toPublicData();

    return {
      ...publicData,
      experience: this._stats.level.experience,
      damageModifier: this._stats.damageModifier,
      submittedAction: this._actions.submittedAction,
      actionSubmissionTime: this._actions.actionSubmissionTime,
      abilities: this._abilities.abilities,
      availableAbilities: this._abilities.availableAbilities,
      abilityCooldowns: this._abilities.cooldowns,
    };
  }

  // === UTILITY ===

  public toString(): string {
    const status = this.isAlive ? `${this.currentHp}/${this.maxHp} HP` : 'DEAD';
    const pos = `(${this.position.q},${this.position.r})`;
    const action = this.hasSubmittedAction ? `Action: ${this.submittedAction?.type}` : 'No action';

    return `Player[${this.name}] L${this.level} ${this.playerClass.name} ${status} ${pos} ${action}`;
  }
}
