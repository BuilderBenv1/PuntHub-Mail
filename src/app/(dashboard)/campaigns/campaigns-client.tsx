"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelScheduledCampaign, deleteCampaign, duplicateCampaign, resendToNonOpeners, getNonOpenerCount } from "./actions";
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

const statusVariant: Record<string, any> = {
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  sent: "default",
};

export function CampaignsClient({ campaigns }: { campaigns: any[] }) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resendOpen, setResendOpen] = useState<string | null>(null);
  const [resendSubject, setResendSubject] = useState("");
  const [nonOpenerCount, setNonOpenerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleCancel(id: string) {
    setLoading(true);
    const result = await cancelScheduledCampaign(id);
    setLoading(false);
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
    else { toast({ title: "Schedule cancelled" }); router.refresh(); }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteCampaign(id);
    setLoading(false);
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
    else { setDeleteId(null); toast({ title: "Campaign deleted" }); router.refresh(); }
  }

  async function handleDuplicate(id: string) {
    setLoading(true);
    const result = await duplicateCampaign(id);
    setLoading(false);
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
    else { toast({ title: "Campaign duplicated" }); router.push(`/campaigns/new?id=${result.id}`); }
  }

  async function openResend(campaign: any) {
    setResendSubject(campaign.subject);
    setResendOpen(campaign.id);
    const count = await getNonOpenerCount(campaign.id);
    setNonOpenerCount(count);
  }

  async function handleResend() {
    if (!resendOpen || !resendSubject.trim()) return;
    setLoading(true);
    const result = await resendToNonOpeners(resendOpen, resendSubject);
    setLoading(false);
    setResendOpen(null);
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
    else { toast({ title: "Re-sent!", description: `${result.sent} emails sent to non-openers` }); router.refresh(); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <Link href="/campaigns/compare"><Button variant="outline">Compare</Button></Link>
          <Link href="/campaigns/new"><Button>New Campaign</Button></Link>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">No campaigns yet.</div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Sent Date</TableHead>
                <TableHead className="hidden md:table-cell text-right">Recipients</TableHead>
                <TableHead className="hidden md:table-cell text-right">Open Rate</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Click Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => {
                    if (c.status === "sent" || c.status === "sending") router.push(`/campaigns/${c.id}`);
                    else router.push(`/campaigns/new?id=${c.id}`);
                  }}>
                  <TableCell className="max-w-[200px]">
                    <Link href={c.status === "sent" ? `/campaigns/${c.id}` : `/campaigns/new?id=${c.id}`} className="font-medium hover:underline text-sm truncate block">{c.subject}</Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status] || "secondary"}>{c.status}</Badge>
                    {c.status === "scheduled" && c.scheduled_at && (
                      <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">{new Date(c.scheduled_at).toLocaleString()}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">{c.total_recipients}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">{c.openRate}%</TableCell>
                  <TableCell className="hidden lg:table-cell text-right">{c.clickRate}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.status === "draft" && <Link href={`/campaigns/new?id=${c.id}`}><Button size="sm" variant="outline">Edit</Button></Link>}
                      {c.status === "scheduled" && <Button size="sm" variant="outline" onClick={() => handleCancel(c.id)} disabled={loading}>Cancel</Button>}
                      {c.status === "sent" && (
                        <>
                          <Link href={`/campaigns/${c.id}`}><Button size="sm" variant="outline">Stats</Button></Link>
                          <Button size="sm" variant="outline" onClick={() => openResend(c)}>Re-send</Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(c.id)} disabled={loading}>Duplicate</Button>
                      {c.status !== "sent" && <Button size="sm" variant="destructive" onClick={() => setDeleteId(c.id)}>Delete</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete campaign?</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={loading}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-send to non-openers dialog */}
      <Dialog open={!!resendOpen} onOpenChange={(o) => !o && setResendOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-send to Non-Openers</DialogTitle>
            <DialogDescription>{nonOpenerCount} subscriber{nonOpenerCount !== 1 ? "s" : ""} didn&apos;t open this campaign.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Subject Line</Label>
              <Input value={resendSubject} onChange={(e) => setResendSubject(e.target.value)} placeholder="Try a different subject..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResendOpen(null)}>Cancel</Button>
            <Button onClick={handleResend} disabled={loading || nonOpenerCount === 0 || !resendSubject.trim()}>
              {loading ? "Sending..." : `Re-send to ${nonOpenerCount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
