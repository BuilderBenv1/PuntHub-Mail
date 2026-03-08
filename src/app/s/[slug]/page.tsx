export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { SignupFormPage } from "./signup-form";
import { getTheme, applyCustomColors } from "@/app/(dashboard)/forms/themes";

export default async function PublicSignupPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServiceClient();

  const { data: form } = await supabase
    .from("signup_forms")
    .select("*")
    .eq("slug", params.slug)
    .eq("active", true)
    .single();

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">This form is no longer available.</p>
      </div>
    );
  }

  const baseTheme = getTheme(form.theme);
  const theme = applyCustomColors(baseTheme, {
    accentColor: form.accent_color,
    backgroundColor: form.background_color,
  });

  return <SignupFormPage form={form} theme={theme} />;
}
