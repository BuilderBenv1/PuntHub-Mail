"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SubscriberWithTags = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  unsubscribe_token: string;
  subscribed_at: string;
  last_opened_at: string | null;
  last_clicked_at: string | null;
  created_at: string;
  tags: { id: string; name: string }[];
};

export async function getSubscribers(params: {
  search?: string;
  tag?: string;
  status?: string;
}) {
  const supabase = createServiceClient();

  let query = supabase
    .from("subscribers")
    .select("*, subscriber_tags(tag_id, tags(id, name))")
    .order("created_at", { ascending: false });

  if (params.search) {
    query = query.or(
      `email.ilike.%${params.search}%,name.ilike.%${params.search}%`
    );
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Flatten tags
  let subscribers: SubscriberWithTags[] = (data || []).map((sub: any) => ({
    id: sub.id,
    email: sub.email,
    name: sub.name,
    status: sub.status,
    unsubscribe_token: sub.unsubscribe_token,
    subscribed_at: sub.subscribed_at,
    last_opened_at: sub.last_opened_at,
    last_clicked_at: sub.last_clicked_at,
    created_at: sub.created_at,
    tags: (sub.subscriber_tags || [])
      .map((st: any) => st.tags)
      .filter(Boolean),
  }));

  // Filter by tag if specified
  if (params.tag) {
    subscribers = subscribers.filter((sub) =>
      sub.tags.some((t) => t.id === params.tag)
    );
  }

  return subscribers;
}

export async function getSubscriberDetail(id: string) {
  const supabase = createServiceClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("*, subscriber_tags(tag_id, tags(id, name))")
    .eq("id", id)
    .single();

  if (!subscriber) return null;

  // Get send events with campaign info
  const { data: sendEvents } = await supabase
    .from("send_events")
    .select("*, campaigns(subject, sent_at)")
    .eq("subscriber_id", id)
    .order("sent_at", { ascending: false });

  return {
    ...subscriber,
    tags: (subscriber.subscriber_tags || [])
      .map((st: any) => st.tags)
      .filter(Boolean),
    sendEvents: sendEvents || [],
  };
}

export async function addSubscriber(formData: FormData) {
  const supabase = createServiceClient();

  const email = (formData.get("email") as string).toLowerCase().trim();
  const name = (formData.get("name") as string) || null;
  const tagIds = formData.getAll("tags") as string[];

  const { data: subscriber, error } = await supabase
    .from("subscribers")
    .insert({ email, name })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A subscriber with this email already exists." };
    }
    return { error: error.message };
  }

  // Assign tags
  if (tagIds.length > 0) {
    const tagInserts = tagIds.map((tag_id) => ({
      subscriber_id: subscriber.id,
      tag_id,
    }));
    await supabase.from("subscriber_tags").insert(tagInserts);
  }

  revalidatePath("/subscribers");
  return { success: true };
}

export async function updateSubscriberTags(
  subscriberId: string,
  tagIds: string[]
) {
  const supabase = createServiceClient();

  // Remove existing tags
  await supabase
    .from("subscriber_tags")
    .delete()
    .eq("subscriber_id", subscriberId);

  // Add new tags
  if (tagIds.length > 0) {
    const tagInserts = tagIds.map((tag_id) => ({
      subscriber_id: subscriberId,
      tag_id,
    }));
    await supabase.from("subscriber_tags").insert(tagInserts);
  }

  revalidatePath("/subscribers");
  return { success: true };
}

export async function bulkImportCSV(
  rows: { email: string; name?: string }[],
  tagIds: string[]
) {
  const supabase = createServiceClient();

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = row.email.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      skipped++;
      continue;
    }

    // Upsert subscriber
    const { data: subscriber, error } = await supabase
      .from("subscribers")
      .upsert({ email, name: row.name || null }, { onConflict: "email" })
      .select()
      .single();

    if (error || !subscriber) {
      skipped++;
      continue;
    }

    // Assign tags (ignore duplicates)
    if (tagIds.length > 0) {
      for (const tag_id of tagIds) {
        await supabase
          .from("subscriber_tags")
          .upsert(
            { subscriber_id: subscriber.id, tag_id },
            { onConflict: "subscriber_id,tag_id" }
          );
      }
    }

    imported++;
  }

  revalidatePath("/subscribers");
  return { imported, skipped };
}

export async function exportSubscribers(params: {
  tag?: string;
  status?: string;
}) {
  const subscribers = await getSubscribers(params);

  const header = "email,name,status,tags,subscribed_at,last_opened_at";
  const csvRows = subscribers.map((sub) => {
    const tags = sub.tags.map((t) => t.name).join("; ");
    return [
      sub.email,
      sub.name || "",
      sub.status,
      `"${tags}"`,
      sub.subscribed_at,
      sub.last_opened_at || "",
    ].join(",");
  });

  return [header, ...csvRows].join("\n");
}

export async function findDormantSubscribers() {
  const supabase = createServiceClient();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .from("subscribers")
    .select("*, subscriber_tags(tag_id, tags(id, name))")
    .eq("status", "active")
    .or(
      `last_opened_at.is.null,last_opened_at.lt.${ninetyDaysAgo.toISOString()}`
    )
    .order("email");

  if (error) throw error;

  return (data || []).map((sub: any) => ({
    ...sub,
    tags: (sub.subscriber_tags || [])
      .map((st: any) => st.tags)
      .filter(Boolean),
  }));
}

export async function markDormant(subscriberIds: string[]) {
  const supabase = createServiceClient();

  // Find or create DORMANT V2 tag
  let { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("name", "DORMANT V2")
    .single();

  if (!tag) {
    const { data: newTag } = await supabase
      .from("tags")
      .insert({ name: "DORMANT V2", description: "Auto-tagged dormant subscribers" })
      .select()
      .single();
    tag = newTag;
  }

  if (!tag) return { error: "Failed to create DORMANT V2 tag" };

  // Update status and assign tag
  for (const id of subscriberIds) {
    await supabase
      .from("subscribers")
      .update({ status: "dormant" })
      .eq("id", id);

    await supabase
      .from("subscriber_tags")
      .upsert(
        { subscriber_id: id, tag_id: tag.id },
        { onConflict: "subscriber_id,tag_id" }
      );
  }

  revalidatePath("/subscribers");
  revalidatePath("/tags");
  return { success: true, count: subscriberIds.length };
}

export async function getAllTags() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("tags").select("id, name").order("name");
  return data || [];
}
