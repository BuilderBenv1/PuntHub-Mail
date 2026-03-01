export const dynamic = "force-dynamic";

import { getTemplates } from "./actions";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Email Templates</h1>
      <TemplatesClient initialTemplates={templates} />
    </div>
  );
}
