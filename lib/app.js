'use strict'
const debug = require('debug')('easycms:API:app')
module.exports = {
  start (noDaemon) {
    this.autoConnect()
      .then(() => {})
      .then(() => this.disconnect())
      .catch(e => {
        return this.disconnect()
          .then(() => Promise.reject(e))
      })
  },
  /**
   * 创建参数
   * @param {Object} args
   */
  async create (args) {
    debug('creating app...')
    try {
      await this.api.connect()
      const appid = await this.api.callDaemonApi({
        method: 'app.create',
        res: args
      })
      debug('creating app successed, try to clone app form git')
      await this.clone(appid)
    } catch (err) {
      debug('creating app failed:', err)
      throw err
    }
  },
  /**
   * 克隆应用
   * @param {String|Number} appid 应用id
   */
  async clone (appid) {
    debug('clone app...')
    return this.api.connect()
      .then(() => this.api.callDaemonApi({
        method: 'app.clone',
        res: {
          appid
        }
      }))
      .then(repo => {
        debug('clone successed')
      })
  },
  api: 'app'
}
