# index configuration

[key] instance type 

```json
  "rocketgate": {
    "datasource": "_datasources/rocket.gate.js",
    "method": {
      "name": "search"
    },  
    "constructorArgs": {
      "baseURL": "env.ROCKETGATE_BASE_URL"
    }
  },
```

datasource : path to datasource resolved from root of project
method: {
  name: instance method name
  arguments: arguments to pass to instance method (instancemethod will receive {query: "search terms"}),
},
"constructorArgs": {
  key value pairs of arguments
  "env.VARIABLE_NAME" will resolve any environment variables
}