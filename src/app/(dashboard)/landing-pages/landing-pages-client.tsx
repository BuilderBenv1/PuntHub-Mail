"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLandingPage, deleteLandingPage, saveLandingPage } from "./actions";
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
import { useToast } from "@/hooks/use-toast";

type LandingPage = {
  id: string;
  name: string;
  slug: string;
  html: string | null;
  css: string | null;
  project_json: any;
  meta_title: string | null;
  meta_description: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export function LandingPagesClient({ initialPages }: { initialPages: LandingPage[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate(formData: FormData) {
    setLoading(true);
    const result = await createLandingPage(formData);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setCreateOpen(false);
    toast({ title: "Landing page created" });
    router.push(`/landing-pages/${result.id}`);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteLandingPage(id);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setDeleteId(null);
    toast({ title: "Landing page deleted" });
    router.refresh();
  }

  async function handleTogglePublish(page: LandingPage) {
    const result = await saveLandingPage(page.id, { published: !page.published, slug: page.slug });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: page.published ? "Page unpublished" : "Page published" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialPages.length} page{initialPages.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => setCreateOpen(true)}>Create Page</Button>
      </div>

      {initialPages.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No landing pages yet. Create one to get started.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[300px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.name}</TableCell>
                  <TableCell>
                    {page.published ? (
                      <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">/p/{page.slug}</a>
                    ) : (
                      <span className="text-muted-foreground">/p/{page.slug}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.published ? "default" : "secondary"}>
                      {page.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/landing-pages/${page.id}`)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => handleTogglePublish(page)}>
                        {page.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(page.id)}>Delete</Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Landing Page</DialogTitle>
            <DialogDescription>Set up a new landing page. You can design it in the editor next.</DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Page Name (internal)</Label>
              <Input name="name" required placeholder="e.g. Free Tips Signup" />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input name="slug" required placeholder="e.g. free-tips" />
              <p className="text-xs text-muted-foreground">Page will be at /p/your-slug</p>
            </div>
            <div className="space-y-2">
              <Label>Meta Title (optional)</Label>
              <Input name="meta_title" placeholder="Page title for SEO" />
            </div>
            <div className="space-y-2">
              <Label>Meta Description (optional)</Label>
              <Input name="meta_description" placeholder="Page description for search engines" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create & Edit"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete landing page?</DialogTitle>
            <DialogDescription>This will permanently delete this page and its content.</DialogDescription>
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
