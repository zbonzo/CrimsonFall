/**
 * @fileoverview Shared entity type definitions for the unified entity system
 * Types for Players, Monsters, NPCs, and shared behaviors
 *
 * @file server/src/core/types/entityTypes.ts
 */

import type { HexCoordinate } from '@/utils/hex/index.js';

// === BASIC ENTITY TYPES ===

export interface EntityId {
  readonly value: string;
}

export interface EntityName {
  readonly value: string;
}

export type EntityType = 'player' | 'monster' | 'npc';

// === ENTITY STATS ===

export interface EntityStats {
  readonly maxHp: number;
  readonly baseArmor: number;
  readonly baseDamage: number;
  readonly movementRange: number;
}

export interface EntityLevel {
  readonly current: number;
  readonly experience: number;
  readonly experienceToNext: number;
}

// === ABILITIES (SHARED) ===

export type AbilityType = 'attack' | 'defense' | 'utility' | 'healing';

export interface AbilityDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: AbilityType;
  readonly damage?: number;
  readonly healing?: number;
  readonly range: number;
  readonly cooldown: number;
  readonly description: string;
  readonly targetType?: 'self' | 'ally' | 'enemy' | 'any' | 'position';
  readonly areaOfEffect?: number;
  readonly statusEffects?: StatusEffectApplication[];
}

export interface StatusEffectApplication {
  readonly effectName: string;
  readonly duration: number;
  readonly value?: number;
  readonly chance?: number; // 0.0 to 1.0, defaults to 1.0
}

export interface AbilityCooldown {
  readonly abilityId: string;
  readonly turnsRemaining: number;
}

// === STATUS EFFECTS (SHARED) ===

export interface StatusEffect {
  readonly name: string;
  readonly duration: number;
  readonly value?: number;
  readonly description: string;
  readonly source?: string;
}

export interface StatusEffectResult {
  readonly expired: string[];
  readonly effects: Array<{
    readonly type: string;
    readonly value: number;
  }>;
}

// === COMBAT RESULTS (SHARED) ===

export interface DamageResult {
  readonly damageDealt: number;
  readonly blocked: number;
  readonly died: boolean;
}

export interface HealResult {
  readonly amountHealed: number;
  readonly newHp: number;
}

export interface MovementResult {
  readonly success: boolean;
  readonly reason?: string;
  readonly newPosition?: HexCoordinate;
}

// === ENTITY DEFINITIONS ===

export interface EntityDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: EntityType;
  readonly stats: EntityStats;
  readonly abilities: ReadonlyArray<AbilityDefinition>;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

// === PLAYER-SPECIFIC TYPES ===

export type PlayerActionType = 'move' | 'attack' | 'ability' | 'wait';

export interface PlayerAction {
  readonly type: PlayerActionType;
  readonly targetId?: string;
  readonly targetPosition?: HexCoordinate;
  readonly abilityId?: string;
  readonly submissionTime: number;
}

export interface ActionSubmissionResult {
  readonly success: boolean;
  readonly reason?: string;
  readonly action?: PlayerAction;
}

export interface PlayerClass extends EntityDefinition {
  readonly type: 'player';
  readonly startingAbilities: ReadonlyArray<string>; // IDs of abilities unlocked at start
  readonly progressionTree?: AbilityProgressionNode[];
}

export interface AbilityProgressionNode {
  readonly abilityId: string;
  readonly requiredLevel: number;
  readonly prerequisites?: ReadonlyArray<string>;
}

// === MONSTER-SPECIFIC TYPES ===

export type MonsterAIType =
  | 'passive'
  | 'aggressive'
  | 'defensive'
  | 'tactical'
  | 'berserker'
  | 'support';

export interface ThreatConfig {
  readonly enabled: boolean;
  readonly decayRate: number;
  readonly healingMultiplier: number;
  readonly damageMultiplier: number;
  readonly armorMultiplier: number;
  readonly avoidLastTargetRounds?: number;
  readonly fallbackToLowestHp?: boolean;
  readonly enableTiebreaker?: boolean;
}

export interface MonsterDefinition extends EntityDefinition {
  readonly type: 'monster';
  readonly aiType: MonsterAIType;
  readonly threatConfig: ThreatConfig;
  readonly spawnWeight: number;
  readonly difficulty: number;
  readonly lootTable?: LootTableEntry[];
  readonly behaviors?: MonsterBehavior[];
}

export interface MonsterBehavior {
  readonly name: string;
  readonly condition: BehaviorCondition;
  readonly action: BehaviorAction;
  readonly priority: number;
}

export interface BehaviorCondition {
  readonly type: 'hp_below' | 'hp_above' | 'enemy_in_range' | 'ally_in_danger' | 'cooldown_ready';
  readonly value?: number;
  readonly abilityId?: string;
}

export interface BehaviorAction {
  readonly type: 'use_ability' | 'move_to' | 'flee' | 'focus_target' | 'call_for_help';
  readonly abilityId?: string;
  readonly targetType?:
    | 'nearest_enemy'
    | 'weakest_enemy'
    | 'strongest_enemy'
    | 'self'
    | 'nearest_ally';
  readonly position?: HexCoordinate;
}

