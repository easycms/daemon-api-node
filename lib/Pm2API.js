var API = require('pm2/lib/API.js')
module.exports = class Pm2API extends API {
  /**
   * Connect to PM2
   * Calling this command is now optional
   *
   * @param {Function} cb callback once pm2 is ready for commands
   */
  connectPromise (noDaemon) {
    return new Promise((resolve, reject) => {
      this.connect(noDaemon, err => err ? reject(err) : resolve(this))
    })
  }
  /**
   * Start a file or json with configuration
   * @param {Object||String} cmd script to start or json
   * @param {Function} cb called when application has been started
   */
  startPromise (cmd, opts) {
    return new Promise((resolve, reject) => {
      this.start(cmd, opts, (err, proc) => err ? reject(err) : resolve(proc))
    })
  }
  /**
   * Disconnect from PM2 instance
   * This will allow your software to exit by itself
   *
   * @param {Function} [cb] optional callback once connection closed
   */
  disconnectPromise () {
    return new Promise((resolve, reject) => {
      this.disconnect(err => err ? reject(err) : resolve(this))
    })
  }
  /**
   * Description
   * @method describeProcess
   * @param {} pm2_id
   * @return
   */
  describePromise (pm2Id) {
    return new Promise((resolve, reject) => {
      this.describe(pm2Id, (err, processDescription) => err ? reject(err) : resolve(processDescription))
    })
  }
  /**
   * Get list of all processes managed
   *
   * @param {Function} cb Callback
   */
  listPromise (opts) {
    return new Promise((resolve, reject) => {
      this.list(opts, (err, processDescriptionList) => err ? reject(err) : resolve(processDescriptionList))
    })
  }
}
