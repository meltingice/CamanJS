module.exports = class Filter
  constructor: (@processFunc) ->

  setPixel: (@r, @g, @b, @a) ->
    
  execute: -> @processFunc.call(@)
