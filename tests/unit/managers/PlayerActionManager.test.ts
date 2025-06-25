/**
 * Hex Dungeon Crawler - PlayerActionManager Tests
 *
 * Unit tests for player action submission and validation system
 * Tests action submission, validation, and state tracking
 *
 * @file tests/unit/server/core/player/PlayerActionManager.test.ts
 */

import {
  EntityActionManager,
  type ActionGameStateValidator,
} from '@/core/player/EntityActionManager';
import type { PlayerAction } from '@/core/types/playerTypes';

// === TEST FIXTURES ===

const VALID_POSITION = { q: 1, r: 0, s: -1 };
const VALID_TARGET_ID = 'player-123';
const VALID_ABILITY_ID = 'fireball';

// === MOCK VALIDATOR ===

class MockGameStateValidator implements ActionGameStateValidator {
  public shouldReturnValid: boolean = true;
  public validationReason: string = 'Mock validation failed';

  validateAction(action: PlayerAction): { isValid: boolean; reason?: string } {
    if (this.shouldReturnValid) {
      return { isValid: true };
    }
    return { isValid: false, reason: this.validationReason };
  }
}

// === HELPER FUNCTIONS ===

function createActionManager(): EntityActionManager {
  return new EntityActionManager();
}

function createMockValidator(): MockGameStateValidator {
  return new MockGameStateValidator();
}

// === TESTS ===