export interface LootTableEntry {
  readonly itemId: string;
  readonly chance: number; // 0.0 to 1.0
  readonly quantity?: number;
}

// === NPC-SPECIFIC TYPES ===

export interface NPCDefinition extends EntityDefinition {
  readonly type: 'npc';
  readonly role: 'merchant' | 'quest_giver' | 'ally' | 'neutral' | 'trainer';
  readonly dialogue?: DialogueTree;
  readonly services?: NPCService[];
}

export interface DialogueTree {
  readonly rootNode: DialogueNode;
  readonly nodes: Map<string, DialogueNode>;
}

export interface DialogueNode {
  readonly id: string;
  readonly text: string;
  readonly options: DialogueOption[];
  readonly actions?: DialogueAction[];
}

export interface DialogueOption {
  readonly text: string;
  readonly nextNodeId: string;
  readonly condition?: DialogueCondition;
}

export interface DialogueCondition {
  readonly type: 'has_item' | 'level_minimum' | 'quest_completed' | 'stat_minimum';
  readonly value?: number;
  readonly itemId?: string;
  readonly questId?: string;
}

export interface DialogueAction {
  readonly type: 'give_item' | 'take_item' | 'give_quest' | 'complete_quest' | 'teleport';
  readonly itemId?: string;
  readonly questId?: string;
  readonly quantity?: number;
  readonly position?: HexCoordinate;
}

export interface NPCService {
  readonly type: 'shop' | 'heal' | 'train' | 'enchant' | 'repair';
  readonly cost?: number;
  readonly items?: ShopItem[];
}

export interface ShopItem {
  readonly itemId: string;
  readonly price: number;
  readonly stock?: number; // undefined = infinite
}

// === SHARED ENTITY INTERFACES ===

export interface CombatEntity {
  addStatusEffect(effectName: any, duration: any, value: any): unknown;
  readonly id: string;
  readonly name: string;
  readonly type: EntityType;
  readonly position: HexCoordinate;
  readonly isAlive: boolean;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly effectiveArmor: number;
  readonly level: number;

  takeDamage(amount: number, source: string): DamageResult;
  heal(amount: number): HealResult;
  calculateDamageOutput(baseDamage?: number): number;
  canAct(): boolean;
  canMove(): boolean;
  canBeTargeted(): boolean;
}

export interface MovableEntity {
  readonly position: HexCoordinate;
  readonly movementRange: number;
  readonly hasMovedThisRound: boolean;

  moveTo(
    targetPosition: HexCoordinate,
    occupiedPositions?: ReadonlySet<string>,
    obstacles?: ReadonlySet<string>
  ): MovementResult;
  getReachablePositions(): HexCoordinate[];
  getDistanceTo(targetPosition: HexCoordinate): number;
}

export interface AbilityUser {
  getAbility(abilityId: string): AbilityDefinition | null;
  canUseAbility(abilityId: string): { canUse: boolean; reason?: string };
  useAbility(abilityId: string): { success: boolean; reason?: string };
  getAvailableAbilities(): ReadonlyArray<AbilityDefinition>;
}

export interface StatusEffectTarget {
  addStatusEffect(
    effectName: string,
    duration: number,
    value?: number
  ): { success: boolean; reason?: string };
  hasStatusEffect(effectName: string): boolean;
  removeStatusEffect(effectName: string): boolean;
  readonly activeStatusEffects: ReadonlyArray<StatusEffect>;
}

// === ENTITY STATE EXPORT ===

export interface EntityState {
  readonly id: string;
  readonly name: string;
  readonly type: EntityType;
  readonly level: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly armor: number;
  readonly position: HexCoordinate;
  readonly isAlive: boolean;
  readonly statusEffects: ReadonlyArray<StatusEffect>;
}

export interface EntityPublicData extends EntityState {
  readonly hasMovedThisRound: boolean;
  readonly availableAbilities: ReadonlyArray<AbilityDefinition>;
}

export interface EntityPrivateData extends EntityPublicData {
  readonly experience: number;
  readonly damageModifier: number;
  readonly abilities: ReadonlyArray<AbilityDefinition>;
  readonly abilityCooldowns: ReadonlyArray<AbilityCooldown>;
}

// === PLAYER SPECIFIC DATA ===

export interface PlayerPublicData extends EntityPublicData {
  readonly className: string;
  readonly hasSubmittedAction: boolean;
}

export interface PlayerPrivateData extends EntityPrivateData, PlayerPublicData {
  readonly submittedAction: PlayerAction | null;
  readonly actionSubmissionTime: number | null;
}

// === MONSTER SPECIFIC DATA ===

export interface MonsterPublicData extends EntityPublicData {
  readonly aiType: MonsterAIType;
  readonly difficulty: number;
  readonly nextDamage: number;
}

export interface MonsterPrivateData extends MonsterPublicData {
  readonly threatTable: Record<string, number>;
  readonly lastTargets: string[];
  readonly behaviors: ReadonlyArray<MonsterBehavior>;
}

