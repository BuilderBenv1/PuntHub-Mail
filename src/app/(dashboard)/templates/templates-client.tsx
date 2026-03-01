"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTemplate, deleteTemplate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Template = {
  id: string;
  name: string;
  subject: string | null;
  html_body: string;
  created_at: string;
  updated_at: string;
};

export function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSave(formData: FormData) {
    setLoading(true);
    const result = await saveTemplate(formData);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setCreateOpen(false);
    setEditTemplate(null);
    toast({ title: editTemplate ? "Template updated" : "Template created" });
    router.refresh();
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteTemplate(id);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setDeleteId(null);
    toast({ title: "Template deleted" });
    router.refresh();
  }

  const formFields = (template: Template | null) => (
    <>
      {template && <input type="hidden" name="id" value={template.id} />}
      <div className="space-y-2">
        <Label>Template Name</Label>
        <Input name="name" required defaultValue={template?.name || ""} placeholder="e.g. Weekly Newsletter" />
      </div>
      <div className="space-y-2">
        <Label>Default Subject (optional)</Label>
        <Input name="subject" defaultValue={template?.subject || ""} placeholder="Can be overridden in campaign" />
      </div>
      <div className="space-y-2">
        <Label>HTML Body</Label>
        <Textarea name="html_body" required defaultValue={template?.html_body || ""} className="min-h-[300px] font-mono text-sm" placeholder="Paste your HTML email template..." />
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{initialTemplates.length} template{initialTemplates.length !== 1 ? "s" : ""}</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>Save a reusable HTML email template.</DialogDescription>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              {formFields(null)}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {initialTemplates.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">No templates yet.</div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[240px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialTemplates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.subject || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(t.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setPreviewHtml(t.html_body)}>Preview</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditTemplate(t)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(t.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTemplate} onOpenChange={(o) => !o && setEditTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
          <form action={handleSave} className="space-y-4">
            {formFields(editTemplate)}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTemplate(null)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewHtml} onOpenChange={(o) => !o && setPreviewHtml(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Template Preview</DialogTitle></DialogHeader>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml || "" }} />
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete template?</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={loading}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
