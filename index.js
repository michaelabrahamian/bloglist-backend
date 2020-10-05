const app = require('./app') // Express app
const http = require('http')
const logger = require('./utils/logger')
const config = require('./utils/config')

const server = http.createServer(app)

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`)
})