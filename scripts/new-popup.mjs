#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Creates or updates a pop-up entry. Always saves as draft unless --status is given,
 * so a new pop-up can be previewed before it goes live.
 *
 *   npm run popup:new -- \
 *     --handle slow-mornings-fall \
 *     --name "Slow Mornings Fall Capsule" \
 *     --domain shop.slowmornings.com \
 *     --collection sm-fall-capsule \
 *     --opens 2026-11-01T16:00:00Z --closes 2026-11-08T16:00:00Z \
 *     --mode preorder --max 6 \
 *     --theme scripts/themes/example.json
 */
import {readFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {adminClient, assertNoUserErrors} from './lib/admin.mjs';

const {values: a} = parseArgs({
  options: {
    handle: {type: 'string'},
    name: {type: 'string'},
    domain: {type: 'string', multiple: true},
    collection: {type: 'string'},
    opens: {type: 'string'},
    closes: {type: 'string'},
    mode: {type: 'string'},
    status: {type: 'string', default: 'draft'},
    layout: {type: 'string'},
    headline: {type: 'string'},
    intro: {type: 'string'},
    'ship-message': {type: 'string'},
    max: {type: 'string'},
    theme: {type: 'string'},
    klaviyo: {type: 'string'},
  },
});

if (!a.handle || !a.name) {
  console.error('Usage: npm run popup:new -- --handle <handle> --name "<name>" [options]');
  process.exit(1);
}

const admin = adminClient();
const fields = [
  {key: 'name', value: a.name},
  {key: 'status', value: a.status},
];
const set = (key, value) => value !== undefined && fields.push({key, value: String(value)});

if (a.domain?.length) set('domains', JSON.stringify(a.domain));
set('opens_at', a.opens);
set('closes_at', a.closes);
set('mode', a.mode);
set('layout', a.layout);
set('headline', a.headline);
set('intro', a.intro);
set('ship_message', a['ship-message']);
set('max_per_order', a.max);
set('klaviyo_list_id', a.klaviyo);

if (a.theme) {
  const theme = JSON.parse(await readFile(a.theme, 'utf8'));
  set('theme', JSON.stringify(theme));
}

if (a.collection) {
  const data = await admin(
    `#graphql
    query FindCollection($query: String!) {
      collections(first: 1, query: $query) { nodes { id handle } }
    }`,
    {query: `handle:${a.collection}`},
  );
  const collection = data.collections.nodes[0];
  if (!collection) {
    console.error(`No collection with handle "${a.collection}". Create it in Shopify admin first.`);
    process.exit(1);
  }
  set('collection', collection.id);
}

const data = await admin(
  `#graphql
  mutation UpsertPopup($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message code }
    }
  }`,
  {handle: {type: 'popup_store', handle: a.handle}, metaobject: {fields}},
);

assertNoUserErrors(data.metaobjectUpsert, 'metaobjectUpsert');
console.log(`Saved pop-up "${a.handle}" as ${a.status}.`);
if (a.status === 'draft') {
  console.log(`Preview it on a preview deployment with ?popup=${a.handle}`);
}
