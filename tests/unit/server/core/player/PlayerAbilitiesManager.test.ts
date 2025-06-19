/**
 * Hex Dungeon Crawler - PlayerAbilitiesManager Tests
 *
 * Unit tests for player abilities and cooldown management system
 * Tests ability definitions, cooldowns, and usage validation
 *
 * @file tests/unit/server/core/player/PlayerAbilitiesManager.test.ts
 */

import { PlayerAbilitiesManager } from '../../../../../server/src/core/player/EntityAbilitiesManager.js';
import type { AbilityDefinition } from '../../../../../server/src/core/types/playerTypes.js';

// === TEST FIXTURES ===

const CLASS_ABILITIES: AbilityDefinition[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    type: 'attack',
    damage: 20,
    range: 3,
    cooldown: 2,
    description: 'A blazing ball of fire',
  },
  {
    id: 'heal',
    name: 'Heal',
    type: 'healing',
    healing: 15,
    range: 2,
    cooldown: 1,
    description: 'Restore health to target',
  },
  {
    id: 'shield',
    name: 'Shield',
    type: 'defense',
    range: 1,
    cooldown: 3,
    description: 'Protect an ally',
  },
  {
    id: 'teleport',
    name: 'Teleport',
    type: 'utility',
    range: 5,
    cooldown: 4,
    description: 'Instantly move to target location',
  },
];

const TEMPORARY_ABILITY: AbilityDefinition = {
  id: 'magic_sword',
  name: 'Magic Sword',
  type: 'attack',
  damage: 25,
  range: 1,
  cooldown: 0,
  description: 'Enchanted weapon ability',
};

// === HELPER FUNCTIONS ===

function createAbilitiesManager(classAbilities: AbilityDefinition[] = []): PlayerAbilitiesManager {
  return new PlayerAbilitiesManager(classAbilities);
}

// === TESTS ===

