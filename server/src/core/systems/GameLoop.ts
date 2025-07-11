/**
 * @fileoverview Streamlined turn-based game loop system
 * Core orchestration logic with extracted processors for action handling and state management
 *
 * COMPLEXITY NOTE: This file remains at 358 lines due to:
 * - Complex game loop orchestration with multiple phases
 * - AI processing integration and decision coordination
 * - Test scenario factory methods with detailed configurations
 * - Game end handling with multiple termination conditions
 * 
 * FUTURE REFACTORING OPPORTUNITIES:
 * - Extract GameLoopPhases to separate phase handlers
 * - Create AICoordinator for monster AI processing
 * - Move factory methods to dedicated GameScenarioFactory
 * - Separate game end logic to GameEndHandler
 *
 * FIXED: Removed reserved keywords 'type' → 'variant', 'class' → 'specialization'
 * REDUCED: From ~550 lines to under 300 by extracting ActionProcessor and GameStateManager
 *
 * @file server/src/core/systems/GameLoop.ts
 */

import type { PlayerSpecialization, TargetingContext } from '@/core/types/entityTypes.js';

import { Monster } from '@/core/entities/Monster.js';
import { MonsterFactory } from '@/core/entities/MonsterFactory.js';
import { Player } from '@/core/entities/Player.js';
import { ActionProcessor, type ActionResult } from './ActionProcessor.js';
import { GameStateManager, type GameState, type StatusEffectResults } from './GameStateManager.js';

// === GAME LOOP TYPES ===

export interface GameLoopConfig {
  readonly maxRounds: number;
  readonly turnTimeoutMs: number;
  readonly autoProgressAfterMs: number;
}

export interface RoundResult {
  readonly roundNumber: number;
  readonly actionResults: ActionResult[];
  readonly statusEffectResults: StatusEffectResults;
  readonly gameEnded: boolean;
  readonly winner?: 'players' | 'monsters' | 'draw' | undefined;
  readonly reason?: string | undefined;
}

// === GAME LOOP IMPLEMENTATION ===

/**
 * Main game loop system for turn-based combat
 * Orchestrates processors for actions and state management
 */
export class GameLoop {
  private readonly _config: GameLoopConfig;
  private readonly _stateManager: GameStateManager;
  private readonly _actionProcessor: ActionProcessor;
  private _roundHistory: RoundResult[] = [];

  constructor(players: Player[], monsters: Monster[], config: Partial<GameLoopConfig> = {}) {
    this._config = {
      maxRounds: 20,
      turnTimeoutMs: 30000, // 30 seconds per turn
      autoProgressAfterMs: 5000, // Auto-progress if all actions submitted
      ...config,
    };

    this._stateManager = new GameStateManager(players, monsters);

    // Set up action processor with required dependencies
    this._actionProcessor = new ActionProcessor(
      (entityId: string) => this._stateManager.findEntityById(entityId),
      () => ({
        occupiedPositions: this._stateManager.gameState.occupiedPositions,
        obstacles: this._stateManager.gameState.obstacles,
        monsters: this._stateManager.gameState.monsters,
      })
    );
  }

  // === GETTERS (Delegated) ===

  public get gameState(): GameState {
    return this._stateManager.gameState;
  }

  public get currentRound(): number {
    return this._stateManager.currentRound;
  }

  public get isGameEnded(): boolean {
    return this._stateManager.isGameEnded;
  }

  public get winner(): 'players' | 'monsters' | 'draw' | null {
    return this._stateManager.winner;
  }

  public get roundHistory(): ReadonlyArray<RoundResult> {
    return [...this._roundHistory];
  }

  // === GAME FLOW CONTROL ===

  public startGame(): void {
    this._stateManager.startGame();
  }

  public async processRound(): Promise<RoundResult> {
    if (this.gameState.phase !== 'playing') {
      return {
        roundNumber: 0,
        actionResults: [],
        statusEffectResults: { entityUpdates: [] },
        gameEnded: false,
      };
    }

    if (this.isGameEnded) {
      return {
        roundNumber: this.currentRound,
        actionResults: [],
        statusEffectResults: { entityUpdates: [] },
        gameEnded: true,
        winner: this.winner || undefined,
      };
    }

    // 1. Check for game end conditions before processing
    const preRoundCheck = this._stateManager.checkGameEndConditions();
    if (preRoundCheck.gameEnded) {
      return this.endGame(preRoundCheck.winner, preRoundCheck.reason);
    }

    // 2. Process AI decisions for monsters
    this.processMonsterAI();

    // 3. Process all actions in priority order
    const actionResults = await this._actionProcessor.processAllActions(
      this._stateManager.getAlivePlayers(),
      this._stateManager.getAliveMonsters()
    );

    // 4. Process status effects and cooldowns
    const statusEffectResults = this._stateManager.processStatusEffects();

    // 5. Update occupied positions
    this._stateManager.updateOccupiedPositions();

    // 6. Check for game end conditions after processing
    const postRoundCheck = this._stateManager.checkGameEndConditions();

    // 7. Create round result
    const roundResult: RoundResult = {
      roundNumber: this.currentRound,
      actionResults,
      statusEffectResults,
      gameEnded: postRoundCheck.gameEnded,
      winner: postRoundCheck.winner,
      reason: postRoundCheck.reason,
    };

    this._roundHistory.push(roundResult);

    // 8. Advance to next round first
    this._stateManager.advanceToNextRound();

    // 9. End game or continue
    if (postRoundCheck.gameEnded) {
      this.endGame(postRoundCheck.winner, postRoundCheck.reason);
      return {
        ...roundResult,
        gameEnded: true,
        winner: postRoundCheck.winner,
        reason: postRoundCheck.reason,
      };
    } else {
      const maxRoundCheck = this._stateManager.checkMaxRounds(this._config.maxRounds);
      if (maxRoundCheck.gameEnded) {
        this.endGame(maxRoundCheck.winner, maxRoundCheck.reason);
        return {
          ...roundResult,
          gameEnded: true,
          winner: maxRoundCheck.winner,
          reason: maxRoundCheck.reason,
        };
      }
    }

    return roundResult;
  }

