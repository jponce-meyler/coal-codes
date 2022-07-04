const express = require("express");

module.exports = {
    express: {
        limit: '25mb',
        bodyParser: {},
        json: {},
        urlencoded: {extended: true}
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