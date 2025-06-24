/**
 * Handles threat management operations
 */

import { ThreatManager } from '@/core/systems/ThreatManager.js';
import type { ThreatUpdate } from '@/core/types/entityTypes.js';

export class MonsterThreatBehavior {
  constructor(private readonly threat: ThreatManager) {}

  public addThreat(update: ThreatUpdate): void {
    this.threat.addThreat(update);
  }

  public getThreat(entityId: string): number {
    return this.threat.getThreat(entityId);
  }

  public getTopThreats(count: number): ReadonlyArray<{ playerId: string; threat: number }> {
    return this.threat.getTopThreats(count).map(entry => ({
      playerId: entry.playerId,
      threat: entry.threat,
    }));
  }

  public trackTarget(entityId: string): void {
    this.threat.trackTarget(entityId);
  }

  public wasRecentlyTargeted(entityId: string): boolean {
    return this.threat.wasRecentlyTargeted(entityId);
  }
}
