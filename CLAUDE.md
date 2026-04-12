# Project: Flow Mocker

## Overview
This project is a developer tool for testing REST APIs as connected workflows instead of isolated requests. It lets users chain API calls, pass data between steps, and run full flows to simulate real scenarios, making debugging and testing faster and more efficient.

## Tech Stack
- Framework: Tauri 2.0 with ViteJS ReactJS
- Language: Typescript and Rust
- Styling: TailwindCSS + ShadCN-UI
- State: Zustand and Tauri plugin
- Platform: Application on Mac
- XYFlow: React Flow
- API Layer:
  - MSW
  - Axios
  - Zod

## Project Structure
```
src/
├── components/       # Reusable UI components
│   ├── ui/           # ShadCN components (Button, Input, Modal...)
│   └── bases/        # Custom reuse components (RangeCalendar, ...)
│   └── features/     # Feature-specific (ProductCard, CartItem...)
├── pages/            # Page-level components
├── store/            # State management
├── services/         # API layer
├── types/            # TypeScript interfaces
├── utils/            # Helpers & constants
├── hooks/            # Custom hooks
└── assets/           # Images, fonts, icons
```

## Execution Engine (Planned)
- Sequential execution of nodes
- Data mapping between nodes (response → next request)
- Basic condition handling (success / failure)
- Retry mechanism (future phase)

## Future Scope
- gRPC support
- WebSocket / SSE flow simulation
- Team collaboration (share flows)
- Cloud sync / storage

## Conventions & Rules

### Code Style
- Strict TypeScript — no `any`, no `as` casting unless justified
- Components use functional style with hooks
- One component per file, named export + default export
- File naming: PascalCase for components, camelCase for utils

### Component Rules
- Use TailwindCSS classes only
- Every component use ShadCN-UI first if necessary you can custom your base component

### Git
- Commit format: `type(scope): message` (feat, fix, refactor, docs, chore)
- Branch naming: `phase-N/feature-name`

## Current Status

### Progress
- Phase 1: Foundation → ✅ Complete
- Phase 2: Core Pages → ⏳
- Phase 3: Business Logic → ⏳
- Phase 4: API Integration → ⏳
- Phase 5: Polish → ⏳

### Completed Components
- **ShadCN UI:** Button, Input, Card, Dialog, Sonner (Toast)
- **Base components:** LoadingSkeleton, EmptyState, PanelSidebar, NodeContainer
- **Stores:** flowStore, executionStore, uiStore
- **Services:** apiClient (Axios + Zod validation)
- **Types:** Flow, FlowNode, FlowEdge, ExecutionResult, NodeLog, RequestConfig, ResponseData
- **Utils:** constants (HTTP_METHODS, DEFAULT_HEADERS, API_TIMEOUT_MS)

### In Progress
(none)

### Known Issues
(none)

## Decisions Log
| Date | Decision | Reason |
|------|----------|--------|
| 2025-04-12 | TailwindCSS v4 with @tailwindcss/vite plugin | Native Vite integration, no PostCSS config needed |
| 2025-04-12 | ESLint v9 flat config | Matches typescript-eslint v8 compatibility |
| 2025-04-12 | Zod v4 (zod/v4 import) | Already installed as v4, use v4 API directly |
| 2025-04-12 | ShadCN new-york style | Clean, compact design suitable for developer tools |

## Do NOT
- Do NOT use `any` type
- Do NOT skip error handling
- Do NOT hardcode strings — use constants
- Do NOT commit console.log
- Do NOT proceed to next phase without passing checkpoint
