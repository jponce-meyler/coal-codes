const Route = require('./Route')


class Router {

    static getRoutesFromJS(file, js, path, className) {
        let route
        if (js.type === 'ClassDeclaration') {
            if (js.leadingComments) {
                let comment = js.leadingComments.reduce((prev, curr) => prev + ' ' + curr.value, '')
                route = this.extractRoutes(comment)
                this.getRoutesFromJS(file, js.body, route?.path || '', js.id.name)
            }
        } else if (js.type === 'MethodDefinition') {
            if (js.leadingComments) {
                let comment = js.leadingComments.reduce((prev, curr) => prev + ' ' + curr.value, '')
                route = this.extractRoutes(comment, path)
                route.className = className
                route.className = className
                route.file = file
                route.methodName = js.key.name
                this.addRoute(route)
            }
        } else {
            if (js.body && js.body.length > 0) {
                js.body.forEach(element => {
                    this.getRoutesFromJS(file, element, path, className)
                })
            }
        }
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
