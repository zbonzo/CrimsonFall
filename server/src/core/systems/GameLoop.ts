/**
 * @fileoverview Turn-based game loop system
 * Handles combat rounds, action processing, and game state management
 *
 * FIXED: Removed reserved keywords 'type' → 'variant', 'class' → 'specialization'
 *
 * @file server/src/core/systems/GameLoop.ts
 */

import type { HexCoordinate } from '@/utils/hex/index';
import type {
  CombatEntity,
  MovableEntity,
  AbilityUser,
  StatusEffectTarget,
  TargetingContext,
  AIDecision,
  PlayerSpecialization,
} from '@/core/types/entityTypes';
import type { PlayerAction, PlayerActionVariant } from '@/core/types/playerTypes';

import { Player } from '@/core/entities/Player';
import { Monster, MonsterFactory } from '@/core/entities/Monster';
import { calculateHexDistance } from '@/utils/hexMath';

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
  readonly winner?: 'players' | 'monsters' | 'draw';
  readonly reason?: string;
}

export interface ActionResult {
  readonly entityId: string;
  readonly entityName: string;
  readonly actionVariant: 'move' | 'attack' | 'ability' | 'wait' | 'ai_decision';
  readonly success: boolean;
  readonly reason?: string;
  readonly damageDealt?: number;
  readonly healingDone?: number;
  readonly newPosition?: HexCoordinate;
  readonly targetId?: string;
  readonly abilityUsed?: string;
}

export interface StatusEffectResults {
  readonly entityUpdates: Array<{
    readonly entityId: string;
    readonly effects: Array<{ type: string; value: number }>;
    readonly expired: string[];
  }>;
}

export interface GameState {
  readonly phase: 'setup' | 'playing' | 'ended';
  readonly currentRound: number;
  readonly players: ReadonlyArray<Player>;
  readonly monsters: ReadonlyArray<Monster>;
  readonly occupiedPositions: ReadonlySet<string>;
  readonly obstacles: ReadonlySet<string>;
}

// === GAME LOOP IMPLEMENTATION ===

/**
 * Main game loop system for turn-based combat
 */
export class GameLoop {
  private readonly _config: GameLoopConfig;
  private _gameState: GameState;
  private _currentRound: number = 0;
  private _gameEnded: boolean = false;
  private _winner: 'players' | 'monsters' | 'draw' | null = null;
  private _roundHistory: RoundResult[] = [];

  constructor(players: Player[], monsters: Monster[], config: Partial<GameLoopConfig> = {}) {
    this._config = {
      maxRounds: 20,
      turnTimeoutMs: 30000, // 30 seconds per turn
      autoProgressAfterMs: 5000, // Auto-progress if all actions submitted
      ...config,
    };

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

  public get roundHistory(): ReadonlyArray<RoundResult> {
    return [...this._roundHistory];
  }

  // === GAME FLOW CONTROL ===

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

  public async processRound(): Promise<RoundResult> {
    if (this._gameState.phase !== 'playing') {
      throw new Error('Game is not in playing phase');
    }

    if (this._gameEnded) {
      throw new Error('Game has already ended');
    }

    // 1. Check for game end conditions before processing
    const preRoundCheck = this.checkGameEndConditions();
    if (preRoundCheck.gameEnded) {
      return this.endGame(preRoundCheck.winner, preRoundCheck.reason);
    }

    // 2. Process AI decisions for monsters
    this.processMonsterAI();

    // 3. Process all actions in priority order
    const actionResults = await this.processAllActions();

    // 4. Process status effects and cooldowns
    const statusEffectResults = this.processStatusEffects();

    // 5. Update occupied positions
    this.updateOccupiedPositions();

    // 6. Check for game end conditions after processing
    const postRoundCheck = this.checkGameEndConditions();

    // 7. Create round result
    const roundResult: RoundResult = {
      roundNumber: this._currentRound,
      actionResults,
      statusEffectResults,
      gameEnded: postRoundCheck.gameEnded,
      winner: postRoundCheck.winner,
      reason: postRoundCheck.reason,
    };

    this._roundHistory.push(roundResult);

    // 8. End game or advance to next round
    if (postRoundCheck.gameEnded) {
      this.endGame(postRoundCheck.winner, postRoundCheck.reason);
    } else if (this._currentRound >= this._config.maxRounds) {
      this.endGame('draw', 'Maximum rounds reached');
    } else {
      this.advanceToNextRound();
    }

    return roundResult;
  }

  // === ACTION PROCESSING ===

  private processMonsterAI(): void {
    const aliveMonsters = this._gameState.monsters.filter(m => m.isAlive);
    const alivePlayers = this._gameState.players.filter(p => p.isAlive);

    for (const monster of aliveMonsters) {
      if (!monster.canAct()) continue;

      const context: TargetingContext = {
        self: monster,
        allies: aliveMonsters.filter(m => m.id !== monster.id) as ReadonlyArray<CombatEntity>,
        enemies: alivePlayers as ReadonlyArray<CombatEntity>,
        obstacles: this._gameState.obstacles,
        currentRound: this._currentRound,
      };

      const decision = monster.makeDecision(context);
      // AI decision is stored in the monster, will be processed in processAllActions
    }
  }

  private async processAllActions(): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    // Process player actions first (players submitted actions)
    const alivePlayers = this._gameState.players.filter(p => p.isAlive);
    for (const player of alivePlayers) {
      if (player.hasSubmittedAction && player.submittedAction) {
        const result = await this.processPlayerAction(player, player.submittedAction);
        results.push(result);
      }
    }

    // Process monster AI decisions
    const aliveMonsters = this._gameState.monsters.filter(m => m.isAlive);
    for (const monster of aliveMonsters) {
      if (monster.lastDecision && monster.canAct()) {
        const result = await this.processMonsterAction(monster, monster.lastDecision);
        results.push(result);
      }
    }

    return results;
  }

