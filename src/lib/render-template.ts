export type RenderVars = {
  name?: string | null;
  email: string;
};

export function renderTemplate(template: string | null | undefined, vars: RenderVars): string {
  if (!template) return "";
  const name = vars.name?.trim() || "there";
  return template
    .replace(/\{name\}/g, name)
    .replace(/\{email\}/g, vars.email);
}
