"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTemplates() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .order("updated_at", { ascending: false });
  return data || [];
}

export async function getTemplate(id: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function saveTemplate(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const subject = (formData.get("subject") as string) || null;
  const html_body = formData.get("html_body") as string;
  const design_json = JSON.parse((formData.get("design_json") as string) || "null");

  if (id) {
    const { error } = await supabase
      .from("email_templates")
      .update({ name, subject, html_body, design_json, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/templates");
    return { success: true, id };
  } else {
    const { data, error } = await supabase
      .from("email_templates")
      .insert({ name, subject, html_body, design_json })
      .select()
      .single();
    if (error) return { error: error.message };
    revalidatePath("/templates");
    return { success: true, id: data.id };
  }
}

export async function deleteTemplate(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("email_templates").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/templates");
  return { success: true };
}
