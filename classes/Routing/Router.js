const Route = require('./Route')
const fs = require("fs");
const path = require("path");



class Router {
    routes = {}
    controllers = {}

    constructor(routes = []) {
        if (Array.isArray(routes) && routes.length > 0) {
            this.pushRoutes(routes)
        }
    }

    pushRoutes(routes) {
        if (!Array.isArray(routes)) {
            routes = [routes]
        }
        for (let route of routes) {
            if (!(route instanceof Route)) {
                route = new Route(route)
            }
            let methods = route.method
            if (!Array.isArray(methods)) {
                methods = [methods]
            }
            for (let method of methods) {
                if (!this.routes[method]) {
                    this.routes[method] = {}
                }
                if (this.routes[method][route.path]) {
                    console.warn(`Route [${method}] ${routes.path} already exists`)
                } else {
                    this.routes[method][route.path] = route
                }
            }
        }
    }

    applyRoutes(externalRouter) {
        for (let method in this.routes) {
            for (let path in this.routes[method]) {
                let route = this.routes[method][path]
                let methodHandler = (req, res, next) => {
                    console.log(`Request on route {${route.className}/${route.methodName}}`);
                    if (!route.roles.includes('PUBLIC')) {
                        res.status(401)
                            .json({message: "You are not authorized to this [method] [page]"})
                    }
                    let controller
                    let requestHandler
                    try {
                        if (!this.controllers[route.file]) {
                            this.controllers[route.file] = require(route.file)
                        }
                        controller = this.controllers[route.file]
                        requestHandler = controller.instance[route.methodName]
                        if (typeof methodHandler !== 'function') {
                            console.error(`Error: ${route.methodName} is not callable in ${route.className}`)
                        }
                    } catch (e) {
                        console.error(`Error requiring ${route.className}.${route.methodName} from file "${route.file}"`)
                    }
                    try {
                        requestHandler(req, res, next)
                    } catch (e) {
                        console.error(`Error executing {${route.methodName}} inside the controller {${route.className}}`)
                        console.error(e)
                    }
                }
                externalRouter[method](path, methodHandler)
            }
        }
        return externalRouter
    }

    static async findRoutes(controllersPath) {
        const espree = require('espree');
        const commentsBuilder = require("../Utils/Espree/commentsBuilder");
        let routes
        let promises = []
        let files = fs.readdirSync(controllersPath)
        for (let file of files) {
            if (file.endsWith('.js')) {
                promises.push(new Promise((resolve) => {
                    fs.readFile( path.join(controllersPath, file), (err, data) => {
                        data = espree.parse(data.toString(), { ecmaVersion: "latest", comment: true, range: true})
                        data = commentsBuilder(data)
                        resolve(Router.getRoutesFromJS(path.join(controllersPath, file), data))
                    })
                }))
            }
        }
        routes = await Promise.all(promises)
        routes = routes.flat()
        return routes
    }

    static findRoutesSync(controllersPath) {
        try {
            const espree = require('espree');
            const commentsBuilder = require("../Utils/Espree/commentsBuilder");
            let routes = []
            let files = fs.readdirSync(controllersPath)
            for (let file of files) {
                if (file.endsWith('.js')) {
                    let data = fs.readFileSync( path.join(controllersPath, file)).toString()
                    data = espree.parse(data, { ecmaVersion: "latest", comment: true, range: true})
                    data = commentsBuilder(data)
                    routes = routes.concat(Router.getRoutesFromJS(path.join(controllersPath, file), data))
                }
            }
            return routes
        } catch (e) {
            console.warn(e)
            console.log("You have to install the optional dependency 'espree' to use the autodetect routes feature.")
        }
    }


    static getRoutesFromJS(file, js, path, className) {
        let routes = []
        let parentRoute

        if (js.type === 'ClassDeclaration') {
            if (js.leadingComments) {
                let comment = js.leadingComments.reduce((prev, curr) => prev + ' ' + curr.value, '')
                parentRoute = this.extractRoutes(comment)
                routes = [...routes, ...this.getRoutesFromJS(file, js.body, parentRoute?.path || '', js.id.name)]
            }
        } else if (js.type === 'MethodDefinition') {
            if (js.leadingComments) {
                let comment = js.leadingComments.reduce((prev, curr) => prev + ' ' + curr.value, '')
                let route = this.extractRoutes(comment, path)
                route.className = className
                route.className = className
                route.file = file
                route.methodName = js.key.name
                routes.push(route)
            }
        } else {
            if (js.body && js.body.length > 0) {
                js.body.forEach(element => {
                    routes = [...routes, ...this.getRoutesFromJS(file, element, path, className)]
                })
            }
        }
        return routes
    }

