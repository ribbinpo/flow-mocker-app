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

export const STORAGE_DIR_NAME = "flows";
export const LEGACY_STORAGE_FILE_NAME = "flows.json";

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
  SELECT_FLOW_DESCRIPTION: "Select a flow from the sidebar or create a new one.",
} as const;

export const FLOW_BUILDER = {
  TOOLBAR_ADD_API_NODE: "API",
  TOOLBAR_ADD_STORE_NODE: "Store",
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
  RETRY_SECTION: "Retry",
  RETRY_ENABLE: "Enable Retry",
  RETRY_MAX_LABEL: "Max Retries",
  RETRY_DELAY_LABEL: "Delay (ms)",
} as const;

export const ENV_EDITOR = {
  DIALOG_TITLE: "Environment Variables",
  DIALOG_DESCRIPTION: "Variables are available as {{VARIABLE_NAME}} in URLs, headers, and body.",
  BUTTON_LABEL: "Env",
  EMPTY_TITLE: "No variables",
  EMPTY_DESCRIPTION: "Add environment variables to use in your requests.",
} as const;

export const START_NODE = {
  LABEL: "Start",
  CANNOT_DELETE: "Start node cannot be deleted",
  ALREADY_EXISTS: "Flow already has a Start node",
} as const;

export const STORE_NODE = {
  LABEL: "Store",
  PANEL_DESCRIPTION: "Collect values from upstream API responses and expose them as named variables for downstream nodes.",
  VARIABLES_SECTION: "Variables",
  VARIABLE_NAME_LABEL: "Name",
  VARIABLE_NAME_PLACEHOLDER: "variableName",
  SOURCE_NODE_LABEL: "Source Node",
  SOURCE_NODE_PLACEHOLDER: "Select source node...",
  SOURCE_PATH_LABEL: "Path",
  SOURCE_PATH_PLACEHOLDER: "data.token",
  ADD_VARIABLE_BUTTON: "Add Variable",
  NO_VARIABLES: "No variables configured",
  NO_API_NODES: "No API nodes available",
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
  VALIDATION_ERRORS_SECTION: "Validation Errors",
  RETRY_ATTEMPTS_LABEL: "attempts",
  EXECUTION_SUCCESS_TOAST: "Flow executed successfully",
  EXECUTION_ERROR_TOAST: "Flow execution failed",
} as const;

export const PERSISTENCE = {
  SAVED_MESSAGE: "Flows saved",
} as const;

export const IMPORT_EXPORT = {
  EXPORT_BUTTON: "Export",
  IMPORT_BUTTON: "Import Flow",
  EXPORT_SUCCESS: "Flow exported successfully",
  IMPORT_SUCCESS: "Flow imported successfully",
  IMPORT_ERROR_INVALID_JSON: "Invalid JSON file",
  IMPORT_ERROR_INVALID_FORMAT: "File is not a valid flow format",
  IMPORT_ERROR_READ_FAILED: "Failed to read file",
  EXPORT_TOOLTIP: "Export as JSON",
  IMPORT_TOOLTIP: "Import flow from JSON file",
} as const;

export const SHORTCUTS = {
  RUN: "Ctrl+Enter",
  STOP: "Ctrl+.",
  STEP_NEXT: "Ctrl+Shift+Enter",
  ADD_NODE: "Ctrl+N",
  DESELECT: "Esc",
} as const;
