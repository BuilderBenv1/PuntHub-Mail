"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addSubscriber,
  exportSubscribers,
  type SubscriberWithTags,
} from "./actions";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SubscriberDetail } from "./subscriber-detail";
import { CSVImportDialog } from "./csv-import-dialog";
import { DormantDialog } from "./dormant-dialog";

type Tag = { id: string; name: string };

export function SubscribersClient({
  initialSubscribers,
  tags,
  currentTag,
  currentStatus,
  currentSearch,
}: {
  initialSubscribers: SubscriberWithTags[];
  tags: Tag[];
  currentTag?: string;
  currentStatus?: string;
  currentSearch?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [dormantOpen, setDormantOpen] = useState(false);
  const [search, setSearch] = useState(currentSearch || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const updateFilters = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/subscribers?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleSearch() {
    updateFilters("search", search || undefined);
  }

  async function handleAdd(formData: FormData) {
    setLoading(true);
    const result = await addSubscriber(formData);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setAddOpen(false);
    toast({ title: "Subscriber added" });
    router.refresh();
  }

  async function handleExport() {
    const csv = await exportSubscribers({
      tag: currentTag,
      status: currentStatus,
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  }

  const statusColors: Record<string, string> = {
    active: "default",
    unsubscribed: "secondary",
    bounced: "destructive",
    complained: "destructive",
    dormant: "outline",
  };

  return (
    <div>
      {/* Filters and actions bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-64"
          />
          <Button variant="outline" onClick={handleSearch}>
            Search
          </Button>
        </div>

        <Select
          value={currentTag || "all"}
          onValueChange={(v) => updateFilters("tag", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Lists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lists</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentStatus || "all"}
          onValueChange={(v) => updateFilters("status", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="complained">Complained</SelectItem>
            <SelectItem value="dormant">Dormant</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setDormantOpen(true)}>
            Dormant Tool
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>Add Subscriber</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subscriber</DialogTitle>
                <DialogDescription>Add a single subscriber manually.</DialogDescription>
              </DialogHeader>
              <form action={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input id="add-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-name">Name</Label>
                  <Input id="add-name" name="name" placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label>Lists</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-1.5">
                        <input type="checkbox" name="tags" value={tag.id} className="rounded" />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                  {tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No lists created yet.</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {initialSubscribers.length} subscriber{initialSubscribers.length !== 1 ? "s" : ""}
      </p>

      {/* Subscriber table */}
      {initialSubscribers.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No subscribers found.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lists</TableHead>
                <TableHead>Last Opened</TableHead>
                <TableHead>Subscribed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialSubscribers.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedId(sub.id)}
                >
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell>{sub.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[sub.status] as any}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {sub.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.last_opened_at
                      ? new Date(sub.last_opened_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(sub.subscribed_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Subscriber detail panel */}
      {selectedId && (
        <SubscriberDetail
          subscriberId={selectedId}
          tags={tags}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* CSV Import dialog */}
      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        tags={tags}
      />

      {/* Dormant tool dialog */}
      <DormantDialog open={dormantOpen} onOpenChange={setDormantOpen} />
    </div>
  );
}
