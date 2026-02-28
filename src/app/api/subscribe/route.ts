import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, name, form_id } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const normalizedEmail = email.toLowerCase().trim();

  // Get form config if form_id provided
  let tagIds: string[] = [];
  let successMessage = "Check your email to confirm your subscription!";

  if (form_id) {
    const { data: form } = await supabase
      .from("signup_forms")
      .select("*")
      .eq("id", form_id)
      .eq("active", true)
      .single();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    tagIds = form.tag_ids || [];
    successMessage = form.success_message;
  }

  // Check if subscriber already exists
  const { data: existing } = await supabase
    .from("subscribers")
    .select("id, status, confirmation_token")
    .eq("email", normalizedEmail)
    .single();

  let confirmationToken: string;

  if (existing) {
    if (existing.status === "active") {
      // Already confirmed and active — assign new tags if any
      if (tagIds.length > 0) {
        for (const tag_id of tagIds) {
          await supabase
            .from("subscriber_tags")
            .upsert(
              { subscriber_id: existing.id, tag_id },
              { onConflict: "subscriber_id,tag_id" }
            );
        }
      }
      return NextResponse.json({ success: true, message: "You're already subscribed!", already_active: true });
    }

    // Re-send confirmation for pending/unsubscribed
    confirmationToken = existing.confirmation_token;

    // Reset to pending
    await supabase
      .from("subscribers")
      .update({ status: "pending", name: name || undefined })
      .eq("id", existing.id);
  } else {
    // Create new subscriber as pending
    const { data: newSub, error } = await supabase
      .from("subscribers")
      .insert({
        email: normalizedEmail,
        name: name || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    confirmationToken = newSub.confirmation_token;

    // Assign tags
    if (tagIds.length > 0) {
      for (const tag_id of tagIds) {
        await supabase
          .from("subscriber_tags")
          .upsert(
            { subscriber_id: newSub.id, tag_id },
            { onConflict: "subscriber_id,tag_id" }
          );
      }
    }
  }

  // Send confirmation email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "https://mailsender.punthub.co.uk";
  const confirmUrl = `${baseUrl}/confirm?token=${confirmationToken}`;

  try {
    await resend.emails.send({
      from: "PuntHub <news@punthub.co.uk>",
      to: normalizedEmail,
      subject: "Confirm your subscription",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Confirm your subscription</h2>
          <p style="color: #666; font-size: 16px;">
            Thanks for signing up${name ? `, ${name}` : ""}! Please confirm your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}"
               style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
              Confirm Subscription
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 12px;">
            Or copy and paste this link: ${confirmUrl}
          </p>
        </div>
      `,
    });
  } catch (err: any) {
    console.error("Failed to send confirmation email:", err.message);
    return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: successMessage });
}
