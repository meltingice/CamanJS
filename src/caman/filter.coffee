module.exports = class Filter
  constructor: (@processFunc) ->
    @r = @g = @b = 0
    @a = 255

  setPixel: (@r, @g, @b, @a) ->

  execute: ->
    @processFunc.call(@)
