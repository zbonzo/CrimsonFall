/**
 * @fileoverview Integration test for the complete game loop system
 * Tests Player entities, Monster entities, and turn-based combat
 *
 * @file tests/integration/gameLoop.test.ts
 */

import { GameLoop, GameLoopFactory } from '../../server/src/core/systems/GameLoop';
import { Player } from '../../server/src/core/entities/Player';
import { MonsterFactory } from '../../server/src/core/entities/Monster';
import type { PlayerClass } from '../../server/src/core/types/entityTypes';

describe('Game Loop Integration', () => {
  describe('Basic Combat Flow', () => {
    let gameLoop: GameLoop;

    beforeEach(() => {
      gameLoop = GameLoopFactory.createTestScenario();
    });

    it('should initialize game state correctly', () => {
      const state = gameLoop.gameState;

      expect(state.phase).toBe('setup');
      expect(state.currentRound).toBe(0);
      expect(state.monsters).toHaveLength(2);
      expect(gameLoop.isGameEnded).toBe(false);
    });

    it('should start game and advance to playing phase', () => {
      gameLoop.startGame();

      expect(gameLoop.gameState.phase).toBe('playing');
      expect(gameLoop.currentRound).toBe(1);
    });

    it('should process a complete combat round', async () => {
      gameLoop.startGame();

      const players = gameLoop.getAlivePlayers();
      const monsters = gameLoop.getAliveMonsters();

      // Players submit actions
      players[0].submitAction('attack', { targetId: monsters[0].id });
      players[1].submitAction('move', { targetPosition: { q: 2, r: 0, s: -2 } });

      // Process the round
      const result = await gameLoop.processRound();

      expect(result.roundNumber).toBe(1);
      expect(result.actionResults).toHaveLength(4); // 2 players + 2 monsters
      expect(result.gameEnded).toBe(false);

      // Check that actions were processed
      const playerAttack = result.actionResults.find(
        r => r.entityId === players[0].id && r.actionType === 'attack'
      );
      expect(playerAttack).toBeDefined();
      expect(playerAttack?.success).toBe(true);
      expect(playerAttack?.damageDealt).toBeGreaterThan(0);
    });

    it('should handle monster AI decisions', async () => {
      gameLoop.startGame();

      const monsters = gameLoop.getAliveMonsters();
      const initialDecisions = monsters.map(m => m.lastDecision);

      // All monsters should start with no decisions
      expect(initialDecisions.every(d => d === null)).toBe(true);

      // Process a round (this will trigger AI decisions)
      await gameLoop.processRound();

      const postRoundDecisions = monsters.map(m => m.lastDecision);

      // Monsters should now have made decisions
      expect(postRoundDecisions.every(d => d !== null)).toBe(true);
      expect(
        postRoundDecisions.every(d => ['attack', 'move', 'ability', 'wait'].includes(d!.type))
      ).toBe(true);
    });

    it('should handle status effects processing', async () => {
      gameLoop.startGame();

      const player = gameLoop.getAlivePlayers()[0];

      // Apply a poison effect
      player.addStatusEffect('poison', 3, 5);
      expect(player.hasStatusEffect('poison')).toBe(true);

      const initialHp = player.currentHp;

      // Process round - should apply poison damage
      const result = await gameLoop.processRound();

      expect(player.currentHp).toBeLessThan(initialHp);

      // Check status effect results
      const playerStatusResults = result.statusEffectResults.entityUpdates.find(
        u => u.entityId === player.id
      );
      expect(playerStatusResults).toBeDefined();
      expect(playerStatusResults?.effects.some(e => e.type === 'poison_damage')).toBe(true);
    });

    it('should detect game end when all monsters defeated', async () => {
      gameLoop.startGame();

      const monsters = gameLoop.getAliveMonsters();

      // Manually kill all monsters to test end condition
      for (const monster of monsters) {
        monster.takeDamage(1000, 'test');
      }

      const result = await gameLoop.processRound();

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBe('players');
      expect(result.reason).toBe('All monsters defeated');
      expect(gameLoop.isGameEnded).toBe(true);
    });

    it('should detect game end when all players defeated', async () => {
      gameLoop.startGame();

      const players = gameLoop.getAlivePlayers();

      // Manually kill all players to test end condition
      for (const player of players) {
        player.takeDamage(1000, 'test');
      }

      const result = await gameLoop.processRound();

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBe('monsters');
      expect(result.reason).toBe('All players defeated');
    });

    it('should enforce maximum rounds limit', async () => {
      const shortGame = new GameLoop(
        Array.from(gameLoop.getAlivePlayers()),
        Array.from(gameLoop.getAliveMonsters()),
        {
          maxRounds: 2,
          turnTimeoutMs: 1000,
          autoProgressAfterMs: 500,
        }
      );

      shortGame.startGame();

      // Process two rounds
      await shortGame.processRound();
      expect(shortGame.isGameEnded).toBe(false);

      const finalResult = await shortGame.processRound();
      expect(finalResult.gameEnded).toBe(true);
      expect(finalResult.winner).toBe('draw');
      expect(finalResult.reason).toBe('Maximum rounds reached');
    });
  });

  describe('Threat System Integration', () => {
    it('should track threat when players attack monsters', async () => {
      const gameLoop = GameLoopFactory.createTestScenario();
      gameLoop.startGame();

      const player = gameLoop.getAlivePlayers()[0];
      const monster = gameLoop.getAliveMonsters()[0];

      // Player attacks monster
      player.submitAction('attack', { targetId: monster.id });

      await gameLoop.processRound();

      // Monster should now have threat for this player
      const threat = monster.getThreat(player.id);
      expect(threat).toBeGreaterThan(0);

      // Monster should prioritize this player in future decisions
      const topThreats = monster.getTopThreats(1);
      expect(topThreats[0]?.playerId).toBe(player.id);
    });

    it('should track healing threat', async () => {
      const gameLoop = GameLoopFactory.createTestScenario();
      gameLoop.startGame();

      const players = gameLoop.getAlivePlayers();
      const healer = players[0];
      const patient = players[1];
      const monster = gameLoop.getAliveMonsters()[0];

      // Damage the patient first
      patient.takeDamage(30, 'test');

      // Healer uses healing ability
      healer.submitAction('ability', {
        abilityId: 'heal_self', // Self-heal for simplicity
      });

      await gameLoop.processRound();

      // Monster should have threat for the healer
      const healerThreat = monster.getThreat(healer.id);
      expect(healerThreat).toBeGreaterThan(0);
    });
  });

  describe('Complex Combat Scenarios', () => {
    it('should handle area of effect abilities', async () => {
      const gameLoop = GameLoopFactory.createSoloScenario();
      gameLoop.startGame();

      const player = gameLoop.getAlivePlayers()[0];
      const monsters = gameLoop.getAliveMonsters();

      // Move player adjacent to multiple monsters (in a real scenario)
      // For this test, we'll assume AOE ability works
      player.submitAction('ability', { abilityId: 'whirlwind' });

      const result = await gameLoop.processRound();

      const abilityResult = result.actionResults.find(
        r => r.entityId === player.id && r.abilityUsed === 'Whirlwind'
      );

      expect(abilityResult).toBeDefined();
      expect(abilityResult?.success).toBe(true);
    });

    it('should handle multiple rounds of combat', async () => {
      const gameLoop = GameLoopFactory.createTestScenario();
      gameLoop.startGame();

      const rounds: any[] = [];

      // Simulate several rounds of combat
      for (let i = 0; i < 5 && !gameLoop.isGameEnded; i++) {
        const players = Array.from(gameLoop.getAlivePlayers()); // Convert to mutable array
        const monsters = Array.from(gameLoop.getAliveMonsters()); // Convert to mutable array

        if (players.length > 0 && monsters.length > 0) {
          // Players take actions
          players[0]?.submitAction('attack', { targetId: monsters[0]?.id });
          if (players[1]) {
            players[1].submitAction('move', {
              targetPosition: { q: players[1].position.q + 1, r: 0, s: players[1].position.s - 1 },
            });
          }
        }

        const result = await gameLoop.processRound();
        rounds.push(result);

        if (result.gameEnded) break;
      }

      expect(rounds.length).toBeGreaterThan(0);
      expect(rounds[rounds.length - 1].gameEnded).toBe(true);
      expect(['players', 'monsters', 'draw']).toContain(rounds[rounds.length - 1].winner);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid player actions gracefully', async () => {
      const gameLoop = GameLoopFactory.createTestScenario();
      gameLoop.startGame();

      const player = gameLoop.getAlivePlayers()[0];

      // Submit invalid action (target doesn't exist)
      player.submitAction('attack', { targetId: 'nonexistent' });

      const result = await gameLoop.processRound();

      const attackResult = result.actionResults.find(
        r => r.entityId === player.id && r.actionType === 'attack'
      );

      expect(attackResult).toBeDefined();
      expect(attackResult?.success).toBe(false);
      expect(attackResult?.reason).toContain('not found');
    });

    it('should handle out of range attacks', async () => {
      const gameLoop = GameLoopFactory.createTestScenario();
      gameLoop.startGame();

      const player = gameLoop.getAlivePlayers()[0];
      const monster = gameLoop.getAliveMonsters()[0];

      // Monster should be out of range initially
      player.submitAction('attack', { targetId: monster.id });

      const result = await gameLoop.processRound();

      const attackResult = result.actionResults.find(
        r => r.entityId === player.id && r.actionType === 'attack'
      );

      expect(attackResult).toBeDefined();
      expect(attackResult?.success).toBe(false);
      expect(attackResult?.reason).toContain('out of range');
    });
  });

  describe('Game State Management', () => {
    it('should maintain consistent occupied positions', async () => {
      const gameLoop = GameLoopFactory.createTestScenario();
      gameLoop.startGame();

      const initialPositions = gameLoop.gameState.occupiedPositions;
      expect(initialPositions.size).toBe(4); // 2 players + 2 monsters

      // Move a player
      const player = gameLoop.getAlivePlayers()[0];
      player.submitAction('move', { targetPosition: { q: 1, r: 1, s: -2 } });

      await gameLoop.processRound();

      const newPositions = gameLoop.gameState.occupiedPositions;
      expect(newPositions.size).toBe(4); // Should still be 4
      expect(newPositions.has('1,1,-2')).toBe(true); // Player's new position
    });

    it('should reset properly for new encounters', () => {
      const gameLoop = GameLoopFactory.createTestScenario();
      gameLoop.startGame();

      // Advance a few rounds
      gameLoop.processRound();
      gameLoop.processRound();

      expect(gameLoop.currentRound).toBeGreaterThan(1);

      // Reset for new encounter
      gameLoop.resetForNewEncounter();

      expect(gameLoop.gameState.phase).toBe('setup');
      expect(gameLoop.currentRound).toBe(0);
      expect(gameLoop.isGameEnded).toBe(false);
      expect(gameLoop.roundHistory).toHaveLength(0);
    });
  });
});

