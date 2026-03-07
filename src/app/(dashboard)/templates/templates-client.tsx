"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { saveTemplate, deleteTemplate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { EmailBuilderRef } from "@/components/email-builder";

const EmailBuilderComponent = dynamic(
  () => import("@/components/email-builder").then((mod) => mod.EmailBuilderComponent),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted/50"><p className="text-muted-foreground">Loading email builder...</p></div> }
);

type Template = {
  id: string;
  name: string;
  subject: string | null;
  html_body: string;
  design_json?: any;
  created_at: string;
  updated_at: string;
};

export function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editorMode, setEditorMode] = useState<string>("visual");
  const [htmlBody, setHtmlBody] = useState("");
  const [designJson, setDesignJson] = useState<any>(null);
  const emailBuilderRef = useRef<EmailBuilderRef>(null);
  const router = useRouter();
  const { toast } = useToast();

  function openCreate() {
    setEditorMode("visual");
    setHtmlBody("");
    setDesignJson(null);
    setCreateOpen(true);
  }

  function openEdit(template: Template) {
    setEditorMode(template.design_json ? "visual" : "html");
    setHtmlBody(template.html_body || "");
    setDesignJson(template.design_json || null);
    setEditTemplate(template);
  }

  async function handleSave(formData: FormData) {
    setLoading(true);

    // Get HTML from visual editor if active
    if (editorMode === "visual" && emailBuilderRef.current) {
      const { html, design } = await emailBuilderRef.current.exportHtml();
      formData.set("html_body", html);
      formData.set("design_json", JSON.stringify(design));
    } else {
      formData.set("html_body", htmlBody);
      formData.set("design_json", JSON.stringify(null));
    }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Template Name</Label>
          <Input name="name" required defaultValue={template?.name || ""} placeholder="e.g. Weekly Newsletter" />
        </div>
        <div className="space-y-2">
          <Label>Default Subject (optional)</Label>
          <Input name="subject" defaultValue={template?.subject || ""} placeholder="Can be overridden in campaign" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email Body</Label>
        <Tabs value={editorMode} onValueChange={setEditorMode}>
          <TabsList className="mb-3">
            <TabsTrigger value="visual">Visual Builder</TabsTrigger>
            <TabsTrigger value="html">HTML Code</TabsTrigger>
          </TabsList>
          <TabsContent value="visual">
            <div className="border rounded-lg overflow-hidden">
              <EmailBuilderComponent
                ref={emailBuilderRef}
                initialDesign={designJson}
                minHeight="500px"
              />
            </div>
          </TabsContent>
          <TabsContent value="html">
            <Textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Paste your HTML email template..."
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{initialTemplates.length} template{initialTemplates.length !== 1 ? "s" : ""}</p>
        <Button onClick={openCreate}>Create Template</Button>
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
                <TableHead>Type</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[240px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialTemplates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.subject || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.design_json ? "Visual" : "HTML"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(t.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setPreviewHtml(t.html_body)}>Preview</Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(t)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(t.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>Design a reusable email template.</DialogDescription>
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

      {/* Edit dialog */}
      <Dialog open={!!editTemplate} onOpenChange={(o) => !o && setEditTemplate(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
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
