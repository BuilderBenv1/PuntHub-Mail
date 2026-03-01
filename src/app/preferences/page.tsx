export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubscriberPreferences } from "./actions";
import { PreferencesClient } from "./preferences-client";

export default async function PreferencesPage({
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
              This preferences link is invalid or missing a token.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await getSubscriberPreferences(token);

  if (result.error || !result.subscriber) {
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

  return (
    <PreferencesClient
      subscriber={result.subscriber}
      allTags={result.allTags || []}
      subscribedTagIds={result.subscribedTagIds || []}
      token={token}
    />
  );
}
