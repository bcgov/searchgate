require('dotenv').config({
  path: '.env.production',
});
const path = require('path');

const { ApolloServer, gql } = require('apollo-server');
const flatten = require('lodash/flatten');
const userConfig = require('./config/index.json');
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
  const config = { ...userConfig };
  console.log(config);
  return Object.keys(dataSources).map((source) => {
    const instance = dataSources[source];
    const { type } = instance;
    const configForType = config[type] || {};
    console.log('the source', type);
    const { method } = configForType;
    console.log(configForType);
    return instance[method.name]({ query: searchString, ...method.arguments });
  });
};
// Resolvers define the technique for fetching the types in the
// schema.
const resolvers = {
  Query: {
    search: (_, { searchString }, { dataSources }) => Promise.all(resolveMultipleSearchs(dataSources, searchString)).then((res) => flatten(res)),
  },


};

const resolveInstanceArgs = (args) => {
  const resolvedArgs = Object.keys(args).map((arg) => {
    // is this an env ?
    if (args[arg].indexOf('env.') === 0) {
      return { [arg]: process.env[args[arg].replace('env.', '')] };
    }
    return { [arg]: args[arg] };
  }).reduce((argObj, arg) => ({ ...argObj, ...arg }), {});
  return resolvedArgs;
};
// Start ApolloServer by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const datasources = Object.keys(userConfig).map((datasourceType) =>
  // get the instance for this datasource type
  ({
    // eslint-disable-next-line import/no-dynamic-require
    class: require(path.resolve(__dirname, userConfig[datasourceType].datasource)),
    config: userConfig[datasourceType],
    type: datasourceType,
  }));

const datasourceInstances = datasources.reduce((datasourcesForApollo, datasource) => {
  const args = resolveInstanceArgs(datasource.config.constructorArgs || {});
  // eslint-disable-next-line new-cap
  return { ...datasourcesForApollo, [datasource.type]: new datasource.class({ ...args }) };
}, {});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => datasourceInstances,
});

// This `listen` method launches a web-server.
server.listen({
  port: 4001,
}).then(({ url }) => {
  console.log(`🚀  Search.Gate GraphQL search gateway ready at ${url}`);
  datasources.forEach((datasource) => {
    const { type } = datasource;
    console.log(`Datasource ${type} utilized`);
  });
});
