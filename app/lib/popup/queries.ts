/** Storefront API query for all pop-up configs. Cached long; configs change rarely. */
export const POPUP_STORES_QUERY = `#graphql
  query PopupStores($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    metaobjects(type: "popup_store", first: 250) {
      nodes {
        handle
        fields {
          key
          value
          reference {
            __typename
            ... on Collection {
              handle
            }
            ... on MediaImage {
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
` as const;