  private async processPlayerAction(player: Player, action: PlayerAction): Promise<ActionResult> {
    const baseResult = {
      entityId: player.id,
      entityName: player.name,
      actionVariant: action.variant as ActionResult['actionVariant'],
      success: false,
    };

    try {
      switch (action.variant) {
        case 'move':
          return this.processMove(
            player as CombatEntity & MovableEntity,
            action.targetPosition!,
            baseResult
          );

        case 'attack':
          return this.processAttack(player as CombatEntity, action.targetId!, baseResult);

        case 'ability':
          return this.processAbility(
            player as CombatEntity & AbilityUser,
            action.abilityId!,
            action.targetId,
            baseResult
          );

        case 'wait':
          return { ...baseResult, success: true };

        default:
          return { ...baseResult, reason: `Unknown action variant: ${action.variant}` };
      }
    } catch (error) {
      return {
        ...baseResult,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async processMonsterAction(
    monster: Monster,
    decision: AIDecision
  ): Promise<ActionResult> {
    const baseResult = {
      entityId: monster.id,
      entityName: monster.name,
      actionVariant: 'ai_decision' as ActionResult['actionVariant'],
      success: false,
    };

    try {
      switch (decision.variant) {
        case 'move':
          if (decision.targetPosition) {
            return this.processMove(monster, decision.targetPosition, baseResult);
          }
          return { ...baseResult, reason: 'No target position for move' };

        case 'attack':
          if (decision.target) {
            return this.processAttack(monster, decision.target.id, baseResult);
          }
          return { ...baseResult, reason: 'No target for attack' };

        case 'ability':
          if (decision.abilityId) {
            return this.processAbility(
              monster,
              decision.abilityId,
              decision.target?.id,
              baseResult
            );
          }
          return { ...baseResult, reason: 'No ability ID for ability action' };

        case 'wait':
          return { ...baseResult, success: true };

        default:
          return { ...baseResult, reason: `Unknown AI decision variant: ${decision.variant}` };
      }
    } catch (error) {
      return {
        ...baseResult,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // === SPECIFIC ACTION HANDLERS ===

  private processMove(
    entity: CombatEntity & MovableEntity,
    targetPosition: HexCoordinate,
    baseResult: Partial<ActionResult>
  ): ActionResult {
    const moveResult = entity.moveTo(
      targetPosition,
      this._gameState.occupiedPositions,
      this._gameState.obstacles
    );

    if (moveResult.success) {
      return {
        ...baseResult,
        success: true,
        newPosition: moveResult.newPosition,
      } as ActionResult;
    } else {
      return {
        ...baseResult,
        success: false,
        reason: moveResult.reason,
      } as ActionResult;
    }
  }

  private processAttack(
    attacker: CombatEntity,
    targetId: string,
    baseResult: Partial<ActionResult>
  ): ActionResult {
    // Find target
    const target = this.findEntityById(targetId);
    if (!target) {
      return {
        ...baseResult,
        success: false,
        reason: `Target ${targetId} not found`,
      } as ActionResult;
    }

    if (!target.isAlive) {
      return {
        ...baseResult,
        success: false,
        reason: `Target ${target.name} is already dead`,
      } as ActionResult;
    }

    // Check range (basic attack has range 1)
    const distance = calculateHexDistance(attacker.position, target.position);
    if (distance > 1) {
      return {
        ...baseResult,
        success: false,
        reason: `Target out of range (distance: ${distance})`,
      } as ActionResult;
    }

    // Calculate and apply damage
    const damage = attacker.calculateDamageOutput();
    const damageResult = target.takeDamage(damage, `${attacker.name} attack`);

    // Record threat if attacker is monster and target is player
    if (attacker instanceof Monster && target instanceof Player) {