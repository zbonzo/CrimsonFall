/**
 * @fileoverview Clean player action management following naming conventions
 * Handles action submission, validation, and state tracking
 *
 * FIXED: Removed reserved keywords 'type' → 'variant'
 *
 * @file server/src/core/player/EntityActionManager.ts
 */

import type {
  ActionSubmissionResult,
  PlayerAction,
  PlayerActionVariant,
} from '@/core/types/playerTypes.js';
import type { HexCoordinate } from '@/utils/hex/hexCoordinates.js';

// === ACTION MANAGER ===

/**
 * Manages player action submission with clean naming
 */
export class EntityActionManager {
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
    actionVariant: PlayerActionVariant,
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

    const validation = this.validateActionParameters(actionVariant, params);
    if (!validation.success) {
      return validation;
    }

    let action: PlayerAction;
    const submissionTime = Date.now();

    switch (actionVariant) {
      case 'move':
        action = { variant: 'move', targetPosition: params.targetPosition!, submissionTime };
        break;
      case 'attack':
        action = { variant: 'attack', targetId: params.targetId!, submissionTime };
        break;
      case 'ability':
        action = {
          variant: 'ability',
          abilityId: params.abilityId!,
          targetId: params.targetId ?? undefined, // explicit undefined for exactOptionalPropertyTypes
          submissionTime,
        };
        break;
      case 'wait':
        action = { variant: 'wait', submissionTime };
        break;
      default:
        throw new Error(`Invalid action variant: ${actionVariant}`);
    }

    this._submittedAction = action;
    this._hasSubmittedAction = true;
    this._actionSubmissionTime = submissionTime;
    this._actionHistory.push(action);

    return { success: true, action };
  }

  public clearAction(): void {
    this._submittedAction = null;
    this._hasSubmittedAction = false;
    this._actionSubmissionTime = null;
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

    switch (this._submittedAction.variant) {
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

  public canAct(): boolean {
    return !this._hasSubmittedAction;
  }

  public getPendingActions(): ReadonlyArray<import('@/core/types/playerTypes.js').PlayerAction> {
    return this._submittedAction ? [this._submittedAction] : [];
  }

  public resetForEncounter(): void {
    this.clearAction();
    this._actionHistory = [];
  }

  public getActionStats(): {
    totalActions: number;
    actionsByVariant: Record<PlayerActionVariant, number>;
  } {
    const actionsByVariant: Record<PlayerActionVariant, number> = {
      move: 0,
      attack: 0,
      ability: 0,
      wait: 0,
    };

    for (const action of this._actionHistory) {
      if (action?.variant) {
        actionsByVariant[action.variant]++;
      }
    }

    return {
      totalActions: this._actionHistory.length,
      actionsByVariant,
    };
  }

  // === PRIVATE HELPERS ===

  private validateActionParameters(
    actionVariant: PlayerActionVariant,
    params: {
      targetId?: string | undefined;
      targetPosition?: HexCoordinate | undefined;
      abilityId?: string | undefined;
    }
  ): ActionSubmissionResult {
    switch (actionVariant) {
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
        return { success: false, reason: `Unknown action variant: ${actionVariant}` };
    }

    return { success: true };
  }
}

// === VALIDATOR INTERFACE ===

export interface ActionGameStateValidator {
  validateAction(action: PlayerAction): { isValid: boolean; reason?: string };
}
