/**
 * Hex Dungeon Crawler - PlayerAbilitiesManager Tests
 *
 * Unit tests for player abilities and cooldown management system
 * Tests ability definitions, cooldowns, usage validation, and unlocking
 *
 * @file tests/unit/server/core/player/PlayerAbilitiesManager.test.ts
 */

import { PlayerAbilitiesManager } from '../../../../../server/src/core/player/PlayerAbilitiesManager.js';
import type { AbilityDefinition } from '../../../../../server/src/core/types/playerTypes.js';

// === TEST FIXTURES ===

const BASIC_ABILITIES: ReadonlyArray<AbilityDefinition> = [
  {
    id: 'basic_attack',
    name: 'Basic Attack',
    type: 'attack',
    damage: 10,
    range: 1,
    cooldown: 0,
    description: 'A simple melee attack',
  },
  {
    id: 'wait',
    name: 'Wait',
    type: 'utility',
    range: 0,
    cooldown: 0,
    description: 'Skip your turn',
  },
] as const;

const CLASS_ABILITIES: ReadonlyArray<AbilityDefinition> = [
  {
    id: 'fireball',
    name: 'Fireball',
    type: 'attack',
    damage: 20,
    range: 3,
    cooldown: 3,
    description: 'A powerful fire attack',
  },
  {
    id: 'heal',
    name: 'Heal',
    type: 'healing',
    healing: 15,
    range: 2,
    cooldown: 2,
    description: 'Restore health to an ally',
  },
  {
    id: 'shield',
    name: 'Shield',
    type: 'defense',
    range: 1,
    cooldown: 4,
    description: 'Provide temporary armor',
  },
  {
    id: 'teleport',
    name: 'Teleport',
    type: 'utility',
    range: 5,
    cooldown: 5,
    description: 'Instantly move to target location',
  },
] as const;

const TEMPORARY_ABILITY: AbilityDefinition = {
  id: 'temp_boost',
  name: 'Temporary Boost',
  type: 'utility',
  range: 0,
  cooldown: 1,
  description: 'A temporary ability from an item',
};

// === HELPER FUNCTIONS ===

function createAbilitiesManager(
  classAbilities: ReadonlyArray<AbilityDefinition> = []
): PlayerAbilitiesManager {
  return new PlayerAbilitiesManager(classAbilities);
}

// === TESTS ===

