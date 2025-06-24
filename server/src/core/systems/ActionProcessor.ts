/**
 * @fileoverview Action processing system for game loop
 * Handles player actions, monster AI decisions, and specific action execution
 * Extracted from GameLoop.ts to reduce complexity
 *
 * @file server/src/core/systems/ActionProcessor.ts
 */

import type {
  AbilityUser,
  AIDecision,
  CombatEntity,
  MovableEntity,
  StatusEffectTarget,
} from '@/core/types/entityTypes.js';
import type { PlayerAction } from '@/core/types/playerTypes.js';
import { calculateHexDistance, type HexCoordinate } from '@/utils/hex/index.js';

import { Monster } from '@/core/entities/Monster.js';
import { Player } from '@/core/entities/Player.js';

// === ACTION RESULT TYPES ===

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

// === ACTION PROCESSOR ===

/**
 * Processes all types of actions for players and monsters
 * Handles validation, execution, and result generation
 */
export class ActionProcessor {
  constructor(
    private readonly findEntityById: (entityId: string) => CombatEntity | null,
    private readonly getGameState: () => {
      occupiedPositions: ReadonlySet<string>;
      obstacles: ReadonlySet<string>;
      monsters: ReadonlyArray<Monster>;
    }
  ) {}

  /**
   * Processes all actions for a round
   */
  public async processAllActions(
    alivePlayers: ReadonlyArray<Player>,
    aliveMonsters: ReadonlyArray<Monster>
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    // Process player actions first
    for (const player of alivePlayers) {
      if (player.hasSubmittedAction && player.submittedAction) {
        const result = await this.processPlayerAction(player, player.submittedAction);
        results.push(result);
      }
    }

    // Process monster AI decisions
    for (const monster of aliveMonsters) {
      if (monster.lastDecision && monster.canAct()) {
        const result = await this.processMonsterAction(monster, monster.lastDecision);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Processes a single player action
   */
  public async processPlayerAction(player: Player, action: PlayerAction): Promise<ActionResult> {
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

  /**
   * Processes a single monster AI decision
   */
  public async processMonsterAction(monster: Monster, decision: AIDecision): Promise<ActionResult> {
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

  /**
   * Processes movement actions
   */
  private processMove(
    entity: CombatEntity & MovableEntity,
    targetPosition: HexCoordinate,
    baseResult: Partial<ActionResult>
  ): ActionResult {
    const gameState = this.getGameState();
    const moveResult = entity.moveTo(
      targetPosition,
      gameState.occupiedPositions,
      gameState.obstacles
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

  /**
   * Processes attack actions
   */
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

  /**
   * Processes ability actions
   */
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
      if (ability.damage && ability.variant === 'attack') {
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

      if (ability.healing && ability.variant === 'healing') {
        const healResult = targetEntity.heal(ability.healing);
        healingDone = healResult.amountHealed;

        // Record threat for healing
        if (caster instanceof Player && targetEntity instanceof Player) {
          const gameState = this.getGameState();
          for (const monster of gameState.monsters.filter(m => m.isAlive)) {
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

  /**
   * Validates action parameters before processing
   */
  public validateAction(
    entity: CombatEntity,
    actionVariant: string,
    targetId?: string,
    targetPosition?: HexCoordinate,
    abilityId?: string
  ): { valid: boolean; reason?: string } {
    if (!entity.isAlive) {
      return { valid: false, reason: 'Entity is not alive' };
    }

    if (!entity.canAct()) {
      return { valid: false, reason: 'Entity cannot act due to status effects' };
    }

    switch (actionVariant) {
      case 'move':
        if (!targetPosition) {
          return { valid: false, reason: 'Move action requires target position' };
        }
        if (!entity.canMove()) {
          return { valid: false, reason: 'Entity cannot move due to status effects' };
        }
        break;

      case 'attack':
        if (!targetId) {
          return { valid: false, reason: 'Attack action requires target ID' };
        }
        break;

      case 'ability':
        if (!abilityId) {
          return { valid: false, reason: 'Ability action requires ability ID' };
        }
        if ('canUseAbility' in entity) {
          const abilityCheck = (entity as unknown as AbilityUser).canUseAbility(abilityId);
          if (!abilityCheck.canUse) {
            return { valid: false, reason: abilityCheck.reason || 'Ability cannot be used' };
          }
        }
        break;

      case 'wait':
        // Wait is always valid if entity can act
        break;

      default:
        return { valid: false, reason: `Unknown action variant: ${actionVariant}` };
    }

    return { valid: true };
  }

  /**
   * Gets action processing statistics
   */
  public getProcessingStats(
    alivePlayers: ReadonlyArray<Player>,
    aliveMonsters: ReadonlyArray<Monster>
  ): {
    playersWithActions: number;
    monstersWithDecisions: number;
    totalActionsToProcess: number;
    actionTypes: Record<string, number>;
  } {
    const actionTypes: Record<string, number> = {};
    let playersWithActions = 0;
    let monstersWithDecisions = 0;

    // Count player actions
    for (const player of alivePlayers) {
      if (player.hasSubmittedAction && player.submittedAction) {
        playersWithActions++;
        const variant = player.submittedAction.variant;
        actionTypes[variant] = (actionTypes[variant] || 0) + 1;
      }
    }

    // Count monster decisions
    for (const monster of aliveMonsters) {
      if (monster.lastDecision && monster.canAct()) {
        monstersWithDecisions++;
        const variant = monster.lastDecision.variant;
        actionTypes[`ai_${variant}`] = (actionTypes[`ai_${variant}`] || 0) + 1;
      }
    }

    return {
      playersWithActions,
      monstersWithDecisions,
      totalActionsToProcess: playersWithActions + monstersWithDecisions,
      actionTypes,
    };
  }
}
