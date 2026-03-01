"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAutomations() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("automations")
    .select("*, automation_steps(count), tags(name)")
    .order("created_at", { ascending: false });

  return (data || []).map((a: any) => ({
    ...a,
    stepCount: a.automation_steps?.[0]?.count ?? 0,
    triggerTagName: a.tags?.name || null,
  }));
}

export async function getAutomation(id: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("automations")
    .select("*, automation_steps(*), tags(name)")
    .eq("id", id)
    .single();

  if (data) {
    data.automation_steps = (data.automation_steps || []).sort((a: any, b: any) => a.step_order - b.step_order);
  }
  return data;
}

export async function createAutomation(formData: FormData) {
  const supabase = createServiceClient();
  const name = formData.get("name") as string;
  const trigger_type = formData.get("trigger_type") as string;
  const trigger_tag_id = (formData.get("trigger_tag_id") as string) || null;

  const { data, error } = await supabase
    .from("automations")
    .insert({ name, trigger_type, trigger_tag_id: trigger_type === "tag_added" ? trigger_tag_id : null })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/automations");
  return { success: true, id: data.id };
}

export async function toggleAutomation(id: string, active: boolean) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("automations").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/automations");
  return { success: true };
}

export async function deleteAutomation(id: string) {
  const supabase = createServiceClient();
  await supabase.from("automation_enrollments").delete().eq("automation_id", id);
  const { error } = await supabase.from("automations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/automations");
  return { success: true };
}

export async function addStep(formData: FormData) {
  const supabase = createServiceClient();
  const automation_id = formData.get("automation_id") as string;
  const subject = formData.get("subject") as string;
  const html_body = formData.get("html_body") as string;
  const delay_minutes = parseInt(formData.get("delay_minutes") as string) || 0;

  // Get next step order
  const { data: existing } = await supabase
    .from("automation_steps")
    .select("step_order")
    .eq("automation_id", automation_id)
    .order("step_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.step_order ?? 0) + 1;

  const { error } = await supabase.from("automation_steps").insert({
    automation_id, subject, html_body, delay_minutes, step_order: nextOrder,
  });

  if (error) return { error: error.message };
  revalidatePath(`/automations/${automation_id}`);
  return { success: true };
}

export async function updateStep(id: string, formData: FormData) {
  const supabase = createServiceClient();
  const subject = formData.get("subject") as string;
  const html_body = formData.get("html_body") as string;
  const delay_minutes = parseInt(formData.get("delay_minutes") as string) || 0;

  const { error } = await supabase
    .from("automation_steps")
    .update({ subject, html_body, delay_minutes })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteStep(id: string, automationId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("automation_steps").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/automations/${automationId}`);
  return { success: true };
}

export async function getAllTags() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("tags").select("id, name").order("name");
  return data || [];
}

export async function getTemplates() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("email_templates").select("id, name, subject, html_body").order("name");
  return data || [];
}

export async function enrollSubscriber(subscriberId: string, automationId: string) {
  const supabase = createServiceClient();

  // Check if already enrolled and active
  const { data: existing } = await supabase
    .from("automation_enrollments")
    .select("id")
    .eq("subscriber_id", subscriberId)
    .eq("automation_id", automationId)
    .eq("status", "active")
    .single();

  if (existing) {
    return { success: true, message: "Already enrolled" };
  }

  // Get first step to determine initial next_send_at
  const { data: steps } = await supabase
    .from("automation_steps")
    .select("delay_minutes")
    .eq("automation_id", automationId)
    .order("step_order", { ascending: true })
    .limit(1);

  if (!steps || steps.length === 0) {
    return { error: "Automation has no steps" };
  }

  const delayMs = (steps[0].delay_minutes || 0) * 60 * 1000;
  const nextSendAt = new Date(Date.now() + delayMs).toISOString();

  const { error } = await supabase.from("automation_enrollments").insert({
    subscriber_id: subscriberId,
    automation_id: automationId,
    status: "active",
    current_step: 0,
    next_send_at: nextSendAt,
  });

  if (error) return { error: error.message };
  return { success: true };
}
