"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Form = {
  id: string;
  name: string;
  slug: string;
  heading: string;
  description: string | null;
  button_text: string;
  success_message: string;
  tag_ids: string[];
  redirect_url: string | null;
};

export function SignupFormPage({ form }: { form: Form }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, form_id: form.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (form.redirect_url) {
        window.location.href = form.redirect_url;
        return;
      }

      setMessage(data.message || form.success_message);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{form.heading}</CardTitle>
          {form.description && (
            <CardDescription className="text-base">{form.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="py-4 text-center">
              <p className="text-lg font-medium text-green-600">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Subscribing..." : form.button_text}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                We&apos;ll send you a confirmation email. No spam, unsubscribe anytime.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
