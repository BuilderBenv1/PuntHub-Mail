"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findDormantSubscribers, markDormant } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type DormantSub = {
  id: string;
  email: string;
  name: string | null;
  last_opened_at: string | null;
  tags: { id: string; name: string }[];
};

const ALL_LISTS = "__all__";

export function DormantDialog({
  open,
  onOpenChange,
  tags,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: { id: string; name: string }[];
}) {
  const [step, setStep] = useState<"search" | "preview" | "done">("search");
  const [dormant, setDormant] = useState<DormantSub[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [sourceTagId, setSourceTagId] = useState<string>(ALL_LISTS);
  const [days, setDays] = useState<string>("90");
  const router = useRouter();
  const { toast } = useToast();

  const sourceTagName =
    sourceTagId === ALL_LISTS
      ? null
      : tags.find((t) => t.id === sourceTagId)?.name || null;

  async function handleFind() {
    setLoading(true);
    const subs = await findDormantSubscribers({
      sourceTagId: sourceTagId === ALL_LISTS ? undefined : sourceTagId,
      days: parseInt(days, 10),
    });
    setDormant(subs);
    setStep("preview");
    setLoading(false);
  }

  async function handleMarkDormant() {
    setLoading(true);
    const ids = dormant.map((s) => s.id);
    const res = await markDormant(ids, {
      removeFromTagId: sourceTagId === ALL_LISTS ? undefined : sourceTagId,
    });
    setLoading(false);

    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }

    setResult({ count: res.count! });
    setStep("done");
    router.refresh();
  }

  function handleClose() {
    setStep("search");
    setDormant([]);
    setResult(null);
    setSourceTagId(ALL_LISTS);
    setDays("90");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dormant Subscriber Tool</DialogTitle>
          <DialogDescription>
            Find active subscribers who haven&apos;t opened recently. They&apos;ll be added
            to DORMANT V2, marked dormant, and removed from the source list if one is
            picked. Subscribers added in the last 14 days are excluded.
          </DialogDescription>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Source list</Label>
              <Select value={sourceTagId} onValueChange={setSourceTagId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_LISTS}>All lists (global)</SelectItem>
                  {tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {sourceTagName
                  ? `Only check subscribers in "${sourceTagName}". They'll be removed from this list.`
                  : "Check all active subscribers. Source-list removal is skipped."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>No opens in the last</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Subscribers who have never opened are always included.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleFind} disabled={loading}>
                {loading ? "Searching..." : "Find Dormant Subscribers"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm">
              Found <strong>{dormant.length}</strong> active subscriber
              {dormant.length !== 1 ? "s" : ""} with no opens in 90 days.
            </p>

            {dormant.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No dormant subscribers found. All active subscribers have opened
                within 90 days.
              </p>
            ) : (
              <>
                <div className="max-h-64 overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Last Opened</TableHead>
                        <TableHead>Lists</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dormant.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="text-sm">{sub.email}</TableCell>
                          <TableCell className="text-sm">{sub.name || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.last_opened_at
                              ? new Date(sub.last_opened_at).toLocaleDateString()
                              : "Never"}
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {sourceTagName && (
                  <p className="text-xs text-muted-foreground">
                    Action: remove from &quot;{sourceTagName}&quot;, add to DORMANT V2,
                    set status to dormant.
                  </p>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setStep("search")}>
                    Back
                  </Button>
                  <Button onClick={handleMarkDormant} disabled={loading}>
                    {loading
                      ? "Processing..."
                      : `Mark ${dormant.length} as Dormant`}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-lg font-semibold">
              {result?.count} subscriber{result?.count !== 1 ? "s" : ""} marked as
              dormant
            </p>
            <p className="text-sm text-muted-foreground">
              They&apos;ve been added to the DORMANT V2 list and their status set to dormant.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
