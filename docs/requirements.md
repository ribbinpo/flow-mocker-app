# AFSeal — Requirements

## Project Overview
This project is a developer tool for testing REST APIs as connected workflows instead of isolated requests. It allows users to visually chain API calls, pass data between steps, and execute flows to simulate real-world scenarios. The goal is to simplify debugging and improve efficiency when working with multi-step API integrations.

## Success Criteria
- [ ] User can create and execute a full API flow end-to-end
- [ ] User can pass data between steps (e.g., token → next request)
- [ ] Flow execution shows clear logs and error tracing
- [ ] App launches in < 2s on Mac (Tauri)
- [ ] Zero TypeScript errors and stable execution

---

## Phase 1: Foundation & Design System
**Goal:** Project skeleton + core components ready  
**Estimated:** 3–5 days  
**Depends on:** Nothing

### Deliverables
- [ ] Project scaffolding (Tauri + Vite + React setup)
- [ ] TypeScript base types (`Flow`, `Node`, `Edge`, `ExecutionResult`)
- [ ] API layer (`axios`, `zod`, error handling)
- [ ] State setup (Zustand + Tauri plugin bridge)
- [ ] Design system components:
  - [ ] Button
  - [ ] Input
  - [ ] Card
  - [ ] Modal / Dialog
  - [ ] Toast / Notification
  - [ ] Loading skeleton
  - [ ] Empty state
  - [ ] Panel / Sidebar
  - [ ] Node container (for flow builder)

### Checkpoint 1 ✅
```
Verify ALL before proceeding:
- [ ] `npm run build` — zero errors
- [ ] `npm run lint` — zero warnings
- [ ] All components render correctly (visual verification)
- [ ] Types are strict — no `any` anywhere
- [ ] Zustand store initialized
- [ ] CLAUDE.md updated with completed components
```
→ DO NOT proceed to Phase 2 until ALL boxes checked

---

## Phase 2: Core Pages (Mock Flow Builder)
**Goal:** Flow builder UI working with mock data  
**Estimated:** 5–7 days  
**Depends on:** Phase 1 ✅

### Deliverables
- [ ] **Flow Builder Page**
  - [ ] Canvas using React Flow (XYFlow)
  - [ ] Add/remove nodes
  - [ ] Connect nodes (edges)
- [ ] **Node Configuration Panel**
  - [ ] Method (GET, POST, PUT, DELETE)
  - [ ] URL input
  - [ ] Headers / Query / Body editor
- [ ] **Flow List Page**
  - [ ] Create / rename / delete flow
- [ ] Mock data in `src/mocks/`
- [ ] Basic navigation (Flow list → Builder)

### Checkpoint 2 ✅
```
Verify ALL before proceeding:
- [ ] User can create nodes and connect them
- [ ] Node config UI updates correctly
- [ ] Flow persists in local state
- [ ] No blank screens or crashes
- [ ] Responsive layout works
- [ ] No hardcoded text — all in constants or i18n
- [ ] CLAUDE.md updated
```
→ DO NOT proceed to Phase 3 until ALL boxes checked

---

## Phase 3: Execution Engine & State Logic
**Goal:** Run flows with real logic  
**Estimated:** 5–8 days  
**Depends on:** Phase 2 ✅

### Deliverables
- [ ] Flow execution engine:
  - [ ] Sequential execution
  - [ ] Step-by-step execution mode
- [ ] Data mapping:
  - [ ] Extract response (JSON path)
  - [ ] Inject into next request
- [ ] Execution state store:
  - [ ] status (idle, running, success, error)
  - [ ] logs per node
- [ ] Error handling:
  - [ ] Stop on failure
  - [ ] Show error per node

### Checkpoint 3 ✅
```
Verify ALL before proceeding:
- [ ] All unit tests pass
- [ ] Flow runs end-to-end
- [ ] Errors are visible and traceable
- [ ] No infinite loops or crashes
- [ ] No console.log or debug code
- [ ] CLAUDE.md updated
```
→ DO NOT proceed to Phase 4 until ALL boxes checked

---

## Phase 4: API Integration & Advanced Features
**Goal:** Real API execution + testing features  
**Estimated:** 4–6 days  
**Depends on:** Phase 3 ✅

### Deliverables
- [ ] Real API calls via Axios
- [ ] MSW integration for mocking scenarios
- [ ] Validation with Zod (request/response)
- [ ] Retry mechanism (basic)
- [ ] Execution logs panel:
  - [ ] Request / Response viewer
  - [ ] Status + latency
