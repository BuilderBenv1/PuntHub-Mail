export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = createServiceClient();

  const [
    { count: subscriberCount },
    { count: activeCount },
    { count: campaignCount },
    { count: sentCampaigns },
  ] = await Promise.all([
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent"),
  ]);

  const stats = [
    {
      title: "Total Subscribers",
      value: subscriberCount ?? 0,
      description: "All subscribers",
    },
    {
      title: "Active Subscribers",
      value: activeCount ?? 0,
      description: "Currently active",
    },
    {
      title: "Total Campaigns",
      value: campaignCount ?? 0,
      description: "All campaigns",
    },
    {
      title: "Sent Campaigns",
      value: sentCampaigns ?? 0,
      description: "Successfully sent",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.description}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
