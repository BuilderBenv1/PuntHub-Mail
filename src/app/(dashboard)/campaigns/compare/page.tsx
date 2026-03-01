export const dynamic = "force-dynamic";

import { getCampaigns } from "../actions";
import { CompareClient } from "./compare-client";

export default async function ComparePage() {
  const campaigns = await getCampaigns();
  const sentCampaigns = campaigns.filter((c: any) => c.status === "sent");

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Compare Campaigns</h1>
      <CompareClient campaigns={sentCampaigns} />
    </div>
  );
}
