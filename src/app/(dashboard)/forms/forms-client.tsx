"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForm, deleteForm, updateForm } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Tag = { id: string; name: string };
type Form = {
  id: string;
  name: string;
  slug: string;
  heading: string;
  description: string | null;
  button_text: string;
  success_message: string;
  tag_ids: string[];
  redirect_url: string | null;
  active: boolean;
  created_at: string;
};

export function FormsClient({
  initialForms,
  tags,
}: {
  initialForms: Form[];
  tags: Tag[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editForm, setEditForm] = useState<Form | null>(null);
  const [embedId, setEmbedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleCreate(formData: FormData) {
    formData.set("tag_ids", JSON.stringify(selectedTagIds));
    setLoading(true);
    const result = await createForm(formData);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setCreateOpen(false);
    setSelectedTagIds([]);
    toast({ title: "Form created" });
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!editForm) return;
    formData.set("tag_ids", JSON.stringify(selectedTagIds));
    formData.set("active", editForm.active ? "true" : "false");
    setLoading(true);
    const result = await updateForm(editForm.id, formData);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setEditForm(null);
    setSelectedTagIds([]);
    toast({ title: "Form updated" });
    router.refresh();
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteForm(id);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setDeleteId(null);
    toast({ title: "Form deleted" });
    router.refresh();
  }

  function openEdit(form: Form) {
    setEditForm(form);
    setSelectedTagIds(form.tag_ids || []);
  }

  function getEmbedCode(form: Form) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `<iframe src="${baseUrl}/s/${form.slug}" width="100%" height="500" frameborder="0" style="border:none;max-width:500px;margin:0 auto;display:block;"></iframe>`;
  }

  function getDirectLink(form: Form) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/s/${form.slug}`;
  }

  const formFields = (isEdit: boolean) => (
    <>
      <div className="space-y-2">
        <Label htmlFor="f-name">Form Name (internal)</Label>
        <Input id="f-name" name="name" required defaultValue={isEdit ? editForm?.name : ""} placeholder="e.g. Homepage Signup" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-slug">URL Slug</Label>
        <Input id="f-slug" name="slug" required defaultValue={isEdit ? editForm?.slug : ""} placeholder="e.g. newsletter" />
        <p className="text-xs text-muted-foreground">Form will be at /s/your-slug</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-heading">Heading</Label>
        <Input id="f-heading" name="heading" defaultValue={isEdit ? editForm?.heading : "Subscribe to our newsletter"} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-desc">Description</Label>
        <Textarea id="f-desc" name="description" defaultValue={isEdit ? editForm?.description || "" : ""} placeholder="Optional description shown below heading" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="f-btn">Button Text</Label>
          <Input id="f-btn" name="button_text" defaultValue={isEdit ? editForm?.button_text : "Subscribe"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-redirect">Redirect URL (optional)</Label>
          <Input id="f-redirect" name="redirect_url" defaultValue={isEdit ? editForm?.redirect_url || "" : ""} placeholder="https://..." />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-success">Success Message</Label>
        <Input id="f-success" name="success_message" defaultValue={isEdit ? editForm?.success_message : "Check your email to confirm your subscription!"} />
      </div>
      <div className="space-y-2">
        <Label>Auto-assign to Lists</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
          {tags.length === 0 && <p className="text-sm text-muted-foreground">No lists created yet.</p>}
        </div>
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialForms.length} form{initialForms.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setSelectedTagIds([]); }}>
          <DialogTrigger asChild>
            <Button>Create Form</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Signup Form</DialogTitle>
              <DialogDescription>Create a public signup form with double opt-in.</DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              {formFields(false)}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {initialForms.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No signup forms yet. Create one to start collecting subscribers.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Lists</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[280px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.name}</TableCell>
                  <TableCell>
                    <a
                      href={`/s/${form.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      /s/{form.slug}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(form.tag_ids || []).map((tid) => {
                        const tag = tags.find((t) => t.id === tid);
                        return tag ? (
                          <Badge key={tid} variant="outline" className="text-xs">{tag.name}</Badge>
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={form.active ? "default" : "secondary"}>
                      {form.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(form)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setEmbedId(form.id)}>Embed</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(form.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editForm} onOpenChange={(o) => { if (!o) { setEditForm(null); setSelectedTagIds([]); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4">
            {formFields(true)}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditForm(null)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Embed code dialog */}
      <Dialog open={!!embedId} onOpenChange={(o) => !o && setEmbedId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Embed Code</DialogTitle>
            <DialogDescription>Copy the code below to embed this form on your website.</DialogDescription>
          </DialogHeader>
          {embedId && (() => {
            const form = initialForms.find((f) => f.id === embedId);
            if (!form) return null;
            return (
              <div className="space-y-4">
                <div>
                  <Label>Direct Link</Label>
                  <Input readOnly value={getDirectLink(form)} className="mt-1 font-mono text-sm" onClick={(e) => (e.target as HTMLInputElement).select()} />
                </div>
                <div>
                  <Label>Embed (iframe)</Label>
                  <Textarea readOnly value={getEmbedCode(form)} className="mt-1 font-mono text-sm" rows={3} onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button onClick={() => setEmbedId(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete form?</DialogTitle>
            <DialogDescription>This will permanently delete this signup form.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={loading}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
