import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("campaigns")
      .select("id, subject, status, sent_at, total_recipients")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      env_check: {
        has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        has_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        url_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
      },
      error: error?.message || null,
      count: data?.length || 0,
      campaigns: data,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