- [ ] Environment variables support (`{{base_url}}`, etc.)

### Checkpoint 4 ✅
```
Verify ALL before proceeding:
- [ ] Real API + mock both work
- [ ] Network errors handled properly
- [ ] Logs show full request/response
- [ ] Validation errors visible
- [ ] No unhandled promise rejections
- [ ] CLAUDE.md updated
```
→ DO NOT proceed to Phase 5 until ALL boxes checked

---

## Phase 5: Polish & Release
**Goal:** Production-ready desktop app  
**Estimated:** 3–5 days  
**Depends on:** Phase 4

### Deliverables
- [ ] Performance optimization (flow rendering, execution speed)
- [ ] UX polish (drag smoothness, transitions)
- [ ] Keyboard shortcuts (optional)
- [ ] Persist flows locally (file or DB via Tauri)
- [ ] Cleanup unused code

### Checkpoint 5 (FINAL) ✅
```
- [ ] Full flow tested end-to-end
- [ ] No crashes on invalid input
- [ ] App stable on Mac
- [ ] Zero TS errors, zero warnings
- [ ] Ready for internal use
- [ ] CHANGELOG.md written
```

---

## Appendix: User Flows
```
Flow 1: Auth + Fetch Data
Login → Extract token → Call protected API → Display result → Done

Flow 2: Error Handling
Call API → Fail → Show error → Retry → Success → Done
```

## Appendix: API Reference
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /example | Test endpoint |
| POST | /auth/login | Get token |
| GET | /user/profile | Protected API |

---

## Phase 6: Operation Node
**Goal:** Polymorphic node types with Store node and variable system  
**Depends on:** Phase 5 ✅

### Deliverables
- [x] Store node type with variable definitions
- [x] Variable drag-and-drop (Store → API field handles)
- [x] Sequence-aware variable availability + auto-cleanup
- [x] Dual edge system (sequence vs variable)

### Checkpoint 6 ✅
```
All verified:
- [x] Store node persists variables
- [x] Variables resolve correctly during execution
- [x] Dual edge system works (sequence + data)
- [x] CLAUDE.md updated
```

---

## Phase 7: API Catalog
**Goal:** Reusable API request template library with import support  
**Depends on:** Phase 6 ✅

### Deliverables

#### 7.1 Catalog Management
- [ ] `CatalogEntry` type (name, description, tags, method, url, headers, queryParams, body)
- [ ] Zustand store for catalog entries (CRUD operations)
- [ ] Persistence via Tauri FS (`{appDataDir}/catalog/catalog.json`)
- [ ] Auto-save with debounce (same pattern as flow persistence)

#### 7.2 Import Support
- [ ] Postman Collection v2.1 JSON parser
  - [ ] Recursive folder traversal → tags
  - [ ] Extract method, url, headers, query params, body
  - [ ] Preserve Postman `{{variable}}` syntax
- [ ] cURL command parser
  - [ ] Support: -X, -H, -d/--data, -u, URL detection
  - [ ] Auto-detect method (POST if body present)
  - [ ] Parse query params from URL
- [ ] Unit tests for both parsers

#### 7.3 Catalog UI
- [ ] Catalog management dialog (create, edit, delete entries)
- [ ] Search/filter by name and tags
- [ ] Import dialog with tabs (Postman file upload / cURL paste)
- [ ] Accessible from both FlowListPage and FlowBuilderPage

#### 7.4 Node Creation Integration
- [ ] API button in FlowToolbar shows popover with two options:
  1. "Create empty" — existing behavior
  2. "From catalog" — opens catalog picker, creates node from selected entry
- [ ] Catalog entry → ApiNode conversion (one-way stamp, not a live link)

### Checkpoint 7 ✅
```
Verify ALL before proceeding:
- [ ] Catalog entries persist across app restarts
- [ ] Postman collection import creates correct entries
- [ ] cURL import handles common formats (GET, POST with headers/body)
- [ ] Catalog entries can be edited and deleted
- [ ] Node created from catalog has correct method, url, headers, body
- [ ] "Create empty" still works as before
- [ ] All unit tests pass
- [ ] `npm run build` — zero errors
- [ ] No `any` types, no hardcoded strings
- [ ] CLAUDE.md updated
```
→ DO NOT proceed to Phase 8 until ALL boxes checked

---

## Appendix: Notes
- Focus REST API only in v1
- No collaboration/multi-user in this phase
- Keep execution simple (no complex branching yet)
