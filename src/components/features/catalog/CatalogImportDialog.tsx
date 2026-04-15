import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCatalogStore } from "@/store/catalogStore";
import { parsePostmanCollection } from "@/services/postmanParser";
import { parseCurlCommand } from "@/services/curlParser";
import { API_CATALOG } from "@/utils/constants";

interface CatalogImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetFolderId?: string | null;
}

export function CatalogImportDialog({ open, onOpenChange, targetFolderId }: CatalogImportDialogProps) {
  const [curlInput, setCurlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addEntry = useCatalogStore((s) => s.addEntry);
  const importEntries = useCatalogStore((s) => s.importEntries);
  const importFolderWithDedup = useCatalogStore((s) => s.importFolderWithDedup);

  const handlePostmanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== "string") return;

      const result = parsePostmanCollection(text);
      if (result.success) {
        // Create/resolve folders and assign folderId to entries
        const entriesWithFolders = [...result.entries];

        for (const folderInfo of result.folders) {
          const folder = importFolderWithDedup(folderInfo.name);
          for (const idx of folderInfo.entryIndices) {
            if (idx < entriesWithFolders.length) {
              entriesWithFolders[idx] = {
                ...entriesWithFolders[idx],
                folderId: folder.id,
              };
            }
          }
        }

        // Entries without a folder go to the current target folder
        const finalEntries = entriesWithFolders.map((e) => ({
          ...e,
          folderId: e.folderId ?? targetFolderId ?? null,
        }));

        const count = importEntries(finalEntries);
        toast.success(`${API_CATALOG.IMPORT_SUCCESS}: ${count} entries`);
        onOpenChange(false);
      } else {
        toast.error(`${API_CATALOG.IMPORT_ERROR}: ${result.error}`);
      }
    };
    reader.onerror = () => {
      toast.error(API_CATALOG.IMPORT_ERROR);
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCurlImport = () => {
    if (!curlInput.trim()) return;

    const result = parseCurlCommand(curlInput);
    if (result.success) {
      addEntry({ ...result.entry, folderId: targetFolderId ?? null });
      toast.success(API_CATALOG.IMPORT_SUCCESS);
      setCurlInput("");
      onOpenChange(false);
    } else {
      toast.error(`${API_CATALOG.IMPORT_ERROR}: ${result.error}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{API_CATALOG.IMPORT_DIALOG_TITLE}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="postman">
          <TabsList className="w-full">
            <TabsTrigger value="postman" className="flex-1">
              {API_CATALOG.IMPORT_POSTMAN_TAB}
            </TabsTrigger>
            <TabsTrigger value="curl" className="flex-1">
              {API_CATALOG.IMPORT_CURL_TAB}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="postman" className="flex flex-col gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Upload a Postman Collection v2.1 JSON file. Folders in the collection will be created automatically.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handlePostmanFile}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload />
              {API_CATALOG.IMPORT_POSTMAN_BUTTON}
            </Button>
          </TabsContent>

          <TabsContent value="curl" className="flex flex-col gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Paste a cURL command to import as a catalog entry.
            </p>
            <Textarea
              className="min-h-32 font-mono text-xs"
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder={API_CATALOG.IMPORT_CURL_PLACEHOLDER}
            />
            <Button
              onClick={handleCurlImport}
              disabled={!curlInput.trim()}
            >
              {API_CATALOG.IMPORT_CURL_BUTTON}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default CatalogImportDialog;
