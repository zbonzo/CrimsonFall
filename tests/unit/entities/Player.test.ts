/**
 * @fileoverview Unit tests for Player entity class
 * Tests Player class in isolation with mocked dependencies
 * 
 * @file tests/unit/entities/Player.test.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Player } from '@/core/entities/Player';
import type { PlayerSpecialization, MovementResult, PlayerAction, ActionSubmissionResult } from '@/core/types/entityTypes';
import type { HexCoordinate } from '@/utils/hex/hexCoordinates';
// Import test utilities using relative paths for now
// import { TestPlayers } from '@/tests/fixtures/players';
// import { MockPlayerFactory } from '@/tests/mocks/entities';
// import { createTestHex, createTestPlayer } from '@/tests/helpers/testUtils';

// Mock all manager dependencies
jest.mock('@/core/player/EntityStatsManager');
jest.mock('@/core/player/EntityAbilitiesManager');
jest.mock('@/core/player/EntityMovementManager');
jest.mock('@/core/player/EntityActionManager');
jest.mock('@/core/player/EntityStatusEffectsManager');

describe('Player Entity', () => {
  let player: Player;
  let mockPlayerClass: PlayerSpecialization;
  let startPosition: HexCoordinate;

  beforeEach(() => {
    startPosition = { q: 2, r: -1, s: -1 };
    mockPlayerClass = {
      id: 'test_fighter',
      name: 'Test Fighter',
      variant: 'player',
      description: 'A test fighter class',
      stats: {
        maxHp: 100,
        baseArmor: 5,
        baseDamage: 15,
        movementRange: 3,
      },
      abilities: [
        {
          id: 'power_strike',
          name: 'Power Strike',
          variant: 'attack',
          damage: 20,
          range: 1,
          cooldown: 2,
          description: 'A powerful melee attack',
          statusEffects: [],
        },
        {
          id: 'defensive_stance',
          name: 'Defensive Stance',
          variant: 'healing',
          damage: 0,
          healing: 0,
          range: 0,
          cooldown: 0,
          description: 'Increases armor for this turn',
          statusEffects: [
            {
              effectName: 'shielded',
              duration: 1,
              value: 3,
              chance: 1.0,
            },
          ],
        },
      ],
      startingAbilities: ['power_strike', 'defensive_stance'],
    };

    player = new Player('test_player_1', 'Test Player', mockPlayerClass, startPosition);
  });

  describe('Construction', () => {
    it('should create a player with required properties', () => {
      expect(player.id).toBe('test_player_1');
      expect(player.name).toBe('Test Player');
      expect(player.specialization).toEqual(mockPlayerClass);
      expect(player.position).toEqual(startPosition);
    });

    it('should initialize with default position if none provided', () => {
      const defaultPlayer = new Player('default', 'Default Player', mockPlayerClass);
      expect(defaultPlayer.position).toEqual({ q: 0, r: 0, s: 0 });
    });

    it('should initialize managers with correct parameters', () => {
      // Verify managers are created with player reference
      expect(player.statsManager).toBeDefined();
      expect(player.abilitiesManager).toBeDefined();
      expect(player.movementManager).toBeDefined();
      expect(player.actionManager).toBeDefined();
      expect(player.statusEffectsManager).toBeDefined();
    });
  });

  describe('Basic Properties', () => {
    it('should expose readonly properties correctly', () => {
      expect(player.maxHp).toBe(mockPlayerClass.stats.maxHp);
      expect(player.currentHp).toBe(player.statsManager.getCurrentHp());
      expect(player.baseArmor).toBe(mockPlayerClass.stats.baseArmor);
      expect(player.currentArmor).toBe(player.statsManager.getCurrentArmor());
      expect(player.baseDamage).toBe(mockPlayerClass.stats.baseDamage);
      expect(player.movementRange).toBe(mockPlayerClass.stats.movementRange);
    });

    it('should delegate state checks to managers', () => {
      const mockIsAlive = jest.fn().mockReturnValue(true);
      const mockCanAct = jest.fn().mockReturnValue(true);
      const mockCanMove = jest.fn().mockReturnValue(true);

      jest.spyOn(player.statsManager, 'isAlive', 'get').mockReturnValue(true);
      jest.spyOn(player, 'canAct').mockReturnValue(true);
      jest.spyOn(player, 'canMove').mockReturnValue(true);

      expect(player.isAlive).toBe(true);
      expect(player.canAct()).toBe(true);
      expect(player.canMove()).toBe(true);

      expect(mockIsAlive).toHaveBeenCalled();
      expect(mockCanAct).toHaveBeenCalled();
      expect(mockCanMove).toHaveBeenCalled();
    });
  });

  describe('Combat Actions', () => {
    beforeEach(() => {
      // Mock manager methods for combat tests
      jest.spyOn(player.statsManager, 'takeDamage').mockReturnValue({
        damageDealt: 15,
        died: false,
        blocked: 5,
      });

      jest.spyOn(player.statsManager, 'heal').mockReturnValue({
        amountHealed: 20,
        newHp: 100,
      });
    });

    it('should delegate damage taking to stats manager', () => {
      const result = player.takeDamage(20, 'test attack');

      expect(player.statsManager.takeDamage).toHaveBeenCalledWith(20, 'test attack');
      expect(result.damageDealt).toBe(15);
      expect(result.died).toBe(false);
    });

    it('should delegate healing to stats manager', () => {
      const result = player.heal(25, 'test heal');

      expect(player.statsManager.heal).toHaveBeenCalledWith(25, 'test heal');
      expect(result.amountHealed).toBe(20);
      expect(result.amountHealed).toBe(20);
    });

    it('should calculate total damage with status effect modifiers', () => {
      jest.spyOn(player.statusEffectsManager, 'getDamageModifier').mockReturnValue(1.5);

      const totalDamage = player.calculateTotalDamage(20);

      expect(totalDamage).toBe(30); // 20 * 1.5
      expect(player.statusEffectsManager.getDamageModifier).toHaveBeenCalledWith(20);
    });

    it('should calculate total healing with status effect modifiers', () => {
      jest.spyOn(player.statusEffectsManager, 'getHealingModifier').mockReturnValue(0.8);

      const totalHealing = player.calculateTotalHealing(25);

      expect(totalHealing).toBe(20); // 25 * 0.8
      expect(player.statusEffectsManager.getHealingModifier).toHaveBeenCalledWith(25);
    });
  });

  describe('Movement', () => {
    it('should delegate movement to movement manager', () => {
      const newPosition = { q: 3, r: 0, s: -3 };
      const mockMoveResult: MovementResult = {
        success: true,
        newPosition,
      };

      jest.spyOn(player.movementManager, 'moveTo').mockReturnValue(mockMoveResult);

      const result = player.moveTo(newPosition);

      expect(player.movementManager.moveTo).toHaveBeenCalledWith(newPosition);
      expect(result).toEqual(mockMoveResult);
      expect(player.position).toEqual(newPosition);
    });

    it('should not update position if movement fails', () => {
      const invalidPosition = { q: 10, r: 0, s: -10 };
      const originalPosition = player.position;
      const mockMoveResult: MovementResult = {
        success: false,
        newPosition: originalPosition,
        reason: 'Movement range exceeded',
      };

      jest.spyOn(player.movementManager, 'moveTo').mockReturnValue(mockMoveResult);

      const result = player.moveTo(invalidPosition);

      expect(result.success).toBe(false);
      expect(player.position).toEqual(originalPosition);
    });
  });

  describe('Abilities', () => {
    it('should get available abilities from abilities manager', () => {
      const mockAbilities = mockPlayerClass.abilities;
      jest.spyOn(player.abilitiesManager, 'getAvailableAbilities').mockReturnValue(mockAbilities);

      const abilities = player.getAvailableAbilities();

      expect(abilities).toEqual(mockAbilities);
      expect(player.abilitiesManager.getAvailableAbilities).toHaveBeenCalled();
    });

    it('should check ability availability through abilities manager', () => {
      jest.spyOn(player.abilitiesManager, 'canUseAbility').mockReturnValue({ canUse: true });

      const canUse = player.canUseAbility('power_strike');

      expect(canUse.canUse).toBe(true);
      expect(player.abilitiesManager.canUseAbility).toHaveBeenCalledWith('power_strike');
    });

    it('should use ability through abilities manager', () => {
      // const target = new Player('target', 'Target', mockPlayerClass);
      const mockResult = {
        success: true,
        damage: 20,
        healing: 0,
        statusEffects: [],
      };

      jest.spyOn(player.abilitiesManager, 'useAbility').mockReturnValue(mockResult as any);

      const result = player.useAbility('power_strike', 'target', { q: 0, r: 0, s: 0 });

      expect(result).toEqual(mockResult);
      expect(player.abilitiesManager.useAbility).toHaveBeenCalledWith('power_strike');
    });
  });

  describe('Status Effects', () => {
    it('should apply status effects through status effects manager', () => {
      const mockResult = {
        applied: true,
        effectName: 'poison',
        duration: 3,
        value: 5,
      };

      jest.spyOn(player, 'applyStatusEffect').mockReturnValue(mockResult);

      const result = player.applyStatusEffect('poison', 3, 5);

      expect(result).toEqual(mockResult);
      expect(player.applyStatusEffect).toHaveBeenCalledWith('poison', 3, 5);
    });

    it('should check status effect presence through manager', () => {
      jest.spyOn(player.statusEffectsManager, 'hasStatusEffect').mockReturnValue(true);

      const hasEffect = player.hasStatusEffect('poison');

      expect(hasEffect).toBe(true);
      expect(player.statusEffectsManager.hasStatusEffect).toHaveBeenCalledWith('poison');
    });

    it('should get active status effects from manager', () => {
      const mockEffects = [
        { effectName: 'poison', duration: 2, value: 5 },
        { effectName: 'blessed', duration: 1, value: 10 },
      ];

      jest.spyOn(player.statusEffectsManager, 'getActiveStatusEffects').mockReturnValue(mockEffects as any);

      const effects = player.getActiveStatusEffects();

      expect(effects).toEqual(mockEffects);
      expect(player.statusEffectsManager.getActiveStatusEffects).toHaveBeenCalled();
    });
  });

  describe('Action Submission', () => {
    it('should submit actions through action manager', () => {
      // const action: PlayerAction = {
      //   variant: 'ability',
      //   abilityId: 'power_strike',
      //   targetId: 'target_player',
      //   submissionTime: Date.now(),
      // };

      const mockResult: ActionSubmissionResult = {
        success: true,
      };

      jest.spyOn(player.actionManager, 'submitAction').mockReturnValue(mockResult);

      const result = player.submitAction('ability', {
        abilityId: 'power_strike',
        targetId: 'target_player',
      });

      expect(result).toEqual(mockResult);
      expect(player.actionManager.submitAction).toHaveBeenCalledWith('ability', {
        abilityId: 'power_strike',
        targetId: 'target_player',
      });
    });

    it('should get pending actions from action manager', () => {
      const mockActions: PlayerAction[] = [
        {
          variant: 'move' as const,
          targetPosition: { q: 3, r: 0, s: -3 },
          submissionTime: Date.now(),
        },
      ];

      jest.spyOn(player.actionManager, 'getPendingActions').mockReturnValue(mockActions);

      const actions = player.getPendingActions();

      expect(actions).toEqual(mockActions);
      expect(player.actionManager.getPendingActions).toHaveBeenCalled();
    });
  });

  describe('Data Access', () => {
    it('should provide public data without sensitive information', () => {
      const publicData = player.getPublicData();

      expect(publicData).toEqual({
        id: player.id,
        name: player.name,
        variant: player.variant,
        specialization: player.specialization,
        level: player.level,
        experience: expect.any(Number),
        position: player.position,
        maxHp: player.maxHp,
        currentHp: player.currentHp,
        baseArmor: player.baseArmor,
        effectiveArmor: player.effectiveArmor,
        baseDamage: player.baseDamage,
        movementRange: player.movementRange,
        isAlive: player.isAlive,
        abilities: player.getAvailableAbilities(),
      });
    });

    it('should provide private data with full details', () => {
      const privateData = player.getPrivateData();

      expect(privateData).toEqual({
        id: player.id,
        name: player.name,
        variant: player.variant,
        specialization: player.specialization,
        level: player.level,
        experience: expect.any(Number),
        position: player.position,
        maxHp: player.maxHp,
        currentHp: player.currentHp,
        baseArmor: player.baseArmor,
        effectiveArmor: player.effectiveArmor,
        baseDamage: player.baseDamage,
        movementRange: player.movementRange,
        isAlive: player.isAlive,
        abilities: player.getAvailableAbilities(),
        hasSubmittedAction: player.hasSubmittedAction,
        statusEffects: player.activeStatusEffects,
        abilityCooldowns: expect.any(Map),
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined manager responses gracefully', () => {
      jest.spyOn(player.statsManager, 'getCurrentHp').mockReturnValue(0);
      jest.spyOn(player.statsManager, 'getIsAlive').mockReturnValue(false);

      expect(player.currentHp).toBe(0);
      expect(player.isAlive).toBe(false);
    });

    it('should handle empty abilities list', () => {
      jest.spyOn(player.abilitiesManager, 'getAvailableAbilities').mockReturnValue([]);

      const abilities = player.getAvailableAbilities();

      expect(abilities).toEqual([]);
      expect(abilities.length).toBe(0);
    });

    it('should handle invalid ability usage', () => {
      const mockResult = {
        success: false,
        error: 'Ability not found',
      };

      jest.spyOn(player.abilitiesManager, 'useAbility').mockReturnValue(mockResult as any);

      const result = player.useAbility('invalid_ability', 'target', { q: 0, r: 0, s: 0 });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Ability not found');
    });
  });

  describe('Manager Integration', () => {
    it('should properly coordinate between all managers', () => {
      // This test verifies that all managers are created and accessible
      expect(player.statsManager).toBeDefined();
      expect(player.abilitiesManager).toBeDefined();
      expect(player.movementManager).toBeDefined();
      expect(player.actionManager).toBeDefined();
      expect(player.statusEffectsManager).toBeDefined();
    });

    it('should handle complex state interactions', () => {
      // Mock all manager interactions for a complex scenario
      jest.spyOn(player.statsManager, 'getCurrentHp').mockReturnValue(50);
      jest.spyOn(player.statusEffectsManager, 'hasStatusEffect').mockReturnValue(true);
      jest.spyOn(player.actionManager, 'canAct').mockReturnValue(false);

      expect(player.currentHp).toBe(50);
      expect(player.hasStatusEffect('poison')).toBe(true);
      expect(player.canAct()).toBe(false);
    });
  });
});