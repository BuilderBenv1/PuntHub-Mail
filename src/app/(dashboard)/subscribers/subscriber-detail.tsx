"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSubscriberDetail, updateSubscriberTags } from "./actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type Tag = { id: string; name: string };

export function SubscriberDetail({
  subscriberId,
  tags,
  onClose,
}: {
  subscriberId: string;
  tags: Tag[];
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingTags, setEditingTags] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    getSubscriberDetail(subscriberId).then((data) => {
      setDetail(data);
      setSelectedTagIds((data?.tags || []).map((t: Tag) => t.id));
      setLoading(false);
    });
  }, [subscriberId]);

  async function handleSaveTags() {
    await updateSubscriberTags(subscriberId, selectedTagIds);
    toast({ title: "Lists updated" });
    setEditingTags(false);
    router.refresh();
    // Refresh detail
    const data = await getSubscriberDetail(subscriberId);
    setDetail(data);
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] overflow-y-auto sm:max-w-lg">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Loading...</div>
        ) : !detail ? (
          <div className="p-6 text-center text-muted-foreground">
            Subscriber not found
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{detail.email}</SheetTitle>
              <SheetDescription>
                {detail.name || "No name"} &middot;{" "}
                <Badge variant={detail.status === "active" ? "default" : "secondary"}>
                  {detail.status}
                </Badge>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Subscribed</p>
                  <p>{new Date(detail.subscribed_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Opened</p>
                  <p>
                    {detail.last_opened_at
                      ? new Date(detail.last_opened_at).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Clicked</p>
                  <p>
                    {detail.last_clicked_at
                      ? new Date(detail.last_clicked_at).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Tags section */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">Lists</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (editingTags) handleSaveTags();
                      else setEditingTags(true);
                    }}
                  >
                    {editingTags ? "Save" : "Edit"}
                  </Button>
                </div>
                {editingTags ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={
                          selectedTagIds.includes(tag.id) ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {detail.tags.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No lists</span>
                    ) : (
                      detail.tags.map((tag: Tag) => (
                        <Badge key={tag.id} variant="outline">
                          {tag.name}
                        </Badge>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Campaign history */}
              <div>
                <h3 className="mb-2 font-semibold">Campaign History</h3>
                {detail.sendEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No campaigns sent to this subscriber.
                  </p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Opened</TableHead>
                          <TableHead>Clicked</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.sendEvents.map((event: any) => (
                          <TableRow key={event.id}>
                            <TableCell className="text-sm">
                              {event.campaigns?.subject || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {event.sent_at
                                ? new Date(event.sent_at).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {event.opened_at ? "Yes" : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {event.clicked_at ? "Yes" : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
