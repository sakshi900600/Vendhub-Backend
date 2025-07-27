// /api/index.js
const serverless = require('serverless-http')
const app = require('../index')   // import your Express app
module.exports = serverless(app)
