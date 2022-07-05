const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const mergeDeep = require('merge-deep');

const Router = require('./Routing/Router');
const crypto = require("crypto");

class App {
    name
    core
    isProduction = false
    settings = require('../defaults')
    services = {
        mongo: false
    }
    databases = {}
    defaultDatabase
    router = new Router()


    constructor(name = 'Coal Codes App', options= {}) {
        this.name = name
        this.core = express()
        this.settings = mergeDeep(this.settings, options)
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

    autodetect(options) {
        if (typeof options == "boolean" && options) {
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
            let routes = Router.findRoutesSync(this.settings.path.controllers)
            this.router.pushRoutes(routes)
        }
    }

    findRootPath() {
        try {
            this.settings.path.root = require('app-root-path')
        } catch (e) {
            console.warn(e)
            console.log("You have to install the optional dependency 'app-root-path' to use the autodetect path feature.")
        }
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

    setSecret(secret) {
        this.settings.session.secret = secret
    }

    start() {
        if (this.settings.autodetect) {
            this.autodetect(this.settings.autodetect)
        }
        this.router.applyRoutes(this.settings.appRouter)

        // set up a default session key based on app name
        // todo: make this more secure
        if (!this.settings.session.secret) {
            this.settings.session.secret = crypto.createHash('md5').update(this.name).digest("hex")
        }

        // set up different environment for production and for others
        if (this.isProduction) {
            this.core.set('trust proxy', 1) // trust first proxy
            this.settings.session.cookie.secure = true // serve secure cookies
        }

        // starting the session
        this.core.use(session(this.settings.session))

        this.core.use(this.router.applyRoutes(new express.Router()))

        // to support JSON-encoded and URL-encoded bodies
        // this.core.use(express.limit(this.options.express.limit));
        // this.core.use(express.bodyParser(this.options.express.bodyParser));
        this.core.use(express.json(this.settings.express.json))
        this.core.use(express.urlencoded(this.settings.express.urlencoded))

        let currentApp = this
        process.on('SIGINT', function () {
            Object.entries(currentApp.databases).forEach(([name, connection]) => {
                connection.close(() => {
                    console.warn(`Database ${name} lost connection`)
                })
            })
        });
    }
}

module.exports = App;
