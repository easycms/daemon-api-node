'use strict'
// 文件系统模块
const fs = require('fs')
// ws模块
const Ws = require('ws')
// 调试
const debug = require('debug')('easycms:API:connect')
// 尝试连接变量
const tryConnect = Symbol('tryConnect')
const ws = Symbol('ws')
// 守护进程启动方法
const launchDaemon = require('./launch/index.js')
const json = require('./utils/json.js')
const callPonds = Symbol('callPonds')
const sendWsApi = Symbol('sendWsApi')
const requestIdLast = Symbol('requestIdLast')
const onWsApiMessage = Symbol('onWsApiMessage')
const { unserialize } = require('./utils/error.serialize.js')

module.exports = {
  [ws]: null,
  connect (noAutoLaunchDaemon) {
    // 试图连接
    debug('Try connect')
    // 连接地址
    debug('connect address:', this.address)
    // 超时时间
    debug('connect timeout:', this.timeout)
    // 先测试是否和守护进程服务器ping通
    return this.ping()
    // 如果ping守护进程失败，就尝试连接
      .catch(e => this[tryConnect]())
      // 如果连接失败
      .catch(e => {
        if (noAutoLaunchDaemon === true) {
          return Promise.reject(e)
        } else {
        // 试图启动守护进程，然后再尝试连接
          return this.launchDaemon().then(() => this[tryConnect]())
        }
      })
      .then(() => {
        this.isConnected = true
      })
  },
  /**
   * 启动守护进程
   */
  launchDaemon,
  ping () {
    // 试图连接
    debug('Try ping')
    if (!this[ws]) {
      return Promise.reject(new Error('not connect'))
    }
    return this.callDaemonApi({ method: 'ping' })
  },
  callDaemonApi (data) {
    // 试图连接
    debug('Try callDaemonApi', data)
    return new Promise((resolve, reject) => {
      if (typeof this[callPonds] !== 'object') {
        this[callPonds] = Object.create(null)
      }
      if (!this[requestIdLast]) {
        this[requestIdLast] = 1
      }
      const requestId = ++this[requestIdLast]
      this[callPonds][requestId] = [resolve, reject, setTimeout(() => {
        if (this[callPonds][requestId]) {
          this[callPonds][requestId][1](new Error('调用超时'))
          delete this[callPonds][requestId]
        }
      }, ((+process.env.EASYCMS_API_RPC_TIMEOUT) || 60) * 1000)]
      json.stringify({
        data,
        requestId
      })
        .then(data => this[sendWsApi](data))
        .catch(reject)
    })
  },
  [sendWsApi] (data, options, cb) {
    // 试图连接
    debug('Try sendWsApi', data)
    return new Promise((resolve, reject) => {
      this[ws].send(data, options, e => e ? reject(e) : resolve())
    })
  },
  /**
   * 断开连接
   *
   * @return     {Promise}  { description_of_the_return_value }
   */
  disconnect () {
    debug('Try disconnect')
    if (!this[ws]) {
      debug('No connect')
      return Promise.resolve()
    }
    debug('Try close wsapi')
    this[ws].close()
    // 开始回收
    return Promise.resolve()
  },
  [onWsApiMessage] (data) {
    // 试图连接
    debug('Try onWsApiMessage', data)
    return json.parse(data)
      .then(data => {
        if (data.requestId && this[callPonds][data.requestId]) {
          try {
            data.error ? this[callPonds][data.requestId][1](unserialize(data.error)) : this[callPonds][data.requestId][0](data.res)
          } catch (e) {
            debug(e)
          }
          if (this[callPonds][data.requestId][2]) {
            clearTimeout(this[callPonds][data.requestId][2])
          }
          delete this[callPonds][data.requestId]
        } else {
          debug('没有请求id')
          debug(data)
        }
      }, e => debug(e))
  },
  /**
   * 尝试建立连接
   */
  [tryConnect] () {
    debug('Try call tryConnect')
    return new Promise((resolve, reject) => {
      fs.stat(this.address, (e, stat) => {
        if (!e && stat && stat.isSocket()) {
          resolve('ws+unix:' + this.address)
        } else {
          resolve(this.address)
        }
      })
    })
      .then(address => new Promise((resolve, reject) => {
      // 建立客户端
        this[ws] = new Ws(address)
        // rpc-api-ws 连接成功事件
        this[ws].on('open', () => {
          debug('Try wsapi on open')
          if (typeof resolve !== typeof void 0) {
            this.ping().then(() => {
              if (typeof resolve === 'function') {
                resolve()
              }
              resolve = reject = void 0
            }, e => {
              if (typeof reject === 'function') {
                reject(e)
              }
              resolve = reject = void 0
            })
          }
        })
        // rpc-api-ws 连接关闭事件
        this[ws].on('close', () => {
          debug('Try wsapi on close')
          if (typeof reject !== typeof void 0) {
            reject(new Error('Unknow error'))
            resolve = reject = void 0
          }
        // this.onWsApiClose()
        })
        // rpc-api-ws 错误事件
        this[ws].on('error', e => {
          debug('Try wsapi on error', e)
          if (typeof reject !== typeof void 0) {
            reject(e)
            resolve = reject = void 0
          }
        // this.onWsApiError(e)
        })
        // rpc-api-ws 消息事件
        this[ws].on('message', message => this[onWsApiMessage](message))
      }))
  }
}
