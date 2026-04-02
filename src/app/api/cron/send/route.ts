import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { rewriteLinksForTracking } from "@/lib/track-links";

const resend = new Resend(process.env.RESEND_API_KEY);

// How many emails to send per cron invocation (keeps within Vercel timeout)
const BATCH_SIZE = 50;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Promote scheduled campaigns that are due
  const now = new Date().toISOString();
  await supabase
    .from("campaigns")
    .update({ status: "sending" })
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  // Find campaigns with status "sending"
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "sending");

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({ ok: true, message: "No campaigns to send" });
  }

  const results: any[] = [];

  for (const campaign of campaigns) {
    // Get all subscribers who have the included tags
    const includeTagIds = campaign.tag_ids || [];
    const excludeTagIds = campaign.exclude_tag_ids || [];

    if (includeTagIds.length === 0) {
      await supabase.from("campaigns").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", campaign.id);
      continue;
    }

    // Fetch all tagged subscriber IDs with pagination
    const allIncluded: string[] = [];
    let offset = 0;
    while (true) {
      const { data } = await supabase
        .from("subscriber_tags")
        .select("subscriber_id")
        .in("tag_id", includeTagIds)
        .range(offset, offset + 999);
      if (!data || data.length === 0) break;
      allIncluded.push(...data.map((r: any) => r.subscriber_id));
      if (data.length < 1000) break;
      offset += 1000;
    }
    const includedIds = Array.from(new Set(allIncluded));

    let excludedIds: string[] = [];
    if (excludeTagIds.length > 0) {
      offset = 0;
      while (true) {
        const { data } = await supabase
          .from("subscriber_tags")
          .select("subscriber_id")
          .in("tag_id", excludeTagIds)
          .range(offset, offset + 999);
        if (!data || data.length === 0) break;
        excludedIds.push(...data.map((r: any) => r.subscriber_id));
        if (data.length < 1000) break;
        offset += 1000;
      }
      excludedIds = Array.from(new Set(excludedIds));
    }

    const finalIds = includedIds.filter((id) => !excludedIds.includes(id));

    // Find which subscribers already got this campaign (paginated to handle >1000)
    const alreadySentIds = new Set<string>();
    let sentOffset = 0;
    while (true) {
      const { data: sentPage } = await supabase
        .from("send_events")
        .select("subscriber_id")
        .eq("campaign_id", campaign.id)
        .range(sentOffset, sentOffset + 999);
      if (!sentPage || sentPage.length === 0) break;
      sentPage.forEach((r: any) => alreadySentIds.add(r.subscriber_id));
      if (sentPage.length < 1000) break;
      sentOffset += 1000;
    }

    // Get remaining subscribers who haven't been sent to yet, in chunks
    const remainingIds = finalIds.filter((id) => !alreadySentIds.has(id));

    if (remainingIds.length === 0) {
      // All done — mark as sent
      const { count: totalSent } = await supabase
        .from("send_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id);

      await supabase.from("campaigns").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: totalSent ?? 0,
      }).eq("id", campaign.id);

      results.push({ campaign_id: campaign.id, status: "completed", total_sent: totalSent });
      continue;
    }

    // Fetch active subscribers from remaining pool (larger batch to skip inactive)
    const lookAheadIds = remainingIds.slice(0, BATCH_SIZE * 10);
    const allRecipients: any[] = [];
    for (let i = 0; i < lookAheadIds.length; i += 500) {
      const chunk = lookAheadIds.slice(i, i + 500);
      const { data: subs } = await supabase
        .from("subscribers")
        .select("id, email, unsubscribe_token")
        .in("id", chunk)
        .eq("status", "active");
      if (subs) allRecipients.push(...subs);
      // Stop once we have enough for a batch
      if (allRecipients.length >= BATCH_SIZE) break;
    }
    // Trim to batch size
    allRecipients.splice(BATCH_SIZE);

    // Record skipped (inactive) subscribers so they don't block future batches
    const activeIds = new Set(allRecipients.map((r) => r.id));
    const skippedIds = lookAheadIds.filter((id) => !activeIds.has(id) && !alreadySentIds.has(id));
    // Only record skips for IDs we looked at but weren't active
    const inactiveSkips = skippedIds.slice(0, lookAheadIds.length);
    if (inactiveSkips.length > 0) {
      // Insert skip markers in batches to prevent re-processing
      for (let i = 0; i < inactiveSkips.length; i += 500) {
        const chunk = inactiveSkips.slice(i, i + 500);
        await supabase.from("send_events").insert(
          chunk.map((id) => ({
            campaign_id: campaign.id,
            subscriber_id: id,
            resend_email_id: null,
            sent_at: new Date().toISOString(),
          }))
        );
      }
    }

    if (allRecipients.length === 0) {
      // No active subscribers left — mark as sent
      const { count: totalSent } = await supabase
        .from("send_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id);

      await supabase.from("campaigns").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: totalSent ?? 0,
      }).eq("id", campaign.id);

      results.push({ campaign_id: campaign.id, status: "completed", total_sent: totalSent });
      continue;
    }

    // Rewrite links for click tracking
    const trackedHtml = await rewriteLinksForTracking(campaign.html_body, campaign.id, null, supabase);

    let batchSent = 0;

    for (let idx = 0; idx < allRecipients.length; idx++) {
      const recipient = allRecipients[idx];
      const html = trackedHtml
        .replace(/\{unsubscribe_token\}/g, recipient.unsubscribe_token || "")
        .replace(/\{subscriber_id\}/g, recipient.id);

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data: emailResult, error: sendError } = await resend.emails.send({
            from: `${campaign.from_name} <${campaign.from_email}>`,
            to: recipient.email,
            subject: campaign.subject,
            html,
            replyTo: campaign.reply_to || undefined,
            headers: campaign.preview_text
              ? { "X-Preview-Text": campaign.preview_text }
              : undefined,
          });

          if (sendError) {
            const msg = sendError.message || "";
            if (msg.toLowerCase().includes("rate") || msg.includes("429")) {
              await sleep(Math.pow(2, attempt) * 1000);
              continue;
            }
            console.error(`Failed to send to ${recipient.email}:`, msg);
            break;
          }

          await supabase.from("send_events").insert({
            campaign_id: campaign.id,
            subscriber_id: recipient.id,
            resend_email_id: emailResult?.id || null,
            sent_at: new Date().toISOString(),
          });

          batchSent++;
          break;
        } catch (err: any) {
          console.error(`Failed to send to ${recipient.email}:`, err.message);
          break;
        }
      }

      // 600ms delay to stay under Resend's 2/sec rate limit
      if (idx + 1 < allRecipients.length) {
        await sleep(600);
      }
    }

    const remaining = remainingIds.length - batchSent;
    results.push({
      campaign_id: campaign.id,
      batch_sent: batchSent,
      remaining,
      status: remaining <= 0 ? "completing" : "in_progress",
    });

    // If this was the last batch, mark campaign as sent
    if (remaining <= 0) {
      const { count: totalSent } = await supabase
        .from("send_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id);

      await supabase.from("campaigns").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: totalSent ?? 0,
      }).eq("id", campaign.id);
    }
  }

  return NextResponse.json({ ok: true, results });
}
