export const dynamic = "force-dynamic";

import { getAllTags, getCampaign } from "../actions";
import { getTemplates } from "../../templates/actions";
import { CampaignEditor } from "./campaign-editor";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const tags = await getAllTags();
  const templates = await getTemplates();
  const campaign = searchParams.id ? await getCampaign(searchParams.id) : null;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">
        {campaign ? "Edit Campaign" : "New Campaign"}
      </h1>
      <CampaignEditor tags={tags} templates={templates} existingCampaign={campaign} />
    </div>
  );
}
