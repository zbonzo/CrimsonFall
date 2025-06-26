/**
 * @fileoverview Unit tests for GameLoop system class
 * Tests game loop orchestration, round management, and state isolation
 * 
 * @file tests/unit/systems/GameLoop.test.ts
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { GameLoop, type GameLoopConfig } from '@/core/systems/GameLoop';
import { Player } from '@/core/entities/Player';
import { Monster } from '@/core/entities/Monster';
import type { PlayerSpecialization, MonsterDefinition } from '@/core/types/entityTypes';
import { createHexCoordinate } from '@/utils/hex/hexCoordinates';

describe('GameLoop', () => {
  let gameLoop: GameLoop;
  let mockConfig: GameLoopConfig;
  let mockPlayers: Player[];
  let mockMonsters: Monster[];

  const mockPlayerSpec: PlayerSpecialization = {
    id: 'test_class',
    name: 'Test Class',
    variant: 'player',
    description: 'Test player class',
    stats: {
      maxHp: 100,
      baseArmor: 2,
      baseDamage: 10,
      movementRange: 3,
    },
    abilities: [],
    startingAbilities: [],
  };

  const mockMonsterDef: MonsterDefinition = {
    id: 'test_monster',
    name: 'Test Monster',
    variant: 'monster',
    description: 'Test monster for unit testing',
    stats: {
      maxHp: 80,
      baseArmor: 1,
      baseDamage: 8,
      movementRange: 2,
    },
    aiVariant: 'aggressive',
    difficulty: 3,
    abilities: [],
  };

  beforeEach(() => {
    mockConfig = {
      maxRounds: 20,
      turnTimeoutMs: 30000,
      autoProgressAfterMs: 5000,
    };

    mockPlayers = [
      new Player('player1', 'Test Player 1', mockPlayerSpec, createHexCoordinate(0, 0)),
      new Player('player2', 'Test Player 2', mockPlayerSpec, createHexCoordinate(1, 0)),
    ];

    mockMonsters = [
      new Monster('monster1', mockMonsterDef, createHexCoordinate(5, 0)),
      new Monster('monster2', mockMonsterDef, createHexCoordinate(5, 1)),
    ];

    gameLoop = new GameLoop(mockPlayers, mockMonsters, mockConfig);
  });

  describe('initialization', () => {
    it('should initialize with provided config', () => {
      expect(gameLoop.gameState.phase).toBe('setup');
      expect(gameLoop.currentRound).toBe(0);
      expect(gameLoop.isGameEnded).toBe(false);
    });

    it('should initialize with players and monsters', () => {
      const players = gameLoop.getAlivePlayers();
      const monsters = gameLoop.getAliveMonsters();

      expect(players).toHaveLength(2);
      expect(monsters).toHaveLength(2);
      expect(players[0]!.id).toBe('player1');
      expect(monsters[0]!.id).toBe('monster1');
    });

    it('should validate initial game state', () => {
      // All entities should be alive and positioned
      mockPlayers.forEach(player => {
        expect(player.isAlive).toBe(true);
        expect(player.position).toBeDefined();
      });

      mockMonsters.forEach(monster => {
        expect(monster.isAlive).toBe(true);
        expect(monster.position).toBeDefined();
      });
    });

    it('should handle empty player list', () => {
      const emptyGameLoop = new GameLoop([], mockMonsters, mockConfig);

      expect(emptyGameLoop.isGameEnded).toBe(true);
      expect(emptyGameLoop.winner).toBe('monsters');
    });

    it('should handle empty monster list', () => {
      const emptyGameLoop = new GameLoop(mockPlayers, [], mockConfig);

      expect(emptyGameLoop.isGameEnded).toBe(true);
      expect(emptyGameLoop.winner).toBe('players');
    });
  });

  describe('game loop lifecycle', () => {
    it('should start game loop', () => {
      gameLoop.startGame();

      expect(gameLoop.gameState.phase === 'playing').toBe(true);
      expect(gameLoop.currentRound).toBe(1);
    });

    it('should not start if already running', () => {
      gameLoop.startGame();
      const initialRound = gameLoop.currentRound;

      gameLoop.startGame(); // Try to start again

      expect(gameLoop.currentRound).toBe(initialRound);
    });

    it('should not start if game has ended', () => {
      // Force game to end
      mockPlayers.forEach(player => {
        player.setHp(0); // Kill all players
      });

      gameLoop.startGame();

      expect(gameLoop.gameState.phase === 'playing').toBe(false);
      expect(gameLoop.isGameEnded).toBe(true);
    });

    it('should pause game loop', () => {
      gameLoop.startGame();
      gameLoop.pause();

      expect(gameLoop.gameState.phase === 'playing').toBe(false);
      expect(gameLoop.isPaused()).toBe(true);
    });

    it('should resume paused game', () => {
      gameLoop.startGame();
      gameLoop.pause();
      gameLoop.resume();

      expect(gameLoop.gameState.phase === 'playing').toBe(true);
      expect(gameLoop.isPaused()).toBe(false);
    });

    it('should stop game loop', () => {
      gameLoop.startGame();
      gameLoop.stop();

      expect(gameLoop.gameState.phase === 'playing').toBe(false);
      expect(gameLoop.isGameEnded).toBe(true);
    });
  });

  describe('round processing', () => {
    beforeEach(() => {
      gameLoop.startGame();
    });

    it('should process a complete round', async () => {
      const result = await gameLoop.processRound();

      expect(result.roundNumber).toBe(1);
      expect(result.actionResults).toBeDefined();
      expect(result.statusEffectResults).toBeDefined();
      expect(typeof result.gameEnded).toBe('boolean');
    });

    it('should increment round number after processing', async () => {
      const initialRound = gameLoop.currentRound;

      await gameLoop.processRound();

      expect(gameLoop.currentRound).toBe(initialRound + 1);
    });

    it('should not process round when not running', async () => {
      gameLoop.pause();

      const result = await gameLoop.processRound();

      expect(result.roundNumber).toBe(0);
      expect(result.actionResults).toEqual([]);
      expect(result.gameEnded).toBe(false);
    });

    it('should not process round when game ended', async () => {
      // Force game end
      mockPlayers.forEach(player => player.setHp(0));

      const result = await gameLoop.processRound();

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBe('monsters');
    });

    it('should handle maximum rounds limit', async () => {
      const shortConfig: GameLoopConfig = {
        maxRounds: 2,
        turnTimeoutMs: 30000,
        autoProgressAfterMs: 5000,
      };

      const shortGameLoop = new GameLoop(mockPlayers, mockMonsters, shortConfig);
      shortGameLoop.startGame();

      // Process rounds until limit
      await shortGameLoop.processRound(); // Round 1
      let result = await shortGameLoop.processRound(); // Round 2

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBe('draw');
      expect(result.reason).toContain('Maximum rounds');
    });
  });

  describe('win conditions', () => {
    beforeEach(() => {
      gameLoop.startGame();
    });

    it('should detect player victory when all monsters dead', async () => {
      // Kill all monsters
      mockMonsters.forEach(monster => monster.setHp(0));

      const result = await gameLoop.processRound();

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBe('players');
      expect(result.reason).toContain('All monsters defeated');
    });

    it('should detect monster victory when all players dead', async () => {
      // Kill all players
      mockPlayers.forEach(player => player.setHp(0));

      const result = await gameLoop.processRound();

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBe('monsters');
      expect(result.reason).toContain('All players defeated');
    });

    it('should detect draw when max rounds reached', async () => {
      const shortConfig: GameLoopConfig = {
        maxRounds: 1,
        turnTimeoutMs: 30000,
        autoProgressAfterMs: 5000,
      };

      const shortGameLoop = new GameLoop(mockPlayers, mockMonsters, shortConfig);
      shortGameLoop.startGame();

      const result = await shortGameLoop.processRound();

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBe('draw');
    });
  });

  describe('entity management', () => {
    it('should provide read-only access to players', () => {
      const players = gameLoop.getAlivePlayers();

      expect(players).toHaveLength(2);
      expect(players[0]).toBeInstanceOf(Player);

      // Should be a copy, not the original array
      (players as Player[]).push(new Player('extra', 'Extra Player', mockPlayerSpec, createHexCoordinate(0, 0)));
      expect(gameLoop.getAlivePlayers()).toHaveLength(2);
    });

    it('should provide read-only access to monsters', () => {
      const monsters = gameLoop.getAliveMonsters();

      expect(monsters).toHaveLength(2);
      expect(monsters[0]).toBeInstanceOf(Monster);

      // Should be a copy, not the original array
      (monsters as Monster[]).push(new Monster('extra', mockMonsterDef, createHexCoordinate(0, 0)));
      expect(gameLoop.getAliveMonsters()).toHaveLength(2);
    });

    it('should track living entities correctly', () => {
      expect(gameLoop.getLivingPlayers()).toHaveLength(2);
      expect(gameLoop.getLivingMonsters()).toHaveLength(2);

      // Kill one player
      mockPlayers[0]!.setHp(0);

      expect(gameLoop.getLivingPlayers()).toHaveLength(1);
      expect(gameLoop.getLivingMonsters()).toHaveLength(2);
    });

    it('should find entity by id', () => {
      const player = gameLoop.getEntityById('player1');
      const monster = gameLoop.getEntityById('monster1');
      const unknown = gameLoop.getEntityById('unknown');

      expect(player).toBeInstanceOf(Player);
      expect(player?.id).toBe('player1');
      expect(monster).toBeInstanceOf(Monster);
      expect(monster?.id).toBe('monster1');
      expect(unknown).toBeNull();
    });
  });

  describe('action submission', () => {
    beforeEach(() => {
      gameLoop.startGame();
    });

    it('should accept valid player actions', () => {
      const action = {
        playerId: 'player1',
        variant: 'movement' as const,
        targetPosition: createHexCoordinate(1, 1),
      };

      const result = gameLoop.submitPlayerAction(action);

      expect(result.success).toBe(true);
      expect(result.action).toEqual(action);
    });

    it('should reject actions for unknown players', () => {
      const action = {
        playerId: 'unknown_player',
        variant: 'movement' as const,
        targetPosition: createHexCoordinate(1, 1),
      };

      const result = gameLoop.submitPlayerAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Player not found');
    });

    it('should reject actions for dead players', () => {
      // Kill player
      mockPlayers[0]!.setHp(0);

      const action = {
        playerId: 'player1',
        variant: 'movement' as const,
        targetPosition: createHexCoordinate(1, 1),
      };

      const result = gameLoop.submitPlayerAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('dead');
    });

    it('should reject actions when game not running', () => {
      gameLoop.pause();

      const action = {
        playerId: 'player1',
        variant: 'movement' as const,
        targetPosition: createHexCoordinate(1, 1),
      };

      const result = gameLoop.submitPlayerAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not running');
    });

    it('should track submitted actions', () => {
      const action1 = {
        playerId: 'player1',
        variant: 'movement' as const,
        targetPosition: createHexCoordinate(1, 1),
      };

      const action2 = {
        playerId: 'player2',
        variant: 'wait' as const,
      };

      gameLoop.submitPlayerAction(action1);
      gameLoop.submitPlayerAction(action2);

      const submittedActions = gameLoop.getSubmittedActions();

      expect(submittedActions).toHaveLength(2);
      
      // Check first action (movement -> move)
      const moveAction = submittedActions.find(a => a.variant === 'move');
      expect(moveAction).toBeDefined();
      expect(moveAction?.targetPosition).toEqual(createHexCoordinate(1, 1));
      
      // Check second action (wait)
      const waitAction = submittedActions.find(a => a.variant === 'wait');
      expect(waitAction).toBeDefined();
    });

    it('should clear submitted actions after round processing', async () => {
      const action = {
        playerId: 'player1',
        variant: 'movement' as const,
        targetPosition: createHexCoordinate(1, 1),
      };

      gameLoop.submitPlayerAction(action);
      expect(gameLoop.getSubmittedActions()).toHaveLength(1);

      await gameLoop.processRound();

      expect(gameLoop.getSubmittedActions()).toHaveLength(0);
    });
  });

  describe('game state queries', () => {
    it('should provide current game state snapshot', () => {
      const state = gameLoop.getGameState();

      expect(state.round).toBe(gameLoop.currentRound);
      expect(state.isRunning).toBe(gameLoop.gameState.phase === 'playing');
      expect(state.isEnded).toBe(gameLoop.isGameEnded);
      expect(state.players).toHaveLength(2);
      expect(state.monsters).toHaveLength(2);
    });

    it('should track occupied positions', () => {
      const occupiedPositions = gameLoop.gameState.occupiedPositions;

      expect(occupiedPositions.size).toBe(4); // 2 players + 2 monsters
      expect(occupiedPositions.has('0,0,0')).toBe(true); // player1 position
      expect(occupiedPositions.has('1,0,-1')).toBe(true); // player2 position
    });

    it('should update occupied positions after movement', async () => {
      gameLoop.startGame();

      const action = {
        playerId: 'player1',
        variant: 'movement' as const,
        targetPosition: createHexCoordinate(2, 0),
      };

      gameLoop.submitPlayerAction(action);
      await gameLoop.processRound();

      const occupiedPositions = gameLoop.gameState.occupiedPositions;

      expect(occupiedPositions.has('0,0,0')).toBe(false); // Old position
      expect(occupiedPositions.has('2,0,-2')).toBe(true); // New position
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle corrupted game state gracefully', async () => {
      // Simulate corrupted state by manually modifying entity health
      mockPlayers[0]!['_currentHp'] = -100;

      gameLoop.startGame();
      const result = await gameLoop.processRound();

      expect(typeof result).toBe('object');
      expect(result.roundNumber).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid configuration values', () => {
      const invalidConfig: GameLoopConfig = {
        maxRounds: -5,
        turnTimeoutMs: -1000,
        autoProgressAfterMs: -500,
      };

      const invalidGameLoop = new GameLoop(mockPlayers, mockMonsters, invalidConfig);

      expect(invalidGameLoop.isGameEnded).toBe(false);
      expect(invalidGameLoop.currentRound).toBe(0);
    });

    it('should handle large number of entities', async () => {
      const manyPlayers: Player[] = [];
      const manyMonsters: Monster[] = [];

      // Create 50 of each
      for (let i = 0; i < 50; i++) {
        manyPlayers.push(
          new Player(`player${i}`, `Player ${i}`, mockPlayerSpec, createHexCoordinate(i, 0))
        );
        manyMonsters.push(
          new Monster(`monster${i}`, mockMonsterDef, createHexCoordinate(i + 100, 0))
        );
      }

      const largeGameLoop = new GameLoop(manyPlayers, manyMonsters, mockConfig);
      largeGameLoop.startGame();

      const result = await largeGameLoop.processRound();

      expect(result.roundNumber).toBe(1);
      expect(result.actionResults).toBeDefined();
    });

    it('should handle simultaneous entity deaths', async () => {
      gameLoop.startGame();

      // Kill all entities to test draw condition
      mockPlayers.forEach(player => player.setHp(0));
      mockMonsters.forEach(monster => monster.setHp(0));

      // This round should detect all entities dead
      const result = await gameLoop.processRound();

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBe('draw');
    });

    it('should maintain consistency after multiple operations', async () => {
      gameLoop.startGame();

      for (let i = 0; i < 5; i++) {
        await gameLoop.processRound();

        // Verify consistency - round starts at 1 and increments after each processRound
        expect(gameLoop.currentRound).toBe(i + 2);
        expect(gameLoop.getAlivePlayers()).toHaveLength(2);
        expect(gameLoop.getAliveMonsters()).toHaveLength(2);

        if (gameLoop.isGameEnded) {
          break;
        }
      }
    });
  });

  describe('performance considerations', () => {
    it('should process rounds efficiently', async () => {
      gameLoop.startGame();

      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await gameLoop.processRound();
        if (gameLoop.isGameEnded) break;
      }

      const endTime = Date.now();
      const timePerRound = (endTime - startTime) / 10;

      // Each round should complete in reasonable time (< 100ms)
      expect(timePerRound).toBeLessThan(100);
    });

    it('should not leak memory through entity references', async () => {
      const initialPlayerCount = gameLoop.getAlivePlayers().length;
      const initialMonsterCount = gameLoop.getAliveMonsters().length;

      gameLoop.startGame();

      // Process multiple rounds
      for (let i = 0; i < 5; i++) {
        await gameLoop.processRound();
        if (gameLoop.isGameEnded) break;
      }

      // Entity counts should remain stable
      expect(gameLoop.getAlivePlayers().length).toBe(initialPlayerCount);
      expect(gameLoop.getAliveMonsters().length).toBe(initialMonsterCount);
    });
  });
});