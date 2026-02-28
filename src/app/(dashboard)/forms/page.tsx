export const dynamic = "force-dynamic";

import { getForms, getAllTags } from "./actions";
import { FormsClient } from "./forms-client";

export default async function FormsPage() {
  const forms = await getForms();
  const tags = await getAllTags();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Signup Forms</h1>
      <FormsClient initialForms={forms} tags={tags} />
    </div>
  );
}
