import type { HttpMethod } from "../types";

export const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
];

export const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

export const API_TIMEOUT_MS = 30_000;

export const APP_NAME = "Flow Mocker";

export const STORAGE_FILE_NAME = "flows.json";

export const FLOW_LIST = {
  PAGE_TITLE: "My Flows",
  EMPTY_TITLE: "No flows yet",
  EMPTY_DESCRIPTION: "Create your first flow to start building API workflows.",
  CREATE_BUTTON: "Create Flow",
  CREATE_DIALOG_TITLE: "Create New Flow",
  CREATE_DIALOG_PLACEHOLDER: "Enter flow name...",
  CREATE_DIALOG_CONFIRM: "Create",
  CREATE_DIALOG_CANCEL: "Cancel",
  RENAME_DIALOG_TITLE: "Rename Flow",
  DELETE_CONFIRM_TITLE: "Delete Flow",
  DELETE_CONFIRM_DESCRIPTION:
    "This action cannot be undone. This will permanently delete the flow.",
  DELETE_CONFIRM_BUTTON: "Delete",
  CARD_NODES_LABEL: "nodes",
  CARD_UPDATED_LABEL: "Updated",
} as const;

export const FLOW_BUILDER = {
  TOOLBAR_ADD_NODE: "Add Node",
  BACK_BUTTON: "Back to Flows",
  UNTITLED_FLOW: "Untitled Flow",
} as const;

export const NODE_CONFIG = {
  PANEL_TITLE: "Node Configuration",
  LABEL_FIELD: "Label",
  METHOD_FIELD: "Method",
  URL_FIELD: "URL",
  URL_PLACEHOLDER: "https://api.example.com/endpoint",
  HEADERS_SECTION: "Headers",
  QUERY_PARAMS_SECTION: "Query Parameters",
  BODY_SECTION: "Body",
  BODY_PLACEHOLDER: '{ "key": "value" }',
  KEY_PLACEHOLDER: "Key",
  VALUE_PLACEHOLDER: "Value",
  ADD_PAIR_BUTTON: "Add",
  DELETE_NODE_BUTTON: "Delete Node",
  NO_URL: "No URL configured",
} as const;

export const DEFAULT_NODE = {
  LABEL: "New Request",
  METHOD: "GET" as HttpMethod,
  URL: "",
  BODY: "",
} as const;

export const EXECUTION = {
  RUN_BUTTON: "Run",
  STEP_BUTTON: "Step",
  STOP_BUTTON: "Stop",
  STEP_NEXT_BUTTON: "Next",
  STEP_MODE_LABEL: "Step Mode",
  LOG_PANEL_TITLE: "Execution Log",
  STATUS_IDLE: "Idle",
  STATUS_RUNNING: "Running...",
  STATUS_SUCCESS: "Success",
  STATUS_ERROR: "Error",
  STATUS_SKIPPED: "Skipped",
  ERROR_NO_NODES: "Flow has no nodes to execute",
  ERROR_CYCLE_DETECTED: "Cycle detected in flow — cannot execute",
  NO_LOGS: "No execution logs yet",
  NO_LOGS_DESCRIPTION: "Run a flow to see execution results here.",
  LATENCY_SUFFIX: "ms",
  REQUEST_SECTION: "Request",
  RESPONSE_SECTION: "Response",
  ERROR_SECTION: "Error",
} as const;
