/**
 * Minimal Shopify Admin GraphQL client for the pop-up scripts.
 * Reads SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN, SHOPIFY_ADMIN_API_VERSION.
 */
export function adminClient() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  const version = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-04';

  if (!domain || !token) {
    console.error(
      'Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN. Copy .env.admin.example to .env.admin and fill it in.',
    );
    process.exit(1);
  }

  return async function admin(query, variables = {}) {
    const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
      body: JSON.stringify({query, variables}),
    });
    const json = await res.json();
    if (!res.ok || json.errors) {
      throw new Error(`Admin API error: ${JSON.stringify(json.errors ?? json, null, 2)}`);
    }
    return json.data;
  };
}

export function assertNoUserErrors(result, label) {
  const errors = result?.userErrors ?? [];
  if (errors.length) {
    console.error(`${label} failed:`);
    for (const e of errors) console.error(`  - ${e.field?.join('.') ?? ''} ${e.message}`);
    process.exit(1);
  }
}
