const ARRAY_INDEX_REGEX = /^(\w+)\[(\d+)\]$/;

function parseSegment(segment: string): { key: string; index: number | null } {
  const match = ARRAY_INDEX_REGEX.exec(segment);
  if (match) {
    return { key: match[1], index: Number(match[2]) };
  }
  return { key: segment, index: null };
}

export function resolveJsonPath(obj: unknown, path: string): unknown {
  if (!path) return obj;

  const segments = path.split(".");
  let current: unknown = obj;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;

    const { key, index } = parseSegment(segment);
    current = (current as Record<string, unknown>)[key];

    if (index !== null) {
      if (!Array.isArray(current)) return undefined;
      current = current[index];
    }
  }

  return current;
}
