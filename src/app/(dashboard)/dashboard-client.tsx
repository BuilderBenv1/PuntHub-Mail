"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  campaignsSent: number;
  totalEmailsSent: number;
}

interface SubscriberGrowth {
  month: string;
  count: number;
}

interface CampaignPerformance {
  id: string;
  subject: string;
  sentAt: string;
  totalRecipients: number;
  opened: number;
  clicked: number;
  openRate: string;
  clickRate: string;
}

interface ActivityItem {
  id: string;
  email: string;
  subject: string;
  sentAt: string;
  status: string;
}

interface DashboardClientProps {
  stats: DashboardStats;
  subscriberGrowth: SubscriberGrowth[];
  campaignPerformance: CampaignPerformance[];
  recentActivity: ActivityItem[];
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "clicked":
      return "default";
    case "opened":
      return "secondary";
    case "bounced":
      return "destructive";
    default:
      return "outline";
  }
}

export default function DashboardClient({
  stats,
  subscriberGrowth,
  campaignPerformance,
  recentActivity,
}: DashboardClientProps) {
  const statCards = [
    {
      title: "Total Subscribers",
      value: formatNumber(stats.totalSubscribers),
      description: "All time subscribers",
    },
    {
      title: "Active Subscribers",
      value: formatNumber(stats.activeSubscribers),
      description: "Currently active",
    },
    {
      title: "Campaigns Sent",
      value: formatNumber(stats.campaignsSent),
      description: "Successfully delivered",
    },
    {
      title: "Emails Sent",
      value: formatNumber(stats.totalEmailsSent),
      description: "Total emails delivered",
    },
  ];

  const maxGrowth = Math.max(...subscriberGrowth.map((g) => g.count), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.description}</CardDescription>
              <CardTitle className="text-xl sm:text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscriber Growth + Recent Activity side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subscriber Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Growth</CardTitle>
            <CardDescription>New subscribers per month (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriberGrowth.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscriber data yet.</p>
            ) : (
              <div className="flex items-end gap-3 h-48">
                {subscriberGrowth.map((item) => {
                  const heightPercent = maxGrowth > 0 ? (item.count / maxGrowth) * 100 : 0;
                  return (
                    <div
                      key={item.month}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.count}
                      </span>
                      <div className="w-full flex items-end" style={{ height: "160px" }}>
                        <div
                          className="w-full rounded-t bg-primary transition-all"
                          style={{
                            height: `${Math.max(heightPercent, 2)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest email send events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.email}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.sentAt)}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Last 10 sent campaigns with engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {campaignPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden sm:table-cell">Sent</TableHead>
                  <TableHead className="text-right">Recipients</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Opens</TableHead>
                  <TableHead className="text-right">Open %</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Clicks</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Click %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignPerformance.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium max-w-[150px] sm:max-w-[250px] truncate text-sm">
                      {campaign.subject}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell whitespace-nowrap">
                      {formatDate(campaign.sentAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.totalRecipients)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                      {formatNumber(campaign.opened)}
                    </TableCell>
                    <TableCell className="text-right">{campaign.openRate}%</TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {formatNumber(campaign.clicked)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">{campaign.clickRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
