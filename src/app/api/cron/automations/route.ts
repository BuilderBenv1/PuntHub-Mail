import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Find all enrollments where status = 'active' and next_send_at <= now
  const { data: enrollments, error } = await supabase
    .from("automation_enrollments")
    .select("*, subscribers(id, email, status, unsubscribe_token)")
    .eq("status", "active")
    .lte("next_send_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let sent = 0;
  let errors = 0;

  for (const enrollment of enrollments || []) {
    processed++;

    // Skip if subscriber is no longer active
    if (enrollment.subscribers?.status !== "active") {
      await supabase
        .from("automation_enrollments")
        .update({ status: "cancelled" })
        .eq("id", enrollment.id);
      continue;
    }

    // Get all steps for this automation
    const { data: steps } = await supabase
      .from("automation_steps")
      .select("*")
      .eq("automation_id", enrollment.automation_id)
      .order("step_order", { ascending: true });

    if (!steps || steps.length === 0) {
      await supabase
        .from("automation_enrollments")
        .update({ status: "completed" })
        .eq("id", enrollment.id);
      continue;
    }

    // Get the current step (current_step is 0-indexed)
    const currentStepIndex = enrollment.current_step || 0;
    const step = steps[currentStepIndex];

    if (!step) {
      // No more steps, mark completed
      await supabase
        .from("automation_enrollments")
        .update({ status: "completed" })
        .eq("id", enrollment.id);
      continue;
    }

    // Send the email via Resend
    try {
      const html = (step.html_body || "").replace(
        /\{unsubscribe_token\}/g,
        enrollment.subscribers.unsubscribe_token || ""
      );

      const { data: emailResult } = await resend.emails.send({
        from: "PuntHub <news@punthub.co.uk>",
        to: enrollment.subscribers.email,
        subject: step.subject,
        html,
      });

      // Record the send event
      await supabase.from("send_events").insert({
        subscriber_id: enrollment.subscribers.id,
        resend_email_id: emailResult?.id || null,
        sent_at: new Date().toISOString(),
        automation_step_id: step.id,
      });

      sent++;
    } catch (err: any) {
      console.error(
        `Failed to send automation email to ${enrollment.subscribers.email}:`,
        err.message
      );
      errors++;
      continue;
    }

    // Move to next step
    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex >= steps.length) {
      // No more steps, mark completed
      await supabase
        .from("automation_enrollments")
        .update({
          status: "completed",
          current_step: nextStepIndex,
        })
        .eq("id", enrollment.id);
    } else {
      // Calculate next_send_at based on next step's delay_minutes
      const nextStep = steps[nextStepIndex];
      const delayMs = (nextStep.delay_minutes || 0) * 60 * 1000;
      const nextSendAt = new Date(Date.now() + delayMs).toISOString();

      await supabase
        .from("automation_enrollments")
        .update({
          current_step: nextStepIndex,
          next_send_at: nextSendAt,
        })
        .eq("id", enrollment.id);
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    sent,
    errors,
    timestamp: now,
  });
}
