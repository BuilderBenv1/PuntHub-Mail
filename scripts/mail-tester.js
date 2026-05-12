// Usage: node scripts/mail-tester.js <mail-tester-address>
// Fetches the most recent sent campaign and sends it through Resend to the given
// address using the exact same from-name/from-email/reply-to/headers your real
// campaigns use, so mail-tester scores what your subscribers actually see.

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();

  const [, , to] = process.argv;
  if (!to) {
    console.error("Usage: node scripts/mail-tester.js <address>");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("subject, preview_text, html_body, from_name, from_email, reply_to")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !campaign) {
    console.error("No sent campaigns found:", error?.message);
    process.exit(1);
  }

  console.log("Using campaign:", campaign.subject);
  console.log("From:", `${campaign.from_name} <${campaign.from_email}>`);

  const { data, error: sendError } = await resend.emails.send({
    from: `${campaign.from_name} <${campaign.from_email}>`,
    to,
    subject: campaign.subject,
    html: campaign.html_body,
    replyTo: campaign.reply_to || undefined,
    headers: campaign.preview_text
      ? { "X-Preview-Text": campaign.preview_text }
      : undefined,
  });

  if (sendError) {
    console.error("Send failed:", sendError.message);
    process.exit(1);
  }

  console.log("Sent. Resend id:", data?.id);
  console.log("Check mail-tester.com for the score in ~30 seconds.");
}

main();
