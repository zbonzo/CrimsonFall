/**
 * @fileoverview Legacy entity types file - now imports from focused modules
 * 
 * ARCHITECTURAL REFACTOR COMPLETE:
 * This file was originally 546 lines of mixed type definitions.
 * 
 * EXTRACTED TO:
 * - abilities.ts: Ability system types
 * - actions.ts: Player action types  
 * - ai.ts: AI and behavior types
 * - combat.ts: Combat and entity core types
 * - monsters.ts: Monster-specific types
 * - players.ts: Player-specific types
 * - statusEffects.ts: Status effect system types
 * - index.ts: Centralized exports
 *
 * This file now serves as a compatibility layer for existing imports.
 * Future imports should use the focused modules directly.
 *
 * @file server/src/core/types/entityTypes.ts
 */

// Re-export everything for backward compatibility
export * from './index.js';

// This file is intentionally kept minimal - all types have been
// extracted to focused modules for better maintainability