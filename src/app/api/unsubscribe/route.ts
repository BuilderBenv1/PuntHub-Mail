import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// RFC 8058 one-click unsubscribe. Gmail/Yahoo POST `List-Unsubscribe=One-Click`
// to this endpoint when a recipient clicks the native Unsubscribe button. Must
// return 2xx promptly with no required interaction.
async function handle(token: string | null) {
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("unsubscribe_token", token)
    .single();

  if (!subscriber) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (subscriber.status !== "unsubscribed") {
    await supabase
      .from("subscribers")
      .update({ status: "unsubscribed" })
      .eq("id", subscriber.id);
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  return handle(token);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe", request.nextUrl));
  }
  return NextResponse.redirect(
    new URL(`/unsubscribe?token=${encodeURIComponent(token)}`, request.nextUrl)
  );
}