describe('PlayerAbilitiesManager', () => {
  describe('initialization', () => {
    test('should initialize with default basic abilities', () => {
      const manager = createAbilitiesManager();

      expect(manager.abilities).toHaveLength(2); // basic_attack + wait
      expect(manager.hasAbility('basic_attack')).toBe(true);
      expect(manager.hasAbility('wait')).toBe(true);
      expect(manager.unlockedAbilities).toHaveLength(2);
      expect(manager.availableAbilities).toHaveLength(2);
    });

    test('should initialize with class abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      expect(manager.abilities).toHaveLength(6); // 2 basic + 4 class
      expect(manager.hasAbility('fireball')).toBe(false); // Not unlocked yet
      expect(manager.getAbility('fireball')).toEqual(CLASS_ABILITIES[0]);
    });

    test('should start with no cooldowns', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      expect(manager.cooldowns).toHaveLength(0);
      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.isOnCooldown('fireball')).toBe(false);
    });
  });

  describe('ability access and retrieval', () => {
    test('should get ability by ID correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const fireball = manager.getAbility('fireball');
      expect(fireball).toEqual(CLASS_ABILITIES[0]);

      const nonexistent = manager.getAbility('nonexistent');
      expect(nonexistent).toBeNull();
    });

    test('should get abilities by type correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      // Unlock all abilities for testing
      CLASS_ABILITIES.forEach(ability => manager.addUnlock(ability.id));

      const attackAbilities = manager.getAbilitiesByType('attack');
      expect(attackAbilities).toHaveLength(2); // basic_attack + fireball

      const healingAbilities = manager.getAbilitiesByType('healing');
      expect(healingAbilities).toHaveLength(1); // heal

      const utilityAbilities = manager.getAbilitiesByType('utility');
      expect(utilityAbilities).toHaveLength(2); // wait + teleport
    });

    test('should check ability ownership correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      expect(manager.hasAbility('basic_attack')).toBe(true);
      expect(manager.hasAbility('fireball')).toBe(false);

      manager.addUnlock('fireball');
      expect(manager.hasAbility('fireball')).toBe(true);
    });
  });

  describe('ability unlocking', () => {
    test('should unlock abilities successfully', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const result = manager.addUnlock('fireball');

      expect(result.success).toBe(true);
      expect(manager.hasAbility('fireball')).toBe(true);
      expect(manager.unlockedAbilities).toContain(manager.getAbility('fireball'));
    });

    test('should reject unlocking nonexistent abilities', () => {
      const manager = createAbilitiesManager();

      const result = manager.addUnlock('nonexistent');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('does not exist');
    });

    test('should reject unlocking already unlocked abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addUnlock('fireball');

      const result = manager.addUnlock('fireball');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('already unlocked');
    });

    test('should remove unlocks correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addUnlock('fireball');

      const removed = manager.removeUnlock('fireball');

      expect(removed).toBe(true);
      expect(manager.hasAbility('fireball')).toBe(false);
      expect(manager.removeUnlock('nonexistent')).toBe(false);
    });
  });

  describe('cooldown management', () => {
    test('should set and get cooldowns correctly', () => {
      const manager = createAbilitiesManager();

      manager.setCooldown('basic_attack', 3);

      expect(manager.getCooldown('basic_attack')).toBe(3);
      expect(manager.isOnCooldown('basic_attack')).toBe(true);
      expect(manager.cooldowns).toContainEqual({
        abilityId: 'basic_attack',
        turnsRemaining: 3,
      });
    });

    test('should clear cooldowns correctly', () => {
      const manager = createAbilitiesManager();
      manager.setCooldown('basic_attack', 3);
      manager.setCooldown('wait', 2);

      const cleared = manager.clearCooldown('basic_attack');

      expect(cleared).toBe(true);
      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.isOnCooldown('basic_attack')).toBe(false);
      expect(manager.getCooldown('wait')).toBe(2); // Other cooldown preserved
    });

    test('should clear all cooldowns correctly', () => {
      const manager = createAbilitiesManager();
      manager.setCooldown('basic_attack', 3);
      manager.setCooldown('wait', 2);

      manager.clearAllCooldowns();

      expect(manager.cooldowns).toHaveLength(0);
      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.getCooldown('wait')).toBe(0);
    });

    test('should handle setting zero cooldown as clear', () => {
      const manager = createAbilitiesManager();
      manager.setCooldown('basic_attack', 3);

      manager.setCooldown('basic_attack', 0);

      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.isOnCooldown('basic_attack')).toBe(false);
    });
  });

  describe('ability usage validation', () => {
    test('should validate ability usage correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addUnlock('fireball');

      const result = manager.canUseAbility('fireball');

      expect(result.canUse).toBe(true);
    });

    test('should reject using nonexistent abilities', () => {
      const manager = createAbilitiesManager();

      const result = manager.canUseAbility('nonexistent');

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('does not exist');
    });

    test('should reject using locked abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const result = manager.canUseAbility('fireball');

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('not unlocked');
    });

    test('should reject using abilities on cooldown', () => {
      const manager = createAbilitiesManager();
      manager.setCooldown('basic_attack', 2);

      const result = manager.canUseAbility('basic_attack');

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('on cooldown');
      expect(result.reason).toContain('2 rounds');
    });

    test('should get available abilities correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addUnlock('fireball');
      manager.addUnlock('heal');
      manager.setCooldown('heal', 1);

      const available = manager.availableAbilities;

      expect(available).toHaveLength(3); // basic_attack, wait, fireball (heal on cooldown)
      expect(available.map(a => a.id)).toContain('fireball');
      expect(available.map(a => a.id)).not.toContain('heal');
    });
  });

  describe('ability usage execution', () => {
    test('should use ability successfully', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addUnlock('fireball');

      const result = manager.useAbility('fireball');

      expect(result.success).toBe(true);
      expect(manager.getCooldown('fireball')).toBe(3); // Fireball has 3 turn cooldown
      expect(manager.getUsageCount('fireball')).toBe(1);
    });

    test('should reject using unavailable abilities', () => {
      const manager = createAbilitiesManager();
      manager.setCooldown('basic_attack', 1);

      const result = manager.useAbility('basic_attack');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('on cooldown');
    });

    test('should handle abilities with no cooldown', () => {
      const manager = createAbilitiesManager();

      const result = manager.useAbility('basic_attack');

      expect(result.success).toBe(true);
      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.getUsageCount('basic_attack')).toBe(1);
    });

    test('should track usage count correctly', () => {
      const manager = createAbilitiesManager();

      manager.useAbility('basic_attack');
      manager.useAbility('basic_attack');
      manager.useAbility('wait');

      expect(manager.getUsageCount('basic_attack')).toBe(2);
      expect(manager.getUsageCount('wait')).toBe(1);
      expect(manager.getUsageCount('nonexistent')).toBe(0);
    });
  });

  describe('temporary abilities', () => {
    test('should add temporary abilities correctly', () => {
      const manager = createAbilitiesManager();

      manager.addAbility(TEMPORARY_ABILITY);

      expect(manager.hasAbility('temp_boost')).toBe(true);
      expect(manager.getAbility('temp_boost')).toEqual(TEMPORARY_ABILITY);
      expect(manager.abilities).toContain(TEMPORARY_ABILITY);
    });

    test('should remove temporary abilities correctly', () => {
      const manager = createAbilitiesManager();
      manager.addAbility(TEMPORARY_ABILITY);

      const removed = manager.removeAbility('temp_boost');

      expect(removed).toBe(true);
      expect(manager.hasAbility('temp_boost')).toBe(false);
      expect(manager.getAbility('temp_boost')).toBeNull();
      expect(manager.getCooldown('temp_boost')).toBe(0);
    });

    test('should not affect class abilities when removing temporary', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addAbility(TEMPORARY_ABILITY);

      manager.removeAbility('temp_boost');

      expect(manager.getAbility('fireball')).toEqual(CLASS_ABILITIES[0]);
      expect(manager.removeAbility('fireball')).toBe(false); // Can't remove class abilities
    });
  });

  describe('round processing', () => {
    test('should process cooldowns correctly', () => {
      const manager = createAbilitiesManager();
      manager.setCooldown('basic_attack', 3);
      manager.setCooldown('wait', 1);

      const expired = manager.processRound();

      expect(expired).toContain('wait');
      expect(expired).not.toContain('basic_attack');
      expect(manager.getCooldown('basic_attack')).toBe(2);
      expect(manager.getCooldown('wait')).toBe(0);
    });

    test('should handle multiple rounds of processing', () => {
      const manager = createAbilitiesManager();
      manager.setCooldown('basic_attack', 2);

      let expired1 = manager.processRound();
      expect(expired1).toHaveLength(0);
      expect(manager.getCooldown('basic_attack')).toBe(1);

      let expired2 = manager.processRound();
      expect(expired2).toContain('basic_attack');
      expect(manager.getCooldown('basic_attack')).toBe(0);
    });

    test('should not affect zero cooldown abilities', () => {
      const manager = createAbilitiesManager();

      const expired = manager.processRound();

      expect(expired).toHaveLength(0);
      expect(manager.getCooldown('basic_attack')).toBe(0);
    });
  });

  describe('damage and healing calculations', () => {
    test('should calculate damage correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const damage1 = manager.calculateDamage('basic_attack');
      expect(damage1).toBe(10); // 10 base damage * 1.0 modifier

      const damage2 = manager.calculateDamage('fireball', 1.5);
      expect(damage2).toBe(30); // 20 base damage * 1.5 modifier

      const damage3 = manager.calculateDamage('heal');
      expect(damage3).toBe(0); // Healing ability has no damage
    });

    test('should calculate healing correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const healing1 = manager.calculateHealing('heal');
      expect(healing1).toBe(15); // 15 base healing * 1.0 modifier

      const healing2 = manager.calculateHealing('heal', 1.2);
      expect(healing2).toBe(18); // 15 base healing * 1.2 modifier

      const healing3 = manager.calculateHealing('fireball');
      expect(healing3).toBe(0); // Attack ability has no healing
    });

    test('should handle abilities without damage or healing', () => {
      const manager = createAbilitiesManager();

      const damage = manager.calculateDamage('wait');
      const healing = manager.calculateHealing('wait');

      expect(damage).toBe(0);
      expect(healing).toBe(0);
    });
  });

  describe('utility methods', () => {
    test('should check if ability requires target', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      expect(manager.isTargetRequired('basic_attack')).toBe(true); // Attack type
      expect(manager.isTargetRequired('heal')).toBe(true); // Healing with range > 0
      expect(manager.isTargetRequired('wait')).toBe(false); // Utility with range 0
      expect(manager.isTargetRequired('nonexistent')).toBe(false);
    });

    test('should reset for encounter correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addUnlock('fireball');
      manager.addAbility(TEMPORARY_ABILITY);
      manager.setCooldown('basic_attack', 3);
      manager.useAbility('wait');

      manager.resetForEncounter();

      // Cooldowns should be cleared
      expect(manager.getCooldown('basic_attack')).toBe(0);

      // Temporary abilities should be removed
      expect(manager.hasAbility('temp_boost')).toBe(false);

      // Usage counts should be reset
      expect(manager.getUsageCount('wait')).toBe(0);

      // Basic abilities should be restored
      expect(manager.hasAbility('basic_attack')).toBe(true);
      expect(manager.hasAbility('wait')).toBe(true);

      // Class unlocks should be cleared
      expect(manager.hasAbility('fireball')).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle negative cooldown values', () => {
      const manager = createAbilitiesManager();

      manager.setCooldown('basic_attack', -5);

      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.isOnCooldown('basic_attack')).toBe(false);
    });

    test('should handle very large cooldown values', () => {
      const manager = createAbilitiesManager();

      manager.setCooldown('basic_attack', 1000);

      expect(manager.getCooldown('basic_attack')).toBe(1000);
      expect(manager.isOnCooldown('basic_attack')).toBe(true);
    });

    test('should handle abilities with zero range correctly', () => {
      const manager = createAbilitiesManager();

      expect(manager.isTargetRequired('wait')).toBe(false);
      expect(manager.canUseAbility('wait').canUse).toBe(true);
    });

    test('should maintain state consistency after complex operations', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      // Perform multiple operations
      manager.addUnlock('fireball');
      manager.addUnlock('heal');
      manager.addAbility(TEMPORARY_ABILITY);
      manager.useAbility('fireball');
      manager.useAbility('temp_boost');
      manager.setCooldown('heal', 2);

      // Verify state consistency
      expect(manager.hasAbility('fireball')).toBe(true);
      expect(manager.hasAbility('temp_boost')).toBe(true);
      expect(manager.getCooldown('fireball')).toBe(3);
      expect(manager.getCooldown('temp_boost')).toBe(1);
      expect(manager.getCooldown('heal')).toBe(2);
      expect(manager.getUsageCount('fireball')).toBe(1);
      expect(manager.availableAbilities.map(a => a.id)).toEqual(['basic_attack', 'wait']);
    });
  });
});
