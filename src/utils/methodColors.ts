import type { HttpMethod } from "@/types";

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  POST: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  PUT: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  DELETE: "bg-red-500/15 text-red-700 dark:text-red-400",
  PATCH: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

export function getMethodStyle(method: HttpMethod): string {
  return METHOD_STYLES[method];
}
