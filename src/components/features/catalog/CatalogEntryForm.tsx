import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KeyValueEditor } from "@/components/features/node-config/KeyValueEditor";
import { useCatalogStore } from "@/store/catalogStore";
import { API_CATALOG, HTTP_METHODS } from "@/utils/constants";
import { getMethodStyle } from "@/utils/methodColors";
import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/types";
import type { CatalogEntry, CatalogEntryDraft } from "@/types";

interface CatalogEntryFormProps {
  entry?: CatalogEntry;
  defaultFolderId?: string | null;
  onSave: (draft: CatalogEntryDraft) => void;
  onCancel: () => void;
}

export function CatalogEntryForm({ entry, defaultFolderId, onSave, onCancel }: CatalogEntryFormProps) {
  const folders = useCatalogStore((s) => s.folders);
  const [name, setName] = useState(entry?.name ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [tagsInput, setTagsInput] = useState(entry?.tags.join(", ") ?? "");
  const [folderId, setFolderId] = useState<string | null>(entry?.folderId ?? defaultFolderId ?? null);
  const [method, setMethod] = useState<HttpMethod>(entry?.method ?? "GET");
  const [url, setUrl] = useState(entry?.url ?? "");
  const [headers, setHeaders] = useState<Record<string, string>>(entry?.headers ?? {});
  const [queryParams, setQueryParams] = useState<Record<string, string>>(entry?.queryParams ?? {});
  const [body, setBody] = useState(entry?.body ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      name: name.trim() || "Untitled",
      description: description.trim(),
      tags,
      folderId,
      method,
      url: url.trim(),
      headers,
      queryParams,
      body,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_NAME}
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Create User"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_DESCRIPTION}
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_FOLDER}
        </label>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={folderId ?? ""}
          onChange={(e) => setFolderId(e.target.value || null)}
        >
          <option value="">{API_CATALOG.FORM_FOLDER_NONE}</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_TAGS}
        </label>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder={API_CATALOG.FORM_TAGS_PLACEHOLDER}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_METHOD}
        </label>
        <div className="flex flex-wrap gap-1">
          {HTTP_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-bold transition-colors",
                method === m
                  ? cn(getMethodStyle(m), "ring-2 ring-offset-1 ring-current")
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_URL}
        </label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={API_CATALOG.FORM_URL_PLACEHOLDER}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_HEADERS}
        </label>
        <KeyValueEditor entries={headers} onChange={setHeaders} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_QUERY_PARAMS}
        </label>
        <KeyValueEditor entries={queryParams} onChange={setQueryParams} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {API_CATALOG.FORM_BODY}
        </label>
        <Textarea
          className="min-h-24 font-mono text-xs"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={API_CATALOG.FORM_BODY_PLACEHOLDER}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {API_CATALOG.FORM_CANCEL}
        </Button>
        <Button type="submit" size="sm">
          {API_CATALOG.FORM_SAVE}
        </Button>
      </div>
    </form>
  );
}

export default CatalogEntryForm;
