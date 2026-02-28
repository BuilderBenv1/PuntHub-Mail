"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { hashApiKey } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function getApiKeys() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, created_at, last_used_at")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function generateApiKey(name: string) {
  const supabase = createServiceClient();

  // Generate a random API key
  const rawKey = `pm_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = hashApiKey(rawKey);

  const { error } = await supabase
    .from("api_keys")
    .insert({ name, key_hash: keyHash });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/api-keys");
  // Return the raw key — this is the only time it's shown
  return { success: true, key: rawKey };
}

export async function revokeApiKey(id: string) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("api_keys").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/api-keys");
  return { success: true };
}
