export interface Player {
  readonly id: string;
  readonly name: string;
  readonly health: number;
  readonly maxHealth: number;
}

export interface GameState {
  readonly phase: GamePhase;
  readonly players: Player[];
  readonly currentRound: number;
}

export enum GamePhase {
  Setup = "setup",
  Playing = "playing", 
  Complete = "complete"
}

export interface SocketEvents {
  // Client -> Server
  joinGame: (data: { playerName: string; gameCode?: string }) => void;
  
  // Server -> Client
  gameJoined: (data: { gameCode: string; player: Player }) => void;
  gameStateUpdate: (gameState: GameState) => void;
}
