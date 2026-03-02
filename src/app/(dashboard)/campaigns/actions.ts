"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { rewriteLinksForTracking } from "@/lib/track-links";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getCampaigns() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, subject, preview_text, from_name, from_email, reply_to, tag_ids, exclude_tag_ids, status, total_recipients, sent_at, scheduled_for, created_at, campaign_stats(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((c: any) => {
    const stats = c.campaign_stats?.[0];
    const total = c.total_recipients || 0;
    return {
      ...c,
      openRate: total > 0 && stats ? ((stats.opened / total) * 100).toFixed(1) : "0.0",
      clickRate: total > 0 && stats ? ((stats.clicked / total) * 100).toFixed(1) : "0.0",
    };
  });
}

export async function getCampaign(id: string) {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("campaigns")
    .select("*, campaign_stats(*)")
    .eq("id", id)
    .single();

  return data;
}

export async function getAllTags() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("tags").select("id, name").order("name");
  return data || [];
}

export async function getRecipientCount(
  includeTagIds: string[],
  excludeTagIds: string[]
) {
  const supabase = createServiceClient();

  if (includeTagIds.length === 0) return 0;

  // Get subscribers who have any of the include tags
  const { data: included } = await supabase
    .from("subscriber_tags")
    .select("subscriber_id")
    .in("tag_id", includeTagIds);

  const includedIds = Array.from(new Set((included || []).map((r: any) => r.subscriber_id)));

  if (includedIds.length === 0) return 0;

  // Get subscribers who have any of the exclude tags
  let excludedIds: string[] = [];
  if (excludeTagIds.length > 0) {
    const { data: excluded } = await supabase
      .from("subscriber_tags")
      .select("subscriber_id")
      .in("tag_id", excludeTagIds);
    excludedIds = Array.from(new Set((excluded || []).map((r: any) => r.subscriber_id)));
  }

  // Filter: included minus excluded, only active
  const finalIds = includedIds.filter((id) => !excludedIds.includes(id));

  if (finalIds.length === 0) return 0;

  const { count } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .in("id", finalIds)
    .eq("status", "active");

  return count ?? 0;
}

export async function saveDraft(formData: FormData) {
  const supabase = createServiceClient();

  const id = formData.get("id") as string | null;
  const subject = formData.get("subject") as string;
  const preview_text = (formData.get("preview_text") as string) || null;
  const from_name = (formData.get("from_name") as string) || "PuntHub";
  const from_email = (formData.get("from_email") as string) || "news@punthub.co.uk";
  const reply_to = (formData.get("reply_to") as string) || null;
  const html_body = formData.get("html_body") as string;
  const tag_ids = JSON.parse((formData.get("tag_ids") as string) || "[]");
  const exclude_tag_ids = JSON.parse((formData.get("exclude_tag_ids") as string) || "[]");

  const campaignData = {
    subject,
    preview_text,
    from_name,
    from_email,
    reply_to,
    html_body,
    tag_ids,
    exclude_tag_ids,
    status: "draft",
  };

  if (id) {
    const { error } = await supabase
      .from("campaigns")
      .update(campaignData)
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/campaigns");
    return { success: true, id };
  } else {
    const { data, error } = await supabase
      .from("campaigns")
      .insert(campaignData)
      .select()
      .single();
    if (error) return { error: error.message };
    revalidatePath("/campaigns");
    return { success: true, id: data.id };
  }
}

export async function scheduleCampaign(campaignId: string, scheduledAt: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "scheduled", scheduled_at: scheduledAt })
    .eq("id", campaignId);

  if (error) return { error: error.message };

  revalidatePath("/campaigns");
  return { success: true };
}

export async function cancelScheduledCampaign(campaignId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "draft", scheduled_at: null })
    .eq("id", campaignId);

  if (error) return { error: error.message };

  revalidatePath("/campaigns");
  return { success: true };
}

