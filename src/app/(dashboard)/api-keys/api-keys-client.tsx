"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateApiKey, revokeApiKey } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type ApiKey = {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
};

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleGenerate() {
    if (!keyName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const result = await generateApiKey(keyName.trim());
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }

    setNewKey(result.key!);
    setKeyName("");
    router.refresh();
  }

  async function handleRevoke(id: string) {
    setLoading(true);
    const result = await revokeApiKey(id);
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }

    setRevokeId(null);
    toast({ title: "API key revoked" });
    router.refresh();
  }

  function handleCopy() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCloseCreate() {
    setCreateOpen(false);
    setNewKey(null);
    setKeyName("");
    setCopied(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialKeys.length} key{initialKeys.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={createOpen} onOpenChange={(o) => (o ? setCreateOpen(true) : handleCloseCreate())}>
          <DialogTrigger asChild>
            <Button>Generate New Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {newKey ? "API Key Generated" : "Generate API Key"}
              </DialogTitle>
              <DialogDescription>
                {newKey
                  ? "Copy this key now. You won't be able to see it again."
                  : "Give your key a name to identify it."}
              </DialogDescription>
            </DialogHeader>

            {newKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted p-3 text-sm break-all">
                    {newKey}
                  </code>
                  <Button variant="outline" onClick={handleCopy}>
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseCreate}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Key Name</Label>
                  <Input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Production, Python Script"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseCreate}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerate} disabled={loading}>
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {initialKeys.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No API keys yet. Generate one to get started.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(key.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={revokeId === key.id}
                      onOpenChange={(o) => setRevokeId(o ? key.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          Revoke
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Revoke API key &quot;{key.name}&quot;?</DialogTitle>
                          <DialogDescription>
                            Any applications using this key will lose access immediately.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRevokeId(null)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRevoke(key.id)}
                            disabled={loading}
                          >
                            Revoke
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
