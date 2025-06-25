/**
 * @fileoverview Custom Jest matchers for hex dungeon crawler testing
 * Provides domain-specific assertions for game entities and mechanics
 *
 * @file tests/helpers/assertions.ts
 */

import type { HexCoordinate } from '@/utils/hex/hexCoordinates.js';
import type { Player } from '@/core/entities/Player.js';
import type { Monster } from '@/core/entities/Monster.js';

// === TYPE DEFINITIONS ===

declare global {
  namespace jest {
    interface Matchers<R> {
      // Hex coordinate matchers
      toBeValidHexCoordinate(): R;
      toBeAtDistance(distance: number, from: HexCoordinate): R;
      toBeAdjacent(to: HexCoordinate): R;
      
      // Entity matchers
      toBeAlive(): R;
      toBeDead(): R;
      toHaveStatusEffect(effectName: string): R;
      toHaveHp(hp: number): R;
      toHaveHpInRange(min: number, max: number): R;
      
      // Combat matchers
      toBeInRange(entity: Player | Monster, range: number): R;
      toBeAbleToAttack(target: Player | Monster): R;
      
      // Performance matchers
      toCompleteWithin(maxTimeMs: number): R;
      
      // Game state matchers
      toHaveActionResult(entityId: string, actionType: string): R;
      toHaveEndedWithWinner(winner: 'players' | 'monsters' | 'draw'): R;
    }
  }
}

// === HEX COORDINATE MATCHERS ===

/**
 * Validates that a coordinate satisfies hex constraint (q + r + s = 0)
 */
function toBeValidHexCoordinate(this: jest.MatcherContext, received: any) {
  const pass = received && 
    typeof received.q === 'number' && 
    typeof received.r === 'number' && 
    typeof received.s === 'number' &&
    Math.abs(received.q + received.r + received.s) < Number.EPSILON;

  if (pass) {
    return {
      message: () => `expected ${JSON.stringify(received)} not to be a valid hex coordinate`,
      pass: true,
    };
  } else {
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to be a valid hex coordinate (q + r + s = 0, got ${
          received ? (received.q + received.r + received.s) : 'invalid object'
        })`,
      pass: false,
    };
  }
}

/**
 * Validates that a coordinate is at a specific distance from another
 */
function toBeAtDistance(this: jest.MatcherContext, received: HexCoordinate, distance: number, from: HexCoordinate) {
  const calculateDistance = (a: HexCoordinate, b: HexCoordinate): number => {
    return Math.max(
      Math.abs(a.q - b.q),
      Math.abs(a.r - b.r),
      Math.abs(a.s - b.s)
    );
  };

  const actualDistance = calculateDistance(received, from);
  const pass = actualDistance === distance;

  if (pass) {
    return {
      message: () => 
        `expected ${JSON.stringify(received)} not to be at distance ${distance} from ${JSON.stringify(from)}`,
      pass: true,
    };
  } else {
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to be at distance ${distance} from ${JSON.stringify(from)}, but was at distance ${actualDistance}`,
      pass: false,
    };
  }
}

/**
 * Validates that two coordinates are adjacent (distance 1)
 */
function toBeAdjacent(this: jest.MatcherContext, received: HexCoordinate, to: HexCoordinate) {
  return toBeAtDistance.call(this, received, 1, to);
}

// === ENTITY MATCHERS ===

/**
 * Validates that an entity is alive
 */
function toBeAlive(this: jest.MatcherContext, received: Player | Monster) {
  const pass = received && received.isAlive === true;

  if (pass) {
    return {
      message: () => `expected ${received.name} not to be alive`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received?.name || 'entity'} to be alive`,
      pass: false,
    };
  }
}

/**
 * Validates that an entity is dead
 */
function toBeDead(this: jest.MatcherContext, received: Player | Monster) {
  const pass = received && received.isAlive === false;

  if (pass) {
    return {
      message: () => `expected ${received.name} not to be dead`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received?.name || 'entity'} to be dead`,
      pass: false,
    };
  }
}

/**
 * Validates that an entity has a specific status effect
 */
function toHaveStatusEffect(this: jest.MatcherContext, received: Player | Monster, effectName: string) {
  const pass = received && received.hasStatusEffect && received.hasStatusEffect(effectName);

  if (pass) {
    return {
      message: () => `expected ${received.name} not to have status effect: ${effectName}`,
      pass: true,
    };
  } else {
    const activeEffects = received?.activeStatusEffects?.map(e => e.name).join(', ') || 'none';
    return {
      message: () => 
        `expected ${received?.name || 'entity'} to have status effect: ${effectName}, but has: ${activeEffects}`,
      pass: false,
    };
  }
}

/**
 * Validates that an entity has specific HP
 */
function toHaveHp(this: jest.MatcherContext, received: Player | Monster, hp: number) {
  const pass = received && received.currentHp === hp;

  if (pass) {
    return {
      message: () => `expected ${received.name} not to have ${hp} HP`,
      pass: true,
    };
  } else {
    return {
      message: () => 
        `expected ${received?.name || 'entity'} to have ${hp} HP, but has ${received?.currentHp || 'unknown'}`,
      pass: false,
    };
  }
}

/**
 * Validates that an entity's HP is within a range
 */
