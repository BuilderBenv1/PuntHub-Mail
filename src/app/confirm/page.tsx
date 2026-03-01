export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This confirmation link is invalid or missing.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = createServiceClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, email, status, signup_form_id, unsubscribe_token")
    .eq("confirmation_token", token)
    .single();

  if (!subscriber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We couldn&apos;t find a subscription with this token.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Activate the subscriber
  if (subscriber.status !== "active") {
    await supabase
      .from("subscribers")
      .update({
        status: "active",
        confirmed_at: new Date().toISOString(),
        subscribed_at: new Date().toISOString(),
      })
      .eq("id", subscriber.id);

    // Send welcome email if the signup form has a welcome template
    if (subscriber.signup_form_id) {
      try {
        const { data: form } = await supabase
          .from("signup_forms")
          .select("welcome_template_id")
          .eq("id", subscriber.signup_form_id)
          .single();

        if (form?.welcome_template_id) {
          const { data: template } = await supabase
            .from("email_templates")
            .select("subject, html_body")
            .eq("id", form.welcome_template_id)
            .single();

          if (template && template.html_body) {
            // Replace {unsubscribe_token} placeholder in the HTML
            const html = template.html_body.replace(
              /\{unsubscribe_token\}/g,
              subscriber.unsubscribe_token
            );

            await resend.emails.send({
              from: "PuntHub <news@punthub.co.uk>",
              to: subscriber.email,
              subject: template.subject || "Welcome!",
              html,
            });
          }
        }
      } catch (err: any) {
        // Log but don't block confirmation if welcome email fails
        console.error("Failed to send welcome email:", err.message);
      }
    }

    // Enroll in automations with trigger_type = 'subscriber_created'
    try {
      const { data: automations } = await supabase
        .from("automations")
        .select("id")
        .eq("trigger_type", "subscriber_created")
        .eq("active", true);

      if (automations && automations.length > 0) {
        for (const automation of automations) {
          // Get first step to determine initial next_send_at
          const { data: steps } = await supabase
            .from("automation_steps")
            .select("delay_minutes")
            .eq("automation_id", automation.id)
            .order("step_order", { ascending: true })
            .limit(1);

          if (steps && steps.length > 0) {
            const delayMs = (steps[0].delay_minutes || 0) * 60 * 1000;
            const nextSendAt = new Date(Date.now() + delayMs).toISOString();

            await supabase.from("automation_enrollments").insert({
              subscriber_id: subscriber.id,
              automation_id: automation.id,
              status: "active",
              current_step: 0,
              next_send_at: nextSendAt,
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to enroll in automations:", err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Subscription Confirmed!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            <strong>{subscriber.email}</strong> has been confirmed. You&apos;re
            now subscribed and will receive our emails.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
