"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SegmentRule = {
  field:
    | "status"
    | "engagement_score"
    | "tag"
    | "last_opened_at"
    | "created_at"
    | "opened_campaign"
    | "clicked_campaign";
  operator: string;
  value: string;
};

async function fetchAllRows<T>(
  builder: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
  pageSize = 1000
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  while (true) {
    const { data } = await builder(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

async function evaluateRules(rules: SegmentRule[]) {
  const supabase = createServiceClient();

  const tagRules = rules.filter((r) => r.field === "tag");
  const openedRules = rules.filter((r) => r.field === "opened_campaign");
  const clickedRules = rules.filter((r) => r.field === "clicked_campaign");
  const regularRules = rules.filter(
    (r) =>
      r.field !== "tag" &&
      r.field !== "opened_campaign" &&
      r.field !== "clicked_campaign"
  );

  let matchingIds: Set<string> | null = null;

  for (const rule of tagRules) {
    const rows = await fetchAllRows<any>((from, to) =>
      supabase
        .from("subscriber_tags")
        .select("subscriber_id")
        .eq("tag_id", rule.value)
        .range(from, to)
    );
    const ids = new Set(rows.map((t: any) => t.subscriber_id));
    if (matchingIds === null) {
      matchingIds = ids;
    } else {
      matchingIds = new Set(Array.from(matchingIds).filter((id) => ids.has(id)));
    }
    if (matchingIds.size === 0) return [];
  }

  for (const rule of openedRules) {
    const rows = await fetchAllRows<any>((from, to) =>
      supabase
        .from("send_events")
        .select("subscriber_id")
        .eq("campaign_id", rule.value)
        .not("opened_at", "is", null)
        .range(from, to)
    );
    const ids = new Set(rows.map((e: any) => e.subscriber_id));
    if (matchingIds === null) {
      matchingIds = ids;
    } else {
      matchingIds = new Set(Array.from(matchingIds).filter((id) => ids.has(id)));
    }
    if (matchingIds.size === 0) return [];
  }

  for (const rule of clickedRules) {
    const rows = await fetchAllRows<any>((from, to) =>
      supabase
        .from("send_events")
        .select("subscriber_id")
        .eq("campaign_id", rule.value)
        .not("clicked_at", "is", null)
        .range(from, to)
    );
    const ids = new Set(rows.map((e: any) => e.subscriber_id));
    if (matchingIds === null) {
      matchingIds = ids;
    } else {
      matchingIds = new Set(Array.from(matchingIds).filter((id) => ids.has(id)));
    }
    if (matchingIds.size === 0) return [];
  }

  const filteredIds: string[] | null =
    matchingIds === null ? null : Array.from(matchingIds);

  const applyRegularRules = (q: any) => {
    for (const rule of regularRules) {
      switch (rule.field) {
        case "status":
          if (rule.operator === "equals") q = q.eq("status", rule.value);
          break;
        case "engagement_score":
          if (rule.operator === "greater_than") q = q.gte("engagement_score", parseInt(rule.value));
          else if (rule.operator === "less_than") q = q.lte("engagement_score", parseInt(rule.value));
          break;
        case "last_opened_at":
          if (rule.operator === "after") q = q.gte("last_opened_at", rule.value);
          else if (rule.operator === "before") q = q.lte("last_opened_at", rule.value);
          break;
        case "created_at":
          if (rule.operator === "after") q = q.gte("created_at", rule.value);
          else if (rule.operator === "before") q = q.lte("created_at", rule.value);
          break;
      }
    }
    return q;
  };

  if (filteredIds !== null) {
    if (filteredIds.length === 0) return [];
    const chunkSize = 300;
    const all: any[] = [];
    for (let i = 0; i < filteredIds.length; i += chunkSize) {
      const chunk = filteredIds.slice(i, i + chunkSize);
      let q = supabase.from("subscribers").select("*").in("id", chunk);
      q = applyRegularRules(q);
      const { data, error } = await q;
      if (error) throw error;
      if (data) all.push(...data);
    }
    return all;
  }

  let query = supabase.from("subscribers").select("*");
  query = applyRegularRules(query);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getSegments() {
  const supabase = createServiceClient();

  const { data: segments, error } = await supabase
    .from("segments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // For each segment, evaluate rules to get matching subscriber count
  const segmentsWithCounts = await Promise.all(
    (segments || []).map(async (segment) => {
      try {
        const subscribers = await evaluateRules(segment.rules || []);
        return { ...segment, matchingCount: subscribers.length };
      } catch {
        return { ...segment, matchingCount: 0 };
      }
    })
  );

  return segmentsWithCounts;
}

export async function createSegment(name: string, rules: SegmentRule[]) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("segments")
    .insert({ name, rules });

  if (error) return { error: error.message };

  revalidatePath("/segments");
  return { success: true };
}

export async function updateSegment(id: string, name: string, rules: SegmentRule[]) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("segments")
    .update({ name, rules })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/segments");
  return { success: true };
}

export async function deleteSegment(id: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("segments")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/segments");
  return { success: true };
}

export async function getSegmentSubscribers(id: string) {
  const supabase = createServiceClient();

  const { data: segment } = await supabase
    .from("segments")
    .select("*")
    .eq("id", id)
    .single();

  if (!segment) return [];

  return evaluateRules(segment.rules || []);
}

export async function previewSegmentCount(rules: SegmentRule[]) {
  try {
    const subscribers = await evaluateRules(rules);
    return { count: subscribers.length };
  } catch (err: any) {
    return { count: 0, error: err.message };
  }
}

export async function getAllTags() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("tags").select("id, name").order("name");
  return data || [];
}

export async function getAllCampaigns() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("campaigns")
    .select("id, subject, sent_at")
    .in("status", ["sent", "sending"])
    .order("sent_at", { ascending: false, nullsFirst: false });
  return data || [];
}

export async function createTagFromSegment(segmentId: string, tagName: string) {
  const trimmed = tagName.trim();
  if (!trimmed) return { error: "Tag name is required" };

  const supabase = createServiceClient();

  const { data: segment } = await supabase
    .from("segments")
    .select("*")
    .eq("id", segmentId)
    .single();
  if (!segment) return { error: "Segment not found" };

  const subscribers = await evaluateRules(segment.rules || []);
  if (subscribers.length === 0) {
    return { error: "Segment has no matching subscribers" };
  }

  const { data: newTag, error: tagError } = await supabase
    .from("tags")
    .insert({
      name: trimmed,
      description: `Snapshot of segment "${segment.name}" on ${new Date().toISOString().slice(0, 10)}`,
    })
    .select("id")
    .single();
  if (tagError) return { error: tagError.message };

  const chunkSize = 500;
  for (let i = 0; i < subscribers.length; i += chunkSize) {
    const chunk = subscribers.slice(i, i + chunkSize);
    const inserts = chunk.map((s: any) => ({
      subscriber_id: s.id,
      tag_id: newTag.id,
    }));
    const { error: insertError } = await supabase
      .from("subscriber_tags")
      .upsert(inserts, {
        onConflict: "subscriber_id,tag_id",
        ignoreDuplicates: true,
      });
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/segments");
  revalidatePath("/tags");
  return { success: true, tagId: newTag.id, count: subscribers.length };
}
