/**
 * @fileoverview Game state management system
 * Handles game state transitions, end conditions, and status effect processing
 * Extracted from GameLoop.ts to reduce complexity
 *
 * COMPLEXITY NOTE: This file remains at 369 lines due to:
 * - Complex game state validation with multiple entity types
 * - Status effect processing across all entities
 * - Game end condition evaluation with multiple scenarios
 * - State synchronization and consistency checking
 * 
 * FUTURE REFACTORING OPPORTUNITIES:
 * - Extract GameStateValidator class for validation logic
 * - Create StatusEffectProcessor for cross-entity status processing
 * - Split win condition checking to GameEndEvaluator
 * - Separate state updates from state queries
 *
 * @file server/src/core/systems/GameStateManager.ts
 */

import type { CombatEntity } from '@/core/types/entityTypes.js';

import { Monster } from '@/core/entities/Monster.js';
import { Player } from '@/core/entities/Player.js';

// === GAME STATE TYPES ===

export interface GameState {
  readonly phase: 'setup' | 'playing' | 'ended';
  readonly currentRound: number;
  readonly players: ReadonlyArray<Player>;
  readonly monsters: ReadonlyArray<Monster>;
  readonly occupiedPositions: ReadonlySet<string>;
  readonly obstacles: ReadonlySet<string>;
}

export interface StatusEffectResults {
  readonly entityUpdates: Array<{
    readonly entityId: string;
    readonly effects: Array<{ type: string; value: number }>;
    readonly expired: string[];
  }>;
}

export interface GameEndCondition {
  readonly gameEnded: boolean;
  readonly winner?: 'players' | 'monsters' | 'draw';
  readonly reason?: string;
}

// === GAME STATE MANAGER ===

/**
 * Manages game state transitions and validation
 * Handles status effects, position updates, and end conditions
 */
export class GameStateManager {
  private _gameState: GameState;
  private _currentRound: number = 0;
  private _gameEnded: boolean = false;
  private _winner: 'players' | 'monsters' | 'draw' | null = null;

  constructor(players: Player[], monsters: Monster[]) {
    this._gameState = {
      phase: 'setup',
      currentRound: 0,
      players: [...players],
      monsters: [...monsters],
      occupiedPositions: this.calculateOccupiedPositions([
        ...players,
        ...monsters,
      ] as CombatEntity[]),
      obstacles: new Set(), // No obstacles for now
    };
  }

  // === GETTERS ===

  public get gameState(): GameState {
    return this._gameState;
  }

  public get currentRound(): number {
    return this._currentRound;
  }

  public get isGameEnded(): boolean {
    return this._gameEnded;
  }

  public get winner(): 'players' | 'monsters' | 'draw' | null {
    return this._winner;
  }

  // === STATE TRANSITIONS ===

  public startGame(): void {
    if (this._gameState.phase !== 'setup') {
      throw new Error('Game has already started');
    }

    this._gameState = {
      ...this._gameState,
      phase: 'playing',
    };

    this._currentRound = 1;
  }

  public advanceToNextRound(): void {
    this._currentRound++;
    this._gameState = {
      ...this._gameState,
      currentRound: this._currentRound,
    };
  }

  public endGame(
    winner: 'players' | 'monsters' | 'draw' | undefined,
    _reason: string | undefined
  ): void {
    this._gameEnded = true;
    this._winner = winner || 'draw';
    this._gameState = {
      ...this._gameState,
      phase: 'ended',
    };
  }

  // === STATUS EFFECT PROCESSING ===

  public processStatusEffects(): StatusEffectResults {
    const entityUpdates: StatusEffectResults['entityUpdates'] = [];

    // Process player status effects
    for (const player of this._gameState.players) {
      const result = player.processRound();
      if (
        result.statusEffectResults.effects.length > 0 ||
        result.statusEffectResults.expired.length > 0
      ) {
        entityUpdates.push({
          entityId: player.id,
          effects: result.statusEffectResults.effects,
          expired: result.statusEffectResults.expired,
        });
      }
    }

    // Process monster status effects
    for (const monster of this._gameState.monsters) {
      const result = monster.processRound();
      if (
        result.statusEffectResults.effects.length > 0 ||
        result.statusEffectResults.expired.length > 0
      ) {
        entityUpdates.push({
          entityId: monster.id,
          effects: result.statusEffectResults.effects,
          expired: result.statusEffectResults.expired,
        });
      }
    }

    return { entityUpdates };
  }

  // === POSITION MANAGEMENT ===

  public updateOccupiedPositions(): void {
    const allEntities = [...this._gameState.players, ...this._gameState.monsters] as CombatEntity[];
    this._gameState = {
      ...this._gameState,
      occupiedPositions: this.calculateOccupiedPositions(allEntities.filter(e => e.isAlive)),
    };
  }

  private calculateOccupiedPositions(entities: ReadonlyArray<CombatEntity>): ReadonlySet<string> {
    const positions = new Set<string>();
    for (const entity of entities) {
      const pos = entity.position;
      positions.add(`${pos.q},${pos.r},${pos.s}`);
    }
    return positions;
  }

  // === GAME END CONDITIONS ===

