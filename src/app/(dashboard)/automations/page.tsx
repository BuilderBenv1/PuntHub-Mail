export const dynamic = "force-dynamic";

import { getAutomations, getAllTags } from "./actions";
import { AutomationsClient } from "./automations-client";

export default async function AutomationsPage() {
  const [automations, tags] = await Promise.all([getAutomations(), getAllTags()]);
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Automations</h1>
      <AutomationsClient automations={automations} tags={tags} />
    </div>
  );
}
