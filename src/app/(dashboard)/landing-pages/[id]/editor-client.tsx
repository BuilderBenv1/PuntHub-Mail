"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { saveLandingPage } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { PageBuilderRef } from "@/components/page-builder";

const PageBuilderComponent = dynamic(
  () => import("@/components/page-builder").then((mod) => mod.PageBuilderComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">Loading page builder...</p>
      </div>
    ),
  }
);

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
};

export function EditorClient({ page }: { page: LandingPage }) {
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState(page.name);
  const [slug, setSlug] = useState(page.slug);
  const [metaTitle, setMetaTitle] = useState(page.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(page.meta_description || "");
  const [published, setPublished] = useState(page.published);
  const builderRef = useRef<PageBuilderRef>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = useCallback(async () => {
    if (!builderRef.current) return;
    setSaving(true);

    const html = builderRef.current.getHtml();
    const css = builderRef.current.getCss();
    const project_json = builderRef.current.getProjectData();

    const result = await saveLandingPage(page.id, {
      name,
      slug,
      html,
      css,
      project_json,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      published,
    });

    setSaving(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }

    toast({ title: "Page saved" });
  }, [name, slug, metaTitle, metaDescription, published, page.id, toast]);

  async function handlePublishToggle() {
    const newPublished = !published;
    setPublished(newPublished);

    // Also save with the builder content
    if (builderRef.current) {
      setSaving(true);
      const html = builderRef.current.getHtml();
      const css = builderRef.current.getCss();
      const project_json = builderRef.current.getProjectData();

      const result = await saveLandingPage(page.id, {
        html,
        css,
        project_json,
        slug,
        published: newPublished,
      });

      setSaving(false);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        setPublished(!newPublished);
        return;
      }
    }

    toast({ title: newPublished ? "Page published" : "Page unpublished" });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/landing-pages")}>
            ← Back
          </Button>
          <span className="font-medium">{name}</span>
          <Badge variant={published ? "default" : "secondary"}>
            {published ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          {published && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer">
                View Page
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePublishToggle} disabled={saving}>
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <PageBuilderComponent
          ref={builderRef}
          projectData={page.project_json}
        />
      </div>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Page Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Page Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              <p className="text-xs text-muted-foreground">Page will be at /p/{slug}</p>
            </div>
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO page title" />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="SEO description" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
