const _ = require('lodash')
const API_PROXY = Symbol('API_PROXY')
const EventEmitter = require('events')
/**
 * Class for api.
 *
 * @class      API (name)
 */
class API extends EventEmitter {
  constructor (opts) {
    super()
    if (typeof opts === 'string' || typeof opts === 'number') {
      opts = {
        address: opts
      }
    } else if (!opts || typeof opts !== typeof {}) {
      opts = {}
    }
    this.opts = Object.assign({
      address: process.env.EASYCMS_DAEMON_RPC_PORT
    }, opts)
  }
  get address () {
    return this.opts.address
  }
  set address (value) {
    this.opts.address = value
    return true
  }
  get timeout () {
    return this.opts.timeout || 0
  }
  set timeout (value) {
    this.opts.timeout = value
    return true
  }
}
/**
 * 设置
 *
 * @param      {<type>}   target  The target
 * @param      {<type>}   key     The key
 * @param      {<type>}   value   The value
 * @param      {<type>}   proxy   The proxy
 * @return     {boolean}  { description_of_the_return_value }
 */
function set (target, key, value, proxy) {
  if (['constructor', 'api'].indexOf(key) > -1) {
    // throw new TypeError('Modifying the ' + key + ' property is not allowed')
    return false
  }
  if (!target[key]) {
    target[key] = {
      value: void 0,
      writable: true,
      enumerable: true,
      configurable: true
    }
  }
  if (typeof target[key].set === 'function') {
    target[key].set.call(proxy, value)
  } else {
    target[key].value = value
  }
  return true
}
/**
 * 遍历key
 *
 * @param      {<type>}  target  The target
 * @return     {<type>}  { description_of_the_return_value }
 */
function ownKeys (target) {
  return Object.keys(target).filter(key => key !== API_PROXY).concat('api')
}
/**
 * 删除属性
 *
 * @param      {<type>}  target  The target
 * @param      {<type>}  key     The key
 */
function deleteProperty (target, key) {
  delete target[key]
  return true
}
/**
 * 定义一个属性
 *
 * @param      {<type>}   target      The target
 * @param      {<type>}   key         The key
 * @param      {<type>}   descriptor  The descriptor
 * @return     {boolean}  { description_of_the_return_value }
 */
function defineProperty (target, key, descriptor) {
  if (target[key]) {
    return false
  }
  target[key] = descriptor
  return true
}
/**
 * { function_description }
 */
function extend () {
  Array
    .prototype
    .concat
    .apply([], arguments)
    .filter(p => {
      if (typeof p === 'object') {
        if (typeof p.api === 'string') {
          return true
        } else {
          Object.assign(API.prototype, p)
        }
      }
      return false
    })
    .map(p => Object.getOwnPropertyDescriptors(p))
    .forEach(ds => defineApiProperty(ds))
  return API
}
/**
 * { function_description }
 *
 * @param      {<type>}  ds      { parameter_description }
 */
function defineApiProperty (ds) {
  // 取得模块的名字
  const module = ds.api.value
  // 删除这个模块的绑定
  delete ds.api
  // 定义一个属性绑定
  Object.defineProperty(API.prototype, module, {
    get () {
      if (!this[API_PROXY]) {
        this[API_PROXY] = Object.create(null)
      }
      if (!this[API_PROXY][module]) {
        this[API_PROXY][module] = new Proxy(_.cloneDeep(ds), Object.assign(Object.create(API.handler), {
          get: (target, key, proxy) => {
            if (key === 'api') {
              return this
            } else if (target[key]) {
              const value = typeof target[key].get === 'function' ? target[key].get.call(proxy) : target[key].value
              return typeof value === 'function' ? value.bind(proxy) : value
            }
          },
          getOwnPropertyDescriptor: (target, key) => {
            if (key === 'api') {
              return {
                value: this,
                writable: false,
                enumerable: true,
                configurable: true
              }
            } else if (key === 'constructor') {
              return {
                value: API,
                writable: false,
                enumerable: true,
                configurable: true
              }
            } else if (target[key] && Object.keys(target).indexOf(key) > -1) {
              return target[key]
            }
          }
        }))
      }
      return this[API_PROXY][module]
    }
  })
}
// 导出API类
module.exports = API
module.exports.extend = extend
module.exports.handler = {
  constructor: API,
  set,
  ownKeys,
  enumerate: ownKeys,
  defineProperty,
  deleteProperty
}
// 扩展API
extend(require('./extend.js'))
