export const dynamic = "force-dynamic";

import { getLandingPage } from "../actions";
import { notFound } from "next/navigation";
import { EditorClient } from "./editor-client";

export default async function LandingPageEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const page = await getLandingPage(params.id);
  if (!page) notFound();

  return <EditorClient page={page} />;
}
