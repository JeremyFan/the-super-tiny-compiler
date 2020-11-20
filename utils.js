const util = require('util')

function compose(...funcs) {
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}

function clone(obj) {
  let result = Array.isArray(obj) ? [] : {}

  for (let key in obj) {
    if (Array.isArray(obj[key])) {
      result[key] = []
      for (let i = 0; i < obj[key].length; i++) {
        result[key][i] = clone(obj[key][i])
      }
    }
    else if (typeof obj[key] === 'object') {
      result[key] = clone(obj[key])
    } else {
      result[key] = obj[key]
    }
  }

  return result
}

function inspect(obj) {
  return util.inspect(obj, { depth: null, colors: true })
}

module.exports = { compose, clone, inspect }