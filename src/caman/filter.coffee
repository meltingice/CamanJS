module.exports = class Filter
  constructor: (@processFunc) ->
    @loc = 0
    @r = @g = @b = 0
    @a = 255

  setPixel: (@loc, @r, @g, @b, @a) ->

  execute: -> @processFunc.call(@)
