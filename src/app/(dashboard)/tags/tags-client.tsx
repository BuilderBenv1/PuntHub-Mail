"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTag, updateTag, deleteTag } from "./actions";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Tag = {
  id: string;
  name: string;
  description: string | null;
  aweber_list_id: string | null;
  created_at: string;
  activeSubscriberCount: number;
};

export function TagsClient({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState(initialTags);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate(formData: FormData) {
    setLoading(true);
    const result = await createTag(formData);
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }

    setCreateOpen(false);
    toast({ title: "List created" });
    router.refresh();
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditDesc(tag.description || "");
  }

  async function handleSaveEdit(id: string) {
    setLoading(true);
    const formData = new FormData();
    formData.set("name", editName);
    formData.set("description", editDesc);
    const result = await updateTag(id, formData);
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }

    setEditingId(null);
    toast({ title: "List updated" });
    router.refresh();
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteTag(id);
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }

    setDeleteConfirmId(null);
    setTags(tags.filter((t) => t.id !== id));
    toast({ title: "List deleted" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tags.length} list{tags.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create List</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create List</DialogTitle>
              <DialogDescription>Add a new list to organize subscribers.</DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Newsletter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Optional description"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tags.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No lists yet. Create your first list to get started.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Active Subscribers</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    {editingId === tag.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <Link
                        href={`/subscribers?tag=${tag.id}`}
                        className="font-medium hover:underline"
                      >
                        {tag.name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === tag.id ? (
                      <Input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="h-8"
                        placeholder="Optional"
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {tag.description || "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{tag.activeSubscriberCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === tag.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(tag.id)}
                            disabled={loading}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(tag)}
                          >
                            Edit
                          </Button>

                          <Dialog
                            open={deleteConfirmId === tag.id}
                            onOpenChange={(open) =>
                              setDeleteConfirmId(open ? tag.id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete list &quot;{tag.name}&quot;?</DialogTitle>
                                <DialogDescription>
                                  This will remove the list from all subscribers. This action
                                  cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(tag.id)}
                                  disabled={loading}
                                >
                                  {loading ? "Deleting..." : "Delete"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
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
