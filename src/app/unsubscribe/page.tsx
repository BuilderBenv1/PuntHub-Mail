export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UnsubscribePage({
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
              This unsubscribe link is invalid or missing a token.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = createServiceClient();

  // Look up subscriber by unsubscribe_token
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, email, status")
    .eq("unsubscribe_token", token)
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
              We couldn&apos;t find a subscriber with this token.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Set status to unsubscribed
  if (subscriber.status !== "unsubscribed") {
    await supabase
      .from("subscribers")
      .update({ status: "unsubscribed" })
      .eq("id", subscriber.id);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>You&apos;ve Been Unsubscribed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            <strong>{subscriber.email}</strong> has been unsubscribed and will no
            longer receive emails from us.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
