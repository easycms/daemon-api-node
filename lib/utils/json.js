module.exports = parse
module.exports.parse = parse
module.exports.stringify = stringify

function parse () {
  try {
    return Promise.resolve(JSON.parse.apply(JSON, arguments))
  } catch (e) {
    return Promise.reject(e)
  }
}
function stringify () {
  try {
    return Promise.resolve(JSON.stringify.apply(JSON, arguments))
  } catch (e) {
    return Promise.reject(e)
  }
}
