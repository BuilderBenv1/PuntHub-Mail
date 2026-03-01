"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createSegment,
  updateSegment,
  deleteSegment,
  previewSegmentCount,
} from "./actions";
import type { SegmentRule } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const FIELD_OPTIONS = [
  { value: "status", label: "Status" },
  { value: "engagement_score", label: "Engagement Score" },
  { value: "tag", label: "List (Tag)" },
  { value: "last_opened_at", label: "Last Opened At" },
  { value: "created_at", label: "Created At" },
];

function getOperatorsForField(field: string) {
  switch (field) {
    case "status":
      return [{ value: "equals", label: "Equals" }];
    case "engagement_score":
      return [
        { value: "greater_than", label: "Greater than" },
        { value: "less_than", label: "Less than" },
      ];
    case "tag":
      return [{ value: "has_tag", label: "Has tag" }];
    case "last_opened_at":
    case "created_at":
      return [
        { value: "after", label: "After" },
        { value: "before", label: "Before" },
      ];
    default:
      return [];
  }
}

const emptyRule: SegmentRule = { field: "status", operator: "equals", value: "" };

export function SegmentsClient({
  segments,
  tags,
}: {
  segments: any[];
  tags: any[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rules, setRules] = useState<SegmentRule[]>([{ ...emptyRule }]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function resetForm() {
    setName("");
    setRules([{ ...emptyRule }]);
    setEditingId(null);
    setPreviewCount(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(segment: any) {
    setEditingId(segment.id);
    setName(segment.name);
    setRules(segment.rules && segment.rules.length > 0 ? segment.rules : [{ ...emptyRule }]);
    setPreviewCount(null);
    setDialogOpen(true);
  }

  function updateRule(index: number, key: keyof SegmentRule, value: string) {
    setRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };

      // When field changes, reset operator and value
      if (key === "field") {
        const operators = getOperatorsForField(value);
        updated[index].operator = operators[0]?.value || "";
        updated[index].value = "";
      }

      return updated;
    });
    setPreviewCount(null);
  }

  function addRule() {
    setRules((prev) => [...prev, { ...emptyRule }]);
    setPreviewCount(null);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
    setPreviewCount(null);
  }

  async function handlePreview() {
    setPreviewLoading(true);
    const result = await previewSegmentCount(rules);
    setPreviewCount(result.count);
    setPreviewLoading(false);
  }

  async function handleSave() {
    if (!name.trim()) return;
    const validRules = rules.filter((r) => r.field && r.operator && r.value);
    if (validRules.length === 0) {
      toast({ title: "Error", description: "Add at least one complete rule.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const result = editingId
      ? await updateSegment(editingId, name, validRules)
      : await createSegment(name, validRules);
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setDialogOpen(false);
      resetForm();
      toast({ title: editingId ? "Segment updated" : "Segment created" });
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteSegment(id);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setDeleteId(null);
      toast({ title: "Segment deleted" });
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {segments.length} segment{segments.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openCreate}>New Segment</Button>
      </div>

      {segments.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No segments yet. Create one to dynamically group your subscribers.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Rules</TableHead>
                <TableHead className="text-center">Matching Subscribers</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell className="font-medium">{segment.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {(segment.rules || []).length} rule{(segment.rules || []).length !== 1 ? "s" : ""}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{segment.matchingCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(segment)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(segment.id)}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Segment" : "New Segment"}</DialogTitle>
            <DialogDescription>
              Define rules to dynamically group subscribers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Highly Engaged, New Subscribers..."
              />
            </div>

            <div className="space-y-2">
              <Label>Rules (all must match)</Label>
              {rules.map((rule, index) => (
                <div key={index} className="flex items-end gap-2 rounded-md border p-3">
                  {/* Field */}
                  <div className="flex-1 space-y-1">
                    <span className="text-xs text-muted-foreground">Field</span>
                    <Select
                      value={rule.field}
                      onValueChange={(v) => updateRule(index, "field", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator */}
                  <div className="flex-1 space-y-1">
                    <span className="text-xs text-muted-foreground">Operator</span>
                    <Select
                      value={rule.operator}
                      onValueChange={(v) => updateRule(index, "operator", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsForField(rule.field).map((op) => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value */}
                  <div className="flex-1 space-y-1">
                    <span className="text-xs text-muted-foreground">Value</span>
                    {rule.field === "tag" ? (
                      <Select
                        value={rule.value}
                        onValueChange={(v) => updateRule(index, "value", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a list..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tags.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : rule.field === "status" ? (
                      <Select
                        value={rule.value}
                        onValueChange={(v) => updateRule(index, "value", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                          <SelectItem value="bounced">Bounced</SelectItem>
                          <SelectItem value="complained">Complained</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : rule.field === "engagement_score" ? (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={rule.value}
                        onChange={(e) => updateRule(index, "value", e.target.value)}
                        placeholder="0-100"
                      />
                    ) : (
                      <Input
                        type="date"
                        value={rule.value}
                        onChange={(e) => updateRule(index, "value", e.target.value)}
                      />
                    )}
                  </div>

                  {/* Remove button */}
                  {rules.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRule(index)}
                      className="shrink-0"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={addRule}>
                  Add Rule
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={previewLoading}
                >
                  {previewLoading ? "Checking..." : "Preview Count"}
                </Button>
                {previewCount !== null && (
                  <span className="text-sm text-muted-foreground">
                    {previewCount} matching subscriber{previewCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !name.trim()}>
              {loading ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete segment?</DialogTitle>
            <DialogDescription>
              This will permanently delete this segment. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
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
