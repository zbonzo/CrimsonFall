# Hex Dungeon Crawler - Project Structure & Architecture

## 🏗️ **System Architecture Overview**

**Design Philosophy**: Clean, modular architecture optimized for solo development with emphasis on maintainability, testability, and incremental growth.

**Key Principles**:
- **Domain-Driven Design**: Business logic separated from infrastructure
- **Event-Driven Architecture**: Loosely coupled systems communicating via events
- **Hexagonal Architecture**: Dependencies point inward, external concerns isolated
- **Test-First Design**: Architecture shaped by testing requirements

```
┌─────────────────────────────────────────────────────────────┐
│                    HEX DUNGEON CRAWLER                     │
├─────────────────────────────────────────────────────────────┤
│  🌐 Web Client (React)     📱 Future Mobile     🖥️ Future TV  │
│     │                           │                    │      │
│     └───────────────────────────┼────────────────────┘      │
│                                 │                           │
│  ┌─────────────────────────────┴─────────────────────────┐  │
│  │              🌐 API Gateway                          │  │
│  │         (Rate Limiting, CORS, Auth)                 │  │
│  └─────────────────────┬───────────────────────────────┘  │
│                        │                                  │
│  ┌────────────────────┴────────────────────┐              │
│  │         📡 WebSocket Server             │              │
│  │       (Real-time Communication)        │              │
│  └────────────────────┬────────────────────┘              │
│                       │                                   │
│  ┌───────────────────┴────────────────────┐               │
│  │           🎮 Game Engine               │               │
│  │      (Core Business Logic)             │               │
│  └───────────────────┬────────────────────┘               │
│                      │                                    │
│  ┌──────────────────┴─────────────────────┐               │
│  │         💾 Data Layer                  │               │
│  │    (In-Memory + Future Persistence)    │               │
│  └────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 **Project Structure**

```
hex-dungeon-crawler/
├── 📦 WORKSPACE ROOT
│   ├── package.json                 # Workspace dependencies & scripts
│   ├── .eslintrc.js                # Shared linting configuration
│   ├── .prettierrc.js              # Code formatting rules
│   ├── jest.config.js              # Testing configuration
│   ├── .github/workflows/          # CI/CD pipeline
│   └── docs/                       # Project documentation
│
├── 🌐 CLIENT APPLICATION
│   └── client/
│       ├── public/
│       │   ├── index.html
│       │   ├── manifest.json       # PWA configuration
│       │   └── icons/              # App icons (emojis initially)
│       ├── src/
│       │   ├── 🎯 ENTRY POINTS
│       │   │   ├── index.js         # React app bootstrap
│       │   │   └── App.jsx          # Main app component & routing
│       │   │
│       │   ├── ⚙️ CONFIGURATION
│       │   │   ├── constants.js     # Client-side constants
│       │   │   └── config.js        # Environment configuration
│       │   │
│       │   ├── 🎨 UI FOUNDATION
│       │   │   ├── styles/
│       │   │   │   ├── globals.css  # CSS variables, themes, utilities
│       │   │   │   ├── components.css # Reusable component styles
│       │   │   │   └── accessibility.css # A11y-specific styles
│       │   │   └── themes/
│       │   │       ├── light.css
│       │   │       ├── dark.css
│       │   │       └── colorblind.css
│       │   │
│       │   ├── 🧠 STATE MANAGEMENT
│       │   │   └── contexts/
│       │   │       ├── GameContext.jsx    # Global game state
│       │   │       ├── UIContext.jsx      # UI state (modals, themes)
│       │   │       └── SocketContext.jsx  # WebSocket connection
│       │   │
│       │   ├── 🔌 EXTERNAL INTERFACES
│       │   │   ├── hooks/
│       │   │   │   ├── useSocket.js       # WebSocket communication
│       │   │   │   ├── useGameState.js    # Game state management
│       │   │   │   ├── useKeyboard.js     # Keyboard navigation
│       │   │   │   └── useAccessibility.js # A11y features
│       │   │   ├── services/
│       │   │   │   ├── apiService.js      # HTTP API client
│       │   │   │   ├── socketService.js   # WebSocket service
│       │   │   │   └── storageService.js  # Local storage
│       │   │   └── utils/
│       │   │       ├── hexMath.js         # Hex grid calculations
│       │   │       ├── gameHelpers.js     # Game utility functions
│       │   │       └── accessibility.js  # A11y helper functions
│       │   │
│       │   ├── 📄 PAGES (Main Views)
│       │   │   ├── HomePage/
│       │   │   │   ├── HomePage.jsx
│       │   │   │   ├── HomePage.test.js
│       │   │   │   └── HomePage.module.css
│       │   │   ├── LobbyPage/
│       │   │   │   ├── LobbyPage.jsx      # Game setup & waiting
│       │   │   │   ├── components/        # Lobby-specific components
│       │   │   │   └── LobbyPage.test.js
│       │   │   ├── GamePage/
│       │   │   │   ├── GamePage.jsx       # Main gameplay interface
│       │   │   │   ├── components/        # Game UI components
│       │   │   │   └── GamePage.test.js
│       │   │   └── ResultsPage/
│       │   │       ├── ResultsPage.jsx    # Game completion & stats
│       │   │       └── ResultsPage.test.js
│       │   │
│       │   ├── 🎮 GAME COMPONENTS
│       │   │   └── components/game/
│       │   │       ├── HexGrid/
│       │   │       │   ├── HexGrid.jsx           # Main hex grid display
│       │   │       │   ├── HexTile.jsx           # Individual hex tile
│       │   │       │   ├── HexGrid.test.js
│       │   │       │   └── HexGrid.module.css
│       │   │       ├── AbilityPanel/
│       │   │       │   ├── AbilityPanel.jsx      # Ability selection UI
│       │   │       │   ├── AbilityCard.jsx       # Individual ability
│       │   │       │   └── AbilityPanel.test.js
│       │   │       ├── PlayerStatus/
│       │   │       │   ├── PlayerStatus.jsx      # Player info display
│       │   │       │   ├── HealthBar.jsx         # HP visualization
│       │   │       │   └── PlayerStatus.test.js
│       │   │       ├── GameLog/
│       │   │       │   ├── GameLog.jsx           # Event history
│       │   │       │   ├── LogEntry.jsx          # Individual log item
│       │   │       │   └── GameLog.test.js
│       │   │       └── TurnTimer/
│       │   │           ├── TurnTimer.jsx         # Turn countdown
│       │   │           └── TurnTimer.test.js
│       │   │
│       │   ├── 🧩 SHARED COMPONENTS
│       │   │   └── components/common/
│       │   │       ├── Button/
│       │   │       │   ├── Button.jsx            # Accessible button
│       │   │       │   ├── Button.test.js
│       │   │       │   └── Button.module.css
│       │   │       ├── Modal/
│       │   │       │   ├── Modal.jsx             # Accessible modal
│       │   │       │   ├── Modal.test.js
│       │   │       │   └── Modal.module.css
│       │   │       ├── LoadingSpinner/
│       │   │       │   ├── LoadingSpinner.jsx
│       │   │       │   └── LoadingSpinner.test.js
│       │   │       └── ErrorBoundary/
│       │   │           ├── ErrorBoundary.jsx     # Error handling
│       │   │           └── ErrorBoundary.test.js
│       │   │
│       │   └── 🧪 TESTING
│       │       └── __tests__/
│       │           ├── setup.js              # Test configuration
│       │           ├── utils/                # Test utilities
│       │           │   ├── testHelpers.js
│       │           │   ├── mockData.js
│       │           │   └── renderHelpers.js
│       │           └── integration/          # Integration tests
│       │               ├── gameFlow.test.js
│       │               └── accessibility.test.js
│       │
│       ├── package.json                     # Client dependencies
│       └── vite.config.js                   # Build configuration
│
├── 🖥️ SERVER APPLICATION  
│   └── server/
│       ├── src/
│       │   ├── 🎯 ENTRY POINTS
│       │   │   ├── index.js                 # Server bootstrap
│       │   │   └── server.js                # Express + Socket.IO setup
│       │   │
│       │   ├── ⚙️ CONFIGURATION
│       │   │   ├── config/
│       │   │   │   ├── index.js             # Configuration loader
│       │   │   │   ├── database.js          # Database configuration
│       │   │   │   ├── server.js            # Server settings
│       │   │   │   └── game.js              # Game balance settings
│       │   │   └── constants/
│       │   │       ├── gameConstants.js     # Game rules & balance
│       │   │       ├── messages.js          # Centralized text strings
│       │   │       └── errors.js            # Error codes & messages
│       │   │
│       │   ├── 🌐 API LAYER (External Interface)
│       │   │   ├── routes/
│       │   │   │   ├── index.js             # Route aggregator
│       │   │   │   ├── gameRoutes.js        # Game-related endpoints
│       │   │   │   ├── playerRoutes.js      # Player management
│       │   │   │   └── configRoutes.js      # Configuration endpoints
│       │   │   ├── middleware/
│       │   │   │   ├── auth.js              # Authentication (future)
│       │   │   │   ├── validation.js        # Input validation
│       │   │   │   ├── rateLimit.js         # Rate limiting
│       │   │   │   ├── errorHandler.js      # Error handling
│       │   │   │   └── cors.js              # CORS configuration
│       │   │   └── sockets/
│       │   │       ├── gameSocket.js        # WebSocket game events
│       │   │       ├── lobbySocket.js       # Lobby management
│       │   │       └── socketMiddleware.js  # Socket authentication
│       │   │
│       │   ├── 🎮 GAME ENGINE (Business Logic)
│       │   │   ├── core/                    # Core domain entities
│       │   │   │   ├── Game.js              # Game session entity
│       │   │   │   ├── Player.js            # Player entity
│       │   │   │   ├── Dungeon.js           # Dungeon entity
│       │   │   │   ├── Monster.js           # Monster entity
│       │   │   │   └── Ability.js           # Ability entity
│       │   │   ├── systems/                 # Game systems
│       │   │   │   ├── GameManager.js       # Game lifecycle
│       │   │   │   ├── TurnManager.js       # Turn order & processing
│       │   │   │   ├── CombatSystem.js      # Combat resolution
│       │   │   │   ├── AbilitySystem.js     # Ability execution
│       │   │   │   ├── MovementSystem.js    # Movement & positioning
│       │   │   │   └── ProgressionSystem.js # XP & advancement
│       │   │   ├── generation/              # Procedural generation
│       │   │   │   ├── DungeonGenerator.js  # Dungeon creation
│       │   │   │   ├── EncounterGenerator.js# Encounter design
│       │   │   │   ├── LootGenerator.js     # Reward generation
│       │   │   │   └── BalanceValidator.js  # Balance checking
│       │   │   └── ai/                      # AI behavior
│       │   │       ├── MonsterAI.js         # Monster behavior
│       │   │       └── DifficultyScaler.js  # Dynamic difficulty
│       │   │
│       │   ├── 🔧 SERVICES (Application Logic)
│       │   │   ├── GameService.js           # Game orchestration
│       │   │   ├── PlayerService.js         # Player management
│       │   │   ├── SessionService.js        # Session management
│       │   │   ├── ValidationService.js     # Business validation
│       │   │   └── EventService.js          # Event publishing
│       │   │
│       │   ├── 💾 DATA LAYER
│       │   │   ├── repositories/            # Data access patterns
│       │   │   │   ├── GameRepository.js    # Game data operations
│       │   │   │   ├── PlayerRepository.js  # Player data operations
│       │   │   │   └── SessionRepository.js # Session data operations
│       │   │   ├── models/                  # Data models
│       │   │   │   ├── GameState.js         # Game state structure
│       │   │   │   ├── PlayerData.js        # Player data structure
│       │   │   │   └── SessionData.js       # Session data structure
│       │   │   └── storage/                 # Storage implementations
│       │   │       ├── InMemoryStorage.js   # In-memory (current)
│       │   │       └── DatabaseStorage.js   # Database (future)
│       │   │
│       │   ├── 🛠️ UTILITIES
│       │   │   ├── utils/
│       │   │   │   ├── hexMath.js           # Hex grid mathematics
│       │   │   │   ├── gameHelpers.js       # Game utility functions
│       │   │   │   ├── validation.js        # Validation helpers
│       │   │   │   └── logger.js            # Logging utility
│       │   │   └── events/
│       │   │       ├── EventEmitter.js      # Custom event system
│       │   │       └── gameEvents.js        # Game event definitions
│       │   │
│       │   └── 🧪 TESTING
│       │       └── __tests__/
│       │           ├── setup.js             # Test configuration
│       │           ├── fixtures/            # Test data
│       │           │   ├── gameFixtures.js
│       │           │   ├── playerFixtures.js
│       │           │   └── dungeonFixtures.js
│       │           ├── unit/                # Unit tests
│       │           │   ├── core/
│       │           │   ├── systems/
│       │           │   ├── services/
│       │           │   └── utils/
│       │           ├── integration/         # Integration tests
│       │           │   ├── api/
│       │           │   ├── sockets/
│       │           │   └── gameFlow/
│       │           └── e2e/                 # End-to-end tests
│       │               ├── completeGame.test.js
│       │               └── multiplayer.test.js
│       │
│       ├── package.json                     # Server dependencies
│       └── nodemon.json                     # Development configuration
│
├── 🧪 TESTING & QUALITY
│   ├── tests/                               # Shared test utilities
│   │   ├── e2e/                            # Cross-app E2E tests
│   │   │   ├── playwright.config.js
│   │   │   └── gameFlow.spec.js
│   │   ├── performance/                    # Performance tests
│   │   │   ├── loadTesting.js
│   │   │   └── memoryProfiling.js
│   │   └── accessibility/                  # A11y tests
│   │       ├── axe.config.js
│   │       └── keyboardNavigation.spec.js
│   │
│   ├── coverage/                           # Test coverage reports
│   ├── .codecov.yml                        # Coverage configuration
│   └── quality-gates.json                  # Quality thresholds
│
├── 🚀 DEPLOYMENT & INFRASTRUCTURE
│   ├── docker/
│   │   ├── Dockerfile.client               # Client container
│   │   ├── Dockerfile.server               # Server container
│   │   ├── docker-compose.yml              # Local development
│   │   └── docker-compose.prod.yml         # Production setup
│   │
│   ├── scripts/
│   │   ├── build.sh                        # Build script
│   │   ├── deploy.sh                       # Deployment script
│   │   ├── test.sh                         # Test runner
│   │   └── setup.sh                        # Initial setup
│   │
│   └── infrastructure/                     # Infrastructure as code
│       ├── nginx.conf                      # Reverse proxy config
│       └── ssl/                            # SSL certificates
│
└── 📚 DOCUMENTATION
    ├── README.md                           # Project overview
    ├── CONTRIBUTING.md                     # Development guide
    ├── ARCHITECTURE.md                     # This document
    ├── API.md                              # API documentation
    ├── DEPLOYMENT.md                       # Deployment guide
    ├── game-design/                        # Game design docs
    │   ├── core-mechanics.md
    │   ├── balance-guide.md
    │   └── progression-system.md
    └── technical/                          # Technical documentation
        ├── testing-strategy.md
        ├── coding-standards.md
        └── performance-guidelines.md
