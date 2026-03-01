export const dynamic = "force-dynamic";

import { getSegments, getAllTags } from "./actions";
import { SegmentsClient } from "./segments-client";

export default async function SegmentsPage() {
  const [segments, tags] = await Promise.all([getSegments(), getAllTags()]);

  return (
    <div>
      <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold">Segments</h1>
      <SegmentsClient segments={segments} tags={tags} />
    </div>
  );
}
