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
      // 连接服务器
      await this.api.connect()
      // 调用守护进程--创建
      const appid = await this.api.callDaemonApi({
        method: 'app.create',
        res: args
      })
      debug('creating app successed, try to clone app form git')
      // 克隆项目
      await this.clone(appid)
      // 断开连接
      await this.api.disconnect()
    } catch (err) {
      debug('creating app failed:', err)
      await this.api.disconnect()
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
        return repo
      })
  },
  api: 'app'
}
