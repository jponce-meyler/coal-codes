# coal-codes
This is a framework/group of utilities to create an app easily 


## Features



## Example
```js
const coal = require('coal-codes');
const app = coal('Your Application Name', {autodetect: true});
```

### Default Options
```js
const options = {
    express: {
        limit: '1000mb', // Max size of a request
        bodyParser: {}, // Options for bodyParser
        json: {}, // Options for jsonParser
        urlencoded: {extended: true} // Options for urlencodedParser
    },
    session: {
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 30000000 // close to 1 year
        }
    },
    database: {
        driver: 'mongodb',
        settings: {
            keepAlive: true
        }
    },
    path: {
        root: false,
        controllers: false
    },
    autodetect: {
        path: false,
        controllers: false,
        routes: false
    },
    appRouter: express.Router
}
```
