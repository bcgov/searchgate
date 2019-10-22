const { GraphQLDataSource } = require('apollo-datasource-graphql');
const { gql } = require('apollo-server-express');
const { BASE_DATA_SOURCES } = require('../constants');

const SEARCH_DOCUMIZE = gql`
  query Search($query: String!) {
    search(searchString: $query) { 
        id
        orgId
        itemId
        itemType
        documentId
        documentSlug
        document
        excerpt
        tags
        spaceId
        space
        spaceSlug
        template
        url
        versionId
        created
        revised
    }
  }
`;
class DocumizeApi extends GraphQLDataSource {
  constructor({ baseURL }) {
    super();
    this.baseURL = baseURL;
    this.dataSourceType = BASE_DATA_SOURCES.documize;
  }

  /**
     * assembles a github v4 api search query that specifically searches within an organization
     * @param {String} query
     * @param {String} org
     */
  static queryWithOrg(query, org) {
    return `${query} org:${org}`;
  }

  static documizeResultReducer(results) {
    const { id } = results;
    return {
      id,
      type: BASE_DATA_SOURCES.documize,
      typePayload: JSON.stringify(results),
    };
  }

  async search({ query }) {
    try {
      const response = await this.query(SEARCH_DOCUMIZE, {
        variables: {
          query,
        },
      });

      return response.data.search.map(DocumizeApi.documizeResultReducer);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

module.exports = DocumizeApi;
