import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all active subscribers in batches
  const BATCH_SIZE = 500;
  let offset = 0;
  let totalUpdated = 0;

  while (true) {
    const { data: subscribers, error } = await supabase
      .from("subscribers")
      .select("id")
      .eq("status", "active")
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) break;

    const subscriberIds = subscribers.map((s: any) => s.id);

    // Get send_events for these subscribers to determine open/click activity
    const { data: sendEvents } = await supabase
      .from("send_events")
      .select("subscriber_id, opened_at, clicked_at")
      .in("subscriber_id", subscriberIds);

    // Build activity map per subscriber
    const activityMap: Record<string, { opens: string[]; clicks: string[] }> = {};
    for (const id of subscriberIds) {
      activityMap[id] = { opens: [], clicks: [] };
    }

    for (const event of sendEvents || []) {
      if (event.opened_at) {
        activityMap[event.subscriber_id]?.opens.push(event.opened_at);
      }
      if (event.clicked_at) {
        activityMap[event.subscriber_id]?.clicks.push(event.clicked_at);
      }
    }

    // Calculate and update scores
    for (const sub of subscribers) {
      const activity = activityMap[sub.id];
      let score = 10; // Base: 10 points for being active

      const hasOpenLast30 = activity.opens.some((d) => d >= thirtyDaysAgo);
      const hasOpenLast90 = activity.opens.some((d) => d >= ninetyDaysAgo);
      const hasClickLast30 = activity.clicks.some((d) => d >= thirtyDaysAgo);
      const hasClickLast90 = activity.clicks.some((d) => d >= ninetyDaysAgo);

      // Opens
      if (hasOpenLast30) {
        score += 30;
      } else if (hasOpenLast90) {
        score += 20;
      }

      // Clicks
      if (hasClickLast30) {
        score += 25;
      } else if (hasClickLast90) {
        score += 15;
      }

      // Decay: no activity in 180+ days
      const allDates = [...activity.opens, ...activity.clicks];
      const latestActivity = allDates.length > 0
        ? allDates.sort().reverse()[0]
        : null;

      if (!latestActivity || latestActivity < oneEightyDaysAgo) {
        score -= 10;
      }

      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score));

      await supabase
        .from("subscribers")
        .update({ engagement_score: score })
        .eq("id", sub.id);

      totalUpdated++;
    }

    if (subscribers.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return NextResponse.json({
    ok: true,
    updated: totalUpdated,
    timestamp: now.toISOString(),
  });
}
