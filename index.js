require('dotenv').config({
  path: '.env.production',
});

const { ApolloServer, gql } = require('apollo-server');
const async = require('async');
const flatten = require('lodash/flatten');
const userConfig = require('./config/index.json');
const baseConfig = require('./constants');
const RocketGateAPI = require('./datasources/rocket.gate');
const GitHubAPI = require('./datasources/github');
// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
// @todo should expose a room query, and leverage that *within* the search query
const typeDefs = gql`      
  type SearchResult {
    id: String
    type: String
    typePayload: String      
  } 

  # The "Query" type is the root of all GraphQL queries.
  type Query {    
    search( searchString: String!): [SearchResult]
  }
`;

const resolveMultipleSearchs = (dataSources, searchString) => {
  const config = { ...baseConfig, ...userConfig };

  return Object.keys(dataSources).map((source) => {
    const instance = dataSources[source];
    const { type } = instance;
    const configForType = config[type] || {};
    return instance.search({ query: searchString, ...configForType });
  });
};
// Resolvers define the technique for fetching the types in the
// schema.
const resolvers = {
  Query: {
    search: (_, { searchString }, { dataSources }) => Promise.all(resolveMultipleSearchs(dataSources, searchString)).then((res) => flatten(res)),
  },


};

// Start ApolloServer by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    rocketGateAPI: new RocketGateAPI({
      baseURL: process.env.ROCKETGATE_BASE_URL,
    }),
    // githubAPI: new GitHubAPI({ baseURL: process.env.GITHUB_BASE_URL, authToken: process.env.GITHUB_AUTH_TOKEN }),
  }),
});

// This `listen` method launches a web-server.
server.listen({
  port: 4001,
}).then(({ url }) => {
  console.log(`🚀  Search.Gate GraphQL search gateway ready at ${url}`);
});
