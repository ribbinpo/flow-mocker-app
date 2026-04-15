# Changelog

All notable changes to AFSeal are documented in this file.

## [0.1.0] - 2026-04-12

### Phase 1: Foundation & Design System
- Project scaffolding with Tauri 2.0 + Vite + React + TypeScript
- Core type definitions: Flow, FlowNode, FlowEdge, ExecutionResult, NodeLog
- API layer with Axios client and Zod v4 response validation
- Zustand stores: flowStore, executionStore, uiStore
- ShadCN UI components: Button, Input, Card, Dialog, Sonner (Toast), Tooltip
- Base components: LoadingSkeleton, EmptyState, PanelSidebar, NodeContainer
- TailwindCSS v4 with dark mode support
- ESLint v9 flat config with strict TypeScript rules

### Phase 2: Core Pages (Mock Flow Builder)
- Flow Builder page with React Flow v12 canvas
- Add/remove/connect nodes with drag-and-drop
- Node Configuration panel: method, URL, headers, query params, body
- Flow List page with create, rename, delete flows
- React Flow ↔ Zustand bidirectional sync (useFlowCanvas hook)
- Custom ApiNode component with method badge and status styles
- Sample flow fixtures for development

### Phase 3: Execution Engine & State Logic
- Sequential execution engine using async generator pattern
- Step-by-step execution mode with pause/resume
- Data mapping between nodes (JSONPath extract → inject into next request)
- Environment variable resolution ({{VARIABLE}} templates)
- Topological sort for execution order with cycle detection
- AbortController support for stopping mid-execution
- Execution Log panel with collapsible request/response details
- Node status visualization on canvas (idle/running/success/error/skipped)
- Unit tests: jsonPath, envResolver, dataMapper, executionEngine

### Phase 4: API Integration & Advanced Features
- MSW integration for mock API scenarios in development
- Request validation before sending (URL, method, JSON body, headers)
- Configurable retry mechanism per node (fixed delay, network errors + 5xx)
- Environment variables editor dialog
- Retry attempts badge and validation errors in execution logs
- Retry configuration UI in Node Config panel

### Phase 5: Polish & Release
- Local persistence via Tauri FS plugin (flows saved to app data directory)
- Debounced auto-save (1s) with save confirmation toast
- Keyboard shortcuts: Ctrl+Enter (run), Ctrl+. (stop), Ctrl+Shift+Enter (step), Ctrl+N (add node), Escape (deselect)
- Tooltip hints on toolbar buttons showing keyboard shortcuts
- Smoother node status transitions (200ms duration)
- Execution complete toast notifications (success/error)
- Increased default window size to 1200x800
- Removed unused code and .gitkeep placeholder files
- 59 unit tests passing across 6 test suites
