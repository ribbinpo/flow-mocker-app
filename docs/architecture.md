# AFSeal — Architecture

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri Shell (Rust)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Frontend (WebView)              │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │  │
│  │  │  Pages   │  │  Flow    │  │  Execution     │  │  │
│  │  │  Router  │  │  Builder │  │  Log Panel     │  │  │
│  │  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │  │
│  │       │              │                │            │  │
│  │  ┌────▼──────────────▼────────────────▼────────┐  │  │
│  │  │              Zustand Stores                  │  │  │
│  │  │  flowStore · executionStore · uiStore        │  │  │
│  │  └────────────────────┬────────────────────────┘  │  │
│  │                       │                            │  │
│  │  ┌────────────────────▼────────────────────────┐  │  │
│  │  │           Services Layer                     │  │  │
│  │  │  executionEngine · apiClient · flowStorage   │  │  │
│  │  └────────────────────┬────────────────────────┘  │  │
│  └───────────────────────┼────────────────────────────┘  │
│                          │ Tauri IPC (invoke / events)   │
│  ┌───────────────────────▼────────────────────────────┐  │
│  │              Rust Backend (Tauri)                   │  │
│  │  filesystem persistence · HTTP proxy (future)      │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

The app is a single-window Tauri desktop application. All UI lives in the React webview. The Rust backend handles file-system persistence and may later proxy HTTP requests to bypass CORS restrictions.

---

## 2. Directory Structure

```
src/
├── components/
│   ├── ui/                  # ShadCN primitives (Button, Input, Dialog, Toast, etc.)
│   ├── bases/               # Composed reusable components
│   │   ├── NodeContainer.tsx
│   │   ├── PanelSidebar.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSkeleton.tsx
│   └── features/
│       ├── flow-builder/    # Canvas, custom nodes, edge renderers
│       ├── node-config/     # Method/URL/headers/body editors
│       ├── flow-list/       # Flow cards, create/rename/delete
│       └── execution/       # Log viewer, status badges, retry controls
├── pages/
│   ├── FlowListPage.tsx     # Home — list of saved flows
│   ├── FlowBuilderPage.tsx  # Canvas + config panel for a single flow
│   └── NotFoundPage.tsx
├── store/
│   ├── flowStore.ts         # Flows, nodes, edges CRUD
│   ├── executionStore.ts    # Run state, logs, per-node status
│   └── uiStore.ts           # Sidebar open/close, selected node, theme
├── services/
│   ├── executionEngine.ts   # Orchestrates sequential/step-by-step runs
│   ├── apiClient.ts         # Axios instance, interceptors, Zod validation
│   ├── dataMapper.ts        # JSONPath extract → inject into next request
│   └── flowStorage.ts       # Save/load flows via Tauri FS API
├── types/
│   ├── flow.ts              # Flow, FlowNode, FlowEdge
│   ├── execution.ts         # ExecutionResult, NodeLog, ExecutionStatus
│   └── api.ts               # RequestConfig, ResponseData
├── utils/
│   ├── constants.ts         # App-wide constants, HTTP methods enum
│   ├── jsonPath.ts          # Lightweight JSONPath resolver
│   └── envResolver.ts       # {{variable}} template interpolation
├── hooks/
│   ├── useFlowExecution.ts  # Connects executionEngine ↔ executionStore
│   └── useNodeConfig.ts     # Selected node read/write shortcut
├── mocks/
│   ├── handlers.ts          # MSW request handlers
│   ├── flows.ts             # Sample flow fixtures
│   └── browser.ts           # MSW browser worker setup
└── assets/
```

---

## 3. Core Types

```typescript
// types/flow.ts
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FlowNode {
  id: string;
  label: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;                       // raw JSON string
  dataMapping: DataMapping[];         // extract from prev → inject here
  position: { x: number; y: number }; // React Flow position
}

interface DataMapping {
  sourceNodeId: string;
  sourcePath: string;   // JSONPath into source response
  targetField: "header" | "query" | "body" | "url";
  targetKey: string;    // which header key, query param, or body path
}

interface FlowEdge {
  id: string;
  source: string;       // node ID
  target: string;       // node ID
}

interface Flow {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  envVariables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// types/execution.ts
type ExecutionStatus = "idle" | "running" | "success" | "error" | "skipped";

interface NodeLog {
  nodeId: string;
  status: ExecutionStatus;
  request: { method: HttpMethod; url: string; headers: Record<string, string>; body: string };
  response: { status: number; headers: Record<string, string>; body: unknown; latencyMs: number } | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface ExecutionResult {
  flowId: string;
  status: ExecutionStatus;
  logs: NodeLog[];
  startedAt: string;
  finishedAt: string | null;
}
```

