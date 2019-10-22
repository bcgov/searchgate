const { GraphQLDataSource } = require('apollo-datasource-graphql');
const { gql } = require('apollo-server-express');
const { BASE_DATA_SOURCES } = require('../constants');

const SEARCH_DOCUMIZE = gql`
  query Search($query: String!) {
    search(searchString: $query) { 
        id
        document
        itemType
        url
        tags
        created
        revised
        space
        excerpt
    }
  }
`;// more fileld can be found or be added at
// https://github.com/bcgov/docugate/blob/525f1ee344408c3d449cbf1ead0d2dbcd499719f/src/index.js#L15

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

  static documizeResultReducer(chatEdge) {
    const { id } = chatEdge;
    return {
      id,
      type: BASE_DATA_SOURCES.documize,
      typePayload: JSON.stringify(chatEdge),
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