async function getRecipients(includeTagIds: string[], excludeTagIds: string[]) {
  const supabase = createServiceClient();

  if (includeTagIds.length === 0) return [];

  const { data: included } = await supabase
    .from("subscriber_tags")
    .select("subscriber_id")
    .in("tag_id", includeTagIds);

  const includedIds = Array.from(new Set((included || []).map((r: any) => r.subscriber_id)));
  if (includedIds.length === 0) return [];

  let excludedIds: string[] = [];
  if (excludeTagIds.length > 0) {
    const { data: excluded } = await supabase
      .from("subscriber_tags")
      .select("subscriber_id")
      .in("tag_id", excludeTagIds);
    excludedIds = Array.from(new Set((excluded || []).map((r: any) => r.subscriber_id)));
  }

  const finalIds = includedIds.filter((id) => !excludedIds.includes(id));
  if (finalIds.length === 0) return [];

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, unsubscribe_token")
    .in("id", finalIds)
    .eq("status", "active");

  return subscribers || [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendCampaignNow(campaignId: string) {
  const supabase = createServiceClient();

  // Get campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) return { error: "Campaign not found" };
  if (campaign.status === "sent") return { error: "Campaign already sent" };

  // Get recipients
  const recipients = await getRecipients(
    campaign.tag_ids || [],
    campaign.exclude_tag_ids || []
  );

  if (recipients.length === 0) return { error: "No recipients found" };

  // Create campaign_stats row
  await supabase
    .from("campaign_stats")
    .upsert({ campaign_id: campaignId, opened: 0, clicked: 0, bounced: 0, complained: 0, unsubscribed: 0 }, { onConflict: "campaign_id" });

  // Rewrite links for click tracking
  const trackedHtml = await rewriteLinksForTracking(campaign.html_body, campaignId, null, supabase);

  // Send in batches of 100 with 500ms delay
  let totalSent = 0;

  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100);

    for (const recipient of batch) {
      // Replace unsubscribe token and subscriber_id placeholders in HTML
      const html = trackedHtml
        .replace(/\{unsubscribe_token\}/g, recipient.unsubscribe_token)
        .replace(/\{subscriber_id\}/g, recipient.id);

      try {
        const { data: emailResult } = await resend.emails.send({
          from: `${campaign.from_name} <${campaign.from_email}>`,
          to: recipient.email,
          subject: campaign.subject,
          html,
          replyTo: campaign.reply_to || undefined,
          headers: campaign.preview_text
            ? { "X-Preview-Text": campaign.preview_text }
            : undefined,
        });

        // Create send_event
        await supabase.from("send_events").insert({
          campaign_id: campaignId,
          subscriber_id: recipient.id,
          resend_email_id: emailResult?.id || null,
          sent_at: new Date().toISOString(),
        });

        totalSent++;
      } catch (err: any) {
        console.error(`Failed to send to ${recipient.email}:`, err.message);
      }
    }

    // 500ms delay between batches
    if (i + 100 < recipients.length) {
      await sleep(500);
    }
  }

  // Update campaign status
  await supabase
    .from("campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      total_recipients: totalSent,
    })
    .eq("id", campaignId);

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true, sent: totalSent };
}

export async function getCampaignStats(campaignId: string) {
  const supabase = createServiceClient();

  const [{ data: campaign }, { data: stats }, { data: sendEvents }] =
    await Promise.all([
      supabase.from("campaigns").select("*").eq("id", campaignId).single(),
      supabase
        .from("campaign_stats")
        .select("*")
        .eq("campaign_id", campaignId)
        .single(),
      supabase
        .from("send_events")
        .select("*, subscribers(email)")
        .eq("campaign_id", campaignId)
        .order("sent_at", { ascending: false }),
    ]);

  return { campaign, stats, sendEvents: sendEvents || [] };
}

export async function deleteCampaign(id: string) {
  const supabase = createServiceClient();

  await supabase.from("send_events").delete().eq("campaign_id", id);
  await supabase.from("campaign_stats").delete().eq("campaign_id", id);
  const { error } = await supabase.from("campaigns").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/campaigns");
  return { success: true };
}

