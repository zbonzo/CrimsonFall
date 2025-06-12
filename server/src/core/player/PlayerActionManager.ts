/**
 * @fileoverview Clean player action management following naming conventions
 * Handles action submission, validation, and state tracking
 *
 * @file server/src/core/player/PlayerActionManager.ts
 */

import type { HexCoordinate } from '@/utils/hex/index.js';
import type {
  PlayerAction,
  PlayerActionType,
  ActionSubmissionResult,
} from '@/core/types/playerTypes.js';

// === ACTION MANAGER ===

/**
 * Manages player action submission with clean naming
 */
export class PlayerActionManager {
  private _submittedAction: PlayerAction | null = null;
  private _hasSubmittedAction: boolean = false;
  private _actionSubmissionTime: number | null = null;
  private _actionHistory: PlayerAction[] = [];

  // === GETTERS ===

  public get hasSubmittedAction(): boolean {
    return this._hasSubmittedAction;
  }

  public get submittedAction(): PlayerAction | null {
    return this._submittedAction;
  }

  public get actionSubmissionTime(): number | null {
    return this._actionSubmissionTime;
  }

  public get actionHistory(): ReadonlyArray<PlayerAction> {
    return [...this._actionHistory];
  }

  // === ACTION SUBMISSION ===

  public submitAction(
    actionType: PlayerActionType,
    params: {
      targetId?: string;
      targetPosition?: HexCoordinate;
      abilityId?: string;
    } = {}
  ): ActionSubmissionResult {
    if (this._hasSubmittedAction) {
      return {
        success: false,
        reason: 'Action already submitted this round',
      };
    }

    const validation = this.validateActionParameters(actionType, params);
    if (!validation.success) {
      return validation;
    }

    const action: PlayerAction = {
      type: actionType,
      targetId: params.targetId,
      targetPosition: params.targetPosition,
      abilityId: params.abilityId,
      submissionTime: Date.now(),
    };

    this._submittedAction = action;
    this._hasSubmittedAction = true;
    this._actionSubmissionTime = Date.now();
    this._actionHistory.push(action);

    return { success: true, action };
  }

  public clearAction(): void {
    this._submittedAction = null;
    this._hasSubmittedAction = false;
    this._actionSubmissionTime = null;
  }

  public updateAction(
    updates: Partial<{
      targetId: string;
      targetPosition: HexCoordinate;
      abilityId: string;
    }>
  ): ActionSubmissionResult {
    if (!this._submittedAction) {
      return { success: false, reason: 'No action to update' };
    }

    const candidateAction: PlayerAction = {
      ...this._submittedAction,
      ...updates,
      submissionTime: Date.now(),
    };

    const validation = this.validateActionParameters(candidateAction.type, {
      targetId: candidateAction.targetId,
      targetPosition: candidateAction.targetPosition,
      abilityId: candidateAction.abilityId,
    });

    if (!validation.success) {
      return validation;
    }

    this._submittedAction = candidateAction;
    this._actionSubmissionTime = Date.now();

    return { success: true, action: candidateAction };
  }
  // === VALIDATION ===

  public validateAction(gameStateValidator: ActionGameStateValidator): {
    isValid: boolean;
    reason?: string;
  } {
    if (!this._submittedAction) {
      return { isValid: false, reason: 'No action submitted' };
    }

    return gameStateValidator.validateAction(this._submittedAction);
  }

  // === UTILITY ===

  public getActionPriority(): number {
    if (!this._submittedAction) {
      return 0;
    }

    switch (this._submittedAction.type) {
      case 'wait':
        return 4;
      case 'move':
        return 3;
      case 'ability':
        return 2;
      case 'attack':
        return 1;
      default:
        return 0;
    }
  }

  public isActionReady(): boolean {
    return this._hasSubmittedAction && this._submittedAction !== null;
  }

  public resetForEncounter(): void {
    this.clearAction();
    this._actionHistory = [];
  }

  public getActionStats(): {
    totalActions: number;
    actionsByType: Record<PlayerActionType, number>;
  } {
    const actionsByType: Record<PlayerActionType, number> = {
      move: 0,
      attack: 0,
      ability: 0,
      wait: 0,
    };

    for (const action of this._actionHistory) {
      actionsByType[action.type]++;
    }

    return {
      totalActions: this._actionHistory.length,
      actionsByType,
    };
  }

  // === PRIVATE HELPERS ===

  private validateActionParameters(
    actionType: PlayerActionType,
    params: { targetId?: string; targetPosition?: HexCoordinate; abilityId?: string }
  ): ActionSubmissionResult {
    switch (actionType) {
      case 'move':
        if (!params.targetPosition) {
          return { success: false, reason: 'Move action requires target position' };
        }
        break;

      case 'attack':
        if (!params.targetId) {
          return { success: false, reason: 'Attack action requires target ID' };
        }
        break;

      case 'ability':
        if (!params.abilityId) {
          return { success: false, reason: 'Ability action requires ability ID' };
        }
        break;

      case 'wait':
        break;

      default:
        return { success: false, reason: `Unknown action type: ${actionType}` };
    }

    return { success: true };
  }
}

// === VALIDATOR INTERFACE ===

export interface ActionGameStateValidator {
  validateAction(action: PlayerAction): { isValid: boolean; reason?: string };
}
