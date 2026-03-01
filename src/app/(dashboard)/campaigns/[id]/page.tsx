export const dynamic = "force-dynamic";

import { getCampaignStats } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CampaignStatsPage({
  params,
}: {
  params: { id: string };
}) {
  const { campaign, stats, sendEvents } = await getCampaignStats(params.id);

  if (!campaign) {
    return <div className="p-8 text-center text-muted-foreground">Campaign not found.</div>;
  }

  const total = campaign.total_recipients || 0;
  const openRate = total > 0 && stats ? ((stats.opened / total) * 100).toFixed(1) : "0.0";
  const clickRate = total > 0 && stats ? ((stats.clicked / total) * 100).toFixed(1) : "0.0";

  const headerStats = [
    { label: "Total Sent", value: total },
    { label: "Open Rate", value: `${openRate}%` },
    { label: "Click Rate", value: `${clickRate}%` },
    { label: "Bounces", value: stats?.bounced ?? 0 },
    { label: "Complaints", value: stats?.complained ?? 0 },
  ];

  return (
    <div>
      <div className="mb-4 sm:mb-6 flex items-start sm:items-center gap-3">
        <Link href="/campaigns">
          <Button variant="outline" size="sm">
            &larr; Back
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold truncate">{campaign.subject}</h1>
          <p className="text-sm text-muted-foreground">
            Sent {campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : "—"}{" "}
            &middot;{" "}
            <Badge variant="default">{campaign.status}</Badge>
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mb-6 sm:mb-8 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        {headerStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Send events table */}
      <h2 className="mb-4 text-xl font-semibold">Individual Send Events</h2>
      {sendEvents.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No send events recorded.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead className="hidden md:table-cell">Clicked</TableHead>
                <TableHead className="hidden lg:table-cell">Bounced</TableHead>
                <TableHead className="hidden lg:table-cell">Complained</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sendEvents.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium text-sm max-w-[150px] truncate">
                    {event.subscribers?.email || "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {event.sent_at
                      ? new Date(event.sent_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {event.opened_at
                      ? new Date(event.opened_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm whitespace-nowrap">
                    {event.clicked_at
                      ? new Date(event.clicked_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm whitespace-nowrap">
                    {event.bounced_at
                      ? new Date(event.bounced_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm whitespace-nowrap">
                    {event.complained_at
                      ? new Date(event.complained_at).toLocaleString()
                      : "—"}
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
