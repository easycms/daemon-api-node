module.exports = serialize
module.exports.serialize = serialize
module.exports.unserialize = unserialize

function serialize (e) {
  const data = Object.create(null)
  Object.keys(e).concat(Reflect.ownKeys(e), Object.getOwnPropertyNames(e), 'name type stack message'.split(' ')).forEach(key => {
    if (!data[key] && e[key]) {
      data[key] = e[key]
    }
  })
  return JSON.stringify({
    data,
    constructor: e.constructor.name
  })
}

function unserialize (input, g) {
  if (!g || typeof g !== 'object' || typeof g.g !== typeof g) {
    if (typeof window !== typeof void 0 && typeof window.window === typeof window) {
      g = window
    } else if (typeof global !== typeof void 0 && typeof global.global === typeof global) {
      g = global
    } else {
      g = this
    }
  }
  const d = JSON.parse(input)
  const data = typeof d.data === 'object' ? d.data : Object.create(null)
  const e = new g[d.constructor](d.message)
  Object.keys(data).forEach(key => {
    e[key] = data[key]
  })
  return e
}
