/**
 * @fileoverview Action system type definitions
 * Extracted from entityTypes.ts for better organization
 *
 * @file server/src/core/types/actions.ts
 */

import type { HexCoordinate } from '@/utils/hex/index.js';

// === PLAYER ACTION TYPES ===

export interface PlayerAction {
  readonly variant: 'move' | 'attack' | 'ability' | 'wait';
  readonly targetId?: string;
  readonly targetPosition?: HexCoordinate;
  readonly abilityId?: string;
  readonly submissionTime: number;
}

export interface ActionSubmissionResult {
  readonly success: boolean;
  readonly reason?: string;
}

// === ACTION VALIDATION TYPES ===

export interface ActionValidation {
  readonly valid: boolean;
  readonly reason?: string;
  readonly suggestions?: string[];
}

export interface ActionContext {
  readonly actorId: string;
  readonly currentRound: number;
  readonly timeRemaining?: number;
  readonly availableTargets: ReadonlyArray<string>;
  readonly availablePositions: ReadonlyArray<HexCoordinate>;
}