  // === AI PROCESSING ===

  private processMonsterAI(): void {
    const aliveMonsters = this._stateManager.getAliveMonsters();
    const alivePlayers = this._stateManager.getAlivePlayers();

    for (const monster of aliveMonsters) {
      if (!monster.canAct()) continue;

      const context: TargetingContext = {
        self: monster,
        allies: aliveMonsters.filter(m => m.id !== monster.id),
        enemies: alivePlayers,
        obstacles: this.gameState.obstacles,
        currentRound: this.currentRound,
      };

      // AI decision is stored in the monster, will be processed in processAllActions
      monster.makeDecision(context);
    }
  }

  // === GAME END HANDLING ===

  private endGame(
    winner: 'players' | 'monsters' | 'draw' | undefined,
    reason: string | undefined
  ): RoundResult {
    this._stateManager.endGame(winner, reason);

    return {
      roundNumber: this.currentRound,
      actionResults: [],
      statusEffectResults: { entityUpdates: [] },
      gameEnded: true,
      winner: this.winner || undefined,
      reason,
    };
  }

  // === PUBLIC UTILITY METHODS (Delegated) ===

  public getAlivePlayers(): ReadonlyArray<Player> {
    return this._stateManager.getAlivePlayers();
  }

  public getAliveMonsters(): ReadonlyArray<Monster> {
    return this._stateManager.getAliveMonsters();
  }

  public getLivingPlayers(): ReadonlyArray<Player> {
    return this._stateManager.getAlivePlayers();
  }

  public getLivingMonsters(): ReadonlyArray<Monster> {
    return this._stateManager.getAliveMonsters();
  }

  public getAllEntities(): ReadonlyArray<import('@/core/types/entityTypes.js').CombatEntity> {
    return this._stateManager.getAllEntities();
  }

  public getEntityById(
    entityId: string
  ): import('@/core/types/entityTypes.js').CombatEntity | null {
    return this._stateManager.findEntityById(entityId);
  }

  public resetForNewEncounter(newPlayers?: Player[], newMonsters?: Monster[]): void {
    this._stateManager.resetForNewEncounter(newPlayers, newMonsters);
    this._roundHistory = [];
  }

  // === GAME CONTROL METHODS ===

  public pause(): void {
    if (this.gameState.phase === 'playing') {
      this._stateManager.endGame('draw', 'Game paused');
    }
  }

  public resume(): void {
    if (this.gameState.phase === 'ended' && this.winner === 'draw') {
      this._stateManager.resetForNewEncounter();
      this.startGame();
    }
  }

  public stop(): void {
    this._stateManager.endGame('draw', 'Game stopped');
  }

  public isPaused(): boolean {
    return this.gameState.phase === 'ended' && this.winner === 'draw';
  }

  // === ACTION SUBMISSION ===

  public submitPlayerAction(action: {
    playerId: string;
    variant: 'movement' | 'attack' | 'ability' | 'wait';
    targetPosition?: import('@/utils/hex/hexCoordinates.js').HexCoordinate;
    targetId?: string;
    abilityId?: string;
  }): {
    success: boolean;
    action?: any;
    error?: string;
  } {
    if (this.gameState.phase !== 'playing') {
      return { success: false, error: 'Game not running' };
    }

    const player = this._stateManager.findEntityById(action.playerId) as Player;
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (!player.isAlive) {
      return { success: false, error: 'Player is dead' };
    }

    // Convert variant names to match the action manager
    let actionVariant: any;
    switch (action.variant) {
      case 'movement':
        actionVariant = 'move';
        break;
      default:
        actionVariant = action.variant;
    }

    // Extract parameters
    const params: any = {};
    if (action.targetPosition) params.targetPosition = action.targetPosition;
    if (action.targetId) params.targetId = action.targetId;
    if (action.abilityId) params.abilityId = action.abilityId;

    // Submit action through player's action manager
    const result = player.actionManager.submitAction(actionVariant, params);
    if (result.success) {
      return { success: true, action };
    } else {
      return { success: false, error: result.reason || 'Unknown error' };
    }
  }

