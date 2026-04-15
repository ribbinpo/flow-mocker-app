# AFSeal

A developer tool for testing REST APIs as connected workflows instead of isolated requests. Chain API calls, pass data between steps, and run full flows to simulate real scenarios.

## Features

- **Visual Flow Builder** - Drag-and-drop canvas powered by React Flow to design API workflows
- **Three Node Types** - Start (entry point), API (HTTP requests), and Store (variable collection)
- **Data Flow** - Connect API responses to Store nodes, then use stored variables in downstream API requests via `[[variableName]]` templates
- **Environment Variables** - Define `{{ENV_VAR}}` templates resolved across all request fields
- **Execution Engine** - Async generator with topological ordering, parallel execution within waves, and step-by-step mode
- **Per-Node Execution** - Run individual API nodes in isolation for quick testing
- **Cookie Management** - Automatic cookie accumulation across sequential requests
- **Retry Logic** - Configurable per-node retry with fixed delay for network errors and 5xx responses
- **Flow Persistence** - Saved to local filesystem via Tauri FS plugin with auto-save
- **Import/Export** - Share flows as JSON files

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- [pnpm](https://pnpm.io/) or npm

## Getting Started

```bash
# Install dependencies
npm install

# Run in browser (dev mode)
npm run dev

# Run as desktop app
npm run tauri dev

# Build for production
npm run tauri build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (browser) |
| `npm run build` | TypeScript check + Vite build |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run tauri dev` | Run as Tauri desktop app |
| `npm run tauri build` | Build production desktop app |

## Project Structure

```
src/
├── components/
│   ├── ui/              # ShadCN components (Button, Input, Dialog...)
│   ├── bases/           # Reusable base components (NodeContainer, PanelSidebar...)
│   └── features/        # Feature components
│       ├── flow-builder/    # Canvas nodes (ApiNode, StartNode, StoreNode)
│       ├── node-config/     # Config panel (NodeConfigPanel, StoreVariableEditor, VariablePillBar)
│       └── execution/       # Execution log (ExecutionLogPanel, NodeLogEntry)
├── pages/               # FlowListPage, FlowBuilderPage
├── store/               # Zustand stores (flowStore, executionStore, uiStore)
├── services/            # Engine (executionEngine, dataMapper, retryExecutor, variableResolver)
├── types/               # TypeScript interfaces (flow, execution, api, reactFlow)
├── utils/               # Helpers (jsonPath, envResolver, storeResolver, cookieJar, templateParser)
├── hooks/               # Custom hooks (useFlowCanvas, useFlowExecution, useFlowPersistence)
├── mocks/               # MSW handlers + sample flows
└── assets/              # Static assets
```

## How It Works

### Node Types

- **Start** - Every flow begins here. One per flow, cannot be deleted.
- **API** - Configures and sends an HTTP request (GET/POST/PUT/DELETE/PATCH). Has a run button for individual execution.
- **Store** - Collects values from API responses using JSONPath. Exposes named variables for downstream nodes.

### Edge Types

- **Sequence** (solid line) - Controls execution order between nodes
- **Data** (purple line) - Connects API data-output to Store data-input, declaring which API feeds into a Store

### Variable System

1. Connect an API node's data output to a Store node's data input
2. Configure Store variables with name + JSONPath (e.g., `token` from `data.accessToken`)
3. In downstream API nodes, use `[[variableName]]` in URL, headers, query params, or body
4. Variables are resolved at execution time from Store context

### Execution

- Topological sort determines execution order from the Start node
- Only nodes reachable from Start are executed
- Nodes at the same level run in parallel
- Failure in a parent node skips all downstream nodes
- Cookies accumulate across sequential steps

## Limitations

- **macOS only** - Currently built and tested for macOS. Windows/Linux may work via Tauri but are not officially supported.
- **REST only** - No gRPC, WebSocket, or SSE support yet.
- **No authentication flows** - No built-in OAuth/OIDC helpers; must be configured manually via headers.
- **Local storage only** - Flows are saved to local filesystem. No cloud sync or team sharing.
- **No response schema validation** - Response bodies are not validated against expected schemas.
- **Fixed retry strategy** - Only fixed-delay retry; no exponential backoff or custom retry conditions.

## License

[MIT](LICENSE)
