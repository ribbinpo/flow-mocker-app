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
export const CATALOG_STORAGE_DIR_NAME = "catalog";
export const CATALOG_STORAGE_FILE_NAME = "catalog.json";

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
  CATALOG_SAVED_MESSAGE: "Catalog saved",
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

export const API_CATALOG = {
  DIALOG_TITLE: "API Catalog",
  DIALOG_DESCRIPTION: "Reusable API request templates",
  CREATE_BUTTON: "New Entry",
  IMPORT_BUTTON: "Import",
  EMPTY_TITLE: "No catalog entries",
  EMPTY_DESCRIPTION: "Create entries manually or import from Postman/cURL.",
  FORM_NAME: "Name",
  FORM_DESCRIPTION: "Description",
  FORM_TAGS: "Tags",
  FORM_TAGS_PLACEHOLDER: "Comma-separated tags",
  FORM_METHOD: "Method",
  FORM_URL: "URL",
  FORM_URL_PLACEHOLDER: "https://api.example.com/endpoint",
  FORM_HEADERS: "Headers",
  FORM_QUERY_PARAMS: "Query Parameters",
  FORM_BODY: "Body",
  FORM_BODY_PLACEHOLDER: '{ "key": "value" }',
  FORM_SAVE: "Save",
  FORM_CANCEL: "Cancel",
  IMPORT_DIALOG_TITLE: "Import API Catalog",
  IMPORT_POSTMAN_TAB: "Postman Collection",
  IMPORT_CURL_TAB: "cURL Command",
  IMPORT_CURL_PLACEHOLDER: "Paste cURL command here...",
  IMPORT_POSTMAN_BUTTON: "Select File",
  IMPORT_CURL_BUTTON: "Import",
  IMPORT_SUCCESS: "Imported successfully",
  IMPORT_ERROR: "Import failed",
  DELETE_CONFIRM: "Are you sure you want to delete this catalog entry?",
  TOOLBAR_POPOVER_EMPTY: "Create empty",
  TOOLBAR_POPOVER_CATALOG: "From catalog",
  SEARCH_PLACEHOLDER: "Search catalog...",
  FOLDER_NEW: "New Folder",
  FOLDER_DEFAULT_NAME: "New Folder",
  FOLDER_RENAME: "Rename",
  FOLDER_DELETE_CONFIRM: "Delete this folder? Entries will be moved to root.",
  FOLDER_ALL: "All Entries",
  FOLDER_ROOT: "Uncategorized",
  FORM_FOLDER: "Folder",
  FORM_FOLDER_NONE: "None (root)",
  MOVE_TO_FOLDER: "Move to folder",
  MOVE_TO_ROOT: "Move to root",
} as const;

export const SHORTCUTS = {
  RUN: "Ctrl+Enter",
  STOP: "Ctrl+.",
  STEP_NEXT: "Ctrl+Shift+Enter",
  ADD_NODE: "Ctrl+N",
  DESELECT: "Esc",
} as const;