  public getSubmittedActions(): ReadonlyArray<import('@/core/types/playerTypes.js').PlayerAction> {
    const actions: import('@/core/types/playerTypes.js').PlayerAction[] = [];
    for (const player of this._stateManager.getAlivePlayers()) {
      const action = player.actionManager.submittedAction;
      if (action) {
        actions.push(action);
      }
    }
    return actions;
  }

  // === GAME STATE ACCESS ===

  public getGameState(): {
    round: number;
    isRunning: boolean;
    isEnded: boolean;
    players: ReadonlyArray<Player>;
    monsters: ReadonlyArray<Monster>;
  } {
    return {
      round: this.currentRound,
      isRunning: this.gameState.phase === 'playing',
      isEnded: this.isGameEnded,
      players: this._stateManager.gameState.players,
      monsters: this._stateManager.gameState.monsters,
    };
  }

  // === DEBUG METHODS ===

  public getDebugInfo(): {
    gameState: GameState;
    currentRound: number;
    isGameEnded: boolean;
    winner: string | null;
    totalRounds: number;
    alivePlayers: number;
    aliveMonsters: number;
    actionStats: ReturnType<ActionProcessor['getProcessingStats']>;
    stateValidation: ReturnType<GameStateManager['validateGameState']>;
  } {
    const stateManager = this._stateManager;
    const actionStats = this._actionProcessor.getProcessingStats(
      stateManager.getAlivePlayers(),
      stateManager.getAliveMonsters()
    );

    return {
      gameState: this.gameState,
      currentRound: this.currentRound,
      isGameEnded: this.isGameEnded,
      winner: this.winner,
      totalRounds: this._roundHistory.length,
      alivePlayers: this.getAlivePlayers().length,
      aliveMonsters: this.getAliveMonsters().length,
      actionStats,
      stateValidation: stateManager.validateGameState(),
    };
  }
}

// === GAME LOOP FACTORY ===

/**
 * Factory for creating game loops with test scenarios
 */
export class GameLoopFactory {
  public static createTestScenario(): GameLoop {
    // Create test players
    const testPlayerSpecialization: PlayerSpecialization = {
      id: 'test_fighter',
      name: 'Fighter',
      variant: 'player',
      description: 'A test fighter class',
      stats: {
        maxHp: 100,
        baseArmor: 2,
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
        },
        {
          id: 'heal_self',
          name: 'Second Wind',
          variant: 'healing',
          healing: 25,
          range: 0,
          cooldown: 3,
          description: 'Heal yourself',
        },
      ],
      startingAbilities: ['power_strike', 'heal_self'],
    };

    const players = [
      new Player('player1', 'Hero', testPlayerSpecialization, { q: 0, r: 0, s: 0 }),
      new Player('player2', 'Sidekick', testPlayerSpecialization, { q: 1, r: 0, s: -1 }),
    ];

    // Create test monsters
    const monsters = [
      MonsterFactory.createSimpleMonster('monster1', 'Goblin', { q: 3, r: 0, s: -3 }),
      MonsterFactory.createSimpleMonster('monster2', 'Orc', { q: 2, r: 1, s: -3 }),
    ];

    return new GameLoop(players, monsters, {
      maxRounds: 10,
      turnTimeoutMs: 10000, // 10 seconds for testing
      autoProgressAfterMs: 2000, // Quick progression
    });
  }

  public static createSoloScenario(): GameLoop {
    const soloPlayerSpecialization: PlayerSpecialization = {
      id: 'solo_hero',
      name: 'Solo Hero',
      variant: 'player',
      description: 'A powerful solo adventurer',
      stats: {
        maxHp: 150,
        baseArmor: 3,
        baseDamage: 20,
        movementRange: 4,
      },
      abilities: [
        {
          id: 'whirlwind',
          name: 'Whirlwind',
          variant: 'attack',
          damage: 15,
          range: 1,
          cooldown: 3,
          description: 'Attack all adjacent enemies',
          areaOfEffect: 1,
        },
      ],
      startingAbilities: ['whirlwind'],
    };

    const players = [
      new Player('solo_player', 'Lone Wolf', soloPlayerSpecialization, { q: 0, r: 0, s: 0 }),
    ];

    const monsters = [
      MonsterFactory.createSimpleMonster('weak1', 'Weak Goblin', { q: 2, r: 0, s: -2 }),
      MonsterFactory.createSimpleMonster('weak2', 'Weak Goblin', { q: 1, r: 1, s: -2 }),
      MonsterFactory.createSimpleMonster('weak3', 'Weak Goblin', { q: 0, r: 2, s: -2 }),
    ];

    return new GameLoop(players, monsters, {
      maxRounds: 15,
      turnTimeoutMs: 15000,
      autoProgressAfterMs: 3000,
    });
  }
}