    static extractRoutes(comment, path) {
        let route = /^((\n|\s)*\**(\s)*)*@Route\s*\(\s*/gm
        let routeLength = route.exec(comment)
        if (!routeLength || routeLength.length < 1) {
            return null
        }
        let routeObject = new Route()
        routeLength = routeLength[0].length
        comment = comment.substring(routeLength)
        let key = /^(\s|\n)*(,\s*)?(?<key>path|method|roles)\s*=\s*/gm
        let currentKey = ''
        let match
        // eslint-disable-next-line no-cond-assign
        while (match = key.exec(comment)) {
            key.lastIndex = 0
            currentKey = match.groups.key
            comment = comment.substring(match[0].length)

            let s_value = /^(\n|\s)*(?<value>'([^']|(?<!\\)\\(\\{2})*')*(?<!\\)(?:\\{2})*?'|"([^"]|(?<!\\)\\(\\{2})*")*(?<!\\)(?:\\{2})*?"|[A-Za-z0-9_\-.:]+)/gm
            let m_value = /^(\s|\n)*(?<value>'([^']|(?<!\\)\\(\\{2})*')*(?<!\\)(?:\\{2})*?'|"([^"]|(?<!\\)\\(\\{2})*")*(?<!\\)(?:\\{2})*?"|[A-Za-z0-9_\-.:]+)|(?<values>\[\s*('([^']|(?<!\\)\\(\\{2})*')*(?<!\\)(?:\\{2})*?'|"([^"]|(?<!\\)\\(\\{2})*")*(?<!\\)(?:\\{2})*?"|[A-Za-z0-9_\-.:]+)(\s*,\s*('([^']|(?<!\\)\\(\\{2})*')*(?<!\\)(?:\\{2})*?'|"([^"]|(?<!\\)\\(\\{2})*")*(?<!\\)(?:\\{2})*?"|[A-Za-z0-9_\-.:]+))*\s*])/gm
            let s_value2 = /^(\n|\s)*(,\s*)?(?<value>'([^']|(?<!\\)\\(\\{2})*')*(?<!\\)(?:\\{2})*?'|"([^"]|(?<!\\)\\(\\{2})*")*(?<!\\)(?:\\{2})*?"|[A-Za-z0-9_\-.:]+)/gm

            let value
            switch (currentKey) {
                case 'path': {
                    if (!(match = s_value.exec(comment))) {
                        return null
                    }
                    s_value.lastIndex = 0
                    comment = comment.substring(match[0].length)
                } break
                case 'method':
                case 'roles': {
                    if (!(match = m_value.exec(comment))) {
                        return null
                    }
                    m_value.lastIndex = 0
                    comment = comment.substring(match[0].length)
                } break
            }
            if (match.groups.value) {
                if (match.groups.value.startsWith('"') || match.groups.value.startsWith('\'')) {
                    match.groups.value = match.groups.value.substring(1, match.groups.value.length - 1)
                }
                value = match.groups.value
            } else if (match.groups.values) {
                let valuesString = match.groups.values
                let values = []
                valuesString = valuesString.substring(1, valuesString.length - 1)
                // eslint-disable-next-line no-cond-assign
                while (match = s_value2.exec(valuesString)) {
                    s_value2.lastIndex = 0
                    valuesString = valuesString.substring(match[0].length)
                    if (match.groups.value.startsWith('"') || match.groups.value.startsWith('\'')) {
                        match.groups.value = match.groups.value.substring(1, match.groups.value.length - 1)
                    }
                    values.push(match.groups.value)
                }
                value = values
            }
            switch (currentKey) {
                case 'path': {
                    routeObject.path = path + value
                } break
                case 'method':
                case 'roles': {
                    routeObject[currentKey] = value
                } break
            }
        }
        return routeObject
    }
}


module.exports = Router
