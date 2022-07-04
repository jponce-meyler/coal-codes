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

    clone = () => {
        let clone = new Route()
        clone.method = this.method
        clone.path = this.path
        clone.roles = this.roles
    }
}