```

---

## 🎯 **Architectural Patterns**

### **Domain-Driven Design (DDD)**

#### **Core Domain** (Game Engine)
- **Entities**: Game, Player, Dungeon, Monster, Ability
- **Value Objects**: Position, Damage, Effect, Range
- **Aggregates**: Game Session (root), Player Collection
- **Domain Services**: Combat resolution, ability execution
- **Domain Events**: Player action, round completion, game end

#### **Application Layer** (Services)
- **Application Services**: Orchestrate use cases
- **Command Handlers**: Process player actions
- **Event Handlers**: React to domain events
- **DTOs**: Data transfer between layers

#### **Infrastructure Layer** (Data & External)
- **Repositories**: Data persistence abstraction
- **External Services**: WebSocket, HTTP APIs
- **Adapters**: Third-party integrations

### **Event-Driven Architecture**

```javascript
// Domain Events Flow
PlayerActionSubmitted → ValidateAction → ExecuteAction → UpdateGameState → BroadcastUpdate

// Event Example
class PlayerActionEvent {
  constructor(playerId, sessionId, action, timestamp) {
    this.playerId = playerId;
    this.sessionId = sessionId;
    this.action = action;
    this.timestamp = timestamp;
  }
}

// Event Handler Example
class GameUpdateHandler {
  async handle(event) {
    const gameState = await this.gameRepository.getState(event.sessionId);
    const updatedState = this.gameEngine.processAction(gameState, event.action);
    await this.gameRepository.saveState(updatedState);
    this.eventBus.publish(new GameStateUpdatedEvent(updatedState));
  }
}
```

### **Hexagonal Architecture (Ports & Adapters)**

```javascript
// Port (Interface)
interface GameRepository {
  getGame(sessionId: string): Promise<Game>;
  saveGame(game: Game): Promise<void>;
  deleteGame(sessionId: string): Promise<void>;
}

