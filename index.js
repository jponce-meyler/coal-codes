const App = require('./classes/App')
const Route = require('./classes/Routing/Route')
const Router = require('./classes/Routing/Router')

const CoalCodes = (name, options) => {
    if (typeof name === 'object') {
        options = name
        name = 'Coal Codes App'
    }
    return new App(name, options)
}

CoalCodes.App = App
CoalCodes.Route = Route
CoalCodes.Router = Router

module.exports = CoalCodes
