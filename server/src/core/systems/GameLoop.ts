/**
 * @fileoverview Turn-based game loop system
 * Handles combat rounds, action processing, and game state management
 *
 * FIXED: Removed reserved keywords 'type' → 'variant', 'class' → 'specialization'
 *
 * @file server/src/core/systems/GameLoop.ts
 */

import type {
  AbilityUser,
  AIDecision,
  CombatEntity,
  MovableEntity,
  StatusEffectTarget,
  TargetingContext,
} from '@/core/types/entityTypes';
import type { PlayerAction } from '@/core/types/playerTypes';
import type { HexCoordinate } from '@/utils/hex/index';

import { Monster, MonsterFactory } from '@/core/entities/Monster';
import { Player } from '@/core/entities/Player';
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
      const monster = attacker as Monster;
      monster.recordPlayerAttack(target.id, damageResult.damageDealt, target.effectiveArmor);
    }

    return {
      ...baseResult,
      success: true,
      damageDealt: damageResult.damageDealt,
      targetId: target.id,
    } as ActionResult;
  }

  private processAbility(
    caster: CombatEntity & AbilityUser,
    abilityId: string,
    targetId: string | undefined,
    baseResult: Partial<ActionResult>
  ): ActionResult {
    // Check if ability exists and can be used
    const ability = caster.getAbility(abilityId);
    if (!ability) {
      return {
        ...baseResult,
        success: false,
        reason: `Ability ${abilityId} not found`,
      } as ActionResult;
    }

    const usageCheck = caster.useAbility(abilityId);
    if (!usageCheck.success) {
      return {
        ...baseResult,
        success: false,
        reason: usageCheck.reason,
      } as ActionResult;
    }

    let damageDealt = 0;
    let healingDone = 0;
    let targetEntity: CombatEntity | null = null;

    // Handle targeted abilities
    if (targetId) {
      targetEntity = this.findEntityById(targetId);
      if (!targetEntity) {
        return {
          ...baseResult,
          success: false,
          reason: `Target ${targetId} not found`,
        } as ActionResult;
      }

      // Check range
      const distance = calculateHexDistance(caster.position, targetEntity.position);
      if (distance > ability.range) {
        return {
          ...baseResult,
          success: false,
          reason: `Target out of range (distance: ${distance}, max: ${ability.range})`,
        } as ActionResult;
      }

      // Apply ability effects
      if (ability.damage && ability.type === 'attack') {
        const damage = caster.calculateDamageOutput(ability.damage);
        const damageResult = targetEntity.takeDamage(damage, `${ability.name}`);
        damageDealt = damageResult.damageDealt;

        // Record threat for monsters
        if (caster instanceof Monster && targetEntity instanceof Player) {
          const monster = caster as Monster;
          monster.recordPlayerAbility(
            targetEntity.id,
            damageResult.damageDealt,
            damageResult.damageDealt,
            0,
            targetEntity.effectiveArmor,
            ability.name
          );
        }
      }

      if (ability.healing && ability.type === 'healing') {
        const healResult = targetEntity.heal(ability.healing);
        healingDone = healResult.amountHealed;

        // Record threat for healing (if monster heals, or player heals)
        if (caster instanceof Player && targetEntity instanceof Player) {
          // Players healing other players can attract monster attention
          for (const monster of this._gameState.monsters.filter(m => m.isAlive)) {
            monster.recordPlayerHealing(caster.id, healResult.amountHealed, caster.effectiveArmor);
          }
        }
      }

      // Apply status effects
      if (ability.statusEffects && 'addStatusEffect' in targetEntity) {
        for (const statusEffect of ability.statusEffects) {
          const chance = statusEffect.chance || 1.0;
          if (Math.random() < chance) {
            (targetEntity as StatusEffectTarget).addStatusEffect(
              statusEffect.effectName,
              statusEffect.duration,
              statusEffect.value
            );
          }
        }
      }
    }

    return {
      ...baseResult,
      success: true,
      abilityUsed: ability.name,
      damageDealt: damageDealt > 0 ? damageDealt : undefined,
      healingDone: healingDone > 0 ? healingDone : undefined,
      targetId: targetEntity?.id,
    } as ActionResult;
  }

  // === STATUS EFFECTS AND ROUND CLEANUP ===

  private processStatusEffects(): StatusEffectResults {
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

  private updateOccupiedPositions(): void {
    const allEntities = [...this._gameState.players, ...this._gameState.monsters] as CombatEntity[];
    this._gameState = {
      ...this._gameState,
      occupiedPositions: this.calculateOccupiedPositions(allEntities.filter(e => e.isAlive)),
    };
  }

  private advanceToNextRound(): void {
    this._currentRound++;
    this._gameState = {
      ...this._gameState,
      currentRound: this._currentRound,
    };
  }

  // === GAME END CONDITIONS ===

  private checkGameEndConditions(): {
    gameEnded: boolean;
    winner?: 'players' | 'monsters' | 'draw';
    reason?: string;
  } {
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

  private endGame(
    winner: 'players' | 'monsters' | 'draw' | undefined,
    reason: string | undefined
  ): RoundResult {
    this._gameEnded = true;
    this._winner = winner || 'draw';
    this._gameState = {
      ...this._gameState,
      phase: 'ended',
    };

    return {
      roundNumber: this._currentRound,
      actionResults: [],
      statusEffectResults: { entityUpdates: [] },
      gameEnded: true,
      winner: this._winner,
      reason,
    };
  }

  // === UTILITY METHODS ===

  private findEntityById(entityId: string): CombatEntity | null {
    const player = this._gameState.players.find(p => p.id === entityId);
    if (player) return player as CombatEntity;

    const monster = this._gameState.monsters.find(m => m.id === entityId);
    if (monster) return monster as CombatEntity;

    return null;
  }

  private calculateOccupiedPositions(entities: ReadonlyArray<CombatEntity>): ReadonlySet<string> {
    const positions = new Set<string>();
    for (const entity of entities) {
      const pos = entity.position;
      positions.add(`${pos.q},${pos.r},${pos.s}`);
    }
    return positions;
  }

  // === PUBLIC UTILITY METHODS ===

  public getAlivePlayers(): ReadonlyArray<Player> {
    return this._gameState.players.filter(p => p.isAlive);
  }

  public getAliveMonsters(): ReadonlyArray<Monster> {
    return this._gameState.monsters.filter(m => m.isAlive);
  }

  public getAllEntities(): ReadonlyArray<CombatEntity> {
    return [...this._gameState.players, ...this._gameState.monsters] as ReadonlyArray<CombatEntity>;
  }

  public getEntityById(entityId: string): CombatEntity | null {
    return this.findEntityById(entityId);
  }

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
    this._roundHistory = [];
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
  } {
    return {
      gameState: this._gameState,
      currentRound: this._currentRound,
      isGameEnded: this._gameEnded,
      winner: this._winner,
      totalRounds: this._roundHistory.length,
      alivePlayers: this.getAlivePlayers().length,
      aliveMonsters: this.getAliveMonsters().length,
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
    const testPlayerClass: PlayerClass = {
      id: 'test_fighter',
      name: 'Fighter',
      type: 'player',
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
          type: 'attack' as const,
          damage: 20,
          range: 1,
          cooldown: 2,
          description: 'A powerful melee attack',
        },
        {
          id: 'heal_self',
          name: 'Second Wind',
          type: 'healing' as const,
          healing: 25,
          range: 0,
          cooldown: 3,
          description: 'Heal yourself',
        },
      ],
      startingAbilities: ['power_strike', 'heal_self'],
    };

    const players = [
      new Player('player1', 'Hero', testPlayerClass, { q: 0, r: 0, s: 0 }),
      new Player('player2', 'Sidekick', testPlayerClass, { q: 1, r: 0, s: -1 }),
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
    const soloPlayerClass: PlayerClass = {
      id: 'solo_hero',
      name: 'Solo Hero',
      type: 'player',
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
          type: 'attack' as const,
          damage: 15,
          range: 1,
          cooldown: 3,
          description: 'Attack all adjacent enemies',
          areaOfEffect: 1,
        },
      ],
      startingAbilities: ['whirlwind'],
    };

    const players = [new Player('solo_player', 'Lone Wolf', soloPlayerClass, { q: 0, r: 0, s: 0 })];

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
