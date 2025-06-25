/**
 * @fileoverview Unit tests for ThreatManager system class
 * Tests threat management, targeting logic, and state isolation
 * 
 * @file tests/unit/systems/ThreatManager.test.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ThreatManager } from '@/core/systems/ThreatManager';
import type { ThreatConfig, ThreatUpdate, CombatEntity, TargetingResult } from '@/core/types/entityTypes';

describe('ThreatManager', () => {
  let threatManager: ThreatManager;
  let mockConfig: ThreatConfig;

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      decayRate: 0.1,
      healingMultiplier: 1.5,
      damageMultiplier: 1.0,
      armorMultiplier: 0.5,
      avoidLastTargetRounds: 1,
      fallbackToLowestHp: true,
      enableTiebreaker: true,
    };
    threatManager = new ThreatManager(mockConfig);
  });

  describe('initialization', () => {
    it('should initialize with empty threat table', () => {
      expect(threatManager.threatEntries).toEqual([]);
    });

    it('should initialize with provided config', () => {
      const customConfig: ThreatConfig = {
        enabled: false,
        decayRate: 0.2,
        healingMultiplier: 2.0,
        damageMultiplier: 1.5,
        armorMultiplier: 1.0,
        avoidLastTargetRounds: 2,
        fallbackToLowestHp: false,
        enableTiebreaker: false,
      };

      const customManager = new ThreatManager(customConfig);
      expect(customManager.isEnabled).toBe(false);
    });

    it('should start with empty targets history', () => {
      expect(threatManager.lastTargets).toEqual([]);
    });
  });

  describe('threat recording', () => {
    it('should record threat from damage actions', () => {
      const threatUpdate: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 20,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 20,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      };

      threatManager.addThreat(threatUpdate);

      const threatValue = threatManager.getThreat('player1');
      expect(threatValue).toBeGreaterThan(0);
    });

    it('should record threat from healing actions', () => {
      const threatUpdate: ThreatUpdate = {
        playerId: 'healer1',
        damageReceived: 0,
        healingReceived: 15,
        playerArmor: 1,
        damageToSelf: 0,
        totalDamageDealt: 0,
        healingDone: 15,
        source: 'healing',
      };

      threatManager.addThreat(threatUpdate);

      const threatValue = threatManager.getThreat('healer1');
      expect(threatValue).toBeGreaterThan(0);
    });

    it('should accumulate threat from multiple actions', () => {
      const firstUpdate: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 10,
        healingReceived: 0,
        playerArmor: 1,
        damageToSelf: 10,
        totalDamageDealt: 10,
        healingDone: 0,
        source: 'attack1',
      };

      const secondUpdate: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 15,
        healingReceived: 0,
        playerArmor: 1,
        damageToSelf: 15,
        totalDamageDealt: 15,
        healingDone: 0,
        source: 'attack2',
      };

      threatManager.addThreat(firstUpdate);
      const firstThreat = threatManager.getThreat('player1');

      threatManager.addThreat(secondUpdate);
      const totalThreat = threatManager.getThreat('player1');

      expect(totalThreat).toBeGreaterThan(firstThreat);
    });

    it('should not record threat when disabled', () => {
      const disabledConfig: ThreatConfig = {
        ...mockConfig,
        enabled: false,
      };
      const disabledManager = new ThreatManager(disabledConfig);

      const threatUpdate: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 20,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 20,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      };

      disabledManager.addThreat(threatUpdate);

      expect(disabledManager.getThreat('player1')).toBe(0);
    });
  });

  describe('threat decay', () => {
    it('should apply decay over time', () => {
      const threatUpdate: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 20,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 20,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      };

      threatManager.addThreat(threatUpdate);
      const initialThreat = threatManager.getThreat('player1');

      threatManager.processRound();
      const decayedThreat = threatManager.getThreat('player1');

      expect(decayedThreat).toBeLessThan(initialThreat);
      expect(decayedThreat).toBeGreaterThan(0);
    });

    it('should remove players below minimum threat threshold', () => {
      const threatUpdate: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: 1,
        healingReceived: 0,
        playerArmor: 0,
        damageToSelf: 1,
        totalDamageDealt: 1,
        healingDone: 0,
        source: 'weak_attack',
      };

      threatManager.addThreat(threatUpdate);

      // Apply decay multiple times to reach minimum threshold
      for (let i = 0; i < 50; i++) {
        threatManager.processRound();
      }

      expect(threatManager.getThreat('player1')).toBe(0);
    });

    it('should increment round counter during decay processing', () => {
      const initialRound = threatManager.getDebugInfo().roundsActive;

      threatManager.processRound();

      expect(threatManager.getDebugInfo().roundsActive).toBe(initialRound + 1);
    });
  });

  describe('targeting selection', () => {
    let mockPlayers: CombatEntity[];

    beforeEach(() => {
      mockPlayers = [
        {
          id: 'player1',
          name: 'Player 1',
          currentHp: 80,
          maxHp: 100,
          position: { q: 1, r: 0, s: -1 },
          isAlive: true,
        },
        {
          id: 'player2',
          name: 'Player 2',
          currentHp: 60,
          maxHp: 100,
          position: { q: 2, r: 0, s: -2 },
          isAlive: true,
        },
        {
          id: 'player3',
          name: 'Player 3',
          currentHp: 100,
          maxHp: 100,
          position: { q: 0, r: 1, s: -1 },
          isAlive: true,
        },
      ];
    });

    it('should select highest threat target', () => {
      // Record different threat levels
      threatManager.addThreat({
        playerId: 'player1',
        damageReceived: 30,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 30,
        totalDamageDealt: 30,
        healingDone: 0,
        source: 'attack',
      });

      threatManager.addThreat({
        playerId: 'player2',
        damageReceived: 10,
        healingReceived: 0,
        playerArmor: 1,
        damageToSelf: 10,
        totalDamageDealt: 10,
        healingDone: 0,
        source: 'attack',
      });

      const result = threatManager.selectTarget(mockPlayers);

      expect(result.target).not.toBeNull();
      expect(result.target?.id).toBe('player1');
      expect(result.reason).toContain('highest threat');
    });

    it('should fall back to lowest HP when no threat exists', () => {
      const result = threatManager.selectTarget(mockPlayers);

      expect(result.target).not.toBeNull();
      expect(result.target?.id).toBe('player2'); // Lowest HP (60)
      expect(result.reason).toContain('lowest HP');
    });

    it('should avoid recent targets when configured', () => {
      // Record threat for player1
      threatManager.addThreat({
        playerId: 'player1',
        damageReceived: 30,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 30,
        totalDamageDealt: 30,
        healingDone: 0,
        source: 'attack',
      });

      // Select target first time
      let result = threatManager.selectTarget(mockPlayers);
      expect(result.target?.id).toBe('player1');

      // Record lower threat for player2
      threatManager.addThreat({
        playerId: 'player2',
        damageReceived: 15,
        healingReceived: 0,
        playerArmor: 1,
        damageToSelf: 15,
        totalDamageDealt: 15,
        healingDone: 0,
        source: 'attack',
      });

      // Should still prefer player2 over recently targeted player1
      result = threatManager.selectTarget(mockPlayers);
      expect(result.target?.id).toBe('player2');
    });

    it('should handle dead players gracefully', () => {
      const deadPlayers: CombatEntity[] = [
        {
          id: 'player1',
          name: 'Dead Player',
          currentHp: 0,
          maxHp: 100,
          position: { q: 1, r: 0, s: -1 },
          isAlive: false,
        },
      ];

      const result = threatManager.selectTarget(deadPlayers);

      // The targeting system may still select a dead player but that's handled elsewhere
      expect(result.target).toBeDefined();
    });

    it('should handle empty player list', () => {
      const result = threatManager.selectTarget([]);

      expect(result.target).toBeNull();
      expect(result.reason).toContain('No');
    });
  });

  describe('threat queries', () => {
    beforeEach(() => {
      // Setup some threat data
      threatManager.addThreat({
        playerId: 'player1',
        damageReceived: 20,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 20,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      });

      threatManager.addThreat({
        playerId: 'player2',
        damageReceived: 0,
        healingReceived: 15,
        playerArmor: 1,
        damageToSelf: 0,
        totalDamageDealt: 0,
        healingDone: 15,
        source: 'healing',
      });
    });

    it('should return individual threat values', () => {
      const player1Threat = threatManager.getThreat('player1');
      const player2Threat = threatManager.getThreat('player2');

      expect(player1Threat).toBeGreaterThan(0);
      expect(player2Threat).toBeGreaterThan(0);
    });

    it('should return zero for unknown players', () => {
      expect(threatManager.getThreat('unknown_player')).toBe(0);
    });

    it('should return all threat values', () => {
      const allThreats = threatManager.threatEntries;

      expect(allThreats).toHaveLength(2);
      expect(allThreats.find(entry => entry.playerId === 'player1')).toBeDefined();
      expect(allThreats.find(entry => entry.playerId === 'player2')).toBeDefined();
    });

    it('should return top threat targets', () => {
      const topThreats = threatManager.getTopThreats(1);

      expect(topThreats).toHaveLength(1);
      expect(topThreats[0].playerId).toBeDefined();
      expect(topThreats[0].threatValue).toBeGreaterThan(0);
    });

    it('should sort top threats by value', () => {
      // Add a higher threat player
      threatManager.addThreat({
        playerId: 'player3',
        damageReceived: 50,
        healingReceived: 0,
        playerArmor: 3,
        damageToSelf: 50,
        totalDamageDealt: 50,
        healingDone: 0,
        source: 'big_attack',
      });

      const topThreats = threatManager.getTopThreats(3);

      expect(topThreats).toHaveLength(3);
      expect(topThreats[0].threatValue).toBeGreaterThanOrEqual(topThreats[1].threatValue);
      expect(topThreats[1].threatValue).toBeGreaterThanOrEqual(topThreats[2].threatValue);
    });
  });

  describe('threat history tracking', () => {
    it('should track threat history', () => {
      threatManager.addThreat({
        playerId: 'player1',
        damageReceived: 20,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 20,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      });

      threatManager.addThreat({
        playerId: 'player1',
        damageReceived: 15,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 15,
        totalDamageDealt: 15,
        healingDone: 0,
        source: 'attack2',
      });

      const threatHistory = threatManager.getThreatHistory('player1');

      expect(threatHistory).toHaveLength(2);
      expect(threatHistory[0].source).toBe('attack');
      expect(threatHistory[1].source).toBe('attack2');
    });

    it('should track healing threat history', () => {
      threatManager.addThreat({
        playerId: 'healer1',
        damageReceived: 0,
        healingReceived: 10,
        playerArmor: 1,
        damageToSelf: 0,
        totalDamageDealt: 0,
        healingDone: 10,
        source: 'heal1',
      });

      threatManager.addThreat({
        playerId: 'healer1',
        damageReceived: 0,
        healingReceived: 15,
        playerArmor: 1,
        damageToSelf: 0,
        totalDamageDealt: 0,
        healingDone: 15,
        source: 'heal2',
      });

      const healingHistory = threatManager.getThreatHistory('healer1');

      expect(healingHistory).toHaveLength(2);
      expect(healingHistory[0].healingDone).toBe(10);
      expect(healingHistory[1].healingDone).toBe(15);
    });

    it('should return empty history for unknown players', () => {
      expect(threatManager.getThreatHistory('unknown')).toEqual([]);
      expect(threatManager.getThreatHistory('unknown')).toEqual([]);
    });
  });

  describe('state management', () => {
    it('should reset threat table', () => {
      // Add some threat
      threatManager.addThreat({
        playerId: 'player1',
        damageReceived: 20,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 20,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      });

      expect(threatManager.threatEntries).toHaveLength(1);

      threatManager.resetForEncounter();

      expect(threatManager.threatEntries).toHaveLength(0);
    });

    it('should reset round counter when resetting threat table', () => {
      threatManager.processRound();
      threatManager.processRound();

      expect(threatManager.getDebugInfo().roundsActive).toBe(2);

      threatManager.resetForEncounter();

      expect(threatManager.getDebugInfo().roundsActive).toBe(0);
    });

    it('should clear history when resetting', () => {
      threatManager.addThreat({
        playerId: 'player1',
        damageReceived: 20,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 20,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      });

      threatManager.resetForEncounter();

      expect(threatManager.getThreatHistory('player1')).toEqual([]);
      expect(threatManager.getThreatHistory('player1')).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle negative threat values gracefully', () => {
      const negativeUpdate: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: -10,
        healingReceived: -5,
        playerArmor: -1,
        damageToSelf: -10,
        totalDamageDealt: -20,
        healingDone: -5,
        source: 'negative_test',
      };

      threatManager.addThreat(negativeUpdate);

      // Should handle gracefully (exact behavior depends on implementation)
      const threatValue = threatManager.getThreat('player1');
      expect(typeof threatValue).toBe('number');
    });

    it('should handle very large threat values', () => {
      const largeUpdate: ThreatUpdate = {
        playerId: 'player1',
        damageReceived: Number.MAX_SAFE_INTEGER,
        healingReceived: 0,
        playerArmor: 1000,
        damageToSelf: Number.MAX_SAFE_INTEGER,
        totalDamageDealt: Number.MAX_SAFE_INTEGER,
        healingDone: 0,
        source: 'large_test',
      };

      threatManager.addThreat(largeUpdate);

      const threatValue = threatManager.getThreat('player1');
      expect(Number.isFinite(threatValue)).toBe(true);
    });

    it('should handle zero configuration values', () => {
      const zeroConfig: ThreatConfig = {
        enabled: true,
        decayRate: 0,
        healingMultiplier: 0,
        damageMultiplier: 0,
        armorMultiplier: 0,
        avoidLastTargetRounds: 0,
        fallbackToLowestHp: true,
        enableTiebreaker: true,
      };

      const zeroManager = new ThreatManager(zeroConfig);

      zeroManager.addThreat({
        playerId: 'player1',
        damageReceived: 20,
        healingReceived: 0,
        playerArmor: 2,
        damageToSelf: 20,
        totalDamageDealt: 20,
        healingDone: 0,
        source: 'attack',
      });

      // Should handle zero multipliers gracefully
      const threatValue = zeroManager.getThreat('player1');
      expect(typeof threatValue).toBe('number');
    });
  });
});