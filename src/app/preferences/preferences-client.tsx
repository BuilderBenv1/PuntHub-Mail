"use client";

import { useState } from "react";
import { updatePreferences, unsubscribeAll } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tag = { id: string; name: string; description: string | null };

export function PreferencesClient({
  subscriber,
  allTags,
  subscribedTagIds: initialSubscribedTagIds,
  token,
}: {
  subscriber: { id: string; email: string; name: string | null; status: string };
  allTags: Tag[];
  subscribedTagIds: string[];
  token: string;
}) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialSubscribedTagIds);
  const [saving, setSaving] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUnsubscribed, setIsUnsubscribed] = useState(subscriber.status === "unsubscribed");

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await updatePreferences(token, selectedTagIds);
    setSaving(false);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Your preferences have been saved." });
    }
  }

  async function handleUnsubscribeAll() {
    if (!confirm("Are you sure you want to unsubscribe from all emails?")) return;

    setUnsubscribing(true);
    setMessage(null);
    const result = await unsubscribeAll(token);
    setUnsubscribing(false);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setIsUnsubscribed(true);
      setSelectedTagIds([]);
      setMessage({ type: "success", text: "You have been unsubscribed from all emails." });
    }
  }

  if (isUnsubscribed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unsubscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              <strong>{subscriber.email}</strong> has been unsubscribed from all emails.
            </p>
            {message && (
              <div
                className={`mt-4 rounded-md p-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                    : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage subscriptions for <strong>{subscriber.email}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                  : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {allTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mailing lists are currently available.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Choose which lists you want to receive:</p>
              {allTags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium">{tag.name}</span>
                    {tag.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{tag.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnsubscribeAll}
              disabled={unsubscribing}
            >
              {unsubscribing ? "Unsubscribing..." : "Unsubscribe from All"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
