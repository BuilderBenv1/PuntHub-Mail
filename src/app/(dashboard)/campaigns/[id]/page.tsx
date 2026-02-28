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
      <div className="mb-6 flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="outline" size="sm">
            &larr; Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{campaign.subject}</h1>
          <p className="text-sm text-muted-foreground">
            Sent {campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : "—"}{" "}
            &middot;{" "}
            <Badge variant="default">{campaign.status}</Badge>
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-5">
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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Clicked</TableHead>
                <TableHead>Bounced</TableHead>
                <TableHead>Complained</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sendEvents.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {event.subscribers?.email || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.sent_at
                      ? new Date(event.sent_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {event.opened_at
                      ? new Date(event.opened_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {event.clicked_at
                      ? new Date(event.clicked_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {event.bounced_at
                      ? new Date(event.bounced_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
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
