#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-time setup: creates the `popup_store` metaobject definition in the
 * Brist pop-up store, readable by the Storefront API.
 *
 *   npm run popup:setup
 */
import {adminClient, assertNoUserErrors} from './lib/admin.mjs';

const admin = adminClient();

const choices = (values) => [{name: 'choices', value: JSON.stringify(values)}];

const definition = {
  type: 'popup_store',
  name: 'Pop-up store',
  description: 'One entry per pop-up. Controls domain, products, drop window, and look.',
  displayNameKey: 'name',
  access: {storefront: 'PUBLIC_READ'},
  fieldDefinitions: [
    {key: 'name', name: 'Name', type: 'single_line_text_field', required: true},
    {key: 'status', name: 'Status', type: 'single_line_text_field', required: true,
      validations: choices(['draft', 'active', 'archived'])},
    {key: 'domains', name: 'Domains', type: 'list.single_line_text_field',
      description: 'Hostnames that serve this pop-up, e.g. shop.example.com'},
    {key: 'collection', name: 'Products collection', type: 'collection_reference'},
    {key: 'opens_at', name: 'Opens at', type: 'date_time'},
    {key: 'closes_at', name: 'Closes at', type: 'date_time'},
    {key: 'mode', name: 'Mode', type: 'single_line_text_field',
      validations: choices(['preorder', 'in_stock'])},
    {key: 'ship_message', name: 'Ship message', type: 'single_line_text_field',
      description: 'Shown on product pages in pre-order mode'},
    {key: 'headline', name: 'Headline', type: 'single_line_text_field'},
    {key: 'intro', name: 'Intro', type: 'multi_line_text_field'},
    {key: 'logo', name: 'Logo', type: 'file_reference',
      validations: [{name: 'file_type_options', value: JSON.stringify(['Image'])}]},
    {key: 'hero_image', name: 'Hero image', type: 'file_reference',
      validations: [{name: 'file_type_options', value: JSON.stringify(['Image'])}]},
    {key: 'layout', name: 'Layout', type: 'single_line_text_field',
      validations: choices(['classic', 'editorial', 'grid'])},
    {key: 'theme', name: 'Theme', type: 'json',
      description: 'Colors, fonts, radius. See scripts/themes/example.json'},
    {key: 'max_per_order', name: 'Max items per order', type: 'number_integer'},
    {key: 'klaviyo_list_id', name: 'Klaviyo list ID', type: 'single_line_text_field'},
  ],
};

const data = await admin(
  `#graphql
  mutation CreatePopupDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message code }
    }
  }`,
  {definition},
);

const result = data.metaobjectDefinitionCreate;
if (result.userErrors.some((e) => e.code === 'TAKEN')) {
  console.log('popup_store definition already exists. Nothing to do.');
  process.exit(0);
}
assertNoUserErrors(result, 'metaobjectDefinitionCreate');
console.log(`Created ${result.metaobjectDefinition.type} (${result.metaobjectDefinition.id})`);
