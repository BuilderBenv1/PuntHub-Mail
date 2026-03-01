"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SegmentRule = {
  field: "status" | "engagement_score" | "tag" | "last_opened_at" | "created_at";
  operator: string;
  value: string;
};

async function evaluateRules(rules: SegmentRule[]) {
  const supabase = createServiceClient();

  // Separate tag rules from regular rules
  const tagRules = rules.filter((r) => r.field === "tag");
  const regularRules = rules.filter((r) => r.field !== "tag");

  // If there are tag rules, first find subscriber IDs that match
  let tagFilteredIds: string[] | null = null;

  if (tagRules.length > 0) {
    // For each tag rule, get subscriber IDs with that tag
    let matchingIds: Set<string> | null = null;

    for (const rule of tagRules) {
      const { data: tagSubs } = await supabase
        .from("subscriber_tags")
        .select("subscriber_id")
        .eq("tag_id", rule.value);

      const ids = new Set((tagSubs || []).map((t: any) => t.subscriber_id));

      if (matchingIds === null) {
        matchingIds = ids;
      } else {
        // AND logic: intersect
        matchingIds = new Set(Array.from(matchingIds).filter((id) => ids.has(id)));
      }
    }

    tagFilteredIds = matchingIds ? Array.from(matchingIds) : [];
    if (tagFilteredIds.length === 0) return [];
  }

  // Build the main query
  let query = supabase.from("subscribers").select("*");

  // Apply tag filter if needed
  if (tagFilteredIds !== null) {
    query = query.in("id", tagFilteredIds);
  }

  // Apply regular rules
  for (const rule of regularRules) {
    switch (rule.field) {
      case "status":
        if (rule.operator === "equals") {
          query = query.eq("status", rule.value);
        }
        break;

      case "engagement_score":
        if (rule.operator === "greater_than") {
          query = query.gte("engagement_score", parseInt(rule.value));
        } else if (rule.operator === "less_than") {
          query = query.lte("engagement_score", parseInt(rule.value));
        }
        break;

      case "last_opened_at":
        if (rule.operator === "after") {
          query = query.gte("last_opened_at", rule.value);
        } else if (rule.operator === "before") {
          query = query.lte("last_opened_at", rule.value);
        }
        break;

      case "created_at":
        if (rule.operator === "after") {
          query = query.gte("created_at", rule.value);
        } else if (rule.operator === "before") {
          query = query.lte("created_at", rule.value);
        }
        break;
    }
  }

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
