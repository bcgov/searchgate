require('dotenv').config({
    path: '.env.production',
});

const {ApolloServer, gql} = require('apollo-server');

const RocketGateAPI = require('./datasources/rocket.gate');
const GitHubAPI = require('./datasources/github');

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
// @todo should expose a room query, and leverage that *within* the search query
const typeDefs = gql`      
    

  type Room {
    id: String
    name: String
  }
    
  type SearchResult {
    id: String
    message: String
    url: String
    author: String
    time: String
    roomId : String
    room: Room       
  } 

  # The "Query" type is the root of all GraphQL queries.
  type Query {    
    search( searchString: String!): [SearchResult]
  }
`;

// Resolvers define the technique for fetching the types in the
// schema.
const resolvers = {
    Query: {
        search: (_, {searchString}, {dataSources}) => dataSources.rocketGateAPI.searchRooms({
            roomIds: process.env.ROCKETCHAT_ROOM_IDS.split(","),
            searchString: searchString
        })
    }


};

// Start ApolloServer by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({
        rocketGateAPI: new RocketGateAPI({
            baseURL: process.env.ROCKETCHAT_BASE_URL,
            authToken: process.env.ROCKETCHAT_AUTH_TOKEN,
            userId: process.env.ROCKETCHAT_USER_ID
        })
    })
});

// This `listen` method launches a web-server.
server.listen({
    port: 4001
}).then(({url}) => {
    console.log(`🚀  Search.Gate GraphQL search gateway ready at ${url}`);
});