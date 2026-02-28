"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findDormantSubscribers, markDormant } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function DormantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<"search" | "preview" | "done">("search");
  const [dormant, setDormant] = useState<DormantSub[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleFind() {
    setLoading(true);
    const subs = await findDormantSubscribers();
    setDormant(subs);
    setStep("preview");
    setLoading(false);
  }

  async function handleMarkDormant() {
    setLoading(true);
    const ids = dormant.map((s) => s.id);
    const res = await markDormant(ids);
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
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dormant Subscriber Tool</DialogTitle>
          <DialogDescription>
            Find active subscribers with no opens in 90 days. Add them to DORMANT V2 list
            and set their status to dormant.
          </DialogDescription>
        </DialogHeader>

        {step === "search" && (
          <div className="py-4 text-center">
            <Button onClick={handleFind} disabled={loading}>
              {loading ? "Searching..." : "Find Dormant Subscribers"}
            </Button>
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

                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
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
