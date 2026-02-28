import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

// DELETE /api/v1/subscribers/:email - unsubscribe by email
export async function DELETE(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) return auth.error!;

  const email = decodeURIComponent(params.email).toLowerCase().trim();
  const supabase = createServiceClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("email", email)
    .single();

  if (!subscriber) {
    return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("id", subscriber.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, email });
}
