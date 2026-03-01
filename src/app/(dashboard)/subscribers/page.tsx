export const dynamic = "force-dynamic";

import { getSubscribers, getAllTags } from "./actions";
import { SubscribersClient } from "./subscribers-client";

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: { search?: string; tag?: string; status?: string };
}) {
  const subscribers = await getSubscribers({
    search: searchParams.search,
    tag: searchParams.tag,
    status: searchParams.status,
  });
  const tags = await getAllTags();

  return (
    <div>
      <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold">Subscribers</h1>
      <SubscribersClient
        initialSubscribers={subscribers}
        tags={tags}
        currentTag={searchParams.tag}
        currentStatus={searchParams.status}
        currentSearch={searchParams.search}
      />
    </div>
  );
}
