import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) return auth.error!;

  const body = await request.json();
  const { to, subject, html, from_name, from_email } = body;

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: "Missing required fields: to, subject, html" },
      { status: 400 }
    );
  }

  const fromAddr = `${from_name || "PuntHub"} <${from_email || "news@punthub.co.uk"}>`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddr,
      to,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