---

## 4. State Management (Zustand)

Three isolated stores, each with a single responsibility:

### flowStore
| Slice        | Purpose                                   |
|--------------|-------------------------------------------|
| flows        | Array of all saved `Flow` objects         |
| activeFlowId | Currently open flow                       |
| Actions      | createFlow, deleteFlow, renameFlow, updateNode, addNode, removeNode, addEdge, removeEdge |

### executionStore
| Slice           | Purpose                                 |
|-----------------|-----------------------------------------|
| currentRun      | `ExecutionResult | null`                |
| isStepMode      | Step-by-step toggle                     |
| Actions         | startRun, stepNext, stopRun, resetRun   |

### uiStore
| Slice           | Purpose                          |
|-----------------|----------------------------------|
| selectedNodeId  | Node currently open in config    |
| sidebarOpen     | Config panel visibility          |
| Actions         | selectNode, toggleSidebar        |

Persistence: `flowStore` syncs to disk via `flowStorage` service (Tauri FS). Execution and UI stores are ephemeral.

---

## 5. Execution Engine

The engine is a pure service (no React dependency). It receives a `Flow` and produces an `ExecutionResult`.

```
ExecutionEngine.run(flow, options)
  │
  ├── 1. Topological sort nodes using edges
  │      (Phase 1: linear chains only — no branching)
  │
  ├── 2. For each node in order:
  │      a. Resolve env variables in URL/headers/body  (envResolver)
  │      b. Apply data mappings from previous responses (dataMapper)
  │      c. Validate request with Zod schema           (apiClient)
  │      d. Execute HTTP request                        (apiClient)
  │      e. Record NodeLog (status, latency, response)
  │      f. On error → stop execution, mark remaining nodes "skipped"
  │
  └── 3. Return ExecutionResult
```

**Step-by-step mode**: The engine yields control after each node. The `useFlowExecution` hook calls `stepNext()` to advance, allowing the user to inspect intermediate state.

**Data mapping flow**:
```
Node A response → JSONPath extract → store in context map
                                           ↓
Node B request  ← inject from context map ← targetField + targetKey
```

The context map is a `Record<nodeId, unknown>` holding each node's parsed response body. `dataMapper` reads from this map using the `sourcePath` and writes into the next request.

---

## 6. Services Layer

### apiClient
- Wraps Axios with a shared instance
- Attaches request/response interceptors for logging
- Validates response shape with Zod when a schema is provided
- Timeout: 30s default, configurable per node (future)

### dataMapper
- Takes a `DataMapping[]` + context map → returns modified request config
- Uses a lightweight JSONPath subset (dot notation + array indexing)
- No external dependency needed for v1; upgrade to `jsonpath-plus` if users need advanced queries

### flowStorage
- Save: serializes `Flow[]` → JSON → writes to Tauri app data dir via `@tauri-apps/plugin-fs`
- Load: reads JSON on app launch → hydrates `flowStore`
- File location: `$APPDATA/afseal/flows.json`

### envResolver
- Scans strings for `{{variable}}` patterns
- Replaces from `flow.envVariables` map
- Runs before data mapping so env vars and dynamic data compose correctly

---

## 7. Pages & Routing

Two primary routes (React Router):

| Route              | Page              | Layout                        |
|--------------------|-------------------|-------------------------------|
| `/`                | FlowListPage      | Full-width card grid          |
| `/flow/:flowId`    | FlowBuilderPage   | Canvas (left) + Panel (right) |

### FlowBuilderPage Layout

```
┌────────────────────────────────────────────────────┐
│  Toolbar  [Run] [Step] [Stop]  Flow name           │
├──────────────────────────────┬─────────────────────┤
│                              │  Node Config Panel  │
│       React Flow Canvas      │  ┌───────────────┐  │
│                              │  │ Method / URL   │  │
│    ┌─────┐     ┌─────┐      │  │ Headers        │  │
│    │Login│────▶│Users│      │  │ Body           │  │
│    └─────┘     └─────┘      │  │ Data Mapping   │  │
│                              │  └───────────────┘  │
├──────────────────────────────┴─────────────────────┤
│  Execution Log Panel (collapsible)                  │
│  [Node A ✅ 200 142ms] [Node B ❌ 401 89ms]        │
└────────────────────────────────────────────────────┘
```

