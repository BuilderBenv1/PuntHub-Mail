import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Test 1: Simple query (same as before)
    const { data: simple, error: e1 } = await supabase
      .from("campaigns")
      .select("id, subject, status, sent_at, total_recipients")
      .order("created_at", { ascending: false })
      .limit(10);

    // Test 2: Exact getCampaigns query
    const { data: full, error: e2 } = await supabase
      .from("campaigns")
      .select("*, campaign_stats(*)")
      .order("created_at", { ascending: false });

    // Test 3: Exact getRecentCampaignPerformance query
    const { data: perf, error: e3 } = await supabase
      .from("campaigns")
      .select("id, subject, sent_at, total_recipients, campaign_stats(*)")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      env_check: {
        has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        has_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      simple: { error: e1?.message, count: simple?.length, data: simple },
      full: { error: e2?.message, count: full?.length, ids: full?.map((c: any) => c.id) },
      perf: { error: e3?.message, count: perf?.length, data: perf },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
