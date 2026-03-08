export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServiceClient();
  const { data: page } = await supabase
    .from("landing_pages")
    .select("meta_title, meta_description")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!page) return { title: "Page Not Found" };

  return {
    title: page.meta_title || undefined,
    description: page.meta_description || undefined,
  };
}

export default async function PublicLandingPage({ params }: Props) {
  const supabase = createServiceClient();

  const { data: page } = await supabase
    .from("landing_pages")
    .select("html, css")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">This page is not available.</p>
      </div>
    );
  }

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
img { max-width: 100%; }
${page.css || ""}
</style>
</head>
<body>
${page.html || ""}
</body>
</html>`;

  return (
    <iframe
      srcDoc={fullHtml}
      style={{ width: "100%", height: "100vh", border: "none" }}
      title="Landing Page"
    />
  );
}