// Adapter (Implementation)
class InMemoryGameRepository implements GameRepository {
  private games = new Map<string, Game>();
  
  async getGame(sessionId: string): Promise<Game> {
    return this.games.get(sessionId) ?? null;
  }
  
  async saveGame(game: Game): Promise<void> {
    this.games.set(game.sessionId, game);
  }
}

// Usage in Domain
class GameService {
  constructor(private gameRepository: GameRepository) {}
  
  async createGame(hostPlayer: Player): Promise<Game> {
    const game = new Game(generateSessionId(), hostPlayer);
    await this.gameRepository.saveGame(game);
    return game;
  }
}
```

---

## 🔄 **Data Flow Architecture**

### **Client-Side Data Flow (React)**

```javascript
// Unidirectional Data Flow
User Action → Event Handler → Context Dispatch → State Update → Re-render

// State Management Pattern
const GameContext = createContext();

function gameReducer(state, action) {
  switch (action.type) {
    case 'PLAYER_JOINED':
      return {
        ...state,
        players: [...state.players, action.payload.player]
      };
    case 'GAME_STARTED':
      return {
        ...state,
        phase: 'playing',
        currentRound: 1
      };
    default:
      return state;
  }
}

// Component Usage
function GamePage() {
  const { gameState, dispatch } = useContext(GameContext);
  const { sendAction } = useSocket();
  
  const handleAbilityUse = (ability, target) => {
    const action = { type: 'USE_ABILITY', ability, target };
    sendAction(action);
    dispatch({ type: 'ACTION_PENDING', payload: action });
  };
  
  return <GameInterface onAbilityUse={handleAbilityUse} />;
}
```

### **Server-Side Data Flow**

```javascript
// Request Processing Pipeline
Socket Event → Middleware → Validation → Service → Domain Logic → Repository → Response

