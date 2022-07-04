const express = require('express');
const fs = require('fs');
const path = require('path');
const mergeDeep = require('merge-deep');
const espree = require("espree");
const commentsBuilder = require('./Utils/Espree/commentsBuilder');

const Router = require('./Routing/Router');
const Route = require('./Routing/Route');

class App {
    name
    core
    isProduction = false
    settings = {
        express: {
            limit: '1000mb',
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
    databases = {}
    services = {
        mongo: false
    }
    defaultDatabase
    extra = {}
    routes = {}


    constructor(name = 'Coal Codes App', options= {}) {
        this.name = name
        this.core = express()
        this.settings = mergeDeep(this.settings, options)
        if (options.autodetect) {
            this.autodetect(options.autodetect)
        }
        if (this.settings.express.json !== false && !this.settings.express.json.limit) {
            this.settings.express.json.limit = this.settings.express.limit
        }
        if (this.settings.express.bodyParser !== false && !this.settings.express.bodyParser.limit) {
            this.settings.express.bodyParser.limit = this.settings.express.limit
        }
        if (this.settings.express.urlencoded !== false && !this.settings.express.urlencoded.limit) {
            this.settings.express.urlencoded.limit = this.settings.express.limit
        }
        this.isProduction = this.settings.env === 'production'
    }

    async autodetect(options) {
        if (typeof options == "boolean") {
            options = {
                path: true,
                controllers: true,
                routes: true
            }
        }
        if (options.path) {
            this.findRootPath()
        }
        if (options.controllers) {
            this.findControllersPath(this.settings.path.root)
        }
        if (options.routes && this.settings.path.controllers) {
            let routes = await this.findRoutes(this.settings.path.controllers)
        }
    }

    pushRoute(route) {
        if (!Array.isArray(route)) {
            route = [route]
        }
        for (let r of route) {
            if (!this.routes[r.method]) {
                this.routes[r.method] = []
            }
            this.routes[r.method].push(r)
        }
    }

    findRootPath() {
        this.settings.path.root = require('app-root-path')
    }

    findControllersPath(rootPath) {
        let folders = fs.readdirSync(rootPath)
        for (let folder of folders) {
            if (['node_modules', 'static', 'client', 'assets', 'css', 'images', 'img'].includes(folder)) {
                continue
            }
            if (fs.statSync(path.join(rootPath, folder)).isDirectory()) {
                if (fs.existsSync(path.join(rootPath, folder, 'controllers'))) {
                    this.settings.path.controllers = path.join(rootPath, folder, 'controllers')
                    return true
                }
            }
        }
        for (let folder of folders) {
            this.findControllersPath(path.join(rootPath, folder))
        }
    }

    async findRoutes(controllersPath) {
        let routes = {}
        const espree = require('espree');
        let promises = []
        let files = fs.readdirSync(controllersPath)
        for (let file of files) {
            if (file.endsWith('.js')) {
                promises.push(new Promise((resolve, reject) => {
                    fs.readFile( path.join(controllersPath, file), (err, data) => {
                        data = espree.parse(data.toString(), { ecmaVersion: "latest", comment: true, range: true})
                        data = commentsBuilder(data)
                        resolve(Router.getRoutesFromJS(path.join(controllersPath, file), data))
                    })
                }))
            }
        }
        return routes
    }

    start() {
        console.log(this.name)
    }
}

module.exports = App;
