import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return !secret; // Skip verification if no secret configured
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("svix-signature");

  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  if (secret && !verifyWebhookSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const supabase = createServiceClient();

  const eventType = event.type;
  const data = event.data;

  // The Resend email ID is in data.email_id
  const resendEmailId = data?.email_id;

  if (!resendEmailId) {
    return NextResponse.json({ ok: true });
  }

  // Find the send_event by resend_email_id
  const { data: sendEvent } = await supabase
    .from("send_events")
    .select("id, campaign_id, subscriber_id")
    .eq("resend_email_id", resendEmailId)
    .single();

  if (!sendEvent) {
    return NextResponse.json({ ok: true, message: "No matching send event" });
  }

  const now = new Date().toISOString();

  switch (eventType) {
    case "email.opened": {
      // Update send_event
      await supabase
        .from("send_events")
        .update({ opened_at: now })
        .eq("id", sendEvent.id)
        .is("opened_at", null); // Only update if not already set

      // Increment campaign_stats
      await supabase.rpc("increment_campaign_stat", {
        p_campaign_id: sendEvent.campaign_id,
        p_field: "opened",
      }).then(async ({ error }) => {
        // Fallback if RPC doesn't exist
        if (error) {
          const { data: stats } = await supabase
            .from("campaign_stats")
            .select("opened")
            .eq("campaign_id", sendEvent.campaign_id)
            .single();
          if (stats) {
            await supabase
              .from("campaign_stats")
              .update({ opened: stats.opened + 1, updated_at: now })
              .eq("campaign_id", sendEvent.campaign_id);
          }
        }
      });

      // Update subscriber last_opened_at
      await supabase
        .from("subscribers")
        .update({ last_opened_at: now })
        .eq("id", sendEvent.subscriber_id);
      break;
    }

    case "email.clicked": {
      await supabase
        .from("send_events")
        .update({ clicked_at: now })
        .eq("id", sendEvent.id)
        .is("clicked_at", null);

      const { data: stats } = await supabase
        .from("campaign_stats")
        .select("clicked")
        .eq("campaign_id", sendEvent.campaign_id)
        .single();
      if (stats) {
        await supabase
          .from("campaign_stats")
          .update({ clicked: stats.clicked + 1, updated_at: now })
          .eq("campaign_id", sendEvent.campaign_id);
      }

      await supabase
        .from("subscribers")
        .update({ last_clicked_at: now })
        .eq("id", sendEvent.subscriber_id);
      break;
    }

    case "email.bounced": {
      await supabase
        .from("send_events")
        .update({ bounced_at: now })
        .eq("id", sendEvent.id);

      const { data: stats } = await supabase
        .from("campaign_stats")
        .select("bounced")
        .eq("campaign_id", sendEvent.campaign_id)
        .single();
      if (stats) {
        await supabase
          .from("campaign_stats")
          .update({ bounced: stats.bounced + 1, updated_at: now })
          .eq("campaign_id", sendEvent.campaign_id);
      }

      // Set subscriber status to bounced
      await supabase
        .from("subscribers")
        .update({ status: "bounced" })
        .eq("id", sendEvent.subscriber_id);
      break;
    }

    case "email.complained": {
      await supabase
        .from("send_events")
        .update({ complained_at: now })
        .eq("id", sendEvent.id);

      const { data: stats } = await supabase
        .from("campaign_stats")
        .select("complained")
        .eq("campaign_id", sendEvent.campaign_id)
        .single();
      if (stats) {
        await supabase
          .from("campaign_stats")
          .update({ complained: stats.complained + 1, updated_at: now })
          .eq("campaign_id", sendEvent.campaign_id);
      }

      await supabase
        .from("subscribers")
        .update({ status: "complained" })
        .eq("id", sendEvent.subscriber_id);
      break;
    }

    case "email.unsubscribed": {
      const { data: stats } = await supabase
        .from("campaign_stats")
        .select("unsubscribed")
        .eq("campaign_id", sendEvent.campaign_id)
        .single();
      if (stats) {
        await supabase
          .from("campaign_stats")
          .update({ unsubscribed: stats.unsubscribed + 1, updated_at: now })
          .eq("campaign_id", sendEvent.campaign_id);
      }

      await supabase
        .from("subscribers")
        .update({ status: "unsubscribed" })
        .eq("id", sendEvent.subscriber_id);
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
