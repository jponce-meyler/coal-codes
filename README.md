# coal-codes
This is a framework/group of utilities to create an app easily 


## Features



## Example
```js
const coal = require('coal-codes');
const app = coal('Your Application Name', {autodetect: true});
```

### Options

#### autodetect
If true, coal will try to autodetect some features like root path, routes, etc.
You can customize the features by passing an object to the `options` parameter.

```js
options = {
    autodetect: true || false,
}
```

```js
options = {
    autodetect: {
        path: true,
        controllers: false,
        routes: false
    },
}
```

#### express
```js
options = {
    express: {
        limit: '25mb',
        bodyParser: {},
        json: {},
        urlencoded: {extended: true}
    }
}
```

#### session
```js
options = {
    session: {
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 30000000 // close to 1 year
        }
    }
}
```
