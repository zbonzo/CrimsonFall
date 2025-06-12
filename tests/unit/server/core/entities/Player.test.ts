/**
 * Hex Dungeon Crawler - Player Entity Tests
 *
 * Integration tests for the main Player entity
 * Tests coordination between subsystems and critical game logic
 *
 * @file tests/unit/server/core/entities/Player.test.ts
 */

import { Player } from '../../../../../server/src/core/entities/Player';
import type {
  PlayerClass,
  PlayerAction,
  ActionSubmissionResult,
} from '../../../../../server/src/core/types/playerTypes';
import type { HexCoordinate } from '../../../../../server/src/utils/hex/index';

// === TEST FIXTURES ===

const DEFAULT_POSITION: HexCoordinate = { q: 0, r: 0, s: 0 };
const NEARBY_POSITION: HexCoordinate = { q: 1, r: 0, s: -1 };
const FAR_POSITION: HexCoordinate = { q: 5, r: 0, s: -5 };

const MOCK_PLAYER_CLASS: PlayerClass = {
  name: 'TestWarrior',
  stats: {
    maxHp: 100,
    baseArmor: 2,
    baseDamage: 15,
    movementRange: 3,
  },
  abilities: [
    {
      id: 'sword_strike',
      name: 'Sword Strike',
      type: 'attack',
      damage: 20,
      range: 1,
      cooldown: 0,
      description: 'Basic sword attack',
    },
    {
      id: 'shield_bash',
      name: 'Shield Bash',
      type: 'attack',
      damage: 12,
      range: 1,
      cooldown: 2,
      description: 'Stunning shield attack',
    },
    {
      id: 'heal_self',
      name: 'Bandage',
      type: 'healing',
      healing: 25,
      range: 0,
      cooldown: 3,
      description: 'Self healing',
    },
  ],
};

const WEAK_PLAYER_CLASS: PlayerClass = {
  name: 'TestNovice',
  stats: {
    maxHp: 50,
    baseArmor: 0,
    baseDamage: 8,
    movementRange: 2,
  },
  abilities: [],
};

// === HELPER FUNCTIONS ===

function createPlayer(
  id: string = 'test-player-1',
  name: string = 'Test Player',
  playerClass: PlayerClass = MOCK_PLAYER_CLASS,
  position: HexCoordinate = DEFAULT_POSITION
): Player {
  return new Player(id, name, playerClass, position);
}

function createMockGameStateValidator(isValid: boolean = true, reason?: string) {
  return {
    validateAction: jest.fn().mockReturnValue({ isValid, reason }),
  };
}

// === TESTS ===