// Example Flow
class GameController {
  constructor(gameService, validationService, eventBus) {
    this.gameService = gameService;
    this.validationService = validationService;
    this.eventBus = eventBus;
  }
  
  async handlePlayerAction(socket, data) {
    try {
      // 1. Validate input
      const validation = await this.validationService.validateAction(data);
      if (!validation.isValid) {
        socket.emit('error', { message: validation.error });
        return;
      }
      
      // 2. Execute business logic
      const result = await this.gameService.processPlayerAction(
        data.sessionId,
        data.playerId,
        data.action
      );
      
      // 3. Publish events
      this.eventBus.publish(new PlayerActionProcessedEvent(result));
      
      // 4. Send response
      socket.emit('actionResult', result);
      
    } catch (error) {
      this.logger.error('Failed to process player action', error);
      socket.emit('error', { message: 'Internal server error' });
    }
  }
}
```

---

## 🎮 **Game Engine Architecture**

### **Core Game Loop**

```javascript
class GameEngine {
  async processRound(gameState) {
    // 1. Collect all player actions
    const actions = await this.collectPlayerActions(gameState);
    
    // 2. Validate actions
    const validActions = this.validateActions(actions, gameState);
    
    // 3. Resolve actions by priority
    const actionResults = await this.resolveActions(validActions, gameState);
    
    // 4. Apply environmental effects
    const environmentResults = await this.applyEnvironmentEffects(gameState);
    
    // 5. Update game state
    const newGameState = this.updateGameState(
      gameState,
      [...actionResults, ...environmentResults]
    );
    
    // 6. Check win conditions
    const gameEnd = this.checkWinConditions(newGameState);
    
    return {
      gameState: newGameState,
      actionResults,
      environmentResults,
      gameEnd
    };
  }
}
```

### **System Architecture Pattern**

```javascript
// Systems communicate through the game state
class SystemsManager {
  constructor() {
    this.systems = [
      new MovementSystem(),
      new CombatSystem(),
      new AbilitySystem(),
      new StatusEffectSystem(),
      new ProgressionSystem()
    ];
  }
  
