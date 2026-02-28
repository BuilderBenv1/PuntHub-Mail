"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkImportCSV } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Tag = { id: string; name: string };

export function CSVImportDialog({
  open,
  onOpenChange,
  tags,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [emailCol, setEmailCol] = useState("");
  const [nameCol, setNameCol] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "map">("upload");
  const router = useRouter();
  const { toast } = useToast();

  function parseCSV(text: string): string[][] {
    return text
      .split("\n")
      .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")))
      .filter((row) => row.some((cell) => cell.length > 0));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const text = await f.text();
    const rows = parseCSV(text);
    if (rows.length > 0) {
      setHeaders(rows[0]);
      setPreview(rows.slice(1, 6));
      setStep("map");
      // Auto-detect columns
      const emailIdx = rows[0].findIndex((h) =>
        h.toLowerCase().includes("email")
      );
      const nameIdx = rows[0].findIndex(
        (h) => h.toLowerCase().includes("name") && !h.toLowerCase().includes("email")
      );
      if (emailIdx >= 0) setEmailCol(String(emailIdx));
      if (nameIdx >= 0) setNameCol(String(nameIdx));
    }
  }

  async function handleImport() {
    if (!file || !emailCol) return;

    setLoading(true);
    const text = await file.text();
    const rows = parseCSV(text);
    const dataRows = rows.slice(1); // skip header

    const emailIndex = parseInt(emailCol);
    const nameIndex = nameCol ? parseInt(nameCol) : -1;

    const mapped = dataRows.map((row) => ({
      email: row[emailIndex] || "",
      name: nameIndex >= 0 ? row[nameIndex] : undefined,
    }));

    const result = await bulkImportCSV(mapped, selectedTagIds);
    setLoading(false);

    toast({
      title: "Import complete",
      description: `${result.imported} imported, ${result.skipped} skipped`,
    });

    // Reset
    setFile(null);
    setHeaders([]);
    setPreview([]);
    setStep("upload");
    setSelectedTagIds([]);
    onOpenChange(false);
    router.refresh();
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setStep("upload");
          setFile(null);
          setHeaders([]);
          setPreview([]);
          setSelectedTagIds([]);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import subscribers.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Column</Label>
                <Select value={emailCol} onValueChange={setEmailCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name Column (optional)</Label>
                <Select value={nameCol} onValueChange={setNameCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {headers.map((h, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign Lists on Import</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No lists available.</p>
                )}
              </div>
            </div>

            {preview.length > 0 && (
              <div>
                <Label>Preview (first {preview.length} rows)</Label>
                <div className="mt-1 max-h-32 overflow-auto rounded border text-xs">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="border-b px-2 py-1 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="border-b px-2 py-1">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={loading || !emailCol}>
                {loading ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