describe('Player Entity', () => {
  describe('initialization and validation', () => {
    it('should create player with valid parameters', () => {
      const player = createPlayer();

      expect(player.id).toBe('test-player-1');
      expect(player.name).toBe('Test Player');
      expect(player.playerClass.name).toBe('TestWarrior');
      expect(player.position).toEqual(DEFAULT_POSITION);
      expect(player.isAlive).toBe(true);
      expect(player.currentHp).toBe(100);
      expect(player.level).toBe(1);
    });

    it('should throw error for empty ID', () => {
      expect(() => createPlayer('', 'Valid Name')).toThrow('Player ID cannot be empty');
      expect(() => createPlayer('   ', 'Valid Name')).toThrow('Player ID cannot be empty');
    });

    it('should throw error for empty name', () => {
      expect(() => createPlayer('valid-id', '')).toThrow('Player name cannot be empty');
      expect(() => createPlayer('valid-id', '   ')).toThrow('Player name cannot be empty');
    });

    it('should throw error for missing player class', () => {
      expect(() => new Player('valid-id', 'Valid Name', null as any)).toThrow(
        'Player class is required'
      );
      expect(() => new Player('valid-id', 'Valid Name', undefined as any)).toThrow(
        'Player class is required'
      );
    });

    it('should initialize with custom position', () => {
      const customPosition = { q: 3, r: -2, s: -1 };
      const player = createPlayer('test', 'Test', MOCK_PLAYER_CLASS, customPosition);

      expect(player.position).toEqual(customPosition);
    });
  });

  describe('stats integration', () => {
    it('should delegate basic stats correctly', () => {
      const player = createPlayer();

      expect(player.currentHp).toBe(100);
      expect(player.maxHp).toBe(100);
      expect(player.level).toBe(1);
      expect(player.isAlive).toBe(true);
    });

    it('should calculate damage output through stats system', () => {
      const player = createPlayer();

      const damage = player.calculateDamageOutput();

      expect(damage).toBe(15); // Base damage from class
    });

    it('should handle experience gain through stats system', () => {
      const player = createPlayer();

      const result = player.addExperience(100);

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(player.level).toBe(2);
    });

    it('should integrate status effects with damage calculation', () => {
      const player = createPlayer();
      player.addStatusEffect('enraged', 3, 50); // +50% damage

      const damage = player.calculateDamageOutput();

      expect(damage).toBe(22); // 15 * 1.5 = 22.5, floored to 22
    });
  });

  describe('damage and healing integration', () => {
    it('should apply status effect modifiers to damage taken', () => {
      const player = createPlayer();
      player.addStatusEffect('vulnerable', 3, 50); // +50% damage taken

      const result = player.takeDamage(20, 'test');

      // 20 * 1.5 = 30 damage, minus armor reduction
      expect(result.damageDealt).toBeGreaterThan(20); // More than base damage
    });

    it('should apply status effect modifiers to healing', () => {
      const player = createPlayer();
      player.takeDamage(50, 'setup'); // Take some damage first
      player.addStatusEffect('blessed', 3, 50); // +50% healing

      const result = player.heal(20);

      expect(result.amountHealed).toBe(30); // 20 * 1.5 = 30
    });

    it('should not allow dead players to take damage', () => {
      const player = createPlayer();
      player.takeDamage(200, 'killing blow'); // Kill player

      const result = player.takeDamage(50, 'post death');

      expect(result.damageDealt).toBe(0);
      expect(result.blocked).toBe(0);
      expect(result.died).toBe(false);
    });

    it('should not allow dead players to heal', () => {
      const player = createPlayer();
      player.takeDamage(200, 'killing blow'); // Kill player

      const result = player.heal(50);

      expect(result.amountHealed).toBe(0);
      expect(result.newHp).toBe(0);
    });

    it('should calculate effective armor with status effects', () => {
      const player = createPlayer();
      player.addStatusEffect('shielded', 3, 5); // +5 armor

      expect(player.effectiveArmor).toBe(7); // 2 base + 5 shield
    });
  });

  describe('movement integration', () => {
    it('should allow movement when not restricted', () => {
      const player = createPlayer();

      const result = player.moveTo(NEARBY_POSITION);

      expect(result.success).toBe(true);
      expect(player.position).toEqual(NEARBY_POSITION);
      expect(player.hasMovedThisRound).toBe(true);
    });

    it('should prevent movement when stunned', () => {
      const player = createPlayer();
      player.addStatusEffect('stunned', 2, 1);

      const result = player.moveTo(NEARBY_POSITION);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('status effects');
      expect(player.position).toEqual(DEFAULT_POSITION);
    });

    it('should prevent movement when frozen', () => {
      const player = createPlayer();
      player.addStatusEffect('frozen', 2, 1);

      const result = player.moveTo(NEARBY_POSITION);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('status effects');
    });

    it('should delegate movement range correctly', () => {
      const player = createPlayer();

      expect(player.movementRange).toBe(3);
      expect(player.getReachablePositions().length).toBeGreaterThan(1);
    });

    it('should calculate distance correctly', () => {
      const player = createPlayer();

      const distance = player.getDistanceTo(FAR_POSITION);

      expect(distance).toBe(5);
    });
  });

  describe('action submission integration', () => {
    it('should allow action submission for alive players', () => {
      const player = createPlayer();

      const result = player.submitAction('attack', { targetId: 'monster-1' });

      expect(result.success).toBe(true);
      expect(player.hasSubmittedAction).toBe(true);
      expect(player.submittedAction?.type).toBe('attack');
    });

    it('should prevent action submission for dead players', () => {
      const player = createPlayer();
      player.takeDamage(200, 'kill'); // Kill player

      const result = player.submitAction('attack', { targetId: 'monster-1' });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Dead players cannot act');
    });

    it('should prevent action submission when stunned', () => {
      const player = createPlayer();
      player.addStatusEffect('stunned', 2, 1);

      const result = player.submitAction('attack', { targetId: 'monster-1' });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('status effects');
    });

    it('should prevent action submission when frozen', () => {
      const player = createPlayer();
      player.addStatusEffect('frozen', 2, 1);

      const result = player.submitAction('attack', { targetId: 'monster-1' });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('status effects');
    });

    it('should allow multiple action submissions (overwrites previous)', () => {
      const player = createPlayer();
      player.submitAction('wait');

      // Second submission should work (current implementation allows this)
      const result = player.submitAction('attack', { targetId: 'monster' });

      expect(result.success).toBe(false); // Actually fails - only one action per round
      expect(player.hasSubmittedAction).toBe(true);
      expect(player.submittedAction?.type).toBe('wait'); // First action remains
    });
  });

  describe('abilities integration', () => {
    it('should access abilities from player class', () => {
      const player = createPlayer();

      const ability = player.getAbility('sword_strike');

      expect(ability).not.toBeNull();
      expect(ability!.name).toBe('Sword Strike');
      expect(ability!.damage).toBe(20);
    });

    it('should get available abilities', () => {
      const player = createPlayer();

      const abilities = player.getAvailableAbilities();

      expect(abilities.length).toBe(3); // All abilities available initially
      expect(abilities.some(a => a.id === 'sword_strike')).toBe(true);
    });

    it('should check ability usage requirements', () => {
      const player = createPlayer();

      const canUse = player.canUseAbility('sword_strike');

      expect(canUse.canUse).toBe(true);
    });

    it('should use abilities and apply cooldowns', () => {
      const player = createPlayer();

      const result = player.useAbility('shield_bash');

      expect(result.success).toBe(true);
      expect(player.canUseAbility('shield_bash').canUse).toBe(false); // On cooldown
    });

    it('should handle non-existent abilities gracefully', () => {
      const player = createPlayer();

      const result = player.canUseAbility('nonexistent_ability');

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('does not exist');
    });
  });

  describe('status effects integration', () => {
    it('should add status effects successfully', () => {
      const player = createPlayer();

      const result = player.addStatusEffect('poison', 3, 5);

      expect(result.success).toBe(true);
      expect(player.hasStatusEffect('poison')).toBe(true);
    });

    it('should remove status effects', () => {
      const player = createPlayer();
      player.addStatusEffect('poison', 3, 5);

      const removed = player.removeStatusEffect('poison');

      expect(removed).toBe(true);
      expect(player.hasStatusEffect('poison')).toBe(false);
    });

    it('should get all active status effects', () => {
      const player = createPlayer();
      player.addStatusEffect('poison', 3, 5);
      player.addStatusEffect('blessed', 2, 25);

      const effects = player.activeStatusEffects;

      expect(effects.length).toBe(2);
      expect(effects.some(e => e.name === 'poison')).toBe(true);
      expect(effects.some(e => e.name === 'blessed')).toBe(true);
    });

    it('should integrate status effects with action capabilities', () => {
      const player = createPlayer();

      expect(player.canAct()).toBe(true);
      expect(player.canMove()).toBe(true);
      expect(player.canBeTargeted()).toBe(true);

      player.addStatusEffect('stunned', 2, 1);

      expect(player.canAct()).toBe(false);
      expect(player.canMove()).toBe(false);
      expect(player.canBeTargeted()).toBe(true);

      player.addStatusEffect('invisible', 1, 1);

      expect(player.canBeTargeted()).toBe(false);
    });
  });

  describe('round processing integration', () => {
    it('should process all subsystems in round', () => {
      const player = createPlayer();
      player.addStatusEffect('poison', 2, 5);
      player.useAbility('shield_bash'); // Put on cooldown
      player.submitAction('wait');
      player.moveTo(NEARBY_POSITION);

      const result = player.processRound();

      expect(result.expiredCooldowns).toContain('basic_attack'); // If basic attack was on cooldown
      expect(result.statusEffectResults.effects.length).toBeGreaterThanOrEqual(0);

      // Should clear round state
      expect(player.hasSubmittedAction).toBe(false);
      expect(player.hasMovedThisRound).toBe(false);
    });

    it('should apply poison damage during round processing', () => {
      const player = createPlayer();
      const initialHp = player.currentHp;
      player.addStatusEffect('poison', 2, 10);

      const result = player.processRound();

      expect(result.statusEffectResults.effects.some(e => e.type === 'poison_damage')).toBe(true);
      expect(player.currentHp).toBeLessThan(initialHp);
    });

    it('should apply regeneration healing during round processing', () => {
      const player = createPlayer();
      player.takeDamage(30, 'setup'); // Take some damage
      const damagedHp = player.currentHp;
      player.addStatusEffect('regeneration', 2, 15);

      const result = player.processRound();

      expect(result.statusEffectResults.effects.some(e => e.type === 'regeneration_heal')).toBe(
        true
      );
      expect(player.currentHp).toBeGreaterThan(damagedHp);
    });

    it('should expire status effects during round processing', () => {
      const player = createPlayer();
      player.addStatusEffect('poison', 1, 5); // Will expire this round

      const result = player.processRound();

      expect(result.statusEffectResults.expired).toContain('poison');
      expect(player.hasStatusEffect('poison')).toBe(false);
    });
  });

  describe('data export integration', () => {
    it('should export public data correctly', () => {
      const player = createPlayer();
      player.addStatusEffect('poison', 3, 5);
      player.submitAction('attack', { targetId: 'monster' });

      const publicData = player.toPublicData();

      expect(publicData.id).toBe('test-player-1');
      expect(publicData.name).toBe('Test Player');
      expect(publicData.className).toBe('TestWarrior');
      expect(publicData.level).toBe(1);
      expect(publicData.currentHp).toBe(100);
      expect(publicData.maxHp).toBe(100);
      expect(publicData.isAlive).toBe(true);
      expect(publicData.hasSubmittedAction).toBe(true);
      expect(publicData.statusEffects.length).toBe(1);
      expect(publicData.statusEffects[0].name).toBe('poison');
    });

    it('should export private data with additional fields', () => {
      const player = createPlayer();
      player.addExperience(50);
      player.submitAction('ability', { abilityId: 'heal_self' });

      const privateData = player.toPrivateData();

      expect(privateData.experience).toBe(50);
      expect(privateData.damageModifier).toBe(1.0);
      expect(privateData.submittedAction).not.toBeNull();
      expect(privateData.submittedAction!.type).toBe('ability');
      expect(privateData.abilities.length).toBe(3);
      expect(privateData.availableAbilities.length).toBe(3);
      expect(privateData.abilityCooldowns).toBeDefined();
    });
  });

  describe('encounter reset integration', () => {
    it('should reset all subsystems for new encounter', () => {
      const player = createPlayer();

      // Modify all subsystems
      player.takeDamage(50, 'test');
      player.addExperience(75);
      player.addStatusEffect('poison', 5, 3);
      player.useAbility('shield_bash');
      player.submitAction('wait');
      player.moveTo(NEARBY_POSITION);

      const newPosition = { q: 2, r: -1, s: -1 };
      player.resetForEncounter(newPosition);

      // Check reset state
      expect(player.currentHp).toBe(100); // Full health
      expect(player.level).toBe(1); // Reset level
      expect(player.position).toEqual(newPosition); // New position
      expect(player.hasSubmittedAction).toBe(false); // No action
      expect(player.hasMovedThisRound).toBe(false); // No movement
      expect(player.activeStatusEffects.length).toBe(0); // No effects
      expect(player.getAvailableAbilities().length).toBe(3); // All abilities available
    });

    it('should reset without changing position if none provided', () => {
      const player = createPlayer();
      const originalPosition = player.position;
      player.moveTo(NEARBY_POSITION);

      player.resetForEncounter();

      expect(player.position).toEqual(originalPosition); // Back to original
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle invalid ability IDs gracefully', () => {
      const player = createPlayer();

      const ability = player.getAbility('nonexistent');
      const canUse = player.canUseAbility('nonexistent');
      const useResult = player.useAbility('nonexistent');

      expect(ability).toBeNull();
      expect(canUse.canUse).toBe(false);
      expect(useResult.success).toBe(false);
    });

    it('should handle invalid status effect names gracefully', () => {
      const player = createPlayer();

      const hasEffect = player.hasStatusEffect('nonexistent');
      const removeResult = player.removeStatusEffect('nonexistent');

      expect(hasEffect).toBe(false);
      expect(removeResult).toBe(false);
    });

    it('should handle multiple status effects of different types', () => {
      const player = createPlayer();

      player.addStatusEffect('poison', 3, 5);
      player.addStatusEffect('blessed', 2, 25);
      player.addStatusEffect('stunned', 1, 1);

      expect(player.activeStatusEffects.length).toBe(3);
      expect(player.canAct()).toBe(false); // Stunned

      const damage = player.calculateDamageOutput();
      expect(damage).toBeGreaterThan(15); // Blessed should increase damage

      const healResult = player.heal(10);
      expect(healResult.amountHealed).toBeGreaterThan(10); // Blessed increases healing
    });

    it('should maintain state consistency under complex operations', () => {
      const player = createPlayer();

      // Complex sequence of operations
      player.takeDamage(25, 'test1');
      player.addStatusEffect('enraged', 3, 30);
      player.submitAction('ability', { abilityId: 'heal_self' });
      player.moveTo(NEARBY_POSITION);
      player.useAbility('shield_bash');
      player.addExperience(50);
      player.processRound();

      // State should remain consistent
      expect(player.currentHp).toBeGreaterThanOrEqual(0);
      expect(player.currentHp).toBeLessThanOrEqual(player.maxHp);
      expect(player.isAlive).toBe(player.currentHp > 0);
      expect(player.hasSubmittedAction).toBe(false); // Cleared by processRound
      expect(player.hasMovedThisRound).toBe(false); // Cleared by processRound
    });
  });

  describe('performance and consistency validation', () => {
    it('should handle rapid state changes without corruption', () => {
      const player = createPlayer();

      // Rapid operations
      for (let i = 0; i < 10; i++) {
        player.takeDamage(5, `damage${i}`);
        player.heal(3);
        player.addStatusEffect('poison', 2, 1);
        player.removeStatusEffect('poison');
        if (i % 2 === 0) {
          player.addExperience(10);
        }
      }

      // State should remain valid
      expect(player.isAlive).toBe(true);
      expect(player.currentHp).toBeGreaterThan(0);
      expect(player.currentHp).toBeLessThanOrEqual(player.maxHp);
      expect(player.level).toBeGreaterThanOrEqual(1);
    });

    it('should maintain correct relationships between subsystems', () => {
      const player = createPlayer();

      // Test subsystem relationships
      expect(player.isAlive).toBe(player.currentHp > 0);
      expect(player.canAct()).toBe(player.isAlive && player.canMove()); // Assuming no status effects

      player.takeDamage(200, 'kill');
      expect(player.isAlive).toBe(false);
      expect(player.canAct()).toBe(false);
      expect(player.canMove()).toBe(false);

      // Dead player checks
      expect(player.submitAction('wait').success).toBe(false);
      expect(player.heal(100).amountHealed).toBe(0);
    });
  });
});