---

## 8. Component Hierarchy

```
App
├── FlowListPage
│   ├── FlowCard[]          (features/flow-list)
│   └── EmptyState          (bases)
│
└── FlowBuilderPage
    ├── BuilderToolbar       (features/flow-builder)
    ├── FlowCanvas           (features/flow-builder — wraps ReactFlow)
    │   ├── ApiNode          (custom React Flow node)
    │   └── DataEdge         (custom React Flow edge, optional)
    ├── NodeConfigPanel      (features/node-config)
    │   ├── MethodSelect
    │   ├── UrlInput
    │   ├── HeadersEditor
    │   ├── BodyEditor
    │   └── DataMappingEditor
    └── ExecutionLogPanel    (features/execution)
        └── NodeLogEntry[]
```

---

## 9. Dependencies to Install

| Package                  | Purpose                        | Phase |
|--------------------------|--------------------------------|-------|
| `react-router-dom`      | Client-side routing            | 1     |
| `zustand`               | State management               | 1     |
| `tailwindcss` + plugins | Styling                        | 1     |
| `shadcn/ui` (via CLI)   | UI primitives                  | 1     |
| `@xyflow/react`         | Flow canvas (React Flow v12)   | 1     |
| `axios`                 | HTTP client                    | 1     |
| `zod`                   | Schema validation              | 1     |
| `clsx` + `tailwind-merge` | Class merging (ShadCN dep)  | 1     |
| `lucide-react`          | Icons (ShadCN default)         | 1     |
| `msw`                   | Mock API for development       | 2     |
| `@tauri-apps/plugin-fs` | File system persistence        | 5     |

---

## 10. Data Flow Diagram

```
User action (add node, edit URL, click Run)
       │
       ▼
   React Component
       │
       ▼
   Zustand Store (flowStore / executionStore)
       │                          │
       ▼                          ▼
   React Flow re-render     executionEngine.run()
                                  │
                        ┌─────────┴──────────┐
                        ▼                    ▼
                  envResolver          dataMapper
                        │                    │
                        └────────┬───────────┘
                                 ▼
                           apiClient.send()
                                 │
                                 ▼
                         Axios → Network
                                 │
                                 ▼
                           NodeLog recorded
                                 │
                                 ▼
                     executionStore updated
                                 │
                                 ▼
                   ExecutionLogPanel re-renders
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Three separate Zustand stores | Keeps flow data, execution state, and UI state independent; avoids unnecessary re-renders |
| Execution engine as a pure service | Testable without React; can be reused if we add CLI mode later |
| JSONPath subset (no library) | Full JSONPath is overkill for v1 dot-notation access; keeps bundle small |
| No complex branching in v1 | Requirements say linear chains only; topological sort handles ordering |
| MSW for dev mocking | Intercepts at network level — no code changes needed between mock and real APIs |
| Tauri FS for persistence (Phase 5) | Local-first; no server needed; flows.json is human-readable for debugging |
| React Flow v12 (@xyflow/react) | Mature library with built-in node/edge management, minimap, controls |

---

## 12. Phase Mapping

| Architecture Layer      | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|------------------------|---------|---------|---------|---------|---------|
| Types                  | ✅      |         |         |         |         |
| UI components (ShadCN) | ✅      |         |         |         |         |
| Zustand stores         | ✅      | ✅      |         |         |         |
| React Flow canvas      |         | ✅      |         |         |         |
| Node config panel      |         | ✅      |         |         |         |
| Flow list page         |         | ✅      |         |         |         |
| Execution engine       |         |         | ✅      |         |         |
| Data mapper            |         |         | ✅      |         |         |
| Env resolver           |         |         | ✅      |         |         |
| Axios + Zod            |         |         |         | ✅      |         |
| MSW mocks              |         |         |         | ✅      |         |
| Execution log panel    |         |         |         | ✅      |         |
| Tauri FS persistence   |         |         |         |         | ✅      |
| Polish & shortcuts     |         |         |         |         | ✅      |
