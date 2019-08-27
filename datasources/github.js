const { GraphQLDataSource } = require('apollo-datasource-graphql');
const { gql } = require('apollo-server-express');
const _ = require('lodash');

const SEARCH_GITHUB = gql`
  query {
    viewer {
      login
    }
  }
  
`;

class GithubApi extends GraphQLDataSource {
  constructor({ baseURL, authToken }) {
    super();
    this.baseURL = `${baseURL}`;
    this.authToken = authToken;
    this.type = 'github';
  }

  willSendRequest(request) {
    console.log('THE REQUEST', request);
    if (!request.headers) {
      request.headers = {};
    }

    request.headers.authorization = `${this.authToken}`;
  }

  /**
     * assembles a github v4 api search query that specifically searches within an organization
     * @param {String} query
     * @param {String} org
     */
  static queryWithOrg(query, org) {
    return `${query} org:${org}`;
  }

  static githubResultsReducer(repoEdge) {
    const { watchers, stargazers, ...rest } = repoEdge.node;
    return {
      type: 'github',
      id: rest.id,
      typePayload: JSON.stringify({
        ...rest,
        numWatchers: watchers.totalCount,
        numStargazers: stargazers.totalCount,
      }),
    };
  }

  async searchReposInOrg({ query, org, first }) {
    try {
      const response = await this.query(SEARCH_GITHUB, {
        variables: {
          query: GithubApi.queryWithOrg(query, org),
          first,
        },
      });
      return response.data.search.edges;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async search({ query, orgs, first = 100 }) {
    // search against the list of orgs
    const searchRequests = _.map(orgs, (org) => this.searchReposInOrg({ query, org, first }));
    const resultSet = await Promise.all(searchRequests);
    console.log('SEARCH RESULTS', resultSet);
    const flattenedSet = _.flatten(resultSet);
    return flattenedSet.map(GithubApi.githubResultsReducer);
  }
}

module.exports = GithubApi;
