export const dynamic = "force-dynamic";

import { getSegments, getAllTags, getAllCampaigns } from "./actions";
import { SegmentsClient } from "./segments-client";

export default async function SegmentsPage() {
  const [segments, tags, campaigns] = await Promise.all([
    getSegments(),
    getAllTags(),
    getAllCampaigns(),
  ]);

  return (
    <div>
      <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold">Segments</h1>
      <SegmentsClient segments={segments} tags={tags} campaigns={campaigns} />
    </div>
  );
}
