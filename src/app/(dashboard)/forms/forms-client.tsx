"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForm, deleteForm, updateForm } from "./actions";
import { THEMES, getTheme, applyCustomColors } from "./themes";
import { FormThemePreview, ThemeCard } from "./form-theme-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Tag = { id: string; name: string };
type Template = { id: string; name: string };
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
  welcome_template_id: string | null;
  active: boolean;
  created_at: string;
  theme: string | null;
  accent_color: string | null;
  background_color: string | null;
  logo_url: string | null;
  show_name_field: boolean;
};

export function FormsClient({
  initialForms,
  tags,
  templates,
}: {
  initialForms: Form[];
  tags: Tag[];
  templates: Template[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editForm, setEditForm] = useState<Form | null>(null);
  const [embedId, setEmbedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState("clean");
  const [accentColor, setAccentColor] = useState<string>("");
  const [bgColor, setBgColor] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState("");
  const [showNameField, setShowNameField] = useState(true);
  // For live preview
  const [previewHeading, setPreviewHeading] = useState("Subscribe to our newsletter");
  const [previewDescription, setPreviewDescription] = useState("");
  const [previewButtonText, setPreviewButtonText] = useState("Subscribe");

  const router = useRouter();
  const { toast } = useToast();

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function resetFormState() {
    setSelectedTagIds([]);
    setSelectedTemplateId("");
    setSelectedTheme("clean");
    setAccentColor("");
    setBgColor("");
    setLogoUrl("");
    setShowNameField(true);
    setPreviewHeading("Subscribe to our newsletter");
    setPreviewDescription("");
    setPreviewButtonText("Subscribe");
  }

  async function handleCreate(formData: FormData) {
    formData.set("tag_ids", JSON.stringify(selectedTagIds));
    formData.set("welcome_template_id", selectedTemplateId === "none" ? "" : selectedTemplateId);
    formData.set("theme", selectedTheme);
    formData.set("accent_color", accentColor);
    formData.set("background_color", bgColor);
    formData.set("logo_url", logoUrl);
    formData.set("show_name_field", showNameField ? "true" : "false");
    setLoading(true);
    const result = await createForm(formData);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setCreateOpen(false);
    resetFormState();
    toast({ title: "Form created" });
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!editForm) return;
    formData.set("tag_ids", JSON.stringify(selectedTagIds));
    formData.set("active", editForm.active ? "true" : "false");
    formData.set("welcome_template_id", selectedTemplateId === "none" ? "" : selectedTemplateId);
    formData.set("theme", selectedTheme);
    formData.set("accent_color", accentColor);
    formData.set("background_color", bgColor);
    formData.set("logo_url", logoUrl);
    formData.set("show_name_field", showNameField ? "true" : "false");
    setLoading(true);
    const result = await updateForm(editForm.id, formData);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setEditForm(null);
    resetFormState();
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
    setSelectedTemplateId(form.welcome_template_id || "");
    setSelectedTheme(form.theme || "clean");
    setAccentColor(form.accent_color || "");
    setBgColor(form.background_color || "");
    setLogoUrl(form.logo_url || "");
    setShowNameField(form.show_name_field !== false);
    setPreviewHeading(form.heading || "Subscribe to our newsletter");
    setPreviewDescription(form.description || "");
    setPreviewButtonText(form.button_text || "Subscribe");
  }

  function getEmbedCode(form: Form) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `<iframe src="${baseUrl}/s/${form.slug}" width="100%" height="600" frameborder="0" style="border:none;max-width:500px;margin:0 auto;display:block;"></iframe>`;
  }

  function getDirectLink(form: Form) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/s/${form.slug}`;
  }

  const currentTheme = applyCustomColors(
    getTheme(selectedTheme),
    { accentColor: accentColor || null, backgroundColor: bgColor || null }
  );

  const formFields = (isEdit: boolean) => (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
      {/* Left column: Form settings */}
      <div className="space-y-4">
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
          <Input
            id="f-heading"
            name="heading"
            defaultValue={isEdit ? editForm?.heading : "Subscribe to our newsletter"}
            onChange={(e) => setPreviewHeading(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-desc">Description</Label>
          <Textarea
            id="f-desc"
            name="description"
            defaultValue={isEdit ? editForm?.description || "" : ""}
            placeholder="Optional description shown below heading"
            onChange={(e) => setPreviewDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="f-btn">Button Text</Label>
            <Input
              id="f-btn"
              name="button_text"
              defaultValue={isEdit ? editForm?.button_text : "Subscribe"}
              onChange={(e) => setPreviewButtonText(e.target.value)}
            />
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

        {/* Theme picker */}
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(THEMES).map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={selectedTheme === theme.id}
                onClick={() => setSelectedTheme(theme.id)}
              />
            ))}
          </div>
        </div>

        {/* Custom colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Accent Color (optional override)</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={accentColor || currentTheme.accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="Use theme default"
                className="flex-1"
              />
              {accentColor && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAccentColor("")}>Reset</Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Background Color (optional override)</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={bgColor || currentTheme.backgroundColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="Use theme default"
                className="flex-1"
              />
              {bgColor && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setBgColor("")}>Reset</Button>
              )}
            </div>
          </div>
        </div>

        {/* Logo & name field */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Logo URL (optional)</Label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://yoursite.com/logo.png"
            />
          </div>
          <div className="space-y-2">
            <Label>Show Name Field</Label>
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={showNameField} onCheckedChange={setShowNameField} />
              <span className="text-sm text-muted-foreground">{showNameField ? "Shown" : "Hidden"}</span>
            </div>
          </div>
        </div>

        {/* Lists & welcome template */}
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
        <div className="space-y-2">
          <Label>Welcome Template</Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="No welcome email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No welcome email</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Send a welcome email when a subscriber confirms via this form.</p>
        </div>
      </div>

      {/* Right column: Live preview */}
      <div className="space-y-2">
        <Label>Live Preview</Label>
        <div className="sticky top-4 rounded-lg border overflow-hidden">
          <FormThemePreview
            theme={currentTheme}
            heading={previewHeading}
            description={previewDescription}
            buttonText={previewButtonText}
            showNameField={showNameField}
            logoUrl={logoUrl || undefined}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialForms.length} form{initialForms.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetFormState(); }}>
          <DialogTrigger asChild>
            <Button>Create Form</Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Signup Form</DialogTitle>
              <DialogDescription>Create a professional signup form with theme customization.</DialogDescription>
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
                <TableHead>Theme</TableHead>
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
                    <a href={`/s/${form.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">/s/{form.slug}</a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{form.theme || "clean"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(form.tag_ids || []).map((tid) => {
                        const tag = tags.find((t) => t.id === tid);
                        return tag ? <Badge key={tid} variant="outline" className="text-xs">{tag.name}</Badge> : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={form.active ? "default" : "secondary"}>{form.active ? "Active" : "Inactive"}</Badge>
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
      <Dialog open={!!editForm} onOpenChange={(o) => { if (!o) { setEditForm(null); resetFormState(); } }}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Form</DialogTitle></DialogHeader>
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
