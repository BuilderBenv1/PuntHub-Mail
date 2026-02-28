import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/v1/subscribers - upsert subscriber
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) return auth.error!;

  const body = await request.json();
  const { email, name, tags } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: subscriber, error } = await supabase
    .from("subscribers")
    .upsert(
      { email: email.toLowerCase().trim(), name: name || null },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Assign tags if provided
  if (tags && Array.isArray(tags) && tags.length > 0) {
    // Look up tag IDs by name
    const { data: tagRecords } = await supabase
      .from("tags")
      .select("id, name")
      .in("name", tags);

    if (tagRecords && tagRecords.length > 0) {
      for (const tag of tagRecords) {
        await supabase
          .from("subscriber_tags")
          .upsert(
            { subscriber_id: subscriber.id, tag_id: tag.id },
            { onConflict: "subscriber_id,tag_id" }
          );
      }
    }
  }

  return NextResponse.json({ success: true, subscriber });
}

// GET /api/v1/subscribers - list subscribers with optional filters
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) return auth.error!;

  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const status = searchParams.get("status");

  const supabase = createServiceClient();

  let query = supabase
    .from("subscribers")
    .select("id, email, name, status, subscribed_at, last_opened_at, subscriber_tags(tags(name))")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let subscribers = (data || []).map((sub: any) => ({
    id: sub.id,
    email: sub.email,
    name: sub.name,
    status: sub.status,
    subscribed_at: sub.subscribed_at,
    last_opened_at: sub.last_opened_at,
    tags: (sub.subscriber_tags || [])
      .map((st: any) => st.tags?.name)
      .filter(Boolean),
  }));

  // Filter by tag name if provided
  if (tag) {
    subscribers = subscribers.filter((sub: any) => sub.tags.includes(tag));
  }

  return NextResponse.json({ subscribers, count: subscribers.length });
}
