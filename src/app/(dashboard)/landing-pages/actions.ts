"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLandingPages() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("landing_pages")
    .select("*")
    .order("updated_at", { ascending: false });
  return data || [];
}

export async function getLandingPage(id: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function createLandingPage(formData: FormData) {
  const supabase = createServiceClient();
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const meta_title = (formData.get("meta_title") as string) || null;
  const meta_description = (formData.get("meta_description") as string) || null;

  const { data, error } = await supabase
    .from("landing_pages")
    .insert({ name, slug, meta_title, meta_description })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "A page with this slug already exists." };
    return { error: error.message };
  }

  revalidatePath("/landing-pages");
  return { success: true, id: data.id };
}

export async function saveLandingPage(id: string, data: {
  name?: string;
  slug?: string;
  html?: string;
  css?: string;
  project_json?: any;
  meta_title?: string | null;
  meta_description?: string | null;
  published?: boolean;
}) {
  const supabase = createServiceClient();

  const updates: any = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (data.html !== undefined) updates.html = data.html;
  if (data.css !== undefined) updates.css = data.css;
  if (data.project_json !== undefined) updates.project_json = data.project_json;
  if (data.meta_title !== undefined) updates.meta_title = data.meta_title;
  if (data.meta_description !== undefined) updates.meta_description = data.meta_description;
  if (data.published !== undefined) updates.published = data.published;

  const { error } = await supabase
    .from("landing_pages")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/landing-pages");
  revalidatePath(`/p/${data.slug}`);
  return { success: true };
}

export async function deleteLandingPage(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("landing_pages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/landing-pages");
  return { success: true };
}
