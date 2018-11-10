'use strict'
const debug = require('debug')('easycms:API:base')
/* const Pm2API = require('../API/Pm2API.js')
const easycmsServer = {
  name: 'easycms-server',
  script: path.resolve(__dirname, '../server/index.js'), // Script to be run
  execMode: 'fork', // Allows your app to be clustered
  maxMemoryRestart: '100M' // Optional: Restarts your app if it reaches 100Mo
} */
// var pm2 = new Pm2API()
module.exports = {
  start () {
    debug('Try start server')
    return this.api.connect()
  },
  stop () {
    debug('Try stop server')
    return this.api.connect()
      .then(() => this.api.callDaemonApi({
        method: 'server.stop'
      }))
  },
  api: 'server'
}