  async processTurn(gameState, playerActions) {
    let currentState = gameState;
    const results = [];
    
    for (const system of this.systems) {
      if (system.shouldProcess(currentState, playerActions)) {
        const result = await system.process(currentState, playerActions);
        currentState = result.newState;
        results.push(result.events);
      }
    }
    
    return { newState: currentState, events: results.flat() };
  }
}

// Example System
class CombatSystem {
  shouldProcess(gameState, actions) {
    return actions.some(action => action.type === 'ATTACK');
  }
  
  async process(gameState, actions) {
    const attackActions = actions.filter(a => a.type === 'ATTACK');
    const events = [];
    let newState = { ...gameState };
    
    for (const attack of attackActions) {
      const damage = this.calculateDamage(attack, newState);
      const target = newState.players.find(p => p.id === attack.targetId);
      
      target.hp = Math.max(0, target.hp - damage);
      
      events.push({
        type: 'DAMAGE_DEALT',
        attacker: attack.playerId,
        target: attack.targetId,
        damage
      });
      
      if (target.hp === 0) {
        events.push({
          type: 'PLAYER_DEFEATED',
          playerId: target.id
        });
      }
    }
    
    return { newState, events };
  }
}
```

---

## 🌐 **Communication Architecture**

### **WebSocket Event System**

```javascript
// Event Definitions
const SOCKET_EVENTS = {
  // Client → Server
  CREATE_GAME: 'createGame',
  JOIN_GAME: 'joinGame',
  START_GAME: 'startGame',
  SUBMIT_ACTION: 'submitAction',
  
  // Server → Client
  GAME_CREATED: 'gameCreated',
  PLAYER_JOINED: 'playerJoined',
  GAME_STARTED: 'gameStarted',
  ROUND_RESULT: 'roundResult',
  GAME_ENDED: 'gameEnded',
  ERROR: 'error'
};

