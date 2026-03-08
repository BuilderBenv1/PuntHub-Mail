export const dynamic = "force-dynamic";

import { getLandingPages } from "./actions";
import { LandingPagesClient } from "./landing-pages-client";

export default async function LandingPagesPage() {
  const pages = await getLandingPages();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Landing Pages</h1>
      <LandingPagesClient initialPages={pages} />
    </div>
  );
}
