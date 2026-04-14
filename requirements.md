# Phase 6: Operation Node — Requirements Tracking

## 6.1 — Polymorphic Node Type System
**Status: COMPLETE**

- [x] `FlowNode` is discriminated union (`ApiNode | StartNode | StoreNode`)
- [x] Type guards: `isApiNode`, `isStartNode`, `isStoreNode`
- [x] `toReactFlowNode` switches on `node.type`
- [x] `NodeLog.request` nullable, added `nodeType` field
- [x] Engine dispatches by node type (`executeNodeInWave`)
- [x] `executeStoreNode` resolves variables from context
- [x] Migration: old flows without `type` default to `"api"` in storage + import
- [x] Zod schema backward compat (optional `type` with transform)
- [x] `NodeConfigPanel` guards API-specific fields with `isApiNode`
- [x] `NodeLogEntry` guards nullable `request`
- [x] All 102 tests pass, TypeScript compiles clean

---

## 6.2 — Start Node
**Status: COMPLETE**

- [x] `StartNode` component (`src/components/features/flow-builder/StartNode.tsx`)
  - Green circle visual, "Start" label
  - Source handle only (right side, no target handle)
- [x] Register `startNode` in `useFlowCanvas.ts` nodeTypes
- [x] Auto-create Start node when new flow is created (`flowStore.createFlow`)
- [x] Cannot delete Start node (toast error in canvas + config panel)
- [x] Config panel shows read-only info for Start node
- [x] Engine skips Start node (passthrough log with success, no HTTP request)
- [x] Existing flows without Start node still execute (graceful fallback)
- [x] 5 new tests for Start node in execution engine (107 total, all passing)

---

## 6.3 — Store Node (Data Model + UI)
**Status: COMPLETE**

- [x] `StoreNode` component (`src/components/features/flow-builder/StoreNode.tsx`)
  - Violet themed, database icon badge, variable name pills
  - Source + target handles
- [x] Registered `storeNode` in `useFlowCanvas.ts` nodeTypes
- [x] Toolbar: "Store" button to add Store nodes
- [x] Config panel: `StoreVariableEditor` component
  - Add/remove variables
  - Name input, source node dropdown (API nodes), source path input
- [x] Engine resolves Store variables from context (implemented in 6.1)
- [x] Downstream API nodes can use Store output via DataMapping
- [x] 6 new tests for Store node execution (115 total, all passing)
- [x] 2 new import/export tests (mixed flow round-trip + legacy compat)

---

## 6.4 — Edge Type System (Sequence vs Variable)
**Status: COMPLETE**

- [x] `FlowEdge` extended with `edgeType?: "sequence" | "variable"`, `sourceVariable?`, `targetField?`, `targetKey?`
- [x] Type guards: `isSequenceEdge`, `isVariableEdge`
- [x] Visual distinction: sequence = solid animated, variable = dashed violet with label
- [x] Variable edges excluded from topological sort (`getExecutionLevels`)
- [x] Variable edges excluded from parent map (failure propagation)
- [x] Removing variable edge auto-removes matching DataMapping on target node
- [x] New store actions: `addDataMapping`, `removeDataMapping`
- [x] Zod schema updated for edge import/export
- [x] Existing edges (no `edgeType`) default to sequence
- [x] 3 new tests: variable edge order, failure isolation, mixed edges (118 total)

---

## 6.5 — Variable Drag-and-Drop
**Status: COMPLETE**

- [x] Store node: named source handles per variable (`var-{variableName}`) + sequence handle
- [x] API node: target handles per field (`target-header`, `target-query`, `target-body`, `target-url`) with H/Q/B/U labels
- [x] `onConnect` detects `var-*` source + `target-*` target → creates variable edge + DataMapping
- [x] Delete variable edge removes DataMapping (implemented in 6.4)
- [x] Store actions `addDataMapping`, `removeDataMapping` (implemented in 6.4)

---

## 6.6 — Sequence-Aware Variable Availability
**Status: COMPLETE**

- [x] `getUpstreamNodeIds(nodeId, nodes, edges)` — BFS via sequence edges
- [x] `findInvalidReferences` and `cleanInvalidReferences` utilities
- [x] Store config: sourceNodeId dropdown disables non-upstream nodes ("executes after" label)
- [x] Auto-cleanup via `validateReferences` in flowStore after edge/node removal
- [x] Toast notification on auto-cleanup
- [x] 13 new tests: upstream computation (linear, diamond, variable edges ignored, disconnected), invalid reference detection, cleanup logic (131 total)

---

## 6.7 — Execution Log Generalization
**Status: COMPLETE**

- [x] Start log: green Play icon, "Flow started" message, not expandable
- [x] Store log: violet Database icon, "Variables resolved" message, expandable to show resolved values as JSON
- [x] API logs: unchanged (method badge, URL, status code, latency, expandable request/response)
- [x] `LogHeader` component switches rendering by `nodeType`
- [x] Non-expandable entries (Start) hide chevron

---

## Phase 6 Summary

**All 7 sub-phases complete.** 131 tests passing, TypeScript clean.

| Sub-phase | Tests Added |
|-----------|-------------|
| 6.1 Type system | 0 (existing tests updated) |
| 6.2 Start Node | 5 |
| 6.3 Store Node | 8 |
| 6.4 Edge types | 3 |
| 6.5 Variable DnD | 0 (UI-only) |
| 6.6 Sequence-aware | 13 |
| 6.7 Log generalization | 0 (UI-only) |
