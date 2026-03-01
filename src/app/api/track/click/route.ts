import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lid = searchParams.get("lid");
  const sid = searchParams.get("sid");

  // Redirect to homepage if params are missing
  if (!lid || !sid) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createServiceClient();

  // Get the tracked link to find the original URL
  const { data: trackedLink } = await supabase
    .from("tracked_links")
    .select("id, original_url, campaign_id, automation_step_id, click_count")
    .eq("id", lid)
    .single();

  if (!trackedLink) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Perform all tracking updates in parallel
  const now = new Date().toISOString();

  try {
    await Promise.all([
      // 1. Insert link_clicks row
      supabase.from("link_clicks").insert({
        tracked_link_id: lid,
        subscriber_id: sid,
        clicked_at: now,
      }),

      // 2. Increment click_count on tracked_links
      supabase
        .from("tracked_links")
        .update({ click_count: (trackedLink.click_count || 0) + 1 })
        .eq("id", lid),

      // 3. Update subscriber last_clicked_at
      supabase
        .from("subscribers")
        .update({ last_clicked_at: now })
        .eq("id", sid),
    ]);

    // 4. Update send_events clicked_at if campaign-based link
    if (trackedLink.campaign_id) {
      await supabase
        .from("send_events")
        .update({ clicked_at: now })
        .eq("campaign_id", trackedLink.campaign_id)
        .eq("subscriber_id", sid)
        .is("clicked_at", null);

      // 5. Increment campaign_stats clicked count
      const { data: stats } = await supabase
        .from("campaign_stats")
        .select("clicked")
        .eq("campaign_id", trackedLink.campaign_id)
        .single();

      if (stats) {
        await supabase
          .from("campaign_stats")
          .update({ clicked: stats.clicked + 1, updated_at: now })
          .eq("campaign_id", trackedLink.campaign_id);
      }
    }
  } catch (err) {
    console.error("Error tracking click:", err);
  }

  // Redirect to original URL
  return NextResponse.redirect(trackedLink.original_url);
}
