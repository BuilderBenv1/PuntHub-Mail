export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    .select("id, email, status")
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
