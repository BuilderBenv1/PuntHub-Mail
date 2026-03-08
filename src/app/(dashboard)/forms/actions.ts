"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getForms() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("signup_forms")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createForm(formData: FormData) {
  const supabase = createServiceClient();

  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const heading = (formData.get("heading") as string) || "Subscribe to our newsletter";
  const description = (formData.get("description") as string) || null;
  const button_text = (formData.get("button_text") as string) || "Subscribe";
  const success_message = (formData.get("success_message") as string) || "Check your email to confirm your subscription!";
  const tag_ids = JSON.parse((formData.get("tag_ids") as string) || "[]");
  const redirect_url = (formData.get("redirect_url") as string) || null;
  const welcome_template_id = (formData.get("welcome_template_id") as string) || null;

  const theme = (formData.get("theme") as string) || "clean";
  const accent_color = (formData.get("accent_color") as string) || null;
  const background_color = (formData.get("background_color") as string) || null;
  const logo_url = (formData.get("logo_url") as string) || null;
  const show_name_field = formData.get("show_name_field") !== "false";

  const { error } = await supabase.from("signup_forms").insert({
    name,
    slug,
    heading,
    description,
    button_text,
    success_message,
    tag_ids,
    redirect_url,
    welcome_template_id,
    theme,
    accent_color,
    background_color,
    logo_url,
    show_name_field,
  });

  if (error) {
    if (error.code === "23505") return { error: "A form with this slug already exists." };
    return { error: error.message };
  }

  revalidatePath("/forms");
  return { success: true };
}

export async function updateForm(id: string, formData: FormData) {
  const supabase = createServiceClient();

  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const heading = (formData.get("heading") as string) || "Subscribe to our newsletter";
  const description = (formData.get("description") as string) || null;
  const button_text = (formData.get("button_text") as string) || "Subscribe";
  const success_message = (formData.get("success_message") as string) || "Check your email to confirm your subscription!";
  const tag_ids = JSON.parse((formData.get("tag_ids") as string) || "[]");
  const redirect_url = (formData.get("redirect_url") as string) || null;
  const active = formData.get("active") === "true";
  const welcome_template_id = (formData.get("welcome_template_id") as string) || null;

  const theme = (formData.get("theme") as string) || "clean";
  const accent_color = (formData.get("accent_color") as string) || null;
  const background_color = (formData.get("background_color") as string) || null;
  const logo_url = (formData.get("logo_url") as string) || null;
  const show_name_field = formData.get("show_name_field") !== "false";

  const { error } = await supabase
    .from("signup_forms")
    .update({ name, slug, heading, description, button_text, success_message, tag_ids, redirect_url, active, welcome_template_id, theme, accent_color, background_color, logo_url, show_name_field })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/forms");
  return { success: true };
}

export async function deleteForm(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("signup_forms").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/forms");
  return { success: true };
}

export async function getAllTags() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("tags").select("id, name").order("name");
  return data || [];
}

export async function getAllTemplates() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("email_templates")
    .select("id, name")
    .order("name");
  return data || [];
}
