/**
 * @fileoverview Centralized type exports for the entity system
 * Replaces the monolithic entityTypes.ts file
 *
 * @file server/src/core/types/index.ts
 */

// Re-export all types for backward compatibility
export * from './abilities.js';
export * from './actions.js';
export * from './ai.js';
export * from './combat.js';
export * from './monsters.js';
export * from './players.js';
export * from './statusEffects.js';

// Legacy export for full compatibility
export type {
  // Core entity interfaces  
  CombatEntity,
  MovableEntity,
  EntityVariant,
  EntityStats,
  EntityId,
  EntityName,
  EntityLevel,
} from './combat.js';

export type {
  // Ability interfaces
  AbilityUser,
  AbilityDefinition,
  AbilityVariant,
  AbilityUsageResult,
  AbilityAvailabilityCheck,
} from './abilities.js';

export type {
  // Status effect interfaces
  StatusEffectTarget,
  StatusEffect,
  StatusEffectResult,
  StatusEffectVariant,
} from './statusEffects.js';

export type {
  // Combat result types
  DamageResult,
  HealResult,
  MovementResult,
} from './combat.js';

export type {
  // AI types
  AIDecision,
  MonsterAIVariant,
  MonsterBehavior,
  BehaviorCondition,
  BehaviorAction,
  TargetingContext,
  TargetingResult,
  ThreatUpdate,
  ThreatEntry,
  ThreatConfig,
} from './ai.js';

export type {
  // Player types
  PlayerSpecialization,
  PlayerPublicData,
  PlayerPrivateData,
  ProgressionEntry,
} from './players.js';

export type {
  // Monster types
  MonsterDefinition,
  MonsterPublicData,
  MonsterPrivateData,
  LootEntry,
} from './monsters.js';

export type {
  // Action types
  PlayerAction,
  ActionSubmissionResult,
  ActionValidation,
  ActionContext,
} from './actions.js';