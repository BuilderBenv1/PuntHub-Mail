export const dynamic = "force-dynamic";

import { getAutomation, getTemplates } from "../actions";
import { notFound } from "next/navigation";
import { AutomationDetailClient } from "./automation-detail-client";

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [automation, templates] = await Promise.all([
    getAutomation(id),
    getTemplates(),
  ]);

  if (!automation) return notFound();

  return (
    <div>
      <AutomationDetailClient automation={automation} templates={templates} />
    </div>
  );
}
