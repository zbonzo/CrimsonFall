/**
 * Hex Dungeon Crawler - PlayerStatsManager Tests
 *
 * Unit tests for player stats management system
 * Tests HP, armor, damage calculation, and level progression
 *
 * @file tests/unit/server/core/player/PlayerStatsManager.test.ts
 */

import { EntityStatsManager } from '@/core/player/EntityStatsManager';
import type { PlayerStats } from '@/core/types/playerTypes';

// === TEST FIXTURES ===

const DEFAULT_STATS: PlayerStats = {
  maxHp: 100,
  baseArmor: 2,
  baseDamage: 10,
  movementRange: 3,
};

const WEAK_STATS: PlayerStats = {
  maxHp: 50,
  baseArmor: 0,
  baseDamage: 5,
  movementRange: 2,
};

const STRONG_STATS: PlayerStats = {
  maxHp: 150,
  baseArmor: 5,
  baseDamage: 20,
  movementRange: 4,
};

// === HELPER FUNCTIONS ===

function createStatsManager(stats: PlayerStats = DEFAULT_STATS): EntityStatsManager {
  return new EntityStatsManager(stats);
}

// === TESTS ===

describe('EntityStatsManager', () => {
  describe('initialization', () => {
    it('should initialize with default stats', () => {
      const manager = createStatsManager();

      expect(manager.currentHp).toBe(100);
      expect(manager.maxHp).toBe(100);
      expect(manager.baseArmor).toBe(2);
      expect(manager.baseDamage).toBe(10);
      expect(manager.movementRange).toBe(3);
      expect(manager.isAlive).toBe(true);
      expect(manager.hpPercentage).toBe(1.0);
    });

    it('should initialize with custom stats', () => {
      const manager = createStatsManager(STRONG_STATS);

      expect(manager.currentHp).toBe(150);
      expect(manager.maxHp).toBe(150);
      expect(manager.baseArmor).toBe(5);
      expect(manager.baseDamage).toBe(20);
    });

    it('should start at level 1 with no experience', () => {
      const manager = createStatsManager();
      const level = manager.level;

      expect(level.current).toBe(1);
      expect(level.experience).toBe(0);
      expect(level.experienceToNext).toBe(100);
    });
  });

  describe('health management', () => {
    it('should take damage correctly with armor reduction', () => {
      const manager = createStatsManager();

      const result = manager.takeDamage(30, 'test');

      // 2 armor * 0.1 * 30 damage = 6 reduction, final damage = 24
      expect(result.damageDealt).toBe(24);
      expect(result.blocked).toBe(6);
      expect(result.died).toBe(false);
      expect(manager.currentHp).toBe(76);
      expect(manager.isAlive).toBe(true);
    });

    it('should calculate armor reduction with damage cap', () => {
      const manager = createStatsManager(STRONG_STATS); // 5 armor

      const result = manager.takeDamage(100, 'test');

      // 5 armor * 0.1 * 100 damage = 50 reduction
      expect(result.blocked).toBe(50);
      expect(result.damageDealt).toBe(50);
    });

    it('should deal minimum 1 damage through heavy armor', () => {
      const manager = createStatsManager(STRONG_STATS);

      const result = manager.takeDamage(1, 'test');

      expect(result.damageDealt).toBe(1);
      expect(manager.currentHp).toBe(149);
    });

    it('should handle death correctly', () => {
      const manager = createStatsManager();

      const result = manager.takeDamage(200, 'test');

      expect(result.died).toBe(true);
      expect(manager.currentHp).toBe(0);
      expect(manager.isAlive).toBe(false);
    });

    it('should not take damage when already dead', () => {
      const manager = createStatsManager();
      manager.takeDamage(200, 'test');

      const result = manager.takeDamage(50, 'test');

      expect(result.damageDealt).toBe(0);
      expect(result.blocked).toBe(0);
      expect(result.died).toBe(false);
    });

    it('should heal correctly without overheal', () => {
      const manager = createStatsManager();
      manager.takeDamage(50, 'test'); // With 2 armor, 50 damage =  10 blocked, 40 actual damage

      const result = manager.heal(50);

      expect(result.amountHealed).toBe(40);
      expect(result.newHp).toBe(100); // Was at 90hp, healed 30, but capped at 100
    });

    it('should cap healing at maximum HP', () => {
      const manager = createStatsManager();
      manager.takeDamage(20, 'test'); // With 2 armor, 20 damage = 4 blocked, 16 actual damage

      const result = manager.heal(50);

      expect(result.amountHealed).toBe(16); // Only heal the actual damage taken
      expect(result.newHp).toBe(100);
      expect(manager.isAtFullHealth()).toBe(true);
    });

    it('should not heal when dead', () => {
      const manager = createStatsManager();
      manager.takeDamage(200, 'test');

      const result = manager.heal(50);

      expect(result.amountHealed).toBe(0);
      expect(result.newHp).toBe(0);
    });
  });

  describe('armor management', () => {
    it('should add and calculate effective armor', () => {
      const manager = createStatsManager();

      manager.addTemporaryArmor(3);

      expect(manager.effectiveArmor).toBe(5); // 2 base + 3 temp
    });

    it('should remove temporary armor correctly', () => {
      const manager = createStatsManager();
      manager.addTemporaryArmor(5);

      manager.removeTemporaryArmor(2);

      expect(manager.effectiveArmor).toBe(5); // 2 base + 3 remaining
    });

    it('should not allow negative temporary armor', () => {
      const manager = createStatsManager();
      manager.addTemporaryArmor(2);

      manager.removeTemporaryArmor(5);

      expect(manager.effectiveArmor).toBe(2); // Just base armor
    });

    it('should clear all temporary armor', () => {
      const manager = createStatsManager();
      manager.addTemporaryArmor(10);

      manager.clearTemporaryArmor();

      expect(manager.effectiveArmor).toBe(2);
    });
  });

  describe('damage calculation', () => {
    it('should calculate base damage output', () => {
      const manager = createStatsManager();

      const damage = manager.calculateDamageOutput();

      expect(damage).toBe(10);
    });

    it('should calculate damage with custom base value', () => {
      const manager = createStatsManager();

      const damage = manager.calculateDamageOutput(15);

      expect(damage).toBe(15);
    });

    it('should apply damage modifier correctly', () => {
      const manager = createStatsManager();
      manager.setDamageModifier(1.5);

      const damage = manager.calculateDamageOutput();

      expect(damage).toBe(15); // 10 * 1.5, floored
    });

    it('should enforce minimum damage modifier', () => {
      const manager = createStatsManager();

      manager.setDamageModifier(-0.5);

      expect(manager.damageModifier).toBe(0.1);
    });
  });

  describe('level progression', () => {
    it('should not level up with insufficient experience', () => {
      const manager = createStatsManager();

      const result = manager.addExperience(50);

      expect(result.leveledUp).toBe(false);
      expect(manager.level.current).toBe(1);
      expect(manager.level.experience).toBe(50);
    });

    it('should level up with sufficient experience', () => {
      const manager = createStatsManager();

      const result = manager.addExperience(100);

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.benefitsGained).toContain('Damage increased to 110%');
      expect(manager.level.current).toBe(2);
      expect(manager.level.experience).toBe(0);
    });

    it('should apply level benefits correctly', () => {
      const manager = createStatsManager();
      manager.takeDamage(30, 'test');

      manager.addExperience(100);

      expect(manager.damageModifier).toBe(1.1);
      expect(manager.isAtFullHealth()).toBe(true);
    });

    it('should handle experience overflow correctly', () => {
      const manager = createStatsManager();

      manager.addExperience(250);

      expect(manager.level.current).toBe(2);
      expect(manager.level.experience).toBe(150);
    });

    it('should calculate experience requirements correctly', () => {
      const manager = createStatsManager();
      manager.addExperience(100);

      const level = manager.level;

      expect(level.current).toBe(2);
      expect(level.experienceToNext).toBe(200); // 2 * 100
    });

    it('should ignore invalid experience values', () => {
      const manager = createStatsManager();

      const result1 = manager.addExperience(0);
      const result2 = manager.addExperience(-50);

      expect(result1.leveledUp).toBe(false);
      expect(result2.leveledUp).toBe(false);
      expect(manager.level.experience).toBe(0);
    });
  });

  describe('health status queries', () => {
    it('should detect critically wounded state', () => {
      const manager = createStatsManager();
      manager.takeDamage(100, 'test'); // Need more damage to get below 25%

      expect(manager.isCriticallyWounded(0.25)).toBe(true);
      expect(manager.isCriticallyWounded(0.1)).toBe(false);
    });

    it('should calculate HP percentage correctly', () => {
      const manager = createStatsManager();
      manager.takeDamage(30, 'test'); // 30 damage - 6 armor = 24 actual damage

      expect(manager.hpPercentage).toBeCloseTo(0.76, 2); // 76hp / 100hp
    });
  });

  describe('combat readiness assessment', () => {
    it('should assess healthy player correctly', () => {
      const manager = createStatsManager();

      const readiness = manager.getCombatReadiness();

      expect(readiness.healthStatus).toBe('healthy');
      expect(readiness.armorStatus).toBe('light');
      expect(readiness.damageStatus).toBe('normal');
    });

    it('should assess wounded player correctly', () => {
      const manager = createStatsManager();
      manager.takeDamage(50, 'test');

      const readiness = manager.getCombatReadiness();

      expect(readiness.healthStatus).toBe('wounded');
    });

    it('should assess critical player correctly', () => {
      const manager = createStatsManager();
      manager.takeDamage(100, 'test'); // Need more damage to get to critical state

      const readiness = manager.getCombatReadiness();

      expect(readiness.healthStatus).toBe('critical');
    });

    it('should assess armor status variations', () => {
      const noArmorManager = createStatsManager(WEAK_STATS);
      const heavyArmorManager = createStatsManager(STRONG_STATS);

      expect(noArmorManager.getCombatReadiness().armorStatus).toBe('none');
      expect(heavyArmorManager.getCombatReadiness().armorStatus).toBe('heavy');
    });

    it('should assess damage status variations', () => {
      const weakManager = createStatsManager();
      const strongManager = createStatsManager();

      weakManager.setDamageModifier(0.8);
      strongManager.setDamageModifier(1.5);

      expect(weakManager.getCombatReadiness().damageStatus).toBe('weak');
      expect(strongManager.getCombatReadiness().damageStatus).toBe('enhanced');
    });
  });

  describe('reset functionality', () => {
    it('should reset to starting stats completely', () => {
      const manager = createStatsManager();

      // Modify all possible state
      manager.takeDamage(50, 'test');
      manager.addTemporaryArmor(5);
      manager.setDamageModifier(1.5);
      manager.addExperience(150);

      manager.resetToStartingStats();

      // Verify complete reset
      expect(manager.currentHp).toBe(100);
      expect(manager.effectiveArmor).toBe(2);
      expect(manager.damageModifier).toBe(1.0);
      expect(manager.level.current).toBe(1);
      expect(manager.level.experience).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle maximum damage values', () => {
      const manager = createStatsManager();

      const result = manager.takeDamage(Number.MAX_SAFE_INTEGER, 'test');

      expect(manager.currentHp).toBe(0);
      expect(result.died).toBe(true);
    });

    it('should handle maximum healing values', () => {
      const manager = createStatsManager();
      manager.takeDamage(50, 'test');

      const result = manager.heal(Number.MAX_SAFE_INTEGER);

      expect(manager.currentHp).toBe(100);
      expect(result.newHp).toBe(100);
    });

    it('should handle HP boundary conditions', () => {
      const manager = createStatsManager();

      manager.setHp(0);
      expect(manager.currentHp).toBe(0);
      expect(manager.isAlive).toBe(false);

      manager.setHp(-10);
      expect(manager.currentHp).toBe(0);

      manager.setHp(150);
      expect(manager.currentHp).toBe(100);
    });

    it('should handle zero damage attacks', () => {
      const manager = createStatsManager();

      const result = manager.takeDamage(0, 'test');

      expect(result.damageDealt).toBe(1); // Minimum damage
      expect(manager.currentHp).toBe(99);
    });

    it('should handle zero healing attempts', () => {
      const manager = createStatsManager();
      manager.takeDamage(30, 'test');

      const result = manager.heal(0);

      expect(result.amountHealed).toBe(0);
      expect(manager.currentHp).toBeLessThan(100);
    });
  });

  describe('performance and consistency', () => {
    it('should maintain state consistency after multiple operations', () => {
      const manager = createStatsManager();

      // Perform multiple operations
      manager.takeDamage(30, 'test1');
      manager.heal(10);
      manager.addTemporaryArmor(2);
      manager.setDamageModifier(1.2);
      manager.addExperience(50);

      // Verify state is consistent
      expect(manager.currentHp).toBeGreaterThan(0);
      expect(manager.currentHp).toBeLessThanOrEqual(manager.maxHp);
      expect(manager.effectiveArmor).toBeGreaterThanOrEqual(manager.baseArmor);
      expect(manager.damageModifier).toBeGreaterThanOrEqual(0.1);
      expect(manager.level.experience).toBeGreaterThanOrEqual(0);
    });

    it('should handle rapid successive operations correctly', () => {
      const manager = createStatsManager();

      // Rapid damage and healing
      for (let i = 0; i < 10; i++) {
        manager.takeDamage(5, 'rapid');
        manager.heal(3);
      }

      expect(manager.isAlive).toBe(true);
      expect(manager.currentHp).toBeGreaterThan(0);
    });
  });
});