// === PERFORMANCE TESTS ===

describe('Game Loop Performance', () => {
  it('should process rounds efficiently', async () => {
    const gameLoop = GameLoopFactory.createTestScenario();
    gameLoop.startGame();

    const startTime = performance.now();

    // Process 10 rounds
    for (let i = 0; i < 10 && !gameLoop.isGameEnded; i++) {
      await gameLoop.processRound();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should process rounds quickly (under 100ms total for 10 rounds)
    expect(duration).toBeLessThan(100);
  });

  it('should handle large numbers of entities efficiently', async () => {
    // Create a larger combat scenario
    const testPlayerClass: PlayerClass = {
      id: 'test_fighter',
      name: 'Fighter',
      type: 'player',
      description: 'A basic fighter for testing',
      stats: { maxHp: 100, baseArmor: 2, baseDamage: 15, movementRange: 3 },
      abilities: [],
      startingAbilities: [],
    };

    const players = Array.from(
      { length: 10 },
      (_, i) => new Player(`player${i}`, `Hero${i}`, testPlayerClass, { q: i, r: 0, s: -i })
    );

    const monsters = Array.from({ length: 10 }, (_, i) =>
      MonsterFactory.createSimpleMonster(`monster${i}`, `Goblin${i}`, { q: i, r: 5, s: -i - 5 })
    );

    const largeGameLoop = new GameLoop(players, monsters);
    largeGameLoop.startGame();

    const startTime = performance.now();

    // Process one round with 20 entities
    await largeGameLoop.processRound();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should still be fast even with many entities (under 50ms)
    expect(duration).toBeLessThan(50);
    expect(largeGameLoop.getAllEntities()).toHaveLength(20);
  });
});

// === MANUAL TESTING HELPERS ===

/**
 * Helper functions for manual testing and debugging
 */
export class GameLoopTestHelpers {
  public static async runFullGameSimulation(): Promise<void> {
    console.log('🎮 Starting Game Loop Simulation...\n');

    const gameLoop = GameLoopFactory.createTestScenario();
    gameLoop.startGame();

    console.log('📊 Initial State:');
    console.log(`Players: ${gameLoop.getAlivePlayers().length}`);
    console.log(`Monsters: ${gameLoop.getAliveMonsters().length}\n`);

    let roundCount = 0;

    while (!gameLoop.isGameEnded && roundCount < 10) {
      roundCount++;
      console.log(`🔄 Round ${roundCount}:`);

      // Submit random actions for players
      const players = Array.from(gameLoop.getAlivePlayers()); // Convert to mutable array
      const monsters = Array.from(gameLoop.getAliveMonsters()); // Convert to mutable array

      for (const player of players) {
        if (monsters.length > 0) {
          // Randomly choose between attack and move
          if (Math.random() > 0.5) {
            const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
            player.submitAction('attack', { targetId: randomMonster.id });
            console.log(`  ${player.name} attacks ${randomMonster.name}`);
          } else {
            const newPos = {
              q: player.position.q + Math.floor(Math.random() * 3) - 1,
              r: player.position.r + Math.floor(Math.random() * 3) - 1,
              s: player.position.s + Math.floor(Math.random() * 3) - 1,
            };
            player.submitAction('move', { targetPosition: newPos });
            console.log(`  ${player.name} moves to (${newPos.q},${newPos.r})`);
          }
        }
      }

      // Process the round
      const result = await gameLoop.processRound();

      console.log(`  Actions processed: ${result.actionResults.length}`);
      console.log(
        `  Damage dealt: ${result.actionResults
          .filter(r => r.damageDealt)
          .reduce((sum, r) => sum + (r.damageDealt || 0), 0)}`
      );

      if (result.gameEnded) {
        console.log(`\n🏆 Game Over! Winner: ${result.winner}`);
        console.log(`Reason: ${result.reason}`);
        break;
      }

      console.log(
        `  Alive - Players: ${gameLoop.getAlivePlayers().length}, Monsters: ${
          gameLoop.getAliveMonsters().length
        }\n`
      );
    }

    console.log(`📈 Game completed in ${roundCount} rounds`);
    console.log('✅ Simulation finished successfully!');
  }

  public static printEntityStates(gameLoop: GameLoop): void {
    console.log('\n📊 Current Entity States:');

    console.log('\n👥 Players:');
    for (const player of gameLoop.getAlivePlayers()) {
      console.log(
        `  ${player.name}: ${player.currentHp}/${player.maxHp} HP at (${player.position.q},${player.position.r})`
      );
      if (player.activeStatusEffects.length > 0) {
        console.log(`    Status: ${player.activeStatusEffects.map(e => e.name).join(', ')}`);
      }
    }

    console.log('\n👹 Monsters:');
    for (const monster of gameLoop.getAliveMonsters()) {
      console.log(
        `  ${monster.name}: ${monster.currentHp}/${monster.maxHp} HP at (${monster.position.q},${monster.position.r})`
      );
      if (monster.lastDecision) {
        console.log(
          `    Last AI: ${monster.lastDecision.type} (${monster.lastDecision.reasoning})`
        );
      }
      if (monster.activeStatusEffects.length > 0) {
        console.log(`    Status: ${monster.activeStatusEffects.map(e => e.name).join(', ')}`);
      }
    }
  }

  public static async runThreatSystemDemo(): Promise<void> {
    console.log('🎯 Threat System Demonstration...\n');

    const gameLoop = GameLoopFactory.createTestScenario();
    gameLoop.startGame();

    const player = Array.from(gameLoop.getAlivePlayers())[0];
    const monster = Array.from(gameLoop.getAliveMonsters())[0];

    console.log(`Initial threat for ${player.name}: ${monster.getThreat(player.id)}`);

    // Player attacks monster multiple times
    for (let i = 0; i < 3; i++) {
      player.submitAction('attack', { targetId: monster.id });
      await gameLoop.processRound();

      const threat = monster.getThreat(player.id);
      console.log(`After attack ${i + 1}, threat for ${player.name}: ${threat.toFixed(2)}`);

      if (!monster.isAlive) {
        console.log(`${monster.name} was defeated!`);
        break;
      }
    }

    console.log('\n🎯 Top Threats:');
    const topThreats = monster.getTopThreats(3);
    for (const threat of topThreats) {
      console.log(`  ${threat.playerId}: ${threat.threat.toFixed(2)}`);
    }
  }
}

// === EXPORT TEST HELPERS FOR MANUAL EXECUTION ===

// Uncomment these lines to run manual tests:
// GameLoopTestHelpers.runFullGameSimulation();
// GameLoopTestHelpers.runThreatSystemDemo();
