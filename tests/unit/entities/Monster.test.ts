/**
 * @fileoverview Unit tests for Monster entity class
 * Tests Monster class in isolation with mocked dependencies
 * 
 * @file tests/unit/entities/Monster.test.ts
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Monster } from '@/core/entities/Monster';
import type { MonsterDefinition } from '@/core/types/entityTypes';
import type { HexCoordinate } from '@/utils/hex/hexCoordinates';

describe('Monster Entity', () => {
  let monster: Monster;
  let mockMonsterDefinition: MonsterDefinition;
  let startPosition: HexCoordinate;

  beforeEach(() => {
    startPosition = { q: 5, r: -2, s: -3 };
    mockMonsterDefinition = {
      id: 'test_goblin',
      name: 'Test Goblin',
      variant: 'monster',
      description: 'A test goblin for unit testing',
      stats: {
        maxHp: 60,
        baseArmor: 2,
        baseDamage: 10,
        movementRange: 3,
      },
      abilities: [
        {
          id: 'bite',
          name: 'Bite',
          variant: 'attack',
          damage: 10,
          range: 1,
          cooldown: 0,
          description: 'Basic bite attack',
          // targetType: 'enemy', // Property doesn't exist on AbilityDefinition
          statusEffects: [],
        },
      ],
      aiVariant: 'aggressive',
      threatConfig: {
        enabled: true,
        decayRate: 0.1,
        healingMultiplier: 1.5,
        damageMultiplier: 1.0,
        armorMultiplier: 0.5,
        avoidLastTargetRounds: 1,
        fallbackToLowestHp: true,
        enableTiebreaker: true,
      },
      spawnWeight: 10,
      difficulty: 3,
      behaviors: [],
      lootTable: [],
      tags: ['common', 'humanoid'],
    };

    monster = new Monster('test_goblin', mockMonsterDefinition, startPosition);
  });

  describe('Construction', () => {
    it('should create a monster with required properties', () => {
      expect(monster.id).toBe('test_goblin');
      expect(monster.name).toBe('Test Goblin');
      expect(monster.definition).toEqual(mockMonsterDefinition);
      expect(monster.position).toEqual(startPosition);
    });

    it('should initialize with default position if none provided', () => {
      const defaultMonster = new Monster('default_goblin', mockMonsterDefinition);
      expect(defaultMonster.position).toEqual({ q: 0, r: 0, s: 0 });
    });

    it('should initialize with proper stats from definition', () => {
      expect(monster.maxHp).toBe(60);
      expect(monster.currentHp).toBe(60);
      expect(monster.baseArmor).toBe(2);
      expect(monster.baseDamage).toBe(10);
      expect(monster.movementRange).toBe(3);
    });
  });

  describe('Basic Properties', () => {
    it('should expose readonly properties correctly', () => {
      expect(monster.maxHp).toBe(mockMonsterDefinition.stats.maxHp);
      expect(monster.baseArmor).toBe(mockMonsterDefinition.stats.baseArmor);
      expect(monster.baseDamage).toBe(mockMonsterDefinition.stats.baseDamage);
      expect(monster.movementRange).toBe(mockMonsterDefinition.stats.movementRange);
      expect(monster.difficulty).toBe(mockMonsterDefinition.difficulty);
      expect(monster.aiVariant).toBe(mockMonsterDefinition.aiVariant);
    });

    it('should report alive state correctly', () => {
      expect(monster.isAlive).toBe(true);
      expect(monster.canAct()).toBe(true);
      expect(monster.canMove()).toBe(true);
    });

    it('should have correct tags and behaviors', () => {
      expect(monster.tags).toEqual(['common', 'humanoid']);
      expect(monster.behaviors).toEqual([]);
    });
  });

  describe('Combat Actions', () => {
    it('should take damage correctly', () => {
      const result = monster.takeDamage(25, 'test attack');

      expect(result.damageDealt).toBeGreaterThan(0);
      expect(result.died).toBe(false);
      expect(monster.currentHp).toBeLessThan(60);
    });

    it('should die when taking fatal damage', () => {
      const result = monster.takeDamage(100, 'fatal attack');

      expect(result.died).toBe(true);
      expect(monster.currentHp).toBe(0);
      expect(monster.isAlive).toBe(false);
    });

    it('should heal correctly', () => {
      monster.takeDamage(30, 'setup damage');
      const damagedHp = monster.currentHp;

      const result = monster.heal(15);

      expect(result.amountHealed).toBe(15);
      expect(monster.currentHp).toBe(damagedHp + 15);
    });

    it('should not overheal beyond max HP', () => {
      const result = monster.heal(20);

      expect(result.amountHealed).toBe(0);
      expect(monster.currentHp).toBe(60);
      expect(result.newHp).toBe(60);
    });
  });

  describe('Movement', () => {
    it('should move to valid positions', () => {
      const newPosition = { q: 6, r: -1, s: -5 };
      const result = monster.moveTo(newPosition);

      expect(result.success).toBe(true);
      expect(monster.position).toEqual(newPosition);
    });

    it('should calculate distance correctly', () => {
      const targetPosition = { q: 8, r: -2, s: -6 };
      const distance = monster.getDistanceTo(targetPosition);

      expect(distance).toBe(3); // Distance from (5,-2,-3) to (8,-2,-6)
    });
  });

  describe('Abilities', () => {
    it('should have abilities from definition', () => {
      const abilities = monster.getAvailableAbilities();

      expect(abilities).toHaveLength(3); // bite + basic_attack + wait
      expect(abilities.find(a => a.id === 'bite')).toBeDefined();
      expect(abilities[0]!.name).toBe('Bite');
    });

    it('should check ability availability', () => {
      const canUse = monster.canUseAbility('bite');

      expect(canUse.canUse).toBe(true);
    });

    it('should return false for non-existent abilities', () => {
      const canUse = monster.canUseAbility('nonexistent_ability');

      expect(canUse.canUse).toBe(false);
    });
  });

  describe('AI and Threat Management', () => {
    it('should have threat configuration', () => {
      expect(monster.threatConfig).toEqual(mockMonsterDefinition.threatConfig);
    });

    it('should support AI variant', () => {
      expect(monster.aiVariant).toBe('aggressive');
    });
  });

  describe('Status Effects', () => {
    it('should apply status effects', () => {
      const result = monster.applyStatusEffect('poison', 3, 5);

      expect(result.applied).toBe(true);
      expect(result.effectName).toBe('poison');
      expect(monster.hasStatusEffect('poison')).toBe(true);
    });

    it('should remove status effects', () => {
      monster.applyStatusEffect('poison', 3, 5);
      const removed = monster.removeStatusEffect('poison');

      expect(removed).toBe(true);
      expect(monster.hasStatusEffect('poison')).toBe(false);
    });

    it('should get active status effects', () => {
      monster.applyStatusEffect('poison', 3, 5);
      monster.applyStatusEffect('stunned', 1, 1);

      const effects = monster.getActiveStatusEffects();

      expect(effects).toHaveLength(2);
      expect(effects.some(e => e.name === 'poison')).toBe(true);
      expect(effects.some(e => e.name === 'stunned')).toBe(true);
    });
  });

  describe('Data Export', () => {
    it('should provide public data', () => {
      const publicData = monster.getPublicData();

      expect(publicData).toEqual({
        id: monster.id,
        name: monster.name,
        position: monster.position,
        maxHp: monster.maxHp,
        currentHp: monster.currentHp,
        effectiveArmor: monster.effectiveArmor,
        movementRange: monster.movementRange,
        isAlive: monster.isAlive,
        canAct: monster.canAct(),
        canMove: monster.canMove(),
        activeStatusEffects: monster.getActiveStatusEffects(),
        tags: monster.tags,
        difficulty: monster.difficulty,
      });
    });

    it('should provide private data with full details', () => {
      const privateData = monster.getPrivateData();

      expect(privateData).toEqual({
        id: monster.id,
        name: monster.name,
        definition: monster.definition,
        position: monster.position,
        maxHp: monster.maxHp,
        currentHp: monster.currentHp,
        baseArmor: monster.baseArmor,
        effectiveArmor: monster.effectiveArmor,
        baseDamage: monster.baseDamage,
        movementRange: monster.movementRange,
        isAlive: monster.isAlive,
        canAct: monster.canAct(),
        canMove: monster.canMove(),
        availableAbilities: monster.getAvailableAbilities(),
        activeStatusEffects: monster.getActiveStatusEffects(),
        aiVariant: monster.aiVariant,
        threatConfig: monster.threatConfig,
        tags: monster.tags,
        difficulty: monster.difficulty,
        behaviors: monster.behaviors,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle dead monster actions gracefully', () => {
      monster.takeDamage(100, 'kill monster');

      expect(monster.isAlive).toBe(false);
      expect(monster.canAct()).toBe(false);
      expect(monster.canMove()).toBe(false);

      const damageResult = monster.takeDamage(20, 'post-death damage');
      expect(damageResult.damageDealt).toBe(0);

      const healResult = monster.heal(20);
      expect(healResult.amountHealed).toBe(0);
    });

    it('should handle monsters with no abilities', () => {
      const noAbilitiesDefinition = { ...mockMonsterDefinition, abilities: [] };
      const noAbilitiesMonster = new Monster('no_abilities_monster', noAbilitiesDefinition);

      const abilities = noAbilitiesMonster.getAvailableAbilities();
      expect(abilities).toHaveLength(2); // basic_attack + wait are always added

      const canUse = noAbilitiesMonster.canUseAbility('any_ability');
      expect(canUse.canUse).toBe(false);
    });

    it('should handle invalid status effect operations', () => {
      const hasNonExistent = monster.hasStatusEffect('nonexistent');
      expect(hasNonExistent).toBe(false);

      const removeNonExistent = monster.removeStatusEffect('nonexistent');
      expect(removeNonExistent).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple status effects correctly', () => {
      monster.applyStatusEffect('poison', 3, 5);
      monster.applyStatusEffect('enraged', 2, 25);
      monster.applyStatusEffect('shielded', 1, 3);

      const effects = monster.getActiveStatusEffects();
      expect(effects).toHaveLength(3);

      // Remove one effect
      monster.removeStatusEffect('enraged');
      const remainingEffects = monster.getActiveStatusEffects();
      expect(remainingEffects).toHaveLength(2);
      expect(remainingEffects.some(e => e.name === 'enraged')).toBe(false);
    });

    it('should maintain state consistency under complex operations', () => {
      // Perform multiple operations
      monster.takeDamage(20, 'test1');
      monster.applyStatusEffect('poison', 3, 5);
      monster.heal(10);
      monster.moveTo({ q: 7, r: -3, s: -4 });

      // State should remain consistent
      expect(monster.currentHp).toBeGreaterThan(0);
      expect(monster.currentHp).toBeLessThanOrEqual(monster.maxHp);
      expect(monster.isAlive).toBe(monster.currentHp > 0);
      expect(monster.hasStatusEffect('poison')).toBe(true);
      expect(monster.position).toEqual({ q: 7, r: -3, s: -4 });
    });
  });
});