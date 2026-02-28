"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTags() {
  const supabase = createServiceClient();

  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  if (error) throw error;

  // Get active subscriber count for each tag
  const tagsWithCounts = await Promise.all(
    (tags || []).map(async (tag) => {
      const { count } = await supabase
        .from("subscriber_tags")
        .select("subscribers!inner(id)", { count: "exact", head: true })
        .eq("tag_id", tag.id)
        .eq("subscribers.status", "active");

      return { ...tag, activeSubscriberCount: count ?? 0 };
    })
  );

  return tagsWithCounts;
}

export async function createTag(formData: FormData) {
  const supabase = createServiceClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase.from("tags").insert({ name, description });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tags");
  return { success: true };
}

export async function updateTag(id: string, formData: FormData) {
  const supabase = createServiceClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase
    .from("tags")
    .update({ name, description })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tags");
  return { success: true };
}

export async function deleteTag(id: string) {
  const supabase = createServiceClient();

  // Delete subscriber_tags associations first
  await supabase.from("subscriber_tags").delete().eq("tag_id", id);

  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tags");
  return { success: true };
}
