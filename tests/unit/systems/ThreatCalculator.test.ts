/**
 * @fileoverview Unit tests for ThreatCalculator utility class
 * Tests pure threat calculation functions in isolation
 * 
 * @file tests/unit/systems/ThreatCalculator.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { ThreatCalculator } from '@/core/systems/ThreatCalculator';
import type { ThreatConfig, ThreatUpdate } from '@/core/types/entityTypes';

describe('ThreatCalculator', () => {
  const standardConfig: ThreatConfig = {
    enabled: true,
    decayRate: 0.1,
    healingMultiplier: 1.5,
    damageMultiplier: 1.0,
    armorMultiplier: 0.5,
    avoidLastTargetRounds: 1,
    fallbackToLowestHp: true,
    enableTiebreaker: true,
  };

  const highThreatConfig: ThreatConfig = {
    enabled: true,
    decayRate: 0.05,
    healingMultiplier: 2.0,
    damageMultiplier: 1.5,
    armorMultiplier: 1.0,
    avoidLastTargetRounds: 2,
    fallbackToLowestHp: true,
    enableTiebreaker: true,
  };

  describe('createThreatUpdate', () => {
    it('should create a basic threat update with all parameters', () => {
      const update = ThreatCalculator.createThreatUpdate(
        'player1',
        20, // damageToMonster
        25, // totalDamageDealt
        10, // healingDone
        5,  // playerArmor
        'test'
      );

      expect(update.playerId).toBe('player1');
      expect(update.damageReceived).toBe(20);
      expect(update.healingReceived).toBe(10);
      expect(update.playerArmor).toBe(5);
      expect(update.damageToSelf).toBe(20);
      expect(update.totalDamageDealt).toBe(25);
      expect(update.healingDone).toBe(10);
      expect(update.source).toBe('test');
    });

    it('should use default values when parameters are not provided', () => {
      const update = ThreatCalculator.createThreatUpdate('player2');

      expect(update.playerId).toBe('player2');
      expect(update.damageReceived).toBe(0);
      expect(update.healingReceived).toBe(0);
      expect(update.playerArmor).toBe(0);
      expect(update.damageToSelf).toBe(0);
      expect(update.totalDamageDealt).toBe(0);
      expect(update.healingDone).toBe(0);
      expect(update.source).toBe('unknown');
    });
  });

  describe('calculateRawThreat', () => {
    it('should calculate threat from damage only', () => {
      const update: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 0,
        healingReceived: 0,
        playerArmor: 0,
        damageToSelf: 0,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      };

      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      expect(threat).toBe(20); // 20 * 1.0 damage multiplier
    });

    it('should calculate threat from healing only', () => {
      const update: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 0,
        healingReceived: 15,
        playerArmor: 0,
        damageToSelf: 0,
        totalDamageDealt: 0,
        healingDone: 15,
        source: 'healing',
      };

      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      expect(threat).toBe(22.5); // 15 * 1.5 healing multiplier
    });

    it('should calculate threat from armor and damage combination', () => {
      const update: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 10,
        healingReceived: 0,
        playerArmor: 3,
        damageToSelf: 10,
        totalDamageDealt: 15,
        healingDone: 0,
        source: 'attack',
      };

      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      // armor threat: 3 * 10 * 0.5 = 15
      // damage threat: 15 * 1.0 = 15
      // total: 30
      expect(threat).toBe(30);
    });

    it('should calculate threat from complex actions', () => {
      const update: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 8,
        healingReceived: 12,
        playerArmor: 4,
        damageToSelf: 8,
        totalDamageDealt: 20,
        healingDone: 12,
        source: 'ability',
      };

      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      // armor threat: 4 * 8 * 0.5 = 16
      // damage threat: 20 * 1.0 = 20
      // healing threat: 12 * 1.5 = 18
      // total: 54
      expect(threat).toBe(54);
    });

    it('should handle zero values correctly', () => {
      const update: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 0,
        healingReceived: 0,
        playerArmor: 0,
        damageToSelf: 0,
        totalDamageDealt: 0,
        healingDone: 0,
        source: 'none',
      };

      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      expect(threat).toBe(0);
    });

    it('should apply different multipliers correctly', () => {
      const update: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 10,
        healingReceived: 10,
        playerArmor: 2,
        damageToSelf: 10,
        totalDamageDealt: 10,
        healingDone: 10,
        source: 'ability',
      };

      const threat = ThreatCalculator.calculateRawThreat(update, highThreatConfig);

      // armor threat: 2 * 10 * 1.0 = 20
      // damage threat: 10 * 1.5 = 15
      // healing threat: 10 * 2.0 = 20
      // total: 55
      expect(threat).toBe(55);
    });
  });

  describe('createAttackThreat', () => {
    it('should create correct threat update for basic attacks', () => {
      const update = ThreatCalculator.createAttackThreat('warrior1', 15, 3);

      expect(update.playerId).toBe('warrior1');
      expect(update.damageReceived).toBe(15);
      expect(update.totalDamageDealt).toBe(15);
      expect(update.healingDone).toBe(0);
      expect(update.playerArmor).toBe(3);
      expect(update.source).toBe('attack');
    });

    it('should handle zero damage attacks', () => {
      const update = ThreatCalculator.createAttackThreat('player1', 0, 2);

      expect(update.damageReceived).toBe(0);
      expect(update.totalDamageDealt).toBe(0);
      expect(update.playerArmor).toBe(2);
    });

    it('should calculate threat correctly for attack updates', () => {
      const update = ThreatCalculator.createAttackThreat('player1', 20, 4);
      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      // armor threat: 4 * 20 * 0.5 = 40
      // damage threat: 20 * 1.0 = 20
      // total: 60
      expect(threat).toBe(60);
    });
  });

  describe('createHealingThreat', () => {
    it('should create correct threat update for healing', () => {
      const update = ThreatCalculator.createHealingThreat('cleric1', 25, 2);

      expect(update.playerId).toBe('cleric1');
      expect(update.damageReceived).toBe(0);
      expect(update.totalDamageDealt).toBe(0);
      expect(update.healingDone).toBe(25);
      expect(update.playerArmor).toBe(2);
      expect(update.source).toBe('healing');
    });

    it('should handle zero healing', () => {
      const update = ThreatCalculator.createHealingThreat('player1', 0, 1);

      expect(update.healingDone).toBe(0);
      expect(update.healingReceived).toBe(0);
    });

    it('should calculate threat correctly for healing updates', () => {
      const update = ThreatCalculator.createHealingThreat('player1', 20, 1);
      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      // healing threat: 20 * 1.5 = 30
      expect(threat).toBe(30);
    });
  });

  describe('createAbilityThreat', () => {
    it('should create correct threat update for complex abilities', () => {
      const update = ThreatCalculator.createAbilityThreat(
        'mage1',
        12, // damage to this monster
        30, // total damage (multi-target)
        8,  // healing done
        2,  // player armor
        'fireball'
      );

      expect(update.playerId).toBe('mage1');
      expect(update.damageReceived).toBe(12);
      expect(update.totalDamageDealt).toBe(30);
      expect(update.healingDone).toBe(8);
      expect(update.playerArmor).toBe(2);
      expect(update.source).toBe('ability:fireball');
    });

    it('should handle abilities with only damage', () => {
      const update = ThreatCalculator.createAbilityThreat(
        'rogue1', 25, 25, 0, 1, 'backstab'
      );

      expect(update.damageReceived).toBe(25);
      expect(update.totalDamageDealt).toBe(25);
      expect(update.healingDone).toBe(0);
      expect(update.source).toBe('ability:backstab');
    });

    it('should handle abilities with only healing', () => {
      const update = ThreatCalculator.createAbilityThreat(
        'paladin1', 0, 0, 30, 5, 'lay_on_hands'
      );

      expect(update.damageReceived).toBe(0);
      expect(update.totalDamageDealt).toBe(0);
      expect(update.healingDone).toBe(30);
      expect(update.source).toBe('ability:lay_on_hands');
    });
  });

  describe('createAoEThreat', () => {
    it('should create correct threat update for AoE abilities', () => {
      const update = ThreatCalculator.createAoEThreat(
        'wizard1',
        15, // damage to this monster
        45, // total damage to all targets
        3,  // targets hit
        2,  // player armor
        'meteor'
      );

      expect(update.playerId).toBe('wizard1');
      expect(update.damageReceived).toBe(15);
      expect(update.healingDone).toBe(0);
      expect(update.playerArmor).toBe(2);
      expect(update.source).toBe('aoe:meteor');

      // AoE multiplier: max(1, 3 * 0.5) = 1.5
      // Adjusted total: 45 * 1.5 = 67.5
      expect(update.totalDamageDealt).toBe(67.5);
    });

    it('should apply minimum AoE multiplier of 1', () => {
      const update = ThreatCalculator.createAoEThreat(
        'player1', 10, 10, 1, 1, 'single_target'
      );

      // AoE multiplier: max(1, 1 * 0.5) = 1
      expect(update.totalDamageDealt).toBe(10);
    });

    it('should scale with number of targets', () => {
      const update1 = ThreatCalculator.createAoEThreat(
        'player1', 10, 30, 2, 1, 'spell'
      );
      const update2 = ThreatCalculator.createAoEThreat(
        'player1', 10, 30, 4, 1, 'spell'
      );

      // 2 targets: multiplier = max(1, 2 * 0.5) = 1
      expect(update1.totalDamageDealt).toBe(30);

      // 4 targets: multiplier = max(1, 4 * 0.5) = 2
      expect(update2.totalDamageDealt).toBe(60);
    });

    it('should calculate threat correctly for AoE updates', () => {
      const update = ThreatCalculator.createAoEThreat(
        'player1', 10, 20, 3, 2, 'explosion'
      );
      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      // AoE multiplier: max(1, 3 * 0.5) = 1.5
      // Adjusted total: 20 * 1.5 = 30
      // armor threat: 2 * 10 * 0.5 = 10
      // damage threat: 30 * 1.0 = 30
      // total: 40
      expect(threat).toBe(40);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle negative values gracefully', () => {
      const update = ThreatCalculator.createThreatUpdate(
        'player1', -5, -10, -3, -1, 'negative'
      );

      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      // armor threat: -1 * -5 * 0.5 = 2.5
      // damage threat: -10 * 1.0 = -10
      // healing threat: -3 * 1.5 = -4.5
      // total: -12
      expect(threat).toBe(-12);
    });

    it('should handle very large numbers', () => {
      const update = ThreatCalculator.createThreatUpdate(
        'player1', 1000, 2000, 500, 100, 'large'
      );

      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      // armor threat: 100 * 1000 * 0.5 = 50000
      // damage threat: 2000 * 1.0 = 2000
      // healing threat: 500 * 1.5 = 750
      // total: 52750
      expect(threat).toBe(52750);
    });

    it('should handle fractional values correctly', () => {
      const update = ThreatCalculator.createThreatUpdate(
        'player1', 10.5, 15.7, 8.3, 2.2, 'fractional'
      );

      const threat = ThreatCalculator.calculateRawThreat(update, standardConfig);

      // armor threat: 2.2 * 10.5 * 0.5 = 11.55
      // damage threat: 15.7 * 1.0 = 15.7
      // healing threat: 8.3 * 1.5 = 12.45
      // total: 39.7
      expect(threat).toBeCloseTo(39.7, 2);
    });

    it('should maintain consistency across different creation methods', () => {
      const damageAmount = 20;
      const playerArmor = 3;

      const manual = ThreatCalculator.createThreatUpdate(
        'player1', damageAmount, damageAmount, 0, playerArmor, 'attack'
      );
      const helper = ThreatCalculator.createAttackThreat('player1', damageAmount, playerArmor);

      expect(manual.playerId).toBe(helper.playerId);
      expect(manual.damageReceived).toBe(helper.damageReceived);
      expect(manual.totalDamageDealt).toBe(helper.totalDamageDealt);
      expect(manual.healingDone).toBe(helper.healingDone);
      expect(manual.playerArmor).toBe(helper.playerArmor);

      const manualThreat = ThreatCalculator.calculateRawThreat(manual, standardConfig);
      const helperThreat = ThreatCalculator.calculateRawThreat(helper, standardConfig);

      expect(manualThreat).toBe(helperThreat);
    });

    it('should handle extreme multiplier values', () => {
      const extremeConfig: ThreatConfig = {
        enabled: true,
        decayRate: 0.01,
        healingMultiplier: 10.0,
        damageMultiplier: 0.1,
        armorMultiplier: 5.0,
        avoidLastTargetRounds: 0,
        fallbackToLowestHp: false,
        enableTiebreaker: false,
      };

      const update = ThreatCalculator.createThreatUpdate(
        'player1', 10, 20, 15, 2, 'extreme'
      );

      const threat = ThreatCalculator.calculateRawThreat(update, extremeConfig);

      // armor threat: 2 * 10 * 5.0 = 100
      // damage threat: 20 * 0.1 = 2
      // healing threat: 15 * 10.0 = 150
      // total: 252
      expect(threat).toBe(252);
    });
  });
});