export const dynamic = "force-dynamic";

import { getApiKeys } from "./actions";
import { ApiKeysClient } from "./api-keys-client";

export default async function ApiKeysPage() {
  const keys = await getApiKeys();

  return (
    <div>
      <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold">API Keys</h1>
      <ApiKeysClient initialKeys={keys} />
    </div>
  );
}
