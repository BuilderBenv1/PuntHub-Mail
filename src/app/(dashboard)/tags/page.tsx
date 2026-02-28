export const dynamic = "force-dynamic";

import { getTags } from "./actions";
import { TagsClient } from "./tags-client";

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Lists</h1>
      <TagsClient initialTags={tags} />
    </div>
  );
}
