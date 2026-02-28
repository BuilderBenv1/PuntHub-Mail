"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelScheduledCampaign, deleteCampaign } from "./actions";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";

const statusVariant: Record<string, any> = {
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  sent: "default",
};

export function CampaignsClient({ campaigns }: { campaigns: any[] }) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleCancel(id: string) {
    setLoading(true);
    const result = await cancelScheduledCampaign(id);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Schedule cancelled" });
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteCampaign(id);
    setLoading(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setDeleteId(null);
      toast({ title: "Campaign deleted" });
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
        </p>
        <Link href="/campaigns/new">
          <Button>New Campaign</Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No campaigns yet. Create your first campaign.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
                <TableHead className="text-right">Click Rate</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={
                        c.status === "sent"
                          ? `/campaigns/${c.id}`
                          : `/campaigns/new?id=${c.id}`
                      }
                      className="font-medium hover:underline"
                    >
                      {c.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status] || "secondary"}>
                      {c.status}
                    </Badge>
                    {c.status === "scheduled" && c.scheduled_at && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(c.scheduled_at).toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.sent_at
                      ? new Date(c.sent_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.total_recipients}
                  </TableCell>
                  <TableCell className="text-right">{c.openRate}%</TableCell>
                  <TableCell className="text-right">{c.clickRate}%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {c.status === "draft" && (
                        <Link href={`/campaigns/new?id=${c.id}`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                      )}
                      {c.status === "scheduled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(c.id)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      )}
                      {c.status === "sent" && (
                        <Link href={`/campaigns/${c.id}`}>
                          <Button size="sm" variant="outline">
                            Stats
                          </Button>
                        </Link>
                      )}
                      {c.status !== "sent" && (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteId(c.id)}
                          >
                            Delete
                          </Button>
                          <Dialog
                            open={deleteId === c.id}
                            onOpenChange={(open) => !open && setDeleteId(null)}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete campaign?</DialogTitle>
                                <DialogDescription>
                                  This will permanently delete &quot;{c.subject}&quot;.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(c.id)}
                                  disabled={loading}
                                >
                                  Delete
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