describe('EntityActionManager', () => {
  describe('initialization', () => {
    it('should initialize with no submitted action', () => {
      const manager = createActionManager();

      expect(manager.hasSubmittedAction).toBe(false);
      expect(manager.submittedAction).toBe(null);
      expect(manager.actionSubmissionTime).toBe(null);
      expect(manager.actionHistory).toHaveLength(0);
    });
  });

  describe('action submission', () => {
    it('should submit move action successfully', () => {
      const manager = createActionManager();

      const result = manager.submitAction('move', {
        targetPosition: VALID_POSITION,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBeDefined();
      expect(result.action?.type).toBe('move');
      expect(result.action?.targetPosition).toEqual(VALID_POSITION);
      expect(manager.hasSubmittedAction).toBe(true);
    });

    it('should submit attack action successfully', () => {
      const manager = createActionManager();

      const result = manager.submitAction('attack', {
        targetId: VALID_TARGET_ID,
      });

      expect(result.success).toBe(true);
      expect(result.action?.type).toBe('attack');
      expect(result.action?.targetId).toBe(VALID_TARGET_ID);
      expect(manager.hasSubmittedAction).toBe(true);
    });

    it('should submit ability action successfully', () => {
      const manager = createActionManager();

      const result = manager.submitAction('ability', {
        abilityId: VALID_ABILITY_ID,
        targetId: VALID_TARGET_ID,
      });

      expect(result.success).toBe(true);
      expect(result.action?.type).toBe('ability');
      expect(result.action?.abilityId).toBe(VALID_ABILITY_ID);
      expect(result.action?.targetId).toBe(VALID_TARGET_ID);
    });

    it('should submit wait action successfully', () => {
      const manager = createActionManager();

      const result = manager.submitAction('wait');

      expect(result.success).toBe(true);
      expect(result.action?.type).toBe('wait');
      expect(manager.hasSubmittedAction).toBe(true);
    });

    it('should prevent double submission in same round', () => {
      const manager = createActionManager();

      manager.submitAction('wait');
      const result = manager.submitAction('move', { targetPosition: VALID_POSITION });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Action already submitted this round');
      expect(manager.submittedAction?.type).toBe('wait'); // First action preserved
    });

    it('should store submission timestamp', () => {
      const manager = createActionManager();
      const beforeTime = Date.now();

      manager.submitAction('wait');

      const afterTime = Date.now();
      expect(manager.actionSubmissionTime).toBeGreaterThanOrEqual(beforeTime);
      expect(manager.actionSubmissionTime).toBeLessThanOrEqual(afterTime);
    });

    it('should add action to history', () => {
      const manager = createActionManager();

      manager.submitAction('wait');
      manager.clearAction();
      manager.submitAction('move', { targetPosition: VALID_POSITION });

      expect(manager.actionHistory).toHaveLength(2);
      expect(manager.actionHistory[0]?.type).toBe('wait');
      expect(manager.actionHistory[1]?.type).toBe('move');
    });
  });

  describe('action validation requirements', () => {
    it('should reject move action without target position', () => {
      const manager = createActionManager();

      const result = manager.submitAction('move');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Move action requires target position');
    });

    it('should reject attack action without target ID', () => {
      const manager = createActionManager();

      const result = manager.submitAction('attack');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Attack action requires target ID');
    });

    it('should reject ability action without ability ID', () => {
      const manager = createActionManager();

      const result = manager.submitAction('ability');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Ability action requires ability ID');
    });

    it('should accept wait action without parameters', () => {
      const manager = createActionManager();

      const result = manager.submitAction('wait');

      expect(result.success).toBe(true);
    });

    it('should reject unknown action types', () => {
      const manager = createActionManager();

      const result = manager.submitAction('invalid');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Unknown action type: invalid');
    });
  });

  describe('action validation against game state', () => {
    it('should validate action successfully with valid game state', () => {
      const manager = createActionManager();
      const validator = createMockValidator();

      manager.submitAction('wait');
      const result = manager.validateAction(validator);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should fail validation with invalid game state', () => {
      const manager = createActionManager();
      const validator = createMockValidator();
      validator.shouldReturnValid = false;
      validator.validationReason = 'Target is out of range';

      manager.submitAction('attack', { targetId: VALID_TARGET_ID });
      const result = manager.validateAction(validator);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Target is out of range');
    });

    it('should fail validation when no action submitted', () => {
      const manager = createActionManager();
      const validator = createMockValidator();

      const result = manager.validateAction(validator);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('No action submitted');
    });
  });

  describe('action management', () => {
    it('should clear action successfully', () => {
      const manager = createActionManager();

      manager.submitAction('wait');
      manager.clearAction();

      expect(manager.hasSubmittedAction).toBe(false);
      expect(manager.submittedAction).toBe(null);
      expect(manager.actionSubmissionTime).toBe(null);
    });

    it('should update action parameters successfully', () => {
      const manager = createActionManager();
      const newPosition = { q: 2, r: -1, s: -1 };

      manager.submitAction('move', { targetPosition: VALID_POSITION });
      const result = manager.updateAction({ targetPosition: newPosition });

      expect(result.success).toBe(true);
      expect(result.action?.targetPosition).toEqual(newPosition);
      expect(manager.submittedAction?.targetPosition).toEqual(newPosition);
    });

    it('should update action timestamp when updating', () => {
      const manager = createActionManager();

      manager.submitAction('attack', { targetId: VALID_TARGET_ID });
      const originalTime = manager.actionSubmissionTime;

      // Small delay to ensure timestamp difference
      setTimeout(() => {
        manager.updateAction({ targetId: 'new-target' });
        expect(manager.actionSubmissionTime).toBeGreaterThan(originalTime!);
      }, 1);
    });

    it('should fail to update when no action submitted', () => {
      const manager = createActionManager();

      const result = manager.updateAction({ targetId: 'new-target' });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('No action to update');
    });

    it('should validate update with proper action type context', () => {
      const manager = createActionManager();

      // Submit move action first
      manager.submitAction('move', { targetPosition: VALID_POSITION });

      // Try to update with invalid move parameter (undefined position)
      const result = manager.updateAction({ targetPosition: undefined });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Move action requires target position');
    });
  });

  describe('action priority system', () => {
    it('should return correct priority for wait action', () => {
      const manager = createActionManager();

      manager.submitAction('wait');

      expect(manager.getActionPriority()).toBe(4);
    });

    it('should return correct priority for move action', () => {
      const manager = createActionManager();

      manager.submitAction('move', { targetPosition: VALID_POSITION });

      expect(manager.getActionPriority()).toBe(3);
    });

    it('should return correct priority for ability action', () => {
      const manager = createActionManager();

      manager.submitAction('ability', { abilityId: VALID_ABILITY_ID });

      expect(manager.getActionPriority()).toBe(2);
    });

    it('should return correct priority for attack action', () => {
      const manager = createActionManager();

      manager.submitAction('attack', { targetId: VALID_TARGET_ID });

      expect(manager.getActionPriority()).toBe(1);
    });

    it('should return zero priority when no action submitted', () => {
      const manager = createActionManager();

      expect(manager.getActionPriority()).toBe(0);
    });
  });

  describe('action readiness', () => {
    it('should be ready when action is submitted', () => {
      const manager = createActionManager();

      manager.submitAction('wait');

      expect(manager.isActionReady()).toBe(true);
    });

    it('should not be ready when no action submitted', () => {
      const manager = createActionManager();

      expect(manager.isActionReady()).toBe(false);
    });

    it('should not be ready after clearing action', () => {
      const manager = createActionManager();

      manager.submitAction('wait');
      manager.clearAction();

      expect(manager.isActionReady()).toBe(false);
    });
  });

  describe('action statistics', () => {
    it('should track action statistics correctly', () => {
      const manager = createActionManager();

      manager.submitAction('wait');
      manager.clearAction();
      manager.submitAction('move', { targetPosition: VALID_POSITION });
      manager.clearAction();
      manager.submitAction('attack', { targetId: VALID_TARGET_ID });
      manager.clearAction();
      manager.submitAction('wait');

      const stats = manager.getActionStats();

      expect(stats.totalActions).toBe(4);
      expect(stats.actionsByType.wait).toBe(2);
      expect(stats.actionsByType.move).toBe(1);
      expect(stats.actionsByType.attack).toBe(1);
      expect(stats.actionsByType.ability).toBe(0);
    });

    it('should return zero stats for new manager', () => {
      const manager = createActionManager();

      const stats = manager.getActionStats();

      expect(stats.totalActions).toBe(0);
      expect(stats.actionsByType.wait).toBe(0);
      expect(stats.actionsByType.move).toBe(0);
      expect(stats.actionsByType.attack).toBe(0);
      expect(stats.actionsByType.ability).toBe(0);
    });
  });

  describe('encounter reset', () => {
    it('should reset all state for new encounter', () => {
      const manager = createActionManager();

      // Set up some state
      manager.submitAction('attack', { targetId: VALID_TARGET_ID });

      manager.resetForEncounter();

      expect(manager.hasSubmittedAction).toBe(false);
      expect(manager.submittedAction).toBe(null);
      expect(manager.actionSubmissionTime).toBe(null);
      expect(manager.actionHistory).toHaveLength(0);
    });

    it('should allow new submissions after reset', () => {
      const manager = createActionManager();

      manager.submitAction('wait');
      manager.resetForEncounter();

      const result = manager.submitAction('move', { targetPosition: VALID_POSITION });

      expect(result.success).toBe(true);
      expect(manager.hasSubmittedAction).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle multiple clear attempts gracefully', () => {
      const manager = createActionManager();

      manager.submitAction('wait');
      manager.clearAction();
      manager.clearAction(); // Second clear should not error

      expect(manager.hasSubmittedAction).toBe(false);
    });

    it('should handle validation without validator gracefully', () => {
      const manager = createActionManager();
      manager.submitAction('wait');

      // This would typically be caught by TypeScript, but test runtime behavior
      expect(() => {
        // @ts-expect-error - Testing invalid validator
        manager.validateAction(null);
      }).toThrow();
    });

    it('should preserve action data integrity during updates', () => {
      const manager = createActionManager();
      const originalAction = {
        targetId: VALID_TARGET_ID,
        abilityId: VALID_ABILITY_ID,
      };

      manager.submitAction('ability', originalAction);
      manager.updateAction({ targetId: 'new-target' });

      // Should preserve ability ID while updating target ID
      expect(manager.submittedAction?.abilityId).toBe(VALID_ABILITY_ID);
      expect(manager.submittedAction?.targetId).toBe('new-target');
      expect(manager.submittedAction?.type).toBe('ability');
    });

    it('should handle rapid successive submissions correctly', () => {
      const manager = createActionManager();

      const result1 = manager.submitAction('wait');
      const result2 = manager.submitAction('move', { targetPosition: VALID_POSITION });
      const result3 = manager.submitAction('attack', { targetId: VALID_TARGET_ID });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);
      expect(manager.submittedAction?.type).toBe('wait'); // First action wins
    });

    it('should maintain state consistency after failed updates', () => {
      const manager = createActionManager();

      // Successful submission of move action
      manager.submitAction('move', { targetPosition: VALID_POSITION });
      const originalSubmissionTime = manager.actionSubmissionTime;
      const originalAction = manager.submittedAction;

      // Failed update - try to clear required position
      const result = manager.updateAction({ targetPosition: undefined });

      // Update should fail
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Move action requires target position');

      // State should be unchanged after failed update
      expect(manager.actionSubmissionTime).toBe(originalSubmissionTime);
      expect(manager.submittedAction).toEqual(originalAction);
    });
  });

  describe('action parameter validation edge cases', () => {
    it('should accept optional parameters for ability actions', () => {
      const manager = createActionManager();

      const result = manager.submitAction('ability', {
        abilityId: VALID_ABILITY_ID,
        // No target ID - should be allowed for self-target abilities
      });

      expect(result.success).toBe(true);
      expect(result.action?.targetId).toBeUndefined();
    });

    it('should reject empty string parameters', () => {
      const manager = createActionManager();

      // Empty string should be rejected (validation must check for empty strings)
      const result = manager.submitAction('attack', {
        targetId: '',
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Attack action requires target ID');
    });

    it('should reject undefined parameters', () => {
      const manager = createActionManager();

      // Undefined should also be rejected
      const result1 = manager.submitAction('attack', {
        targetId: undefined,
      });

      const result2 = manager.submitAction('move', {
        targetPosition: undefined,
      });

      expect(result1.success).toBe(false);
      expect(result1.reason).toBe('Attack action requires target ID');

      expect(result2.success).toBe(false);
      expect(result2.reason).toBe('Move action requires target position');
    });
  });
});