  public checkGameEndConditions(): GameEndCondition {
    const alivePlayers = this._gameState.players.filter(p => p.isAlive);
    const aliveMonsters = this._gameState.monsters.filter(m => m.isAlive);

    if (alivePlayers.length === 0 && aliveMonsters.length === 0) {
      return {
        gameEnded: true,
        winner: 'draw',
        reason: 'All combatants defeated',
      };
    }

    if (alivePlayers.length === 0) {
      return {
        gameEnded: true,
        winner: 'monsters',
        reason: 'All players defeated',
      };
    }

    if (aliveMonsters.length === 0) {
      return {
        gameEnded: true,
        winner: 'players',
        reason: 'All monsters defeated',
      };
    }

    return { gameEnded: false };
  }

  public checkMaxRounds(maxRounds: number): GameEndCondition {
    if (this._currentRound >= maxRounds) {
      return {
        gameEnded: true,
        winner: 'draw',
        reason: 'Maximum rounds reached',
      };
    }

    return { gameEnded: false };
  }

  // === ENTITY ACCESS ===

  public getAlivePlayers(): ReadonlyArray<Player> {
    return this._gameState.players.filter(p => p.isAlive);
  }

  public getAliveMonsters(): ReadonlyArray<Monster> {
    return this._gameState.monsters.filter(m => m.isAlive);
  }

  public getAllEntities(): ReadonlyArray<CombatEntity> {
    return [...this._gameState.players, ...this._gameState.monsters] as ReadonlyArray<CombatEntity>;
  }

  public findEntityById(entityId: string): CombatEntity | null {
    const player = this._gameState.players.find(p => p.id === entityId);
    if (player) return player as CombatEntity;

    const monster = this._gameState.monsters.find(m => m.id === entityId);
    if (monster) return monster as CombatEntity;

    return null;
  }

  // === RESET AND CLEANUP ===

  public resetForNewEncounter(newPlayers?: Player[], newMonsters?: Monster[]): void {
    // Reset all existing entities
    for (const player of this._gameState.players) {
      player.resetForEncounter();
    }
    for (const monster of this._gameState.monsters) {
      monster.resetForEncounter();
    }

    // Use new entities if provided
    const players = newPlayers || this._gameState.players;
    const monsters = newMonsters || this._gameState.monsters;

    this._gameState = {
      phase: 'setup',
      currentRound: 0,
      players: [...players],
      monsters: [...monsters],
      occupiedPositions: this.calculateOccupiedPositions([
        ...players,
        ...monsters,
      ] as CombatEntity[]),
      obstacles: new Set(),
    };

    this._currentRound = 0;
    this._gameEnded = false;
    this._winner = null;
  }

  // === VALIDATION ===

  public validateGameState(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for duplicate entity IDs
    const allIds = [...this._gameState.players, ...this._gameState.monsters].map(e => e.id);
    const uniqueIds = new Set(allIds);
    if (allIds.length !== uniqueIds.size) {
      issues.push('Duplicate entity IDs found');
    }

    // Check for entities at same position
    const positions = new Map<string, string[]>();
    for (const entity of this.getAllEntities()) {
      const posKey = `${entity.position.q},${entity.position.r},${entity.position.s}`;
      if (!positions.has(posKey)) {
        positions.set(posKey, []);
      }
      positions.get(posKey)!.push(entity.id);
    }

    for (const [pos, entityIds] of positions.entries()) {
      if (entityIds.length > 1) {
        issues.push(`Multiple entities at position ${pos}: ${entityIds.join(', ')}`);
      }
    }

    // Check for invalid game state transitions
    if (this._gameState.phase === 'ended' && !this._gameEnded) {
      issues.push('Game state shows ended but internal flag is false');
    }

    if (this._currentRound > 0 && this._gameState.phase === 'setup') {
      issues.push('Round counter advanced but game still in setup phase');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // === STATISTICS ===

  public getGameStateStats(): {
    phase: string;
    currentRound: number;
    totalPlayers: number;
    alivePlayers: number;
    totalMonsters: number;
    aliveMonsters: number;
    occupiedPositions: number;
    obstacles: number;
    gameEnded: boolean;
    winner: string | null;
  } {
    const alivePlayers = this.getAlivePlayers();
    const aliveMonsters = this.getAliveMonsters();

    return {
      phase: this._gameState.phase,
      currentRound: this._currentRound,
      totalPlayers: this._gameState.players.length,
      alivePlayers: alivePlayers.length,
      totalMonsters: this._gameState.monsters.length,
      aliveMonsters: aliveMonsters.length,
      occupiedPositions: this._gameState.occupiedPositions.size,
      obstacles: this._gameState.obstacles.size,
      gameEnded: this._gameEnded,
      winner: this._winner,
    };
  }

  // === DEBUGGING ===

  public getDebugInfo(): {
    gameState: GameState;
    currentRound: number;
    isGameEnded: boolean;
    winner: string | null;
    validation: ReturnType<GameStateManager['validateGameState']>;
    stats: ReturnType<GameStateManager['getGameStateStats']>;
  } {
    return {
      gameState: this._gameState,
      currentRound: this._currentRound,
      isGameEnded: this._gameEnded,
      winner: this._winner,
      validation: this.validateGameState(),
      stats: this.getGameStateStats(),
    };
  }
}