// === AI TARGETING TYPES ===

export interface TargetingContext {
  readonly self: CombatEntity;
  readonly allies: ReadonlyArray<CombatEntity>;
  readonly enemies: ReadonlyArray<CombatEntity>;
  readonly obstacles: ReadonlySet<string>;
  readonly currentRound: number;
}

export interface TargetingResult {
  readonly target: CombatEntity | null;
  readonly reason: string;
  readonly confidence: number; // 0.0 to 1.0
}

export interface AIDecision {
  readonly type: 'attack' | 'ability' | 'move' | 'wait' | 'flee';
  readonly target?: CombatEntity;
  readonly targetPosition?: HexCoordinate;
  readonly abilityId?: string;
  readonly priority: number;
  readonly reasoning: string;
}

// === THREAT SYSTEM TYPES ===

export interface ThreatEntry {
  readonly playerId: string;
  readonly playerName: string;
  readonly threat: number;
  readonly lastAction?: string;
  readonly roundsTracked: number;
}

export interface ThreatUpdate {
  readonly playerId: string;
  readonly damageToSelf: number;
  readonly totalDamageDealt: number;
  readonly healingDone: number;
  readonly playerArmor: number;
  readonly source: string;
}

// === ENTITY FACTORY TYPES ===

export interface EntityFactory {
  createPlayer(
    id: string,
    name: string,
    playerClass: PlayerClass,
    position?: HexCoordinate
  ): CombatEntity;
  createMonster(
    id: string,
    monsterDefinition: MonsterDefinition,
    position?: HexCoordinate
  ): CombatEntity;
  createNPC(id: string, npcDefinition: NPCDefinition, position?: HexCoordinate): CombatEntity;
}

// === ENTITY MANAGER TYPES ===

export interface EntityManager {
  addEntity(entity: CombatEntity): void;
  removeEntity(entityId: string): boolean;
  getEntity(entityId: string): CombatEntity | null;
  getEntitiesByType(type: EntityType): ReadonlyArray<CombatEntity>;
  getEntitiesInRange(center: HexCoordinate, range: number): ReadonlyArray<CombatEntity>;
  getAllEntities(): ReadonlyArray<CombatEntity>;
  processRound(): void;
  resetForEncounter(): void;
}

// === ENCOUNTER GENERATION TYPES ===

export interface EncounterDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly difficulty: number;
  readonly monsters: EncounterMonster[];
  readonly objectives?: EncounterObjective[];
  readonly rewards?: EncounterReward[];
  readonly environment?: EnvironmentEffect[];
}

export interface EncounterMonster {
  readonly monsterId: string;
  readonly count: number;
  readonly positions?: HexCoordinate[];
  readonly level?: number;
  readonly modifications?: MonsterModification[];
}

export interface MonsterModification {
  readonly type: 'hp_multiplier' | 'damage_multiplier' | 'add_ability' | 'add_status_effect';
  readonly value?: number;
  readonly abilityId?: string;
  readonly statusEffect?: StatusEffectApplication;
}

export interface EncounterObjective {
  readonly type:
    | 'defeat_all'
    | 'defeat_specific'
    | 'survive_rounds'
    | 'reach_position'
    | 'protect_npc';
  readonly description: string;
  readonly required: boolean;
  readonly targetId?: string;
  readonly targetPosition?: HexCoordinate;
  readonly rounds?: number;
}

export interface EncounterReward {
  readonly type: 'experience' | 'gold' | 'item' | 'ability_unlock';
  readonly value?: number;
  readonly itemId?: string;
  readonly abilityId?: string;
}

export interface EnvironmentEffect {
  readonly name: string;
  readonly description: string;
  readonly type: 'damage_zone' | 'healing_zone' | 'movement_modifier' | 'visibility_modifier';
  readonly positions: HexCoordinate[];
  readonly value?: number;
  readonly ticksPerRound?: number;
}

// === UTILITY TYPES ===

export type EntityFilter = (entity: CombatEntity) => boolean;
export type EntityComparator = (a: CombatEntity, b: CombatEntity) => number;
export type EntityMapper<T> = (entity: CombatEntity) => T;

// === TYPE GUARDS ===

export function isPlayer(entity: CombatEntity): entity is CombatEntity & { type: 'player' } {
  return entity.type === 'player';
}

export function isMonster(entity: CombatEntity): entity is CombatEntity & { type: 'monster' } {
  return entity.type === 'monster';
}

export function isNPC(entity: CombatEntity): entity is CombatEntity & { type: 'npc' } {
  return entity.type === 'npc';
}

export function isAlive(entity: CombatEntity): boolean {
  return entity.isAlive;
}

export function isDead(entity: CombatEntity): boolean {
  return !entity.isAlive;
}

export function canAct(entity: CombatEntity): boolean {
  return entity.isAlive && entity.canAct();
}

export function canMove(entity: CombatEntity): boolean {
  return entity.isAlive && entity.canMove();
}

export function canBeTargeted(entity: CombatEntity): boolean {
  return entity.isAlive && entity.canBeTargeted();
}
