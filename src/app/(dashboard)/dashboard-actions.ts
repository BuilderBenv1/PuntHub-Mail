"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = createServiceClient();

  const [
    { count: totalSubscribers },
    { count: activeSubscribers },
    { count: campaignsSent },
    { data: sentCampaigns },
  ] = await Promise.all([
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase
      .from("campaigns")
      .select("total_recipients")
      .eq("status", "sent"),
  ]);

  const totalEmailsSent = (sentCampaigns || []).reduce(
    (sum: number, c: any) => sum + (c.total_recipients || 0),
    0
  );

  return {
    totalSubscribers: totalSubscribers ?? 0,
    activeSubscribers: activeSubscribers ?? 0,
    campaignsSent: campaignsSent ?? 0,
    totalEmailsSent,
  };
}

export async function getSubscriberGrowth() {
  const supabase = createServiceClient();

  // Fetch all subscribers with their created_at date
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("created_at")
    .order("created_at", { ascending: true });

  if (!subscribers || subscribers.length === 0) return [];

  // Group by month for the last 6 months
  const now = new Date();
  const months: { month: string; count: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    const label = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const count = subscribers.filter((s: any) => {
      const d = new Date(s.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;

    months.push({ month: label, count });
  }

  return months;
}

export async function getRecentCampaignPerformance() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("campaigns")
    .select("id, subject, sent_at, total_recipients, campaign_stats(*)")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(10);

  return (data || []).map((c: any) => {
    const stats = c.campaign_stats?.[0];
    const total = c.total_recipients || 0;
    return {
      id: c.id,
      subject: c.subject,
      sentAt: c.sent_at,
      totalRecipients: total,
      opened: stats?.opened ?? 0,
      clicked: stats?.clicked ?? 0,
      openRate: total > 0 && stats ? ((stats.opened / total) * 100).toFixed(1) : "0.0",
      clickRate: total > 0 && stats ? ((stats.clicked / total) * 100).toFixed(1) : "0.0",
    };
  });
}

export async function getRecentActivity() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("send_events")
    .select("id, sent_at, opened_at, clicked_at, bounced_at, subscribers(email), campaigns(subject)")
    .order("sent_at", { ascending: false })
    .limit(10);

  return (data || []).map((e: any) => {
    let status = "sent";
    if (e.bounced_at) status = "bounced";
    else if (e.clicked_at) status = "clicked";
    else if (e.opened_at) status = "opened";

    return {
      id: e.id,
      email: e.subscribers?.email ?? "Unknown",
      subject: e.campaigns?.subject ?? "Unknown",
      sentAt: e.sent_at,
      status,
    };
  });
}
