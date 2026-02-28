export const dynamic = "force-dynamic";

import { getCampaigns } from "./actions";
import { CampaignsClient } from "./campaigns-client";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Campaigns</h1>
      <CampaignsClient campaigns={campaigns} />
    </div>
  );
}
