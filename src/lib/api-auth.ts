import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function authenticateApiKey(
  request: NextRequest
): Promise<{ authenticated: boolean; error?: NextResponse }> {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: "Missing X-API-Key header" },
        { status: 401 }
      ),
    };
  }

  const keyHash = hashApiKey(apiKey);
  const supabase = createServiceClient();

  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("id")
    .eq("key_hash", keyHash)
    .single();

  if (!keyRecord) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      ),
    };
  }

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  return { authenticated: true };
}