describe('PlayerAbilitiesManager', () => {
  describe('initialization', () => {
    it('should initialize with default basic abilities only', () => {
      const manager = createAbilitiesManager();

      expect(manager.abilities).toHaveLength(2); // basic_attack + wait
      expect(manager.hasAbility('basic_attack')).toBe(true);
      expect(manager.hasAbility('wait')).toBe(true);
      expect(manager.unlockedAbilities).toHaveLength(2);
      expect(manager.availableAbilities).toHaveLength(2);
    });

    it('should initialize with class abilities and unlock them all', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      expect(manager.abilities).toHaveLength(6); // 2 basic + 4 class
      expect(manager.hasAbility('fireball')).toBe(true); // Now unlocked by default
      expect(manager.hasAbility('heal')).toBe(true);
      expect(manager.hasAbility('shield')).toBe(true);
      expect(manager.hasAbility('teleport')).toBe(true);
      expect(manager.getAbility('fireball')).toEqual(CLASS_ABILITIES[0]);
      expect(manager.unlockedAbilities).toHaveLength(6); // All abilities unlocked
      expect(manager.availableAbilities).toHaveLength(6); // All available
    });

    it('should start with no cooldowns', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      expect(manager.cooldowns).toHaveLength(0);
      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.isOnCooldown('fireball')).toBe(false);
    });
  });

  describe('ability access and retrieval', () => {
    it('should get ability by ID correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const fireball = manager.getAbility('fireball');
      expect(fireball).toEqual(CLASS_ABILITIES[0]);

      const basicAttack = manager.getAbility('basic_attack');
      expect(basicAttack?.name).toBe('Basic Attack');

      const nonexistent = manager.getAbility('nonexistent');
      expect(nonexistent).toBeNull();
    });

    it('should get abilities by type correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      // All abilities are now unlocked by default

      const attackAbilities = manager.getAbilitiesByType('attack');
      expect(attackAbilities).toHaveLength(2); // basic_attack + fireball

      const healingAbilities = manager.getAbilitiesByType('healing');
      expect(healingAbilities).toHaveLength(1); // heal

      const utilityAbilities = manager.getAbilitiesByType('utility');
      expect(utilityAbilities).toHaveLength(2); // wait + teleport

      const defenseAbilities = manager.getAbilitiesByType('defense');
      expect(defenseAbilities).toHaveLength(1); // shield
    });

    it('should return only unlocked abilities by type', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      // Remove some unlocks to test filtering
      manager.removeUnlock('fireball');
      manager.removeUnlock('heal');

      const attackAbilities = manager.getAbilitiesByType('attack');
      expect(attackAbilities).toHaveLength(1); // Only basic_attack

      const healingAbilities = manager.getAbilitiesByType('healing');
      expect(healingAbilities).toHaveLength(0); // heal unlocked removed

      const utilityAbilities = manager.getAbilitiesByType('utility');
      expect(utilityAbilities).toHaveLength(2); // wait + teleport still unlocked
    });
  });

  describe('ability unlocking', () => {
    it('should still allow unlocking additional abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      // All class abilities already unlocked, but can still unlock new ones
      manager.addAbility(TEMPORARY_ABILITY);

      manager.addUnlock('magic_sword');

      expect(manager.hasAbility('magic_sword')).toBe(true);
      expect(manager.unlockedAbilities).toHaveLength(7); // 6 + magic_sword
    });

    it('should fail to unlock nonexistent abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const result = manager.addUnlock('nonexistent');

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Ability 'nonexistent' does not exist");
    });

    it('should fail to unlock already unlocked abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const result = manager.addUnlock('fireball'); // Already unlocked by default

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Ability 'fireball' already unlocked");
    });

    it('should remove ability unlocks', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const removed = manager.removeUnlock('fireball');

      expect(removed).toBe(true);
      expect(manager.hasAbility('fireball')).toBe(false);
      expect(manager.unlockedAbilities).toHaveLength(5); // 6 - fireball
    });

    it('should handle removing non-unlocked abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.removeUnlock('fireball'); // Remove it first

      const removed = manager.removeUnlock('fireball'); // Try to remove again

      expect(removed).toBe(false);
    });
  });

  describe('cooldown management', () => {
    it('should set ability cooldowns correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      manager.setCooldown('fireball', 3);

      expect(manager.getCooldown('fireball')).toBe(3);
      expect(manager.isOnCooldown('fireball')).toBe(true);
      expect(manager.cooldowns).toHaveLength(1);
    });

    it('should clear cooldowns when set to zero', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.setCooldown('fireball', 3);

      manager.setCooldown('fireball', 0);

      expect(manager.getCooldown('fireball')).toBe(0);
      expect(manager.isOnCooldown('fireball')).toBe(false);
      expect(manager.cooldowns).toHaveLength(0);
    });

    it('should clear individual cooldowns', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.setCooldown('fireball', 3);
      manager.setCooldown('heal', 2);

      const cleared = manager.clearCooldown('fireball');

      expect(cleared).toBe(true);
      expect(manager.getCooldown('fireball')).toBe(0);
      expect(manager.getCooldown('heal')).toBe(2); // Unchanged
      expect(manager.cooldowns).toHaveLength(1);
    });

    it('should clear all cooldowns', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.setCooldown('fireball', 3);
      manager.setCooldown('heal', 2);
      manager.setCooldown('shield', 1);

      manager.clearAllCooldowns();

      expect(manager.cooldowns).toHaveLength(0);
      expect(manager.getCooldown('fireball')).toBe(0);
      expect(manager.getCooldown('heal')).toBe(0);
      expect(manager.getCooldown('shield')).toBe(0);
    });

    it('should handle clearing non-existent cooldowns', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const cleared = manager.clearCooldown('fireball'); // No cooldown set

      expect(cleared).toBe(false);
    });
  });

  describe('ability usage', () => {
    it('should use abilities successfully when conditions are met', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      // fireball is already unlocked by default

      const canUse = manager.canUseAbility('fireball');
      expect(canUse.canUse).toBe(true);

      const result = manager.useAbility('fireball');

      expect(result.success).toBe(true);
      expect(manager.getCooldown('fireball')).toBe(2); // Set to ability's cooldown
      expect(manager.getUsageCount('fireball')).toBe(1);
    });

    it('should fail to use non-existent abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const canUse = manager.canUseAbility('nonexistent');

      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe("Ability 'nonexistent' does not exist");
    });

    it('should fail to use unlocked abilities that were removed', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.removeUnlock('fireball'); // Remove the unlock

      const canUse = manager.canUseAbility('fireball');

      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe("Ability 'Fireball' is not unlocked");
    });

    it('should fail to use abilities on cooldown', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.setCooldown('fireball', 2);

      const canUse = manager.canUseAbility('fireball');

      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe("Ability 'Fireball' is on cooldown (2 rounds remaining)");
    });

    it('should track usage count correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      // heal is already unlocked

      expect(manager.getUsageCount('heal')).toBe(0);

      manager.useAbility('heal');
      expect(manager.getUsageCount('heal')).toBe(1);

      // Use again after clearing cooldown
      manager.clearCooldown('heal');
      manager.useAbility('heal');
      expect(manager.getUsageCount('heal')).toBe(2);
    });

    it('should not apply cooldown for zero-cooldown abilities', () => {
      const manager = createAbilitiesManager();

      manager.useAbility('basic_attack'); // 0 cooldown

      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.cooldowns).toHaveLength(0);
    });
  });

  describe('temporary abilities', () => {
    it('should add temporary abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      manager.addAbility(TEMPORARY_ABILITY);

      expect(manager.abilities).toHaveLength(7); // 6 + temporary
      expect(manager.hasAbility('magic_sword')).toBe(true);
      expect(manager.getAbility('magic_sword')).toEqual(TEMPORARY_ABILITY);
    });

    it('should remove temporary abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addAbility(TEMPORARY_ABILITY);

      const removed = manager.removeAbility('magic_sword');

      expect(removed).toBe(true);
      expect(manager.abilities).toHaveLength(6); // Back to original
      expect(manager.hasAbility('magic_sword')).toBe(false);
      expect(manager.getAbility('magic_sword')).toBeNull();
    });

    it('should clear cooldowns when removing temporary abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.addAbility(TEMPORARY_ABILITY);
      manager.setCooldown('magic_sword', 3);

      manager.removeAbility('magic_sword');

      expect(manager.getCooldown('magic_sword')).toBe(0);
      expect(manager.cooldowns).toHaveLength(0);
    });

    it('should handle removing non-existent temporary abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const removed = manager.removeAbility('nonexistent');

      expect(removed).toBe(false);
    });
  });

  describe('round processing', () => {
    it('should process cooldowns correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.setCooldown('fireball', 3);
      manager.setCooldown('heal', 1);
      manager.setCooldown('shield', 2);

      const expired = manager.processRound();

      expect(expired).toEqual(['heal']); // Only heal expired
      expect(manager.getCooldown('fireball')).toBe(2);
      expect(manager.getCooldown('heal')).toBe(0);
      expect(manager.getCooldown('shield')).toBe(1);
      expect(manager.cooldowns).toHaveLength(2); // heal removed
    });

    it('should handle multiple abilities expiring', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.setCooldown('fireball', 1);
      manager.setCooldown('heal', 1);

      const expired = manager.processRound();

      expect(expired).toHaveLength(2);
      expect(expired).toContain('fireball');
      expect(expired).toContain('heal');
      expect(manager.cooldowns).toHaveLength(0);
    });

    it('should handle no cooldowns expiring', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);
      manager.setCooldown('fireball', 3);

      const expired = manager.processRound();

      expect(expired).toHaveLength(0);
      expect(manager.getCooldown('fireball')).toBe(2);
    });
  });

  describe('utility functions', () => {
    it('should calculate damage correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const damage = manager.calculateDamage('fireball', 1.5);

      expect(damage).toBe(30); // 20 * 1.5, floored
    });

    it('should calculate healing correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const healing = manager.calculateHealing('heal', 1.2);

      expect(healing).toBe(18); // 15 * 1.2, floored
    });

    it('should return zero for non-damage abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const damage = manager.calculateDamage('shield');

      expect(damage).toBe(0);
    });

    it('should return zero for non-healing abilities', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const healing = manager.calculateHealing('fireball');

      expect(healing).toBe(0);
    });

    it('should determine target requirements correctly', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      expect(manager.isTargetRequired('fireball')).toBe(true); // attack
      expect(manager.isTargetRequired('heal')).toBe(true); // healing with range
      expect(manager.isTargetRequired('wait')).toBe(false); // utility, no range
      expect(manager.isTargetRequired('nonexistent')).toBe(false); // doesn't exist
    });
  });

  describe('encounter reset', () => {
    it.skip('should reset all state for new encounter', () => {
      // TODO: New Cooldown System
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      // Set up some state
      manager.addAbility(TEMPORARY_ABILITY);
      manager.setCooldown('heal', 3);
      manager.useAbility('basic_attack');

      manager.resetForEncounter();

      // Check reset state
      expect(manager.cooldowns).toHaveLength(4);
      expect(manager.abilities).toHaveLength(6); // Back to 2 basic + 4 class (temp removed)
      expect(manager.hasAbility('fireball')).toBe(true); // Class abilities still unlocked
      expect(manager.hasAbility('heal')).toBe(true); // Class abilities still unlocked
      expect(manager.hasAbility('magic_sword')).toBe(false); // Temporary removed
      expect(manager.getUsageCount('basic_attack')).toBe(0); // Usage cleared
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle negative cooldowns', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      manager.setCooldown('fireball', -5);

      expect(manager.getCooldown('fireball')).toBe(0); // Should not set negative
    });

    it('should handle usage of abilities with zero cooldown repeatedly', () => {
      const manager = createAbilitiesManager();

      // basic_attack has 0 cooldown
      manager.useAbility('basic_attack');
      manager.useAbility('basic_attack');
      manager.useAbility('basic_attack');

      expect(manager.getUsageCount('basic_attack')).toBe(3);
      expect(manager.getCooldown('basic_attack')).toBe(0);
      expect(manager.canUseAbility('basic_attack').canUse).toBe(true);
    });

    it('should handle processing rounds with no cooldowns', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      const expired = manager.processRound();

      expect(expired).toHaveLength(0);
    });

    it('should maintain state consistency during operations', () => {
      const manager = createAbilitiesManager(CLASS_ABILITIES);

      // Perform multiple operations
      manager.addAbility(TEMPORARY_ABILITY);
      manager.useAbility('fireball'); // Already unlocked
      manager.processRound();
      manager.clearCooldown('fireball');

      // Verify state is consistent
      expect(manager.unlockedAbilities.length).toBeGreaterThanOrEqual(6); // 2 basic + 4 class + temp
      expect(manager.availableAbilities.length).toBeGreaterThanOrEqual(6);
      expect(manager.getUsageCount('fireball')).toBe(1);
    });
  });
});