function toHaveHpInRange(this: jest.MatcherContext, received: Player | Monster, min: number, max: number) {
  const pass = received && received.currentHp >= min && received.currentHp <= max;

  if (pass) {
    return {
      message: () => `expected ${received.name} not to have HP between ${min} and ${max}`,
      pass: true,
    };
  } else {
    return {
      message: () => 
        `expected ${received?.name || 'entity'} to have HP between ${min} and ${max}, but has ${received?.currentHp || 'unknown'}`,
      pass: false,
    };
  }
}

// === COMBAT MATCHERS ===

/**
 * Validates that an entity is within range of another
 */
function toBeInRange(this: jest.MatcherContext, received: Player | Monster, entity: Player | Monster, range: number) {
  if (!received || !entity) {
    return {
      message: () => 'expected valid entities for range check',
      pass: false,
    };
  }

  const calculateDistance = (a: HexCoordinate, b: HexCoordinate): number => {
    return Math.max(
      Math.abs(a.q - b.q),
      Math.abs(a.r - b.r),
      Math.abs(a.s - b.s)
    );
  };

  const distance = calculateDistance(received.position, entity.position);
  const pass = distance <= range;

  if (pass) {
    return {
      message: () => `expected ${received.name} not to be within range ${range} of ${entity.name}`,
      pass: true,
    };
  } else {
    return {
      message: () => 
        `expected ${received.name} to be within range ${range} of ${entity.name}, but distance is ${distance}`,
      pass: false,
    };
  }
}

/**
 * Validates that an entity can attack another (range and status checks)
 */
function toBeAbleToAttack(this: jest.MatcherContext, received: Player | Monster, target: Player | Monster) {
  if (!received || !target) {
    return {
      message: () => 'expected valid entities for attack check',
      pass: false,
    };
  }

  const canAct = received.canAct && received.canAct();
  const targetAlive = target.isAlive;
  const inRange = toBeInRange.call(this, received, target, 1).pass;

  const pass = canAct && targetAlive && inRange;

  if (pass) {
    return {
      message: () => `expected ${received.name} not to be able to attack ${target.name}`,
      pass: true,
    };
  } else {
    const reasons = [];
    if (!canAct) reasons.push('cannot act');
    if (!targetAlive) reasons.push('target is dead');
    if (!inRange) reasons.push('out of range');
    
    return {
      message: () => 
        `expected ${received.name} to be able to attack ${target.name}, but: ${reasons.join(', ')}`,
      pass: false,
    };
  }
}

// === PERFORMANCE MATCHERS ===

/**
 * Validates that an async operation completes within a time limit
 */
function toCompleteWithin(this: jest.MatcherContext, received: Promise<any>, maxTimeMs: number) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    received
      .then(() => {
        const duration = performance.now() - startTime;
        const pass = duration <= maxTimeMs;
        
        resolve({
          message: () => pass 
            ? `expected operation not to complete within ${maxTimeMs}ms`
            : `expected operation to complete within ${maxTimeMs}ms, but took ${duration.toFixed(2)}ms`,
          pass
        });
      })
      .catch(() => {
        resolve({
          message: () => 'expected operation to complete successfully',
          pass: false
        });
      });
  });
}

// === GAME STATE MATCHERS ===

/**
 * Validates that a game result contains an action result for an entity
 */
function toHaveActionResult(
  this: jest.MatcherContext, 
  received: { actionResults: any[] }, 
  entityId: string, 
  actionType: string
) {
  if (!received || !received.actionResults) {
    return {
      message: () => 'expected valid game result with actionResults',
      pass: false,
    };
  }

  const actionResult = received.actionResults.find(
    result => result.entityId === entityId && result.actionType === actionType
  );
  
  const pass = !!actionResult;

  if (pass) {
    return {
      message: () => `expected game result not to have ${actionType} action for entity ${entityId}`,
      pass: true,
    };
  } else {
    const availableActions = received.actionResults.map(r => `${r.entityId}:${r.actionType}`).join(', ');
    return {
      message: () => 
        `expected game result to have ${actionType} action for entity ${entityId}, but found: ${availableActions}`,
      pass: false,
    };
  }
}

/**
 * Validates that a game has ended with a specific winner
 */
function toHaveEndedWithWinner(
  this: jest.MatcherContext, 
  received: { gameEnded: boolean; winner?: string }, 
  winner: 'players' | 'monsters' | 'draw'
) {
  if (!received) {
    return {
      message: () => 'expected valid game result',
      pass: false,
    };
  }

  const pass = received.gameEnded && received.winner === winner;

  if (pass) {
    return {
      message: () => `expected game not to end with winner: ${winner}`,
      pass: true,
    };
  } else {
    if (!received.gameEnded) {
      return {
        message: () => `expected game to have ended with winner: ${winner}, but game has not ended`,
        pass: false,
      };
    } else {
      return {
        message: () => 
          `expected game to end with winner: ${winner}, but ended with winner: ${received.winner}`,
        pass: false,
      };
    }
  }
}

// === EXPORT MATCHERS ===

export const customMatchers = {
  toBeValidHexCoordinate,
  toBeAtDistance,
  toBeAdjacent,
  toBeAlive,
  toBeDead,
  toHaveStatusEffect,
  toHaveHp,
  toHaveHpInRange,
  toBeInRange,
  toBeAbleToAttack,
  toCompleteWithin,
  toHaveActionResult,
  toHaveEndedWithWinner,
};

// Auto-register matchers when imported
expect.extend(customMatchers);