// Server Event Handling
class SocketEventHandler {
  constructor(gameService, sessionManager) {
    this.gameService = gameService;
    this.sessionManager = sessionManager;
  }
  
  setupEventHandlers(io) {
    io.on('connection', (socket) => {
      // Join game room
      socket.on(SOCKET_EVENTS.JOIN_GAME, async (data) => {
        try {
          const result = await this.gameService.joinGame(data.gameCode, data.playerName);
          socket.join(result.sessionId);
          socket.emit(SOCKET_EVENTS.GAME_JOINED, result);
          socket.to(result.sessionId).emit(SOCKET_EVENTS.PLAYER_JOINED, {
            player: result.player
          });
        } catch (error) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }
}
```

### **API Design Pattern**

```javascript
// RESTful API Structure
const API_ROUTES = {
  // Game management
  'POST /api/games': 'createGame',
  'GET /api/games/:id': 'getGameState',
  'PUT /api/games/:id/start': 'startGame',
  'DELETE /api/games/:id': 'endGame',
  
  // Configuration
  'GET /api/config/classes': 'getClasses',
  'GET /api/config/abilities': 'getAbilities',
  'GET /api/config/balance': 'getBalanceSettings',
  
  // Health & monitoring
  'GET /api/health': 'healthCheck',
  'GET /api/metrics': 'getMetrics'
};

// API Response Format
class ApiResponse {
  static success(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }
  
  static error(message, code = 'INTERNAL_ERROR', details = null) {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## 🔐 **Security Architecture**

### **Input Validation Pattern**

```javascript
// Validation Schema
const actionValidationSchema = {
  sessionId: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z0-9-]{36}$/
  },
  playerId: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z0-9-]{36}$/
  },
  action: {
    type: 'object',
    required: true,
    properties: {
      type: { type: 'string', enum: ['MOVE', 'ATTACK', 'ABILITY', 'WAIT'] },
      target: { type: 'string', optional: true },
      position: { type: 'object', optional: true }
    }
  }
};

// Validation Middleware
class ValidationMiddleware {
  static validatePlayerAction(req, res, next) {
    const validation = validate(req.body, actionValidationSchema);
    if (!validation.isValid) {
      return res.status(400).json(
        ApiResponse.error('Invalid input', 'VALIDATION_ERROR', validation.errors)
      );
    }
    next();
  }
}
```

### **Rate Limiting & Security**

```javascript
// Rate limiting configuration
const RATE_LIMITS = {
  globalLimit: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes
  gameActions: { windowMs: 1000, max: 10 }, // 10 actions per second
  gameCreation: { windowMs: 60 * 1000, max: 5 } // 5 games per minute
};

// Security middleware
class SecurityMiddleware {
  static rateLimiter(type) {
    const config = RATE_LIMITS[type];
    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: ApiResponse.error('Rate limit exceeded', 'RATE_LIMIT_ERROR'),
      standardHeaders: true,
      legacyHeaders: false
    });
  }
  
  static sanitizeInput(req, res, next) {
    // Sanitize all string inputs
    const sanitize = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = DOMPurify.sanitize(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    };
    
    sanitize(req.body);
    sanitize(req.query);
    next();
  }
}
```

---

## ♿ **Accessibility Architecture**

### **Component Accessibility Pattern**

```javascript
// Accessible component base
class AccessibleComponent extends React.Component {
  constructor(props) {
    super(props);
    this.componentId = `component-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Standard accessibility props
  getAccessibilityProps() {
    return {
      id: this.componentId,
      role: this.props.role,
      'aria-label': this.props.ariaLabel,
      'aria-describedby': this.props.ariaDescribedBy,
      tabIndex: this.props.focusable ? 0 : -1,
      onKeyDown: this.handleKeyDown.bind(this)
    };
  }
  
  handleKeyDown(event) {
    // Standard keyboard navigation
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (this.props.onClick) {
          event.preventDefault();
          this.props.onClick(event);
        }
        break;
      case 'Escape':
        if (this.props.onEscape) {
          this.props.onEscape(event);
        }
        break;
    }
  }
}

// Game-specific accessible components
class AccessibleAbilityCard extends AccessibleComponent {
  render() {
    const { ability, onSelect, disabled } = this.props;
    
    return (
      <button
        {...this.getAccessibilityProps()}
        className={`ability-card ${disabled ? 'disabled' : ''}`}
        disabled={disabled}
        onClick={() => onSelect(ability)}
        aria-label={`Use ${ability.name}. ${ability.description}. Damage: ${ability.damage}. Range: ${ability.range}.`}
      >
        <span className="ability-name">{ability.name}</span>
        <span className="ability-stats" aria-hidden="true">
          ⚔️ {ability.damage} 📏 {ability.range}
        </span>
        <span className="sr-only">
          {ability.description}. 
          {disabled ? 'Currently unavailable.' : 'Press Enter to select.'}
        </span>
      </button>
    );
  }
}
```

### **Theme System Architecture**

```css
/* CSS Custom Properties for theming */
:root {
  /* Light theme (default) */
  --color-primary: #4a5568;
  --color-secondary: #2d3748;
  --color-accent: #3182ce;
  --color-background: #ffffff;
  --color-surface: #f7fafc;
  --color-text: #2d3748;
  --color-text-secondary: #4a5568;
  
  /* Semantic colors */
  --color-success: #38a169;
  --color-warning: #d69e2e;
  --color-error: #e53e3e;
  --color-info: #3182ce;
  
  /* Game-specific colors */
  --color-health: #38a169;
  --color-damage: #e53e3e;
  --color-mana: #3182ce;
  --color-armor: #a0aec0;
}

/* Dark theme */
[data-theme="dark"] {
  --color-background: #1a202c;
  --color-surface: #2d3748;
  --color-text: #f7fafc;
  --color-text-secondary: #a0aec0;
}

/* Colorblind-friendly theme */
[data-theme="colorblind"] {
  --color-success: #0066cc;
  --color-warning: #ff6600;
  --color-error: #cc0000;
  --color-health: #0066cc;
  --color-damage: #cc0000;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-text: #000000;
    --color-background: #ffffff;
    --border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📊 **Performance Architecture**

### **Client-Side Performance**

```javascript
// Component optimization patterns
const MemoizedAbilityCard = React.memo(AbilityCard, (prevProps, nextProps) => {
  return (
    prevProps.ability.id === nextProps.ability.id &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.selected === nextProps.selected
  );
});

// State optimization
const GameContextProvider = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    gameState,
    dispatch
  }), [gameState]);
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Virtual scrolling for large lists
const VirtualizedPlayerList = ({ players }) => {
  const [visiblePlayers, setVisiblePlayers] = useState([]);
  const containerRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // Update visible players based on viewport
    });
    
    return () => observer.disconnect();
  }, [players]);
  
  return (
    <div ref={containerRef} className="player-list">
      {visiblePlayers.map(player => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
};
```

### **Server-Side Performance**

```javascript
// Connection pooling and resource management
class ResourceManager {
  constructor() {
    this.connectionPool = new Map();
    this.gameSessionCache = new LRUCache({ max: 1000, ttl: 1000 * 60 * 30 });
  }
  
  async getGameSession(sessionId) {
    // Check cache first
    let session = this.gameSessionCache.get(sessionId);
    if (!session) {
      session = await this.loadGameSession(sessionId);
      this.gameSessionCache.set(sessionId, session);
    }
    return session;
  }
  
  // Cleanup inactive sessions
  startCleanupTimer() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.gameSessionCache.entries()) {
        if (now - session.lastActivity > 1000 * 60 * 60) { // 1 hour
          this.gameSessionCache.delete(sessionId);
        }
      }
    }, 1000 * 60 * 15); // Clean every 15 minutes
  }
}

// Efficient game state updates
class GameStateManager {
  updateGameState(sessionId, updateFunction) {
    const session = this.getSession(sessionId);
    const newState = updateFunction(session.gameState);
    
    // Only broadcast changes, not entire state
    const changes = this.calculateStateChanges(session.gameState, newState);
    session.gameState = newState;
    
    // Broadcast only to relevant players
    this.broadcastChanges(sessionId, changes);
  }
  
  calculateStateChanges(oldState, newState) {
    const changes = {};
    
    // Compare player states
    if (oldState.players !== newState.players) {
      changes.players = this.getPlayerChanges(oldState.players, newState.players);
    }
    
    // Compare game metadata
    if (oldState.round !== newState.round) {
      changes.round = newState.round;
    }
    
    return changes;
  }
}
```

---

## 🚀 **Deployment Architecture**

### **Environment Configuration**

```javascript
// Environment-specific configurations
const configs = {
  development: {
    server: {
      port: 3001,
      host: 'localhost',
      cors: { origin: '*' }
    },
    database: {
      type: 'memory',
      persistToDisk: false
    },
    logging: {
      level: 'debug',
      prettyPrint: true
    }
  },
  
  production: {
    server: {
      port: process.env.PORT || 3001,
      host: '0.0.0.0',
      cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') }
    },
    database: {
      type: 'redis',
      url: process.env.REDIS_URL
    },
    logging: {
      level: 'info',
      prettyPrint: false
    }
  }
};

const config = configs[process.env.NODE_ENV] || configs.development;
```

### **Docker Configuration**

```dockerfile
# Multi-stage build for client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

# Multi-stage build for server
FROM node:18-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Production image
FROM node:18-alpine
WORKDIR /app

# Copy built applications
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server ./server

# Set up non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3001
CMD ["node", "server/src/index.js"]
```

