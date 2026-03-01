"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAutomation, toggleAutomation, deleteAutomation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function AutomationsClient({
  automations,
  tags,
}: {
  automations: any[];
  tags: any[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("tag_added");
  const [triggerTagId, setTriggerTagId] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  function resetForm() {
    setName("");
    setTriggerType("tag_added");
    setTriggerTagId("");
  }

  async function handleCreate() {
    if (!name.trim()) return;
    if (triggerType === "tag_added" && !triggerTagId) {
      toast({ title: "Error", description: "Please select a list.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("trigger_type", triggerType);
    if (triggerType === "tag_added") formData.set("trigger_tag_id", triggerTagId);

    const result = await createAutomation(formData);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setCreateOpen(false);
      resetForm();
      toast({ title: "Automation created" });
      router.refresh();
    }
  }

  async function handleToggle(id: string, active: boolean) {
    const result = await toggleAutomation(id, active);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteAutomation(id);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setDeleteId(null);
      toast({ title: "Automation deleted" });
      router.refresh();
    }
  }

  function triggerLabel(type: string) {
    switch (type) {
      case "tag_added": return "List Added";
      case "subscriber_created": return "Subscriber Created";
      default: return type;
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {automations.length} automation{automations.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          New Automation
        </Button>
      </div>

      {automations.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No automations yet. Create one to get started.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Trigger</TableHead>
                <TableHead className="hidden md:table-cell">List</TableHead>
                <TableHead className="text-center">Steps</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`/automations/${a.id}`} className="hover:underline">
                      {a.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{triggerLabel(a.trigger_type)}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {a.triggerTagName || "—"}
                  </TableCell>
                  <TableCell className="text-center">{a.stepCount}</TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={a.active}
                      onClick={() => handleToggle(a.id, !a.active)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        a.active ? "bg-primary" : "bg-input"
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          a.active ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/automations/${a.id}`}>
                        <Button size="sm" variant="outline">Edit</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(a.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Automation Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Welcome series, Onboarding, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tag_added">List Added</SelectItem>
                  <SelectItem value="subscriber_created">Subscriber Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {triggerType === "tag_added" && (
              <div className="space-y-2">
                <Label>Trigger List</Label>
                <Select value={triggerTagId} onValueChange={setTriggerTagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete automation?</DialogTitle>
            <DialogDescription>
              This will permanently delete this automation and all its steps. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
