"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function getSubscriberPreferences(token: string) {
  const supabase = createServiceClient();

  // Look up subscriber by unsubscribe_token
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, email, name, status, unsubscribe_token")
    .eq("unsubscribe_token", token)
    .single();

  if (!subscriber) {
    return { error: "Subscriber not found" };
  }

  // Get all available tags
  const { data: allTags } = await supabase
    .from("tags")
    .select("id, name, description")
    .order("name");

  // Get subscriber's current tag subscriptions
  const { data: subscriberTags } = await supabase
    .from("subscriber_tags")
    .select("tag_id")
    .eq("subscriber_id", subscriber.id);

  const subscribedTagIds = (subscriberTags || []).map((st) => st.tag_id);

  return {
    subscriber: {
      id: subscriber.id,
      email: subscriber.email,
      name: subscriber.name,
      status: subscriber.status,
    },
    allTags: allTags || [],
    subscribedTagIds,
  };
}

export async function updatePreferences(token: string, tagIds: string[]) {
  const supabase = createServiceClient();

  // Verify subscriber
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id")
    .eq("unsubscribe_token", token)
    .single();

  if (!subscriber) {
    return { error: "Subscriber not found" };
  }

  // Remove all existing tag associations
  await supabase
    .from("subscriber_tags")
    .delete()
    .eq("subscriber_id", subscriber.id);

  // Insert new tag associations
  if (tagIds.length > 0) {
    const tagInserts = tagIds.map((tag_id) => ({
      subscriber_id: subscriber.id,
      tag_id,
    }));
    const { error } = await supabase.from("subscriber_tags").insert(tagInserts);
    if (error) {
      return { error: error.message };
    }
  }

  return { success: true };
}

export async function unsubscribeAll(token: string) {
  const supabase = createServiceClient();

  // Verify subscriber
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id")
    .eq("unsubscribe_token", token)
    .single();

  if (!subscriber) {
    return { error: "Subscriber not found" };
  }

  // Set status to unsubscribed
  await supabase
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("id", subscriber.id);

  // Remove all tag associations
  await supabase
    .from("subscriber_tags")
    .delete()
    .eq("subscriber_id", subscriber.id);

  return { success: true };
}