export async function sendTestEmail(params: {
  to: string;
  subject: string;
  html: string;
  from_name: string;
  from_email: string;
}) {
  try {
    const { error } = await resend.emails.send({
      from: `${params.from_name} <${params.from_email}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function duplicateCampaign(id: string) {
  const supabase = createServiceClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) return { error: "Campaign not found" };

  const { data: newCampaign, error } = await supabase
    .from("campaigns")
    .insert({
      subject: `${campaign.subject} (Copy)`,
      preview_text: campaign.preview_text,
      html_body: campaign.html_body,
      from_name: campaign.from_name,
      from_email: campaign.from_email,
      reply_to: campaign.reply_to,
      tag_ids: campaign.tag_ids,
      exclude_tag_ids: campaign.exclude_tag_ids,
      status: "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/campaigns");
  return { success: true, id: newCampaign.id };
}

export async function resendToNonOpeners(campaignId: string, newSubject: string) {
  const supabase = createServiceClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) return { error: "Campaign not found" };

  // Find send events where opened_at is null
  const { data: nonOpenerEvents } = await supabase
    .from("send_events")
    .select("subscriber_id, subscribers(id, email, status, unsubscribe_token)")
    .eq("campaign_id", campaignId)
    .is("opened_at", null);

  const activeNonOpeners = (nonOpenerEvents || [])
    .filter((e: any) => e.subscribers?.status === "active")
    .map((e: any) => e.subscribers);

  if (activeNonOpeners.length === 0) return { error: "No non-openers found" };

  // Create a new campaign for the resend
  const { data: newCampaign, error: createErr } = await supabase
    .from("campaigns")
    .insert({
      subject: newSubject,
      preview_text: campaign.preview_text,
      html_body: campaign.html_body,
      from_name: campaign.from_name,
      from_email: campaign.from_email,
      reply_to: campaign.reply_to,
      tag_ids: campaign.tag_ids,
      exclude_tag_ids: campaign.exclude_tag_ids,
      status: "sent",
      sent_at: new Date().toISOString(),
      total_recipients: 0,
    })
    .select()
    .single();

  if (createErr || !newCampaign) return { error: createErr?.message || "Failed to create resend campaign" };

  await supabase.from("campaign_stats").insert({
    campaign_id: newCampaign.id,
    opened: 0, clicked: 0, bounced: 0, complained: 0, unsubscribed: 0,
  });

  // Rewrite links for click tracking on the new resend campaign
  const trackedHtml = await rewriteLinksForTracking(campaign.html_body, newCampaign.id, null, supabase);

  let totalSent = 0;

  for (let i = 0; i < activeNonOpeners.length; i += 100) {
    const batch = activeNonOpeners.slice(i, i + 100);
    for (const recipient of batch) {
      const html = trackedHtml
        .replace(/\{unsubscribe_token\}/g, recipient.unsubscribe_token)
        .replace(/\{subscriber_id\}/g, recipient.id);
      try {
        const { data: emailResult } = await resend.emails.send({
          from: `${campaign.from_name} <${campaign.from_email}>`,
          to: recipient.email,
          subject: newSubject,
          html,
          replyTo: campaign.reply_to || undefined,
        });
        await supabase.from("send_events").insert({
          campaign_id: newCampaign.id,
          subscriber_id: recipient.id,
          resend_email_id: emailResult?.id || null,
          sent_at: new Date().toISOString(),
        });
        totalSent++;
      } catch (err: any) {
        console.error(`Failed to resend to ${recipient.email}:`, err.message);
      }
    }
    if (i + 100 < activeNonOpeners.length) await sleep(500);
  }

  await supabase.from("campaigns").update({ total_recipients: totalSent }).eq("id", newCampaign.id);

  revalidatePath("/campaigns");
  return { success: true, sent: totalSent, newCampaignId: newCampaign.id };
}

export async function getNonOpenerCount(campaignId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("send_events")
    .select("subscriber_id, subscribers!inner(status)")
    .eq("campaign_id", campaignId)
    .is("opened_at", null)
    .eq("subscribers.status", "active");
  return data?.length ?? 0;
}
