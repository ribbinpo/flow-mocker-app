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

## Execution Engine
- Sequential execution via async generator pattern
- Step-by-step mode (generator yields after each node)
- Data mapping between nodes (JSONPath extract → inject into next request)
- Environment variable resolution ({{VARIABLE}} templates)
- Stop on failure with remaining nodes marked "skipped"
- AbortController for cancelling mid-execution
- Retry mechanism (configurable per-node, fixed delay, network errors + 5xx)

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
- Phase 2: Core Pages → ✅ Complete
- Phase 3: Execution Engine → ✅ Complete
- Phase 4: API Integration → ✅ Complete
- Phase 5: Polish & Release → ✅ Complete
- Phase 6: Operation Node → ✅ Complete
- Phase 7: API Catalog → ✅ Complete

### Core Features (Completed)
- Flow builder (React Flow)
- Execution engine (async generator + topological sort)
- Data mapping (JSONPath + env resolver)
- API execution (Axios + validation + retry)
- Execution logs + step mode
- MSW mock integration (dev mode)
- Flow persistence (Tauri FS + fallback)
- Keyboard shortcuts
- Unit tests (engine, mapper, validator, retry)
- Polymorphic node types (Start, API, Store)
- Variable drag-and-drop (Store → API field handles)
- Sequence-aware variable availability + auto-cleanup
- Dual edge system (sequence vs variable)

### Key Modules
- **Stores:** flowStore, executionStore, uiStore  
- **Engine:** executionEngine, dataMapper, retryExecutor, variableResolver  
- **API:** apiClient, requestValidator  
- **Utils:** jsonPath, envResolver, cookieJar  
- **Catalog:** catalogStore, catalogStorage, curlParser, postmanParser  
- **Hooks:** useFlowCanvas, useFlowExecution, useFlowPersistence, useCatalogPersistence  

### Phase 7 Features (Completed)
- API Catalog (reusable request templates)
- Postman Collection v2.1 import
- cURL command import
- Catalog management dialog (create, edit, delete, search)
- Node creation popover (empty vs from catalog)
- Catalog persistence (Tauri FS)

### In Progress
(none)

### Known Issues
(none)

## Decisions Log (Architecture Only)
| Date | Decision | Reason |
|------|----------|--------|
| 2025-04-12 | Async generator execution engine | Enables step-by-step + run modes naturally |
| 2025-04-12 | React Flow controlled mode | Zustand as source of truth, smoother UX |
| 2025-04-12 | Lightweight JSONPath | Covers v1 needs, reduces bundle size |
| 2025-04-12 | MSW (dev only) | Safe mocking without affecting production |
| 2025-04-12 | Fixed retry strategy | Simpler v1 implementation |
| 2025-04-12 | Tauri FS persistence | Minimal Rust, easy fallback for browser |

## Do NOT
- Do NOT use `any` type
- Do NOT skip error handling
- Do NOT hardcode strings — use constants
- Do NOT commit console.log
- Do NOT proceed to next phase without passing checkpoint
