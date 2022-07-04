const METHODS = {
    DELETE: "DELETE",
    GET: "GET",
    PATCH: "PATCH",
    POST: "POST",
    PUT: "PUT"
}

class Route {
    method = METHODS.GET
    path = '/'
    roles = ['PUBLIC']
    file = ''
    className = ''
    methodName = ''

    constructor({method, path, roles = ['PUBLIC'], file, className, methodName}) {
        if (METHODS[method]) {
            this.method = METHODS[method]
        }
        this.path = path
        this.roles = roles
        this.file = file
        this.className = className
        this.methodName = methodName
    }

    clone = () => {
        let clone = new Route()
        clone.method = this.method
        clone.path = this.path
        clone.roles = this.roles
    }
}

module.exports = Route
