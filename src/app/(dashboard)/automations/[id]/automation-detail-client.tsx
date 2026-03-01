"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addStep, updateStep, deleteStep } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

function formatDelay(minutes: number): string {
  if (minutes === 0) return "Immediately";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    if (remainingMinutes === 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
    return `${hours}h ${remainingMinutes}m`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days} day${days !== 1 ? "s" : ""}`;
  return `${days}d ${remainingHours}h`;
}

function triggerLabel(type: string) {
  switch (type) {
    case "tag_added": return "List Added";
    case "subscriber_created": return "Subscriber Created";
    default: return type;
  }
}

export function AutomationDetailClient({
  automation,
  templates,
}: {
  automation: any;
  templates: any[];
}) {
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("0");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  const steps = automation.automation_steps || [];

  function resetForm() {
    setSubject("");
    setHtmlBody("");
    setDelayMinutes("0");
    setSelectedTemplate("");
    setEditingStep(null);
  }

  function openAddStep() {
    resetForm();
    setStepDialogOpen(true);
  }

  function openEditStep(step: any) {
    setEditingStep(step);
    setSubject(step.subject || "");
    setHtmlBody(step.html_body || "");
    setDelayMinutes(String(step.delay_minutes || 0));
    setSelectedTemplate("");
    setStepDialogOpen(true);
  }

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      if (template.subject) setSubject(template.subject);
      if (template.html_body) setHtmlBody(template.html_body);
    }
  }

  async function handleSaveStep() {
    if (!subject.trim()) {
      toast({ title: "Error", description: "Subject is required.", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (editingStep) {
      // Update existing step
      const formData = new FormData();
      formData.set("subject", subject);
      formData.set("html_body", htmlBody);
      formData.set("delay_minutes", delayMinutes);
      const result = await updateStep(editingStep.id, formData);
      setLoading(false);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        setStepDialogOpen(false);
        resetForm();
        toast({ title: "Step updated" });
        router.refresh();
      }
    } else {
      // Add new step
      const formData = new FormData();
      formData.set("automation_id", automation.id);
      formData.set("subject", subject);
      formData.set("html_body", htmlBody);
      formData.set("delay_minutes", delayMinutes);
      const result = await addStep(formData);
      setLoading(false);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        setStepDialogOpen(false);
        resetForm();
        toast({ title: "Step added" });
        router.refresh();
      }
    }
  }

  async function handleDeleteStep(id: string) {
    setLoading(true);
    const result = await deleteStep(id, automation.id);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setDeleteStepId(null);
      toast({ title: "Step deleted" });
      router.refresh();
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/automations">
            <Button variant="ghost" size="sm" className="mb-2">
              &larr; Back to Automations
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">{automation.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary">{triggerLabel(automation.trigger_type)}</Badge>
            {automation.tags?.name && (
              <Badge variant="outline">{automation.tags.name}</Badge>
            )}
            <Badge variant={automation.active ? "default" : "secondary"}>
              {automation.active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Steps ({steps.length})</h2>
        <Button onClick={openAddStep}>Add Step</Button>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No steps yet. Add your first step to this automation.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">#</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Email Preview</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((step: any, index: number) => (
                <TableRow key={step.id}>
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{step.subject}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatDelay(step.delay_minutes)}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-2 max-w-[300px] text-sm text-muted-foreground">
                      {step.html_body
                        ? step.html_body.replace(/<[^>]*>/g, "").slice(0, 120) + (step.html_body.length > 120 ? "..." : "")
                        : "No content"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEditStep(step)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteStepId(step.id)}>
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

      {/* Add/Edit Step Dialog */}
      <Dialog open={stepDialogOpen} onOpenChange={(o) => { if (!o) { setStepDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStep ? "Edit Step" : "Add Step"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>Load from Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
              />
            </div>
            <div className="space-y-2">
              <Label>Delay (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                How long to wait before sending this step. 0 = send immediately.
                {parseInt(delayMinutes) > 0 && (
                  <span className="ml-1 font-medium">({formatDelay(parseInt(delayMinutes))})</span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Email Body (HTML)</Label>
              <Textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStepDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveStep} disabled={loading || !subject.trim()}>
              {loading ? "Saving..." : editingStep ? "Update Step" : "Add Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Step Confirmation Dialog */}
      <Dialog open={!!deleteStepId} onOpenChange={(o) => { if (!o) setDeleteStepId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete step?</DialogTitle>
            <DialogDescription>
              This will permanently remove this step from the automation. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStepId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteStepId && handleDeleteStep(deleteStepId)}
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
