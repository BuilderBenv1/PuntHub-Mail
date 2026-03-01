export const dynamic = "force-dynamic";

import { getForms, getAllTags, getAllTemplates } from "./actions";
import { FormsClient } from "./forms-client";

export default async function FormsPage() {
  const forms = await getForms();
  const tags = await getAllTags();
  const templates = await getAllTemplates();

  return (
    <div>
      <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold">Signup Forms</h1>
      <FormsClient initialForms={forms} tags={tags} templates={templates} />
    </div>
  );
